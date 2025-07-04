import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Tüm logları listele
export async function GET() {
  try {
    // Yetki kontrolü
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
      select: { permissions: true, role: true }
    });
    
    if (!user || (!user.permissions?.includes('admin') && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Bu sayfaya erişim yetkiniz yok.' }, { status: 403 });
    }
    
    // Logları çek
    const logs = await prisma.log.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Log listeleme hatası:', error);
    return NextResponse.json({ error: 'Loglar alınırken bir hata oluştu.' }, { status: 500 });
  }
}