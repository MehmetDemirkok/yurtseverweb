import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Tüm carileri listele
export async function GET() {
  try {
    const cariler = await prisma.cari.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ cariler });
  } catch (error) {
    console.error('Cariler alınamadı:', error);
    return NextResponse.json(
      { error: 'Cariler alınamadı' },
      { status: 500 }
    );
  }
}

// POST - Yeni cari ekle
export async function POST(request: NextRequest) {
  try {
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

    const cari = await prisma.cari.create({
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

    return NextResponse.json({ cari }, { status: 201 });
  } catch (error) {
    console.error('Cari oluşturulamadı:', error);
    return NextResponse.json(
      { error: 'Cari oluşturulamadı' },
      { status: 500 }
    );
  }
}
