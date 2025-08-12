import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyAccess } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ArventoService } from '@/lib/arvento';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Kullanıcı yetkilendirmesi
    const user = await requireCompanyAccess();

    const { arventoId } = await request.json();

    if (!arventoId) {
      return NextResponse.json(
        { error: 'Arvento ID gerekli' }, 
        { status: 400 }
      );
    }

    // Aracın şirkete ait olduğunu kontrol et
    const arac = await prisma.arac.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId
      }
    });

    if (!arac) {
      return NextResponse.json(
        { error: 'Araç bulunamadı' }, 
        { status: 404 }
      );
    }

    // Şirket bazlı Arvento servisi oluştur
    const arventoService = new ArventoService(user.companyId);
    
    // Arvento araç detaylarını getir
    const arventoVehicle = await arventoService.getVehicle(arventoId);

    // Araç eşleştirmesini kaydet
    await prisma.arac.update({
      where: { id: params.id },
      data: {
        arventoId: arventoId,
        arventoData: arventoVehicle
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Araç-Arvento eşleştirme error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    
    if (error.message === 'Company access denied') {
      return NextResponse.json({ error: 'Şirket erişimi reddedildi' }, { status: 403 });
    }

    if (error.message === 'Vehicle not found') {
      return NextResponse.json({ error: 'Arvento araç bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Eşleştirme başarısız' }, 
      { status: 500 }
    );
  }
}
