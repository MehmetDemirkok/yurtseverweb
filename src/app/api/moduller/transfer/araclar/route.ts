import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCompanyAccess } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('Araçlar API çağrısı başladı');
    
    const user = await requireCompanyAccess();
    console.log('Kullanıcı bilgileri alındı:', { id: user.id, companyId: user.companyId });
    
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

    console.log(`${araclar.length} araç bulundu`);
    return NextResponse.json({ araclar });
  } catch (error: any) {
    console.error('Araç fetch error detayı:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
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

export async function POST(request: NextRequest) {
  try {
    const user = await requireCompanyAccess();
    const data = await request.json();

    // Tarih alanlarını dönüştür
    const processedData = {
      ...data,
      sigortaTarihi: data.sigortaTarihi ? new Date(data.sigortaTarihi) : null,
      muayeneTarihi: data.muayeneTarihi ? new Date(data.muayeneTarihi) : null,
      companyId: user.companyId
    };

    const arac = await prisma.arac.create({
      data: processedData
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