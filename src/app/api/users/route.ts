import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

type MyJwtPayload = JwtPayload & { role: string; userId: number };

// Tüm kullanıcıları listele - sadece ADMIN ve MANAGER
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as MyJwtPayload;
    if (!['ADMIN', 'MUDUR'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Bu işlem için yetki gereklidir.' }, { status: 403 });
    }
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        permissions: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: 'Bir hata oluştu.' }, { status: 500 });
  }
}

// Yeni kullanıcı oluştur - sadece ADMIN
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
    
    if (!data.email || !data.password) {
      return NextResponse.json({ error: 'Email ve şifre zorunludur.' }, { status: 400 });
    }
    
    // Email kontrolü
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });
    
    if (existingUser) {
      return NextResponse.json({ error: 'Bu email adresi zaten kullanılıyor.' }, { status: 400 });
    }
    
    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name || '',
        password: hashedPassword,
        role: data.role || 'KULLANICI',
        permissions: data.permissions || []
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        permissions: true
      }
    });
    
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Bir hata oluştu.' }, { status: 500 });
  }
} 