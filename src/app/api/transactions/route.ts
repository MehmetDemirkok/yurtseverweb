import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Tüm işlemleri listele
export async function GET() {
  try {
    // Kullanıcı bilgilerini al ve yetki kontrolü yap
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string; permissions: string[] };
    
    // Finans sayfasına erişim yetkisi kontrolü
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { permissions: true, role: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 401 });
    }
    
    // Finans sayfasına erişim yetkisi kontrolü
    const hasPermission = user.permissions.includes('FINANCE_VIEW') || 
                         user.role === 'ADMIN' || 
                         user.role === 'MANAGER';
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Bu sayfaya erişim yetkiniz bulunmamaktadır.' }, { status: 403 });
    }
    
    // Tüm işlemleri çek
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    });
    
    return NextResponse.json(transactions);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
}

// Yeni işlem ekle
export async function POST(request: Request) {
  try {
    // Kullanıcı bilgilerini al ve yetki kontrolü yap
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string; permissions: string[] };
    
    // Finans sayfasına erişim yetkisi kontrolü
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { permissions: true, role: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 401 });
    }
    
    // Finans işlemi ekleme yetkisi kontrolü
    const hasPermission = user.permissions.includes('FINANCE_EDIT') || 
                         user.role === 'ADMIN' || 
                         user.role === 'MANAGER';
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'İşlem ekleme yetkiniz bulunmamaktadır.' }, { status: 403 });
    }
    
    const data = await request.json();
    
    // Basit validasyon
    if (!data.type || !data.description || !data.amount || !data.date) {
      return NextResponse.json({ error: 'Tüm alanlar zorunludur.' }, { status: 400 });
    }
    
    // İşlemi oluştur
    const transaction = await prisma.transaction.create({
      data: {
        type: data.type,
        description: data.description,
        amount: parseFloat(data.amount),
        date: data.date,
        userId: decoded.id
      }
    });
    
    return NextResponse.json(transaction);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
}

// İşlem sil
export async function DELETE(request: Request) {
  try {
    // Kullanıcı bilgilerini al ve yetki kontrolü yap
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string; permissions: string[] };
    
    // Finans sayfasına erişim yetkisi kontrolü
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { permissions: true, role: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 401 });
    }
    
    // Finans işlemi silme yetkisi kontrolü
    const hasPermission = user.permissions.includes('FINANCE_DELETE') || 
                         user.role === 'ADMIN';
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'İşlem silme yetkiniz bulunmamaktadır.' }, { status: 403 });
    }
    
    const data = await request.json();
    const { id } = data;
    
    if (!id) {
      return NextResponse.json({ error: 'ID zorunlu' }, { status: 400 });
    }
    
    // İşlemi sil
    await prisma.transaction.delete({
      where: { id: Number(id) }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
}