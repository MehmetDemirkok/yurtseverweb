import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Tüm konaklama kayıtlarını listele
export async function GET() {
  const records = await prisma.accommodation.findMany();
  return NextResponse.json(records);
}

// Yeni konaklama kaydı ekle
export async function POST(request: Request) {
  const data = await request.json();
  try {
    const record = await prisma.accommodation.create({ data });
    return NextResponse.json(record);
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
  const { id } = data;
  if (!id) {
    return NextResponse.json({ error: 'ID zorunlu' }, { status: 400 });
  }
  try {
    await prisma.accommodation.delete({
      where: { id: Number(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
} 