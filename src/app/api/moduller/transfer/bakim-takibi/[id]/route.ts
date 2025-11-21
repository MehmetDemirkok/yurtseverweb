import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET - Tek bir bakım kaydını getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const bakim = await prisma.aracBakim.findFirst({
      where: {
        id: params.id,
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

    if (!bakim) {
      return NextResponse.json(
        { error: 'Bakım kaydı bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ bakim });
  } catch (error) {
    console.error('Bakım kaydı alınırken hata:', error);
    return NextResponse.json(
      { error: 'Bakım kaydı alınamadı' },
      { status: 500 }
    );
  }
}

// PUT - Bakım kaydını güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const body = await request.json();
    const {
      bakimTipi,
      durum,
      baslik,
      aciklama,
      planlananTarih,
      baslamaTarihi,
      bitisTarihi,
      maliyet,
      odemeDurumu,
      odemeTarihi,
      tedarikci,
      tedarikciTelefon,
      tedarikciAdres,
      notlar,
    } = body;

    // Bakım kaydının varlığını kontrol et
    const mevcutBakim = await prisma.aracBakim.findFirst({
      where: {
        id: params.id,
        companyId: currentUser.companyId,
      },
    });

    if (!mevcutBakim) {
      return NextResponse.json(
        { error: 'Bakım kaydı bulunamadı' },
        { status: 404 }
      );
    }

    const guncellenenBakim = await prisma.aracBakim.update({
      where: {
        id: params.id,
      },
      data: {
        bakimTipi,
        durum,
        baslik,
        aciklama,
        planlananTarih: planlananTarih ? new Date(planlananTarih) : undefined,
        baslamaTarihi: baslamaTarihi ? new Date(baslamaTarihi) : undefined,
        bitisTarihi: bitisTarihi ? new Date(bitisTarihi) : undefined,
        maliyet: maliyet ? parseFloat(maliyet) : null,
        odemeDurumu,
        odemeTarihi: odemeTarihi ? new Date(odemeTarihi) : undefined,
        tedarikci,
        tedarikciTelefon,
        tedarikciAdres,
        notlar,
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

    return NextResponse.json({ bakim: guncellenenBakim });
  } catch (error) {
    console.error('Bakım kaydı güncellenirken hata:', error);
    return NextResponse.json(
      { error: 'Bakım kaydı güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE - Bakım kaydını sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    // Bakım kaydının varlığını kontrol et
    const mevcutBakim = await prisma.aracBakim.findFirst({
      where: {
        id: params.id,
        companyId: currentUser.companyId,
      },
    });

    if (!mevcutBakim) {
      return NextResponse.json(
        { error: 'Bakım kaydı bulunamadı' },
        { status: 404 }
      );
    }

    await prisma.aracBakim.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: 'Bakım kaydı başarıyla silindi' });
  } catch (error) {
    console.error('Bakım kaydı silinirken hata:', error);
    return NextResponse.json(
      { error: 'Bakım kaydı silinemedi' },
      { status: 500 }
    );
  }
}
