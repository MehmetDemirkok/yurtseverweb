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