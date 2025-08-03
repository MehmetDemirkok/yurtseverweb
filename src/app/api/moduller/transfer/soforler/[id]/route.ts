import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Belirli bir şoförü getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sofor = await prisma.sofor.findUnique({
      where: { id: params.id },
      include: {
        atananArac: {
          select: {
            id: true,
            plaka: true
          }
        }
      }
    });

    if (!sofor) {
      return NextResponse.json(
        { error: 'Şoför bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ sofor });
  } catch (error) {
    console.error('Şoför alınamadı:', error);
    return NextResponse.json(
      { error: 'Şoför alınamadı' },
      { status: 500 }
    );
  }
}

// PUT - Şoför güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { ad, soyad, telefon, ehliyetSinifi, atananAracId, durum } = body;

    // Validasyon
    if (!ad || !soyad || !telefon || !ehliyetSinifi) {
      return NextResponse.json(
        { error: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }

    // Telefon benzersizlik kontrolü (kendi ID'si hariç)
    const existingSofor = await prisma.sofor.findFirst({
      where: {
        telefon,
        id: { not: params.id }
      }
    });

    if (existingSofor) {
      return NextResponse.json(
        { error: 'Bu telefon numarası zaten başka bir şoförde kayıtlı' },
        { status: 400 }
      );
    }

    const sofor = await prisma.sofor.update({
      where: { id: params.id },
      data: {
        ad,
        soyad,
        telefon,
        ehliyetSinifi,
        atananAracId: atananAracId || null,
        durum
      },
      include: {
        atananArac: {
          select: {
            id: true,
            plaka: true
          }
        }
      }
    });

    return NextResponse.json({ sofor });
  } catch (error) {
    console.error('Şoför güncellenemedi:', error);
    return NextResponse.json(
      { error: 'Şoför güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE - Şoför sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Şoför transferde kullanılıyor mu kontrol et
    const activeTransfer = await prisma.transfer.findFirst({
      where: {
        soforId: params.id,
        durum: { in: ['BEKLEMEDE', 'YOLDA'] }
      }
    });

    if (activeTransfer) {
      return NextResponse.json(
        { error: 'Bu şoför aktif bir transferde kullanılıyor' },
        { status: 400 }
      );
    }

    await prisma.sofor.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Şoför başarıyla silindi' });
  } catch (error) {
    console.error('Şoför silinemedi:', error);
    return NextResponse.json(
      { error: 'Şoför silinemedi' },
      { status: 500 }
    );
  }
}