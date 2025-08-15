import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET - Bakım listesini getir
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const aracId = searchParams.get('aracId');
    const durum = searchParams.get('durum');
    const bakimTipi = searchParams.get('bakimTipi');

    // Filtreleme koşulları
    const where: any = {
      companyId: currentUser.companyId,
    };

    if (aracId) {
      where.aracId = aracId;
    }

    if (durum && durum !== 'TUMU') {
      where.durum = durum;
    }

    if (bakimTipi && bakimTipi !== 'TUMU') {
      where.bakimTipi = bakimTipi;
    }

    const bakimlar = await prisma.aracBakim.findMany({
      where,
      include: {
        arac: {
          select: {
            id: true,
            plaka: true,
            marka: true,
            model: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        planlananTarih: 'asc',
      },
    });

    return NextResponse.json({ bakimlar });
  } catch (error) {
    console.error('Bakım listesi alınırken hata:', error);
    return NextResponse.json(
      { error: 'Bakım listesi alınamadı' },
      { status: 500 }
    );
  }
}

// POST - Yeni bakım ekle
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const body = await request.json();
    const {
      aracId,
      bakimTipi,
      baslik,
      aciklama,
      planlananTarih,
      maliyet,
      tedarikci,
      tedarikciTelefon,
      tedarikciAdres,
      notlar,
    } = body;

    // Araç kontrolü
    const arac = await prisma.arac.findFirst({
      where: {
        id: aracId,
        companyId: currentUser.companyId,
      },
    });

    if (!arac) {
      return NextResponse.json(
        { error: 'Araç bulunamadı' },
        { status: 404 }
      );
    }

    const yeniBakim = await prisma.aracBakim.create({
      data: {
        aracId,
        bakimTipi,
        baslik,
        aciklama,
        planlananTarih: new Date(planlananTarih),
        maliyet: maliyet ? parseFloat(maliyet) : null,
        tedarikci,
        tedarikciTelefon,
        tedarikciAdres,
        notlar,
        createdBy: currentUser.id,
        companyId: currentUser.companyId,
      },
      include: {
        arac: {
          select: {
            id: true,
            plaka: true,
            marka: true,
            model: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ bakim: yeniBakim }, { status: 201 });
  } catch (error) {
    console.error('Bakım eklenirken hata:', error);
    return NextResponse.json(
      { error: 'Bakım eklenemedi' },
      { status: 500 }
    );
  }
}
