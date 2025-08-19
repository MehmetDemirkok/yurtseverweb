import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCompanyAccess } from '@/lib/auth';

// GET - Belirli bir şoförü getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCompanyAccess();
    const paramsData = await params;
    const sofor = await prisma.sofor.findFirst({
      where: { 
        id: paramsData.id,
        companyId: user.companyId // Şirket bazlı veri izolasyonu
      },
      include: {
        atananArac: {
          select: {
            id: true,
            plaka: true
          }
        }
      }
    });

    if (!sofor) {
      return NextResponse.json(
        { error: 'Şoför bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ sofor });
  } catch (error) {
    console.error('Şoför alınamadı:', error);
    return NextResponse.json(
      { error: 'Şoför alınamadı' },
      { status: 500 }
    );
  }
}

// PUT - Şoför güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCompanyAccess();
    const paramsData = await params;
    const body = await request.json();
    const { ad, soyad, telefon, ehliyetSinifi, ehliyetSiniflari, srcBelgeleri, atananAracId, durum } = body;

    // Validasyon
    if (!ad || !soyad || !telefon || !ehliyetSiniflari || ehliyetSiniflari.length === 0) {
      return NextResponse.json(
        { error: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }

    // Telefon benzersizlik kontrolü (kendi ID'si hariç, aynı şirket içinde)
    const existingSofor = await prisma.sofor.findFirst({
      where: {
        telefon,
        companyId: user.companyId, // Şirket bazlı veri izolasyonu
        id: { not: paramsData.id }
      }
    });

    if (existingSofor) {
      return NextResponse.json(
        { error: 'Bu telefon numarası zaten başka bir şoförde kayıtlı' },
        { status: 400 }
      );
    }

    const sofor = await prisma.sofor.update({
      where: { 
        id: paramsData.id,
        companyId: user.companyId // Şirket bazlı veri izolasyonu
      },
      data: {
        ad,
        soyad,
        telefon,
        ehliyetSinifi: ehliyetSiniflari[0], // Geriye uyumluluk için ilk ehliyet sınıfını kullan
        ehliyetSiniflari,
        srcBelgeleri: srcBelgeleri || [],
        atananAracId: atananAracId || null,
        durum
      },
      include: {
        atananArac: {
          select: {
            id: true,
            plaka: true
          }
        }
      }
    });

    return NextResponse.json({ sofor });
  } catch (error) {
    console.error('Şoför güncellenemedi:', error);
    return NextResponse.json(
      { error: 'Şoför güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE - Şoför sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCompanyAccess();
    const paramsData = await params;
    
    // Şoför aktif transferde kullanılıyor mu kontrol et (şirket bazlı)
    const activeTransfer = await prisma.transfer.findFirst({
      where: {
        soforId: paramsData.id,
        companyId: user.companyId, // Şirket bazlı veri izolasyonu
        durum: { in: ['BEKLEMEDE', 'YOLDA'] }
      }
    });

    if (activeTransfer) {
      return NextResponse.json(
        { error: 'Bu şoför aktif bir transferde kullanılıyor, silinemez' },
        { status: 400 }
      );
    }

    // Şoförü sil (şirket bazlı)
    await prisma.sofor.delete({
      where: { 
        id: paramsData.id,
        companyId: user.companyId // Şirket bazlı veri izolasyonu
      }
    });

    return NextResponse.json({ message: 'Şoför başarıyla silindi' });
  } catch (error) {
    console.error('Şoför silinemedi:', error);
    return NextResponse.json(
      { error: 'Şoför silinemedi' },
      { status: 500 }
    );
  }
}