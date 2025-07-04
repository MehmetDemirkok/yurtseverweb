import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Tüm konaklama kayıtlarını listele
export async function GET() {
  // Tüm konaklama kayıtlarını çek
  const records = await prisma.accommodation.findMany();
  // Her konaklama için ilgili Sale kaydı var mı kontrol et
  const recordsWithStatus = await Promise.all(records.map(async (record) => {
    const sale = await prisma.sale.findFirst({ where: { accommodationId: record.id } });
    return { ...record, faturaEdildi: !!sale };
  }));
  return NextResponse.json(recordsWithStatus);
}

// Yeni konaklama kaydı ekle
export async function POST(request: Request) {
  const data = await request.json();
  try {
    if (Array.isArray(data)) {
      // Toplu kayıt ekleme
      const createdRecords = await prisma.$transaction(
        data.map((record) => prisma.accommodation.create({ data: record }))
      );
      return NextResponse.json(createdRecords);
    } else {
      // Tek kayıt ekleme
      const record = await prisma.accommodation.create({ data });
      return NextResponse.json(record);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
}

// Kayıt güncelle (PATCH)
export async function PATCH(request: Request) {
  const data = await request.json();
  const { id, ...updateData } = data;
  if (!id) {
    return NextResponse.json({ error: 'ID zorunlu' }, { status: 400 });
  }
  try {
    const updated = await prisma.accommodation.update({
      where: { id: Number(id) },
      data: updateData,
    });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
}

// Kayıt sil (DELETE)
export async function DELETE(request: Request) {
  const data = await request.json();
  const { id, ids } = data;
  
  try {
    // Kullanıcı bilgilerini al
    const cookieStore = await cookies();
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
    
    if (ids && Array.isArray(ids)) {
      // Toplu silme işlemi
      // Önce silinecek kayıtları bul ve logla
      const recordsToDelete = await prisma.accommodation.findMany({
        where: { id: { in: ids.map(Number) } },
      });
      
      // Log kayıtlarını oluştur
      await Promise.all(recordsToDelete.map(record => {
        return prisma.log.create({
          data: {
            action: 'DELETE',
            modelName: 'Accommodation',
            recordId: record.id,
            recordData: JSON.stringify(record),
            userId,
            ipAddress,
            userAgent
          }
        });
      }));
      
      // Kayıtları sil
      await prisma.accommodation.deleteMany({
        where: { id: { in: ids.map(Number) } },
      });
      
      return NextResponse.json({ success: true });
    } else if (id) {
      // Tek kayıt silme işlemi
      // Önce silinecek kaydı bul
      const recordToDelete = await prisma.accommodation.findUnique({
        where: { id: Number(id) },
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
        where: { id: Number(id) },
      });
      
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'ID veya IDs zorunlu' }, { status: 400 });
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
}