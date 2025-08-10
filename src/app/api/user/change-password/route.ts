import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

type MyJwtPayload = JwtPayload & { id: number; role: string };

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as MyJwtPayload;
    if (!decoded.id) {
      return NextResponse.json({ error: 'Geçersiz oturum.' }, { status: 401 });
    }
    
    const { currentPassword, newPassword } = await request.json();
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Mevcut şifre ve yeni şifre zorunludur.' }, { status: 400 });
    }
    
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Yeni şifre en az 6 karakter olmalıdır.' }, { status: 400 });
    }
    
    // Kullanıcıyı veritabanından al
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }
    
    // Mevcut şifreyi kontrol et
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Mevcut şifre hatalı.' }, { status: 400 });
    }
    
    // Yeni şifreyi hash'le
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Şifreyi güncelle
    await prisma.user.update({
      where: { id: decoded.id },
      data: { password: hashedNewPassword }
    });
    
    return NextResponse.json({ success: true, message: 'Şifre başarıyla değiştirildi.' });
  } catch (error) {
    console.error('Şifre değiştirme hatası:', error);
    return NextResponse.json({ error: 'Şifre değiştirilirken bir hata oluştu.' }, { status: 500 });
  }
}
