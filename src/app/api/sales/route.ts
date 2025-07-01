import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Tüm satışları listele
export async function GET() {
  const sales = await prisma.sale.findMany({
    include: {
      accommodation: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(sales);
}

// Satışa aktarma (bir veya birden fazla konaklama kaydı)
export async function POST(request: Request) {
  // --- İZİN KONTROLÜ ---
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string; permissions?: string[] };
    if (!decoded || !decoded.id) {
      return NextResponse.json({ error: 'Geçersiz oturum.' }, { status: 401 });
    }
    // Kullanıcıyı DB'den çekip permissions kontrolü yap
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { permissions: true }
    });
    if (!user || !user.permissions || !user.permissions.includes('sales')) {
      return NextResponse.json({ error: 'Satışa aktarma yetkiniz yok.' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Yetki kontrolü başarısız.' }, { status: 401 });
  }
  const data = await request.json();
  // data: { sales: [{ accommodationId, fiyat }], organizasyonAdi: string }
  const { sales, organizasyonAdi } = data;
  if (!sales || !Array.isArray(sales) || !organizasyonAdi) {
    return NextResponse.json({ error: 'Eksik veri.' }, { status: 400 });
  }
  const accommodationIds = sales.map(s => s.accommodationId);
  // Aynı organizasyonda daha önce satışa aktarılan konaklamaları bul
  const existingSales = await prisma.sale.findMany({
    where: {
      accommodationId: { in: accommodationIds },
      organizasyonAdi,
    },
  });
  const alreadySoldAccommodationIds = existingSales.map(sale => sale.accommodationId);
  const newSales = sales.filter(s => !alreadySoldAccommodationIds.includes(s.accommodationId));
  if (newSales.length === 0) {
    return NextResponse.json({ error: 'Seçili kayıtlar zaten bu organizasyonda satışa aktarılmış.' }, { status: 400 });
  }
  // Satış kayıtlarını oluştur
  const createdSales = await prisma.$transaction(
    newSales.map(({ accommodationId, fiyat }) =>
      prisma.sale.create({
        data: {
          accommodationId,
          organizasyonAdi,
          fiyat,
          status: 'AKTARILDI',
        },
      })
    )
  );
  // İlgili konaklamaların durumunu güncelle
  await prisma.accommodation.updateMany({
    where: {
      id: { in: newSales.map(s => s.accommodationId) },
      organizasyonAdi,
    },
    data: {
      faturaEdildi: true,
    },
  });
  return NextResponse.json({ success: true, createdSales });
}

// Satış fiyatı güncelle (PATCH)
export async function PATCH(request: Request) {
  const data = await request.json();
  const { id, fiyat } = data;
  if (!id || typeof fiyat !== 'number') {
    return NextResponse.json({ error: 'Eksik veri.' }, { status: 400 });
  }
  try {
    const updated = await prisma.sale.update({
      where: { id: Number(id) },
      data: { fiyat },
    });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
}

// Satış sil (DELETE)
export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    const { id } = data;
    if (!id) {
      return NextResponse.json({ error: 'Eksik veri: id gerekli.' }, { status: 400 });
    }
    // Önce silinecek satışı bul
    const sale = await prisma.sale.findUnique({ where: { id: Number(id) } });
    if (!sale) {
      return NextResponse.json({ error: 'Satış kaydı bulunamadı.' }, { status: 404 });
    }
    // Satışı sil
    await prisma.sale.delete({ where: { id: Number(id) } });
    // İlgili konaklama kaydını güncelle
    await prisma.accommodation.update({
      where: { id: sale.accommodationId },
      data: { faturaEdildi: false },
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
} 