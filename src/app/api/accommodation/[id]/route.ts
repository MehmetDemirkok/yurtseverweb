import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

// Belirli bir konaklama kaydını getir
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const paramsData = await params;
  const id = parseInt(paramsData.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Geçersiz ID' }, { status: 400 });
  }

  try {
    // Kullanıcı yetkilendirmesi kontrol et
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const record = await prisma.accommodation.findUnique({
      where: { id },
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

    if (!record) {
      return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 });
    }

    // Kullanıcının kendi şirketinin verilerine erişim kontrolü
    if (record.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Bu kayda erişim izniniz yok' }, { status: 403 });
    }

    return NextResponse.json(record);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
}

// Konaklama kaydını güncelle
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const paramsData = await params;
  const id = parseInt(paramsData.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Geçersiz ID' }, { status: 400 });
  }

  try {
    // Kullanıcı yetkilendirmesi kontrol et
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    // Kullanıcının düzenleme yetkisi kontrol et
    if (!['ADMIN', 'MANAGER', 'USER'].includes(user.role)) {
      return NextResponse.json({ error: 'Düzenleme yetkiniz yok' }, { status: 403 });
    }

    // Mevcut kaydı kontrol et
    const existingRecord = await prisma.accommodation.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 });
    }

    // Kullanıcının kendi şirketinin verilerine erişim kontrolü
    if (existingRecord.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Bu kaydı düzenleme izniniz yok' }, { status: 403 });
    }

    const data = await request.json();
    
    // companyId, id ve organization objesini değiştirmeye izin verme
    const { companyId, id: dataId, organization, ...updateData } = data;
    
    // Organizasyon ID varsa organizasyonun mevcut olduğunu kontrol et
    if (updateData.organizationId) {
      const organization = await prisma.organization.findFirst({
        where: {
          id: updateData.organizationId,
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
      
      // Eğer organizationId varsa isMunferit false olmalı
      updateData.isMunferit = false;
    }
    
    const updated = await prisma.accommodation.update({
      where: { id },
      data: updateData,
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
        action: 'UPDATE',
        modelName: 'Accommodation',
        recordId: id,
        recordData: JSON.stringify(updated),
        userId: user.id,
        companyId: user.companyId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
}

// Konaklama kaydını sil
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const paramsData = await params;
  const id = parseInt(paramsData.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Geçersiz ID' }, { status: 400 });
  }

  try {
    // Kullanıcı yetkilendirmesi kontrol et
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    // Kullanıcının silme yetkisi kontrol et
    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Silme yetkiniz yok' }, { status: 403 });
    }
    
    // Silinecek kaydı bul
    const recordToDelete = await prisma.accommodation.findUnique({
      where: { id },
    });
    
    if (!recordToDelete) {
      return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 });
    }

    // Kullanıcının kendi şirketinin verilerine erişim kontrolü
    if (recordToDelete.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Bu kaydı silme izniniz yok' }, { status: 403 });
    }
    
    // Log kaydı oluştur
    await prisma.log.create({
      data: {
        action: 'DELETE',
        modelName: 'Accommodation',
        recordId: recordToDelete.id,
        recordData: JSON.stringify(recordToDelete),
        userId: user.id,
        companyId: user.companyId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });
    
    // Kaydı sil
    await prisma.accommodation.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
}