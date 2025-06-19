import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Kullanıcı listeleme
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    return NextResponse.json({ user: decoded });
  } catch {
    return NextResponse.json({ error: 'Geçersiz oturum.' }, { status: 401 });
  }
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