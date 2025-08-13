import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Belirli bir tedarikçiyi getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsData = await params;
    const tedarikci = await prisma.tedarikci.findUnique({
      where: { id: paramsData.id }
    });

    if (!tedarikci) {
      return NextResponse.json(
        { error: 'Tedarikçi bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tedarikci });
  } catch (error) {
    console.error('Tedarikçi alınamadı:', error);
    return NextResponse.json(
      { error: 'Tedarikçi alınamadı' },
      { status: 500 }
    );
  }
}

// PUT - Tedarikçi güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { 
      sirketAdi, 
      yetkiliKisi, 
      email, 
      telefon, 
      adres, 
      sehir, 
      ulke, 
      vergiNo, 
      vergiDairesi, 
      hizmetTuru, 
      notlar, 
      durum 
    } = body;

    // Validasyon
    if (!sirketAdi) {
      return NextResponse.json(
        { error: 'Şirket adı alanı zorunludur' },
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
    const tedarikci = await prisma.tedarikci.update({
      where: { id: paramsData.id },
      data: {
        sirketAdi,
        yetkiliKisi: yetkiliKisi || null,
        email: email || null,
        telefon: telefon || null,
        adres: adres || null,
        sehir: sehir || null,
        ulke: ulke || 'Türkiye',
        vergiNo: vergiNo || null,
        vergiDairesi: vergiDairesi || null,
        hizmetTuru: hizmetTuru || null,
        notlar: notlar || null,
        durum: durum || 'AKTIF'
      }
    });

    return NextResponse.json({ tedarikci });
  } catch (error) {
    console.error('Tedarikçi güncellenemedi:', error);
    return NextResponse.json(
      { error: 'Tedarikçi güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE - Tedarikçi sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsData = await params;
    const tedarikci = await prisma.tedarikci.findUnique({
      where: { id: paramsData.id }
    });

    if (!tedarikci) {
      return NextResponse.json(
        { error: 'Tedarikçi bulunamadı' },
        { status: 404 }
      );
    }

    await prisma.tedarikci.delete({
      where: { id: paramsData.id }
    });

    return NextResponse.json({ message: 'Tedarikçi başarıyla silindi' });
  } catch (error) {
    console.error('Tedarikçi silinemedi:', error);
    return NextResponse.json(
      { error: 'Tedarikçi silinemedi' },
      { status: 500 }
    );
  }
}
