/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

type MyJwtPayload = JwtPayload & { role: string; userId: number };

// Kullanıcı güncelle - sadece ADMIN
export async function PUT(request: Request, context: any) {
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
    const userId = parseInt(context.params.id);
    
    // Kendini değiştirmeye çalışıyorsa engelle
    if (decoded.userId === userId) {
      return NextResponse.json({ error: 'Kendi hesabınızı buradan değiştiremezsiniz.' }, { status: 400 });
    }
    
    const updateData: Record<string, unknown> = {};
    
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    
    if (data.role !== undefined) {
      updateData.role = data.role;
    }
    
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });
    
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Bir hata oluştu.' }, { status: 500 });
  }
}

// Kullanıcı sil - sadece ADMIN
export async function DELETE(request: Request, context: any) {
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
    
    const userId = parseInt(context.params.id);
    
    // Kendini silmeye çalışıyorsa engelle
    if (decoded.userId === userId) {
      return NextResponse.json({ error: 'Kendi hesabınızı silemezsiniz.' }, { status: 400 });
    }
    
    await prisma.user.delete({
      where: { id: userId }
    });
    
    return NextResponse.json({ message: 'Kullanıcı başarıyla silindi.' });
  } catch {
    return NextResponse.json({ error: 'Bir hata oluştu.' }, { status: 500 });
  }
} 