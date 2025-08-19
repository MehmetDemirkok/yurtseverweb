import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCompanyAccess } from '@/lib/auth';

// GET - Belirli bir aracı getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCompanyAccess();
    const paramsData = await params;
    const arac = await prisma.arac.findFirst({
      where: { 
        id: paramsData.id,
        companyId: user.companyId // Şirket bazlı veri izolasyonu
      }
    });

    if (!arac) {
      return NextResponse.json(
        { error: 'Araç bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ arac });
  } catch (error) {
    console.error('Araç alınamadı:', error);
    return NextResponse.json(
      { error: 'Araç alınamadı' },
      { status: 500 }
    );
  }
}

// PUT - Araç güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCompanyAccess();
    const paramsData = await params;
    const body = await request.json();
    const { plaka, marka, model, aracTipi, yolcuKapasitesi, durum, enlem, boylam, sigortaTarihi, muayeneTarihi } = body;

    // Validasyon
    if (!plaka || !marka || !model || !aracTipi || !yolcuKapasitesi) {
      return NextResponse.json(
        { error: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }

    // Plaka benzersizlik kontrolü (kendi ID'si hariç, aynı şirket içinde)
    const existingArac = await prisma.arac.findFirst({
      where: {
        plaka,
        companyId: user.companyId, // Şirket bazlı veri izolasyonu
        id: { not: paramsData.id }
      }
    });

    if (existingArac) {
      return NextResponse.json(
        { error: 'Bu plaka zaten başka bir araçta kayıtlı' },
        { status: 400 }
      );
    }

    const arac = await prisma.arac.update({
      where: { 
        id: paramsData.id,
        companyId: user.companyId // Şirket bazlı veri izolasyonu
      },
      data: {
        plaka,
        marka,
        model,
        aracTipi,
        yolcuKapasitesi: parseInt(yolcuKapasitesi),
        durum,
        enlem: parseFloat(enlem) || 0,
        boylam: parseFloat(boylam) || 0,
        sigortaTarihi: sigortaTarihi ? new Date(sigortaTarihi) : null,
        muayeneTarihi: muayeneTarihi ? new Date(muayeneTarihi) : null,
        sonGuncelleme: new Date()
      }
    });

    return NextResponse.json({ arac });
  } catch (error) {
    console.error('Araç güncellenemedi:', error);
    return NextResponse.json(
      { error: 'Araç güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE - Araç sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCompanyAccess();
    const paramsData = await params;
    
    // Araç transferde kullanılıyor mu kontrol et (şirket bazlı)
    const activeTransfer = await prisma.transfer.findFirst({
      where: {
        aracId: paramsData.id,
        companyId: user.companyId, // Şirket bazlı veri izolasyonu
        durum: { in: ['BEKLEMEDE', 'YOLDA'] }
      }
    });

    if (activeTransfer) {
      return NextResponse.json(
        { error: 'Bu araç aktif bir transferde kullanılıyor, silinemez' },
        { status: 400 }
      );
    }

    // Aracı sil (şirket bazlı)
    await prisma.arac.delete({
      where: { 
        id: paramsData.id,
        companyId: user.companyId // Şirket bazlı veri izolasyonu
      }
    });

    return NextResponse.json({ message: 'Araç başarıyla silindi' });
  } catch (error) {
    console.error('Araç silinemedi:', error);
    return NextResponse.json(
      { error: 'Araç silinemedi' },
      { status: 500 }
    );
  }
}