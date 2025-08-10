import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, Role } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(Role.ADMIN);
    
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            users: true,
            accommodations: true,
            hotels: true,
            araclar: true,
            soforler: true,
            transferler: true,
            cariler: true,
            tedarikciler: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(companies);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Yetersiz yetki' }, { status: 403 });
    }
    
    console.error('Companies fetch error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(Role.ADMIN);
    const data = await request.json();

    const company = await prisma.company.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country || 'Türkiye',
        taxNumber: data.taxNumber,
        taxOffice: data.taxOffice,
        logo: data.logo,
        status: data.status || 'ACTIVE'
      }
    });

    return NextResponse.json(company);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Yetersiz yetki' }, { status: 403 });
    }
    
    console.error('Company create error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
