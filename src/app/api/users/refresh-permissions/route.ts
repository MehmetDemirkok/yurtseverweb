import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Kullanıcı izinlerini yenile ve yeni JWT token oluştur
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    
    // Kullanıcının güncel bilgilerini veritabanından al
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }
    
    // Yeni JWT token oluştur
    const newToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Yeni token'ı cookie olarak ayarla
    const response = NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions
      }
    });
    
    response.headers.set('Set-Cookie', `token=${newToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`);
    
    return response;
  } catch (error) {
    console.error('Error refreshing permissions:', error);
    return NextResponse.json({ error: 'İzinler yenilenirken hata oluştu.' }, { status: 500 });
  }
}
