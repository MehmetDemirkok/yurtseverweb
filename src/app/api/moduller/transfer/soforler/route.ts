import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCompanyAccess } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireCompanyAccess();
    
    const soforler = await prisma.sofor.findMany({
      where: {
        companyId: user.companyId
      },
      include: {
        atananArac: true,
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

    return NextResponse.json({ soforler });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    if (error.message === 'Company access denied') {
      return NextResponse.json({ error: 'Şirket erişimi reddedildi' }, { status: 403 });
    }
    
    console.error('Şoför fetch error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCompanyAccess();
    const data = await request.json();

    const sofor = await prisma.sofor.create({
      data: {
        ...data,
        companyId: user.companyId
      }
    });

    return NextResponse.json(sofor);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    if (error.message === 'Company access denied') {
      return NextResponse.json({ error: 'Şirket erişimi reddedildi' }, { status: 403 });
    }
    
    console.error('Şoför create error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}