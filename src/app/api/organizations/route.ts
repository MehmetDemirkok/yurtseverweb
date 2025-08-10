import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

// GET - Tüm organizasyonları listele
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromToken();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const where: any = {
      companyId: currentUser.companyId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const organizations = await prisma.organization.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Her organizasyon için konaklama sayısını al
    const organizationsWithCounts = await Promise.all(
      organizations.map(async (org) => {
        const accommodationCount = await prisma.accommodation.count({
          where: {
            organizationId: org.id,
            companyId: currentUser.companyId,
          },
        });

        return {
          ...org,
          _count: {
            accommodations: accommodationCount
          }
        };
      })
    );
    
    return NextResponse.json(organizationsWithCounts);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// POST - Yeni organizasyon oluştur
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUserFromToken();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      contactPerson, 
      contactEmail, 
      contactPhone, 
      status,
      baslangicTarihi,
      bitisTarihi,
      lokasyon,
      sehir,
      ulke,
      hotelId
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Organizasyon adı zorunludur' }, { status: 400 });
    }

    // Aynı isimde organizasyon var mı kontrol et
    const existingOrganization = await prisma.organization.findFirst({
      where: {
        name,
        companyId: currentUser.companyId,
      },
    });

    if (existingOrganization) {
      return NextResponse.json({ error: 'Bu isimde bir organizasyon zaten mevcut' }, { status: 400 });
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        description,
        contactPerson,
        contactEmail,
        contactPhone,
        status: status || 'ACTIVE',
        baslangicTarihi: baslangicTarihi ? new Date(baslangicTarihi) : null,
        bitisTarihi: bitisTarihi ? new Date(bitisTarihi) : null,
        lokasyon,
        sehir,
        ulke,

        companyId: currentUser.companyId,
      },
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 