import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    
    // Kullanıcının şirketine ait tüm konaklama kayıtlarından benzersiz otel isimlerini çek
    const accommodations = await prisma.accommodation.findMany({
      where: {
        companyId: user.companyId,
        otelAdi: {
          not: null,
        },
      },
      select: {
        otelAdi: true,
      },
      distinct: ['otelAdi'],
      orderBy: {
        otelAdi: 'asc',
      },
    });

    // Otel isimlerini temizle ve filtrele
    const hotelNames = accommodations
      .map(acc => acc.otelAdi)
      .filter((name): name is string => name !== null && name.trim() !== '')
      .map(name => name.trim());

    return NextResponse.json(hotelNames);
  } catch (error: any) {
    console.error('Hotel names fetch error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

