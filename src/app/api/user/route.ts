import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Kullanıcı listeleme
export async function GET() {
  const users = await prisma.user.findMany();
  return NextResponse.json(users);
}

// Kullanıcı ekleme
export async function POST(request: Request) {
  const data = await request.json();
  // Basit validasyon: email zorunlu
  if (!data.email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }
  try {
    const user = await prisma.user.create({ data });
    return NextResponse.json(user);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
} 