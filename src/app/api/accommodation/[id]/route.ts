import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Belirli bir konaklama kaydını getir
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = parseInt(await params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Geçersiz ID' }, { status: 400 });
  }

  try {
    const record = await prisma.accommodation.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 });
    }

    // Satış durumunu kontrol et
    const sale = await prisma.sale.findFirst({ where: { accommodationId: record.id } });
    const recordWithStatus = { ...record, faturaEdildi: !!sale };

    return NextResponse.json(recordWithStatus);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
}

// Konaklama kaydını güncelle
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = parseInt(await params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Geçersiz ID' }, { status: 400 });
  }

  try {
    const data = await request.json();
    const updated = await prisma.accommodation.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
}

// Konaklama kaydını sil
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = parseInt(await params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Geçersiz ID' }, { status: 400 });
  }

  try {
    // Kullanıcı bilgilerini al
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    let userId = null;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        userId = decoded.id;
      } catch (e) {
        console.error('Token çözme hatası:', e);
      }
    }
    
    // IP ve User-Agent bilgilerini al
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Silinecek kaydı bul
    const recordToDelete = await prisma.accommodation.findUnique({
      where: { id },
    });
    
    if (!recordToDelete) {
      return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 });
    }
    
    // Log kaydı oluştur
    await prisma.log.create({
      data: {
        action: 'DELETE',
        modelName: 'Accommodation',
        recordId: recordToDelete.id,
        recordData: JSON.stringify(recordToDelete),
        userId,
        ipAddress,
        userAgent
      }
    });
    
    // Kaydı sil
    await prisma.accommodation.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
}