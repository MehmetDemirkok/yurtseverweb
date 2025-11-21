import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

// Şirketleri listele - ADMIN tüm şirketleri görebilir
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken();
    
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    // Sadece ADMIN tüm şirketleri görebilir
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bu işlem için ADMIN yetkisi gereklidir.' }, { status: 403 });
    }

    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        taxNumber: true,
        taxOffice: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            accommodations: true,
            hotels: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(companies);
  } catch (error: any) {
    console.error('Companies fetch error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

