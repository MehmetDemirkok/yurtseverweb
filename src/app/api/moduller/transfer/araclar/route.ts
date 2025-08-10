import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCompanyAccess } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireCompanyAccess();
    
    const araclar = await prisma.arac.findMany({
      where: {
        companyId: user.companyId
      },
      include: {
        soforler: true,
        transferler: {
          where: {
            durum: {
              in: ['BEKLEMEDE', 'YOLDA']
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(araclar);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    if (error.message === 'Company access denied') {
      return NextResponse.json({ error: 'Şirket erişimi reddedildi' }, { status: 403 });
    }
    
    console.error('Araç fetch error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCompanyAccess();
    const data = await request.json();

    const arac = await prisma.arac.create({
      data: {
        ...data,
        companyId: user.companyId
      }
    });

    return NextResponse.json(arac);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    if (error.message === 'Company access denied') {
      return NextResponse.json({ error: 'Şirket erişimi reddedildi' }, { status: 403 });
    }
    
    console.error('Araç create error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
} 