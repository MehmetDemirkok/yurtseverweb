import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

// GET - Organizasyon detayını getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('GET request for organization ID:', params.id);
    
    const currentUser = await getUserFromToken();
    if (!currentUser) {
      console.log('User not authenticated');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated:', currentUser.email, 'Company ID:', currentUser.companyId);

    const organizationId = parseInt(params.id);
    if (isNaN(organizationId)) {
      console.log('Invalid organization ID:', params.id);
      return NextResponse.json({ error: 'Geçersiz organizasyon ID' }, { status: 400 });
    }

    console.log('Looking for organization with ID:', organizationId);

    // Önce organizasyonu bul
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        companyId: currentUser.companyId,
      },
    });

    console.log('Organization found:', organization);

    if (!organization) {
      console.log('Organization not found');
      return NextResponse.json({ error: 'Organizasyon bulunamadı' }, { status: 404 });
    }

    // Sonra konaklama sayısını al
    const accommodationCount = await prisma.accommodation.count({
      where: {
        organizationId: organizationId,
        companyId: currentUser.companyId,
      },
    });

    console.log('Accommodation count:', accommodationCount);

    // Organizasyon verisine konaklama sayısını ekle
    const organizationWithCount = {
      ...organization,
      _count: {
        accommodations: accommodationCount
      }
    };

    console.log('Returning organization with count:', organizationWithCount);

    return NextResponse.json(organizationWithCount);
  } catch (error) {
    console.error('Error fetching organization:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// PUT - Organizasyonu güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getUserFromToken();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = parseInt(params.id);
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
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getUserFromToken();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = parseInt(params.id);
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

    // Organizasyona bağlı konaklama kayıtları varsa uyarı ver
    if (existingOrganization._count.accommodations > 0) {
      return NextResponse.json({ 
        error: 'Bu organizasyona bağlı konaklama kayıtları bulunmaktadır. Önce konaklama kayıtlarını başka bir organizasyona taşıyın veya münferit konaklama olarak işaretleyin.' 
      }, { status: 400 });
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
