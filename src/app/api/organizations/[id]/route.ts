import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

// GET - Organizasyon detayını getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const currentUser = await getUserFromToken();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = parseInt(id);
    if (isNaN(organizationId)) {
      return NextResponse.json({ error: 'Geçersiz organizasyon ID' }, { status: 400 });
    }

    // Önce organizasyonu bul
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        companyId: currentUser.companyId,
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organizasyon bulunamadı' }, { status: 404 });
    }

    // Sonra konaklama sayısını al
    const accommodationCount = await prisma.accommodation.count({
      where: {
        organizationId: organizationId,
        companyId: currentUser.companyId,
      },
    });

    // Organizasyon verisine konaklama sayısını ekle
    const organizationWithCount = {
      ...organization,
      _count: {
        accommodations: accommodationCount
      }
    };

    return NextResponse.json(organizationWithCount);
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Organizasyonu güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getUserFromToken();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = parseInt(id);
    if (isNaN(organizationId)) {
      return NextResponse.json({ error: 'Geçersiz organizasyon ID' }, { status: 400 });
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

    // Organizasyonun mevcut olup olmadığını kontrol et
    const existingOrganization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        companyId: currentUser.companyId,
      },
    });

    if (!existingOrganization) {
      return NextResponse.json({ error: 'Organizasyon bulunamadı' }, { status: 404 });
    }

    // Aynı isimde başka organizasyon var mı kontrol et
    const duplicateOrganization = await prisma.organization.findFirst({
      where: {
        name,
        companyId: currentUser.companyId,
        id: { not: organizationId },
      },
    });

    if (duplicateOrganization) {
      return NextResponse.json({ error: 'Bu isimde bir organizasyon zaten mevcut' }, { status: 400 });
    }

    const updatedOrganization = await prisma.organization.update({
      where: {
        id: organizationId,
      },
      data: {
        name,
        description,
        contactPerson,
        contactEmail,
        contactPhone,
        status,
        baslangicTarihi: baslangicTarihi ? new Date(baslangicTarihi) : null,
        bitisTarihi: bitisTarihi ? new Date(bitisTarihi) : null,
        lokasyon,
        sehir,
        ulke,

      },
    });

    return NextResponse.json(updatedOrganization);
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE - Organizasyonu sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const currentUser = await getUserFromToken();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = parseInt(id);
    
    if (isNaN(organizationId)) {
      return NextResponse.json({ error: 'Geçersiz organizasyon ID' }, { status: 400 });
    }

    // Organizasyonun mevcut olup olmadığını kontrol et
    const existingOrganization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        companyId: currentUser.companyId,
      },
      include: {
        _count: {
          select: {
            accommodations: true,
          },
        },
      },
    });

    if (!existingOrganization) {
      return NextResponse.json({ error: 'Organizasyon bulunamadı' }, { status: 404 });
    }

    // Organizasyona bağlı konaklama kayıtları varsa münferit konaklama olarak işaretle
    if (existingOrganization._count.accommodations > 0) {
      // Konaklama kayıtlarını münferit olarak işaretle
      await prisma.accommodation.updateMany({
        where: {
          organizationId: organizationId,
          companyId: currentUser.companyId,
        },
        data: {
          organizationId: null,
          isMunferit: true,
        },
      });
    }

    await prisma.organization.delete({
      where: {
        id: organizationId,
      },
    });

    return NextResponse.json({ message: 'Organizasyon başarıyla silindi' });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
