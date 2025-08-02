import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Belirli bir aracı getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const arac = await prisma.arac.findUnique({
      where: { id: params.id }
    });

    if (!arac) {
      return NextResponse.json(
        { error: 'Araç bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ arac });
  } catch (error) {
    console.error('Araç alınamadı:', error);
    return NextResponse.json(
      { error: 'Araç alınamadı' },
      { status: 500 }
    );
  }
}

// PUT - Araç güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { plaka, marka, model, yolcuKapasitesi, durum, enlem, boylam } = body;

    // Validasyon
    if (!plaka || !marka || !model || !yolcuKapasitesi) {
      return NextResponse.json(
        { error: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }

    // Plaka benzersizlik kontrolü (kendi ID'si hariç)
    const existingArac = await prisma.arac.findFirst({
      where: {
        plaka,
        id: { not: params.id }
      }
    });

    if (existingArac) {
      return NextResponse.json(
        { error: 'Bu plaka zaten başka bir araçta kayıtlı' },
        { status: 400 }
      );
    }

    const arac = await prisma.arac.update({
      where: { id: params.id },
      data: {
        plaka,
        marka,
        model,
        yolcuKapasitesi: parseInt(yolcuKapasitesi),
        durum,
        enlem: parseFloat(enlem) || 0,
        boylam: parseFloat(boylam) || 0,
        sonGuncelleme: new Date()
      }
    });

    return NextResponse.json({ arac });
  } catch (error) {
    console.error('Araç güncellenemedi:', error);
    return NextResponse.json(
      { error: 'Araç güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE - Araç sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Araç transferde kullanılıyor mu kontrol et
    const activeTransfer = await prisma.transfer.findFirst({
      where: {
        aracId: params.id,
        durum: { in: ['beklemede', 'yolda'] }
      }
    });

    if (activeTransfer) {
      return NextResponse.json(
        { error: 'Bu araç aktif bir transferde kullanılıyor' },
        { status: 400 }
      );
    }

    await prisma.arac.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Araç başarıyla silindi' });
  } catch (error) {
    console.error('Araç silinemedi:', error);
    return NextResponse.json(
      { error: 'Araç silinemedi' },
      { status: 500 }
    );
  }
} 