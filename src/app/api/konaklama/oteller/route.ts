import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCompanyAccess } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireCompanyAccess();
    
    const hotels = await prisma.hotel.findMany({
      where: {
        companyId: user.companyId,
        durum: 'AKTIF'
      },
      select: {
        id: true,
        adi: true,
        sehir: true,
        ulke: true,
        durum: true,
      },
      orderBy: {
        adi: 'asc'
      }
    });

    return NextResponse.json(hotels);
  } catch (error: any) {
    console.error('Hotels fetch error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    if (error.message === 'Company access denied') {
      return NextResponse.json({ error: 'Şirket erişimi reddedildi' }, { status: 403 });
    }
    
    return NextResponse.json({ 
      error: 'Sunucu hatası', 
      details: error.message 
    }, { status: 500 });
  }
}

