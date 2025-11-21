import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCompanyAccess } from '@/lib/auth';

// GET - Tüm transferleri listele
export async function GET() {
  try {
    console.log('Transferler API çağrısı başladı');
    
    const user = await requireCompanyAccess();
    console.log('Kullanıcı bilgileri alındı:', { id: user.id, companyId: user.companyId });
    
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
      },
      orderBy: {
        kalkisTarihi: 'desc'
      }
    });

    console.log(`${transferler.length} transfer bulundu`);
    return NextResponse.json({ transferler });
  } catch (error: any) {
    console.error('Transferler fetch error detayı:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    if (error.message === 'Company access denied') {
      return NextResponse.json({ error: 'Şirket erişimi reddedildi' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Transferler alınamadı', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Yeni transfer ekle
export async function POST(request: NextRequest) {
  try {
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
        cariId: cariId || null,
        tedarikciId: tedarikciId || null,
        tedarikciyeYaptirilacak: tedarikciyeYaptirilacak || false,
        manuelAracMarka: manuelAracMarka || null,
        manuelAracModel: manuelAracModel || null,
        manuelAracTip: manuelAracTip || null,
        manuelAracPlaka: manuelAracPlaka || null,
        manuelSoforAdi: manuelSoforAdi || null,
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

    return NextResponse.json({ transfer }, { status: 201 });
  } catch (error) {
    console.error('Transfer oluşturulamadı:', error);
    return NextResponse.json(
      { error: 'Transfer oluşturulamadı' },
      { status: 500 }
    );
  }
}