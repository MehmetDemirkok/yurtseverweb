import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCompanyAccess } from '@/lib/auth';

// GET - Belirli bir cariyi getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCompanyAccess();
    const paramsData = await params;
    const cari = await prisma.cari.findFirst({
      where: { 
        id: paramsData.id,
        companyId: user.companyId // Şirket bazlı veri izolasyonu
      }
    });

    if (!cari) {
      return NextResponse.json(
        { error: 'Cari bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ cari });
  } catch (error) {
    console.error('Cari alınamadı:', error);
    return NextResponse.json(
      { error: 'Cari alınamadı' },
      { status: 500 }
    );
  }
}

// PUT - Cari güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCompanyAccess();
    const body = await request.json();
    const { 
      ad, 
      soyad, 
      sirket, 
      email, 
      telefon, 
      adres, 
      sehir, 
      ulke, 
      vergiNo, 
      vergiDairesi, 
      notlar, 
      tip, 
      durum 
    } = body;

    // Validasyon
    if (!ad) {
      return NextResponse.json(
        { error: 'Ad alanı zorunludur' },
        { status: 400 }
      );
    }

    // Email validasyonu (varsa)
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Geçersiz email formatı' },
          { status: 400 }
        );
      }
    }

    const paramsData = await params;
    const cari = await prisma.cari.update({
      where: { 
        id: paramsData.id,
        companyId: user.companyId // Şirket bazlı veri izolasyonu
      },
      data: {
        ad,
        soyad: soyad || null,
        sirket: sirket || null,
        email: email || null,
        telefon: telefon || null,
        adres: adres || null,
        sehir: sehir || null,
        ulke: ulke || 'Türkiye',
        vergiNo: vergiNo || null,
        vergiDairesi: vergiDairesi || null,
        notlar: notlar || null,
        tip: tip || 'MUSTERI',
        durum: durum || 'AKTIF'
      }
    });

    return NextResponse.json({ cari });
  } catch (error) {
    console.error('Cari güncellenemedi:', error);
    return NextResponse.json(
      { error: 'Cari güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE - Cari sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCompanyAccess();
    const paramsData = await params;
    
    // Cariyi sil (şirket bazlı)
    await prisma.cari.delete({
      where: { 
        id: paramsData.id,
        companyId: user.companyId // Şirket bazlı veri izolasyonu
      }
    });

    return NextResponse.json({ message: 'Cari başarıyla silindi' });
  } catch (error) {
    console.error('Cari silinemedi:', error);
    return NextResponse.json(
      { error: 'Cari silinemedi' },
      { status: 500 }
    );
  }
}
