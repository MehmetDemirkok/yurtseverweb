import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Tüm araçları listele
export async function GET() {
  try {
    const araclar = await prisma.arac.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ araclar });
  } catch (error) {
    console.error('Araçlar alınamadı:', error);
    return NextResponse.json(
      { error: 'Araçlar alınamadı' },
      { status: 500 }
    );
  }
}

// POST - Yeni araç ekle
export async function POST(request: NextRequest) {
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

    // Plaka benzersizlik kontrolü
    const existingArac = await prisma.arac.findUnique({
      where: { plaka }
    });

    if (existingArac) {
      return NextResponse.json(
        { error: 'Bu plaka zaten kayıtlı' },
        { status: 400 }
      );
    }

    const arac = await prisma.arac.create({
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

    return NextResponse.json({ arac }, { status: 201 });
  } catch (error) {
    console.error('Araç oluşturulamadı:', error);
    return NextResponse.json(
      { error: 'Araç oluşturulamadı' },
      { status: 500 }
    );
  }
} 