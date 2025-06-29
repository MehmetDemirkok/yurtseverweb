import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Kullanıcı adı ve şifre zorunlu.' }, { status: 400 });
    }
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { name: email }
        ]
      }
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ success: false, error: 'Kullanıcı adı veya şifre hatalı.' }, { status: 401 });
    }

    // JWT oluştur - role bilgisini de dahil et
    const token = jwt.sign({ 
      id: user.id, 
      email: user.email, 
      name: user.name,
      role: user.role 
    }, JWT_SECRET, { expiresIn: '7d' });
    
    // Cookie olarak set et
    const cookie = serialize('token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 gün
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    const response = NextResponse.json({ 
      success: true, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role 
      } 
    });
    response.headers.set('Set-Cookie', cookie);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
} 