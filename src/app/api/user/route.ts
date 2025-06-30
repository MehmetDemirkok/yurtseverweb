import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

type MyJwtPayload = JwtPayload & { role: string; userId: number };

// Kullanıcı listeleme
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
  }
  const decoded = jwt.verify(token, JWT_SECRET) as MyJwtPayload;
  if (!decoded.id || typeof decoded.id !== 'number' || isNaN(decoded.id)) {
    return NextResponse.json({ error: 'Geçersiz oturum.' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true
    }
  });
  if (!user) {
    return NextResponse.json({ error: 'Geçersiz oturum.' }, { status: 401 });
  }
  return NextResponse.json({ user });
}

// Kullanıcı ekleme - sadece ADMIN yetkisi
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as MyJwtPayload;
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bu işlem için ADMIN yetkisi gereklidir.' }, { status: 403 });
    }
    
    const data = await request.json();
    // Basit validasyon: email zorunlu
    if (!data.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Şifreyi hash'le
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    
    // Role varsayılan olarak USER
    if (!data.role) {
      data.role = 'USER';
    }
    
    const user = await prisma.user.create({ data });
    return NextResponse.json(user);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
} 