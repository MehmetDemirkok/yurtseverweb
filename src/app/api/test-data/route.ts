import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'generate') {
      // Test verilerini oluştur
      await generateTestData();
      return NextResponse.json({ 
        success: true, 
        message: 'Test verileri başarıyla oluşturuldu' 
      });
    } else if (action === 'clear') {
      // Test verilerini temizle
      await clearTestData();
      return NextResponse.json({ 
        success: true, 
        message: 'Test verileri başarıyla temizlendi' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Geçersiz işlem' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Test data API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Bir hata oluştu' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Mevcut test verilerinin sayısını getir
    const [aracCount, soforCount, transferCount, konaklamaCount] = await Promise.all([
      prisma.arac.count(),
      prisma.sofor.count(),
      prisma.transfer.count(),
      prisma.accommodation.count()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        araclar: aracCount,
        soforler: soforCount,
        transferler: transferCount,
        konaklamalar: konaklamaCount
      }
    });
  } catch (error) {
    console.error('Test data count error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Veri sayısı alınırken hata oluştu' 
    }, { status: 500 });
  }
}

async function generateTestData() {
  // Önce mevcut şirket kontrolü
  let company = await prisma.company.findFirst();
  
  if (!company) {
    // Şirket yoksa oluştur
    company = await prisma.company.create({
      data: {
        name: 'Yurtsever Turizm A.Ş.',
        email: 'info@yurtsever.com',
        phone: '+90 212 555 0123',
        address: 'İstanbul, Türkiye',
        city: 'İstanbul',
        country: 'Türkiye',
        taxNumber: '1234567890',
        taxOffice: 'İstanbul Vergi Dairesi',
        status: 'ACTIVE'
      }
    });
  }

  // Test araçları oluştur
  const aracMarkalari = ['Mercedes', 'BMW', 'Audi', 'Volkswagen', 'Ford', 'Toyota', 'Honda', 'Hyundai', 'Kia', 'Renault'];
  const aracModelleri = ['Sprinter', 'Vito', 'Transit', 'Hiace', 'Crafter', 'Ducato', 'Daily', 'Master', 'Boxer', 'Relay'];
  const aracTipleri = ['BINEK', 'MINIBUS', 'MIDIBUS', 'OTOBUS'];
  const durumlar = ['MUSAIT', 'TRANSFERDE', 'BAKIMDA'];
  
  const araclar = [];
  for (let i = 1; i <= 20; i++) {
    const marka = aracMarkalari[Math.floor(Math.random() * aracMarkalari.length)];
    const model = aracModelleri[Math.floor(Math.random() * aracModelleri.length)];
    const aracTipi = aracTipleri[Math.floor(Math.random() * aracTipleri.length)];
    const durum = durumlar[Math.floor(Math.random() * durumlar.length)];
    
    const plaka = `${Math.floor(Math.random() * 81) + 1} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))} ${Math.floor(Math.random() * 900) + 100}`;
    
    const arac = await prisma.arac.create({
      data: {
        plaka: plaka,
        marka: marka,
        model: model,
        aracTipi: aracTipi,
        yolcuKapasitesi: Math.floor(Math.random() * 50) + 4,
        durum: durum,
        enlem: 39.9334 + (Math.random() - 0.5) * 0.1,
        boylam: 32.8597 + (Math.random() - 0.5) * 0.1,
        companyId: company.id
      }
    });
    araclar.push(arac);
  }

  // Test şoförleri oluştur
  const isimler = ['Ahmet', 'Mehmet', 'Ali', 'Veli', 'Hasan', 'Hüseyin', 'Mustafa', 'İbrahim', 'Ömer', 'Yusuf', 'Murat', 'Emre', 'Can', 'Burak', 'Serkan', 'Tolga', 'Erkan', 'Orhan', 'Osman', 'Kemal'];
  const soyisimler = ['Yılmaz', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Yıldırım', 'Özkan', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Erdoğan', 'Koç', 'Kurt', 'Özkan', 'Şen', 'Güneş'];
  const ehliyetSiniflari = ['B', 'C', 'D', 'E'];
  const soforDurumlar = ['MUSAIT', 'TRANSFERDE', 'IZINLI'];
  
  const soforler = [];
  for (let i = 1; i <= 20; i++) {
    const ad = isimler[Math.floor(Math.random() * isimler.length)];
    const soyad = soyisimler[Math.floor(Math.random() * soyisimler.length)];
    const durum = soforDurumlar[Math.floor(Math.random() * soforDurumlar.length)];
    const telefon = `+90 5${Math.floor(Math.random() * 9) + 3}${Math.floor(Math.random() * 90000000) + 10000000}`;
    
    const sofor = await prisma.sofor.create({
      data: {
        ad: ad,
        soyad: soyad,
        telefon: telefon,
        ehliyetSinifi: ehliyetSiniflari[Math.floor(Math.random() * ehliyetSiniflari.length)],
        durum: durum,
        ehliyetSiniflari: [ehliyetSiniflari[Math.floor(Math.random() * ehliyetSiniflari.length)]],
        srcBelgeleri: ['SRC1', 'SRC2'],
        companyId: company.id
      }
    });
    soforler.push(sofor);
  }

  // Test transferleri oluştur
  const kalkisYerleri = ['İstanbul Havalimanı', 'Sabiha Gökçen Havalimanı', 'Ankara Esenboğa Havalimanı', 'İzmir Adnan Menderes Havalimanı', 'Antalya Havalimanı', 'Bodrum Havalimanı', 'Dalaman Havalimanı', 'Trabzon Havalimanı', 'Adana Havalimanı', 'Gaziantep Havalimanı'];
  const varisYerleri = ['İstanbul Şehir Merkezi', 'Ankara Şehir Merkezi', 'İzmir Şehir Merkezi', 'Antalya Şehir Merkezi', 'Bodrum Şehir Merkezi', 'Dalaman Şehir Merkezi', 'Trabzon Şehir Merkezi', 'Adana Şehir Merkezi', 'Gaziantep Şehir Merkezi', 'Bursa Şehir Merkezi'];
  const transferDurumlar = ['BEKLEMEDE', 'YOLDA', 'TAMAMLANDI', 'IPTAL'];
  
  for (let i = 1; i <= 20; i++) {
    const kalkisYeri = kalkisYerleri[Math.floor(Math.random() * kalkisYerleri.length)];
    const varisYeri = varisYerleri[Math.floor(Math.random() * varisYerleri.length)];
    const durum = transferDurumlar[Math.floor(Math.random() * transferDurumlar.length)];
    const aracId = araclar.length > 0 ? araclar[Math.floor(Math.random() * araclar.length)].id : null;
    const soforId = soforler.length > 0 ? soforler[Math.floor(Math.random() * soforler.length)].id : null;
    
    const kalkisTarihi = new Date();
    kalkisTarihi.setDate(kalkisTarihi.getDate() + (Math.floor(Math.random() * 60) - 30));
    
    await prisma.transfer.create({
      data: {
        kalkisYeri: kalkisYeri,
        varisYeri: varisYeri,
        kalkisSaati: `${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
        kalkisTarihi: kalkisTarihi,
        yolcuSayisi: Math.floor(Math.random() * 50) + 1,
        aracId: aracId,
        soforId: soforId,
        durum: durum,
        notlar: `Test transfer notu ${i}`,
        fiyat: Math.floor(Math.random() * 1000) + 100,
        tahsisli: Math.random() > 0.5,
        companyId: company.id
      }
    });
  }

  // Test konaklamaları oluştur
  const unvanlar = ['Mühendis', 'Doktor', 'Öğretmen', 'Avukat', 'Mimar', 'Diş Hekimi', 'Eczacı', 'Veteriner', 'Hemşire', 'Teknisyen'];
  const sehirler = ['İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Adana', 'Gaziantep', 'Konya', 'Mersin', 'Diyarbakır'];
  const odaTipleri = ['Tek Kişilik', 'Çift Kişilik', 'Üç Kişilik', 'Suit', 'Deluxe', 'Standart'];
  const konaklamaTipleri = ['Yarım Pansiyon', 'Tam Pansiyon', 'Ultra Her Şey Dahil', 'Sadece Kahvaltı', 'Oda Kahvaltı'];
  const otelAdlari = ['Grand Hotel', 'Palace Hotel', 'Resort Hotel', 'Business Hotel', 'Boutique Hotel', 'Luxury Hotel', 'City Hotel', 'Airport Hotel', 'Beach Hotel', 'Mountain Hotel'];
  
  for (let i = 1; i <= 20; i++) {
    const ad = isimler[Math.floor(Math.random() * isimler.length)];
    const soyad = soyisimler[Math.floor(Math.random() * soyisimler.length)];
    const unvan = unvanlar[Math.floor(Math.random() * unvanlar.length)];
    const sehir = sehirler[Math.floor(Math.random() * sehirler.length)];
    const odaTipi = odaTipleri[Math.floor(Math.random() * odaTipleri.length)];
    const konaklamaTipi = konaklamaTipleri[Math.floor(Math.random() * konaklamaTipleri.length)];
    const otelAdi = otelAdlari[Math.floor(Math.random() * otelAdlari.length)];
    
    const girisTarihi = new Date();
    girisTarihi.setDate(girisTarihi.getDate() + Math.floor(Math.random() * 30));
    
    const cikisTarihi = new Date(girisTarihi);
    cikisTarihi.setDate(cikisTarihi.getDate() + Math.floor(Math.random() * 7) + 1);
    
    const numberOfNights = Math.ceil((cikisTarihi - girisTarihi) / (1000 * 60 * 60 * 24));
    const gecelikUcret = Math.floor(Math.random() * 500) + 100;
    const toplamUcret = gecelikUcret * numberOfNights;
    
    await prisma.accommodation.create({
      data: {
        adiSoyadi: `${ad} ${soyad}`,
        unvani: unvan,
        ulke: 'Türkiye',
        sehir: sehir,
        girisTarihi: girisTarihi.toISOString().split('T')[0],
        cikisTarihi: cikisTarihi.toISOString().split('T')[0],
        odaTipi: odaTipi,
        konaklamaTipi: konaklamaTipi,

        gecelikUcret: gecelikUcret,
        toplamUcret: toplamUcret,
        otelAdi: otelAdi,
        numberOfNights: numberOfNights,
        isMunferit: Math.random() > 0.7,
        companyId: company.id
      }
    });
  }
}

async function clearTestData() {
  // İlişkili verileri önce sil
  await prisma.yolcu.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.sofor.deleteMany();
  await prisma.arac.deleteMany();
  await prisma.accommodation.deleteMany();
}
