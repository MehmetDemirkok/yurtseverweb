import { prisma } from '@/lib/prisma';

type SendResult = {
  success: boolean;
  message: string;
  seferReferansNo?: string;
  rawResponse?: any;
};

function getUetdsWsdlBase(isTest: boolean): string {
  // Not: Resmi WSDL adresleri IP tanımlı ağlarda erişilebilir olabilir.
  // Şirket ayarlarına göre güncellenecektir.
  // Varsayılanı placeholder bırakıyoruz; prod/test farkını sürdürüyoruz.
  return isTest
    ? (process.env.UETDS_TEST_WSDL_BASE || 'https://test.uetds.wsdl.local')
    : (process.env.UETDS_PROD_WSDL_BASE || 'https://prod.uetds.wsdl.local');
}

export async function sendTransferToUetds(transferId: string, companyId: number): Promise<SendResult> {
  const transfer = await prisma.transfer.findFirst({
    where: { id: transferId, companyId },
    include: {
      arac: true,
      sofor: true,
      yolcular: true,
      company: true,
    },
  });

  if (!transfer) {
    return { success: false, message: 'Transfer bulunamadı' };
  }

  const company = transfer.company as any;
  const missing: string[] = [];
  if (!company?.uetdsUsername) missing.push('Şirket U-ETDS kullanıcı adı');
  if (!company?.uetdsPassword) missing.push('Şirket U-ETDS şifre');
  if (!company?.uetdsYetkiBelgeNo) missing.push('Şirket U-ETDS yetki belge no');
  if (!transfer.arac?.plaka && !transfer.manuelAracPlaka) missing.push('Araç plaka');
  if (!transfer.sofor?.ad && !transfer.manuelSoforAdi) missing.push('Şoför adı');
  if (!transfer.yolcular || transfer.yolcular.length === 0) missing.push('Yolcu listesi');

  // Yolculardan en az birinde kimlik bilgisi aranır
  const hasAnyIdentity = transfer.yolcular.some((y) => Boolean((y as any).tckn) || Boolean((y as any).pasaportNo));
  if (!hasAnyIdentity) missing.push('En az bir yolcu için TCKN/Pasaport');

  if (missing.length > 0) {
    return { success: false, message: `Eksik veri: ${missing.join(', ')}` };
  }

  const isMock = process.env.UETDS_MOCK === '1';
  const wsdlBase = getUetdsWsdlBase(Boolean(company.uetdsTestMode));

  // İstek gövdesi taslağı (D2/Turizm için tipik alanlar baz alınmıştır; gerçek alanlar WSDL'e göre güncellenecek)
  const requestPayload = {
    kullaniciAdi: company.uetdsUsername,
    sifre: company.uetdsPassword,
    yetkiBelgeNo: company.uetdsYetkiBelgeNo,
    seferBilgisi: {
      baslangicNoktasi: transfer.kalkisYeri,
      bitisNoktasi: transfer.varisYeri,
      hareketTarihi: new Date(transfer.kalkisTarihi).toISOString().split('T')[0],
      hareketSaati: transfer.kalkisSaati,
      plaka: transfer.arac?.plaka || transfer.manuelAracPlaka,
      soforAdSoyad: transfer.sofor ? `${transfer.sofor.ad} ${transfer.sofor.soyad}` : (transfer.manuelSoforAdi || ''),
      yolcuListesi: transfer.yolcular.map((y) => ({
        ad: y.ad,
        soyad: y.soyad,
        tckn: (y as any).tckn || undefined,
        pasaportNo: (y as any).pasaportNo || undefined,
        telefon: y.telefon || undefined,
      })),
    },
  };

  if (isMock) {
    const fakeRef = `MOCK-${transfer.id.slice(0, 8)}`;
    await prisma.transfer.update({
      where: { id: transfer.id },
      data: {
        uetdsSeferReferansNo: fakeRef,
        uetdsDurum: 'BILDIRILDI',
        uetdsSonMesaj: 'Mock modunda başarıyla bildirildi',
      },
    });
    return { success: true, message: 'Mock: U-ETDS bildirimi başarılı', seferReferansNo: fakeRef };
  }

  // Gerçek çağrı (SOAP) – kütüphane kurulu olmalı
  try {
    const wsdlUrl = `${wsdlBase}/UetdsTurizmSeferIslem.wsdl`;
    // Dinamik import, build-time tree-shaking sorunlarını azaltır
    const soap = await import('soap');
    const client = await new Promise<any>((resolve, reject) => {
      (soap as any).createClient(wsdlUrl, (err: any, cl: any) => {
        if (err) reject(err);
        else resolve(cl);
      });
    });

    const method = client?.seferEkle || client?.SeferEkle || client?.["seferEkle"];
    if (!method) {
      throw new Error('SOAP metodu bulunamadı (seferEkle)');
    }

    const response = await new Promise<any>((resolve, reject) => {
      method.call(client, requestPayload, (err: any, res: any) => {
        if (err) reject(err);
        else resolve(res);
      });
    });

    const success = Boolean(response?.sonucKodu === 0 || response?.success === true);
    const refNo = response?.seferReferansNo || response?.referansNo || undefined;
    await prisma.transfer.update({
      where: { id: transfer.id },
      data: {
        uetdsSeferReferansNo: refNo || undefined,
        uetdsDurum: success ? 'BILDIRILDI' : 'HATA',
        uetdsSonMesaj: response?.sonucAciklama || response?.message || 'Yanıt alındı',
      },
    });

    return {
      success,
      message: response?.sonucAciklama || response?.message || (success ? 'U-ETDS bildirimi başarılı' : 'U-ETDS bildirimi başarısız'),
      seferReferansNo: refNo,
      rawResponse: response,
    };
  } catch (error: any) {
    await prisma.transfer.update({
      where: { id: transfer.id },
      data: { uetdsDurum: 'HATA', uetdsSonMesaj: error?.message || 'Bilinmeyen hata' },
    });
    return { success: false, message: error?.message || 'U-ETDS çağrısı başarısız' };
  }
}


