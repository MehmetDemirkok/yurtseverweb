import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCompanyAccess } from '@/lib/auth';

// GET - Tüm transferleri listele
export async function GET() {
  try {
    const user = await requireCompanyAccess();
    const transferler = await prisma.transfer.findMany({
      where: {
        companyId: user.companyId
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
        yolcular: true
      },
      orderBy: {
        kalkisTarihi: 'desc'
      }
    });

    return NextResponse.json({ transferler });
  } catch (error) {
    console.error('Transferler alınamadı:', error);
    return NextResponse.json(
      { error: 'Transferler alınamadı' },
      { status: 500 }
    );
  }
}

// POST - Yeni transfer ekle
export async function POST(request: NextRequest) {
  try {
    const user = await requireCompanyAccess();
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
      yolcular
    } = body;

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

    const transfer = await prisma.transfer.create({
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
        companyId: user.companyId,
        yolcular: {
          create: yolcular || []
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
        yolcular: true
      }
    });

    return NextResponse.json({ transfer }, { status: 201 });
  } catch (error) {
    console.error('Transfer oluşturulamadı:', error);
    return NextResponse.json(
      { error: 'Transfer oluşturulamadı' },
      { status: 500 }
    );
  }
}