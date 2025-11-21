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

    // Toplu kayıt işlemi
    if (data.records && Array.isArray(data.records)) {
      const createdRecords = [];
      const errors = [];

      // Transaction ile işlemi güvenli hale getir
      // Not: SQLite'da iç içe transaction sorun olabilir, bu yüzden döngü içinde tek tek işliyoruz
      // veya tümünü tek bir transaction bloğuna alıyoruz.
      
      try {
        const result = await prisma.$transaction(async (tx) => {
          const results = [];
          
          for (const record of data.records) {
            // organizationId boş string ise null yap
            if (record.organizationId === '') {
              record.organizationId = null;
            }
            
            // Organizasyon ID varsa organizasyonun mevcut olduğunu kontrol et
            if (record.organizationId) {
              const organization = await tx.organization.findFirst({
                where: {
                  id: record.organizationId,
                  companyId: user.companyId,
                },
              });
              
              if (!organization) {
                throw new Error(`Organizasyon bulunamadı: ${record.organizationId}`);
              }
              
              if (organization.status !== 'ACTIVE') {
                throw new Error(`Organizasyon aktif değil: ${organization.name}`);
              }
            }

            const accommodation = await tx.accommodation.create({
              data: {
                ...record,
                companyId: user.companyId,
                // Eğer organizationId varsa isMunferit false olmalı
                isMunferit: record.organizationId ? false : (record.isMunferit || false),
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
            
            // Log kaydı
            await tx.log.create({
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

            results.push(accommodation);
          }
          
          return results;
        });
        
        return NextResponse.json(result);
        
      } catch (error: any) {
        console.error('Bulk create transaction error:', error);
        return NextResponse.json({ error: `Toplu kayıt sırasında hata: ${error.message}` }, { status: 400 });
      }
    }
    
    // Tekli kayıt işlemi (Mevcut kod)
    
    // Varsayılan değerleri ayarla
    const accommodationData = {
      ...data,
      ulke: data.ulke || 'Türkiye',
      sehir: data.sehir || '',
      organizationId: data.organizationId || null,
      isMunferit: data.organizationId ? false : (data.isMunferit || false),
      companyId: user.companyId,
    };
    
    // Organizasyon ID varsa organizasyonun mevcut olduğunu kontrol et
    if (accommodationData.organizationId) {
      const organization = await prisma.organization.findFirst({
        where: {
          id: accommodationData.organizationId,
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
      data: accommodationData,
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