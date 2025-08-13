import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyAccess } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsData = await params;
    
    // Kullanıcı yetkilendirmesi
    const user = await requireCompanyAccess();

    // Aracın şirkete ait olduğunu kontrol et
    const arac = await prisma.arac.findFirst({
      where: {
        id: paramsData.id,
        companyId: user.companyId
      }
    });

    if (!arac) {
      return NextResponse.json(
        { error: 'Araç bulunamadı' }, 
        { status: 404 }
      );
    }

    // Araç eşleştirmesini kaldır
    await prisma.arac.update({
      where: { id: paramsData.id },
      data: {
        arventoId: null,
        arventoData: null
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Araç-Arvento eşleştirme kaldırma error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    
    if (error.message === 'Company access denied') {
      return NextResponse.json({ error: 'Şirket erişimi reddedildi' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Eşleştirme kaldırılamadı' }, 
      { status: 500 }
    );
  }
}
