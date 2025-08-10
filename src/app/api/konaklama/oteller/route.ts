import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// JWT token'dan kullanıcı bilgisini al
async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET - Tüm otelleri listele
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hotels = await prisma.hotel.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(hotels);
  } catch (error) {
    console.error('Oteller listelenirken hata:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Yeni otel ekle
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Sadece ADMIN, MUDUR ve OPERATOR kullanıcılar otel ekleyebilir
    if (!['ADMIN', 'MUDUR', 'OPERATOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      adi,
      adres,
      sehir,
      ulke,
      telefon,
      email,
      website,
      yildizSayisi,
      puan,
      aciklama,
      durum
    } = body;

    // Zorunlu alanları kontrol et
    if (!adi || !adres || !sehir || !ulke) {
      return NextResponse.json({ 
        error: 'Otel adı, adres, şehir ve ülke alanları zorunludur' 
      }, { status: 400 });
    }

    // Puan kontrolü (sadece puan verilmişse)
    if (puan !== undefined && (puan < 0 || puan > 10)) {
      return NextResponse.json({ 
        error: 'Puan 0-10 arasında olmalıdır' 
      }, { status: 400 });
    }

    // Yıldız kontrolü (sadece yıldız verilmişse)
    if (yildizSayisi !== undefined && (yildizSayisi < 0 || yildizSayisi > 5)) {
      return NextResponse.json({ 
        error: 'Yıldız sayısı 0-5 arasında olmalıdır' 
      }, { status: 400 });
    }

    const hotel = await prisma.hotel.create({
      data: {
        adi,
        adres,
        sehir,
        ulke,
        telefon: telefon || null,
        email: email || null,
        website: website || null,
        yildizSayisi: yildizSayisi !== undefined ? parseInt(yildizSayisi) : 0,
        puan: puan !== undefined ? parseFloat(puan) : 0.0,
        aciklama: aciklama || null,
        durum: durum || 'AKTIF'
      }
    });

    // Log kaydı
    await prisma.log.create({
      data: {
        action: 'CREATE',
        modelName: 'Hotel',
        recordId: hotel.id,
        recordData: JSON.stringify(hotel),
        userId: user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json(hotel, { status: 201 });
  } catch (error) {
    console.error('Otel eklenirken hata:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
