import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    
    const accommodations = await prisma.accommodation.findMany({
      where: {
        companyId: user.companyId
      },
      orderBy: {
        id: 'desc'
      }
    });

    return NextResponse.json(accommodations);
  } catch (error: any) {
    console.error('Accommodation fetch error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    // Kullanıcının ekleme yetkisi kontrol et
    if (!['ADMIN', 'MANAGER', 'USER'].includes(user.role)) {
      return NextResponse.json({ error: 'Kayıt ekleme yetkiniz yok' }, { status: 403 });
    }

    const data = await request.json();

    const accommodation = await prisma.accommodation.create({
      data: {
        ...data,
        companyId: user.companyId
      }
    });

    // Log kaydı oluştur
    await prisma.log.create({
      data: {
        action: 'CREATE',
        modelName: 'Accommodation',
        recordId: accommodation.id,
        recordData: JSON.stringify(accommodation),
        userId: user.id,
        companyId: user.companyId,
        ipAddress: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json(accommodation);
  } catch (error: any) {
    console.error('Accommodation create error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}