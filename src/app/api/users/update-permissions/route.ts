import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Tüm kullanıcıların izinlerini güncelle
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bu işlem için ADMIN yetkisi gereklidir.' }, { status: 403 });
    }
    
    const data = await request.json();
    const { permission, userIds } = data;
    
    if (!permission || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'Geçersiz veri formatı.' }, { status: 400 });
    }
    
    // Kullanıcıların izinlerini güncelle
    const updatePromises = userIds.map(async (userId: number) => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { permissions: true }
      });
      
      if (!user) return null;
      
      // İzin zaten varsa ekleme, yoksa ekle
      let updatedPermissions = [...user.permissions];
      if (!updatedPermissions.includes(permission)) {
        updatedPermissions.push(permission);
      }
      
      return prisma.user.update({
        where: { id: userId },
        data: { permissions: updatedPermissions },
        select: { id: true, email: true, name: true, permissions: true }
      });
    });
    
    const results = await Promise.all(updatePromises);
    const updatedUsers = results.filter(Boolean);
    
    return NextResponse.json({ success: true, updatedUsers });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
}

// Kullanıcıların izinlerini kaldır
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bu işlem için ADMIN yetkisi gereklidir.' }, { status: 403 });
    }
    
    const data = await request.json();
    const { permission, userIds } = data;
    
    if (!permission || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'Geçersiz veri formatı.' }, { status: 400 });
    }
    
    // Kullanıcıların izinlerini güncelle
    const updatePromises = userIds.map(async (userId: number) => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { permissions: true }
      });
      
      if (!user) return null;
      
      // İzni kaldır
      const updatedPermissions = user.permissions.filter(p => p !== permission);
      
      return prisma.user.update({
        where: { id: userId },
        data: { permissions: updatedPermissions },
        select: { id: true, email: true, name: true, permissions: true }
      });
    });
    
    const results = await Promise.all(updatePromises);
    const updatedUsers = results.filter(Boolean);
    
    return NextResponse.json({ success: true, updatedUsers });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
}