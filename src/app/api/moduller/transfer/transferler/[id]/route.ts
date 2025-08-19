import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCompanyAccess } from '@/lib/auth';

// GET - Belirli bir transferi getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsData = await params;
    const transfer = await prisma.transfer.findUnique({
      where: { id: paramsData.id },
      include: {
        arac: {
          select: {
            id: true,
            plaka: true
          }
        },
        sofor: {
          select: {
            id: true,
            ad: true,
            soyad: true
          }
        },
        cari: {
          select: {
            id: true,
            ad: true,
            soyad: true,
            sirket: true
          }
        },
        tedarikci: {
          select: {
            id: true,
            sirketAdi: true,
            yetkiliKisi: true
          }
        },
        yolcular: true
      }
    });

    if (!transfer) {
      return NextResponse.json(
        { error: 'Transfer bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ transfer });
  } catch (error) {
    console.error('Transfer alınamadı:', error);
    return NextResponse.json(
      { error: 'Transfer alınamadı' },
      { status: 500 }
    );
  }
}

// PUT - Transfer güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCompanyAccess();
    const paramsData = await params;
    const body = await request.json();
    const { 
      kalkisYeri, 
      varisYeri, 
      kalkisSaati, 
      kalkisTarihi, 
      yolcuSayisi, 
      aracId, 
      soforId, 
      durum, 
      notlar,
      fiyat,
      tahsisli,
      cariId,
      tedarikciId,
      tedarikciyeYaptirilacak,
      manuelAracMarka,
      manuelAracModel,
      manuelAracTip,
      manuelAracPlaka,
      manuelSoforAdi,
      yolcular
    } = body;

    // İzin kontrolü: Transferin şirketi doğrulanmalı
    const existing = await prisma.transfer.findUnique({
      where: { id: paramsData.id },
      select: { companyId: true }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Transfer bulunamadı' }, { status: 404 });
    }
    if (existing.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Şirket erişimi reddedildi' }, { status: 403 });
    }

    // Validasyon
    if (!kalkisYeri || !varisYeri || !kalkisSaati || !kalkisTarihi || !yolcuSayisi) {
      return NextResponse.json(
        { error: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }

    // Araç ve şoför kontrolü
    if (aracId) {
      const arac = await prisma.arac.findUnique({
        where: { id: aracId }
      });

      if (!arac) {
        return NextResponse.json(
          { error: 'Seçilen araç bulunamadı' },
          { status: 400 }
        );
      }

      if (arac.durum === 'BAKIMDA') {
        return NextResponse.json(
          { error: 'Seçilen araç bakımda' },
          { status: 400 }
        );
      }
    }

    if (soforId) {
      const sofor = await prisma.sofor.findUnique({
        where: { id: soforId }
      });

      if (!sofor) {
        return NextResponse.json(
          { error: 'Seçilen şoför bulunamadı' },
          { status: 400 }
        );
      }

      if (sofor.durum === 'IZINLI') {
        return NextResponse.json(
          { error: 'Seçilen şoför izinli' },
          { status: 400 }
        );
      }
    }

    // Önce mevcut yolcuları sil
    await prisma.yolcu.deleteMany({
      where: { transferId: paramsData.id }
    });

    // Gelen yolcu verilerini temizle (izin verilen alanlar)
    const sanitizedPassengers = Array.isArray(yolcular)
      ? yolcular.map((y: any) => ({
          ad: y.ad ?? '',
          soyad: y.soyad ?? '',
          telefon: y.telefon ?? null,
          ucusSaati: y.ucusSaati ?? null,
          ucusTkKodu: y.ucusTkKodu ?? null
        }))
      : [];

    const transfer = await prisma.transfer.update({
      where: { id: paramsData.id },
      data: {
        kalkisYeri,
        varisYeri,
        kalkisSaati,
        kalkisTarihi: new Date(kalkisTarihi),
        yolcuSayisi: parseInt(yolcuSayisi),
        aracId: aracId || null,
        soforId: soforId || null,
        durum,
        notlar: notlar || '',
        fiyat: fiyat ? parseFloat(fiyat) : null,
        tahsisli: tahsisli || false,
        cariId: cariId || null,
        tedarikciId: tedarikciId || null,
        tedarikciyeYaptirilacak: tedarikciyeYaptirilacak || false,
        manuelAracMarka: manuelAracMarka || null,
        manuelAracModel: manuelAracModel || null,
        manuelAracTip: manuelAracTip || null,
        manuelAracPlaka: manuelAracPlaka || null,
        manuelSoforAdi: manuelSoforAdi || null,
        yolcular: {
          create: sanitizedPassengers
        }
      },
      include: {
        arac: {
          select: {
            id: true,
            plaka: true
          }
        },
        sofor: {
          select: {
            id: true,
            ad: true,
            soyad: true
          }
        },
        cari: {
          select: {
            id: true,
            ad: true,
            soyad: true,
            sirket: true
          }
        },
        tedarikci: {
          select: {
            id: true,
            sirketAdi: true,
            yetkiliKisi: true
          }
        },
        yolcular: true
      }
    });

    return NextResponse.json({ transfer });
  } catch (error) {
    console.error('Transfer güncellenemedi:', error);
    return NextResponse.json(
      { error: 'Transfer güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE - Transfer sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsData = await params;
    const transfer = await prisma.transfer.findUnique({
      where: { id: paramsData.id }
    });

    if (!transfer) {
      return NextResponse.json(
        { error: 'Transfer bulunamadı' },
        { status: 404 }
      );
    }

    // Aktif transfer kontrolü
    if (transfer.durum === 'YOLDA') {
      return NextResponse.json(
        { error: 'Yolda olan transfer silinemez' },
        { status: 400 }
      );
    }

    await prisma.transfer.delete({
      where: { id: paramsData.id }
    });

    return NextResponse.json({ message: 'Transfer başarıyla silindi' });
  } catch (error) {
    console.error('Transfer silinemedi:', error);
    return NextResponse.json(
      { error: 'Transfer silinemedi' },
      { status: 500 }
    );
  }
}