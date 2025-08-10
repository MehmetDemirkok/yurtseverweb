import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

// Belirli bir konaklama kaydını getir
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
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
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
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
    
    // companyId'yi değiştirmeye izin verme
    const { companyId, ...updateData } = data;
    
    const updated = await prisma.accommodation.update({
      where: { id },
      data: updateData,
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
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
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