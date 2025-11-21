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

// GET - Belirli bir oteli getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paramsData = await params;
    const id = parseInt(paramsData.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const hotel = await prisma.hotel.findUnique({
      where: { id }
    });

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    return NextResponse.json(hotel);
  } catch (error) {
    console.error('Otel getirilirken hata:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Otel güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Sadece ADMIN ve MUDUR kullanıcılar otel güncelleyebilir
    if (!['ADMIN', 'MUDUR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const paramsData = await params;
    const id = parseInt(paramsData.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
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

    // Puan kontrolü
    if (puan < 0 || puan > 10) {
      return NextResponse.json({ 
        error: 'Puan 0-10 arasında olmalıdır' 
      }, { status: 400 });
    }

    // Yıldız kontrolü
    if (yildizSayisi < 0 || yildizSayisi > 5) {
      return NextResponse.json({ 
        error: 'Yıldız sayısı 0-5 arasında olmalıdır' 
      }, { status: 400 });
    }

    // Otelin var olup olmadığını kontrol et
    const existingHotel = await prisma.hotel.findUnique({
      where: { id }
    });

    if (!existingHotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    const updatedHotel = await prisma.hotel.update({
      where: { id },
      data: {
        adi,
        adres,
        sehir,
        ulke,
        telefon: telefon || null,
        email: email || null,
        website: website || null,
        yildizSayisi: parseInt(yildizSayisi),
        puan: parseFloat(puan),
        aciklama: aciklama || null,
        durum: durum || 'AKTIF'
      }
    });

    // Log kaydı
    await prisma.log.create({
      data: {
        action: 'UPDATE',
        modelName: 'Hotel',
        recordId: id,
        recordData: JSON.stringify(updatedHotel),
        userId: user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json(updatedHotel);
  } catch (error) {
    console.error('Otel güncellenirken hata:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Otel sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Sadece ADMIN ve MUDUR kullanıcılar otel silebilir
    if (!['ADMIN', 'MUDUR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const paramsData = await params;
    const id = parseInt(paramsData.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Otelin var olup olmadığını kontrol et
    const existingHotel = await prisma.hotel.findUnique({
      where: { id }
    });

    if (!existingHotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    // Log kaydı (silme işleminden önce)
    await prisma.log.create({
      data: {
        action: 'DELETE',
        modelName: 'Hotel',
        recordId: id,
        recordData: JSON.stringify(existingHotel),
        userId: user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    // Oteli sil
    await prisma.hotel.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Hotel deleted successfully' });
  } catch (error) {
    console.error('Otel silinirken hata:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
