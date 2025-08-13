import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, Role } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(Role.ADMIN);
    const paramsData = await params;
    const companyId = parseInt(paramsData.id);

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            users: true,
            accommodations: true,
            hotels: true,
            araclar: true,
            soforler: true,
            transferler: true,
            cariler: true,
            tedarikciler: true
          }
        }
      }
    });

    if (!company) {
      return NextResponse.json({ error: 'Şirket bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Yetersiz yetki' }, { status: 403 });
    }
    
    console.error('Company fetch error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(Role.ADMIN);
    const paramsData = await params;
    const companyId = parseInt(paramsData.id);
    const data = await request.json();

    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country || 'Türkiye',
        taxNumber: data.taxNumber,
        taxOffice: data.taxOffice,
        logo: data.logo,
        status: data.status || 'ACTIVE'
      }
    });

    return NextResponse.json(company);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Yetersiz yetki' }, { status: 403 });
    }
    
    console.error('Company update error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(Role.ADMIN);
    const paramsData = await params;
    const companyId = parseInt(paramsData.id);

    // Şirketin kullanıcı sayısını kontrol et
    const userCount = await prisma.user.count({
      where: { companyId }
    });

    if (userCount > 0) {
      return NextResponse.json(
        { error: 'Bu şirketin kullanıcıları bulunmaktadır. Önce kullanıcıları silmelisiniz.' },
        { status: 400 }
      );
    }

    await prisma.company.delete({
      where: { id: companyId }
    });

    return NextResponse.json({ message: 'Şirket başarıyla silindi' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Yetersiz yetki' }, { status: 403 });
    }
    
    console.error('Company delete error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
