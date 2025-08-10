import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCompanyAccess } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireCompanyAccess();
    
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
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    if (error.message === 'Company access denied') {
      return NextResponse.json({ error: 'Şirket erişimi reddedildi' }, { status: 403 });
    }
    
    console.error('Accommodation fetch error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCompanyAccess();
    const data = await request.json();

    const accommodation = await prisma.accommodation.create({
      data: {
        ...data,
        companyId: user.companyId
      }
    });

    return NextResponse.json(accommodation);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    if (error.message === 'Company access denied') {
      return NextResponse.json({ error: 'Şirket erişimi reddedildi' }, { status: 403 });
    }
    
    console.error('Accommodation create error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}