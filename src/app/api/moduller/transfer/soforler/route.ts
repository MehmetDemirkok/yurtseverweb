import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Tüm şoförleri listele
export async function GET() {
  try {
    const soforler = await prisma.sofor.findMany({
      include: {
        atananArac: {
          select: {
            id: true,
            plaka: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ soforler });
  } catch (error) {
    console.error('Şoförler alınamadı:', error);
    return NextResponse.json(
      { error: 'Şoförler alınamadı' },
      { status: 500 }
    );
  }
}

// POST - Yeni şoför ekle
export async function POST(request: NextRequest) {
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

    // Telefon benzersizlik kontrolü
    const existingSofor = await prisma.sofor.findUnique({
      where: { telefon }
    });

    if (existingSofor) {
      return NextResponse.json(
        { error: 'Bu telefon numarası zaten kayıtlı' },
        { status: 400 }
      );
    }

    const sofor = await prisma.sofor.create({
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

    return NextResponse.json({ sofor }, { status: 201 });
  } catch (error) {
    console.error('Şoför oluşturulamadı:', error);
    return NextResponse.json(
      { error: 'Şoför oluşturulamadı' },
      { status: 500 }
    );
  }
} 