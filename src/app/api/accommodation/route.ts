import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const organizasyonAdi = searchParams.get('organizasyonAdi');
    const organizationId = searchParams.get('organizationId');
    const isMunferit = searchParams.get('isMunferit');
    
    const whereClause: any = {
      companyId: user.companyId
    };
    
    if (organizasyonAdi) {
      whereClause.organizasyonAdi = organizasyonAdi;
    }
    
    if (organizationId) {
      whereClause.organizationId = parseInt(organizationId);
    }
    
    if (isMunferit !== null) {
      whereClause.isMunferit = isMunferit === 'true';
    }
    
    const accommodations = await prisma.accommodation.findMany({
      where: whereClause,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
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
    if (!['ADMIN', 'MUDUR', 'OPERATOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Kayıt ekleme yetkiniz yok' }, { status: 403 });
    }

    const data = await request.json();
    
    // organizationId boş string ise null yap
    if (data.organizationId === '') {
      data.organizationId = null;
    }
    
    // Organizasyon ID varsa organizasyonun mevcut olduğunu kontrol et
    if (data.organizationId) {
      const organization = await prisma.organization.findFirst({
        where: {
          id: data.organizationId,
          companyId: user.companyId,
        },
      });
      
      if (!organization) {
        return NextResponse.json({ error: 'Belirtilen organizasyon bulunamadı' }, { status: 400 });
      }
      
      // Organizasyon aktif mi kontrol et
      if (organization.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Belirtilen organizasyon aktif değil' }, { status: 400 });
      }
    }

    const accommodation = await prisma.accommodation.create({
      data: {
        ...data,
        companyId: user.companyId,
        // Eğer organizationId varsa isMunferit false olmalı
        isMunferit: data.organizationId ? false : (data.isMunferit || false),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
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
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json(accommodation);
  } catch (error: any) {
    console.error('Accommodation create error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}