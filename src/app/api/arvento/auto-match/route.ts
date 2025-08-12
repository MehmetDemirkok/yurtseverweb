import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyAccess } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ArventoService } from '@/lib/arvento';

export async function POST(request: NextRequest) {
  try {
    // Kullanıcı yetkilendirmesi
    const user = await requireCompanyAccess();

    // Şirketin araçlarını getir
    const araclar = await prisma.arac.findMany({
      where: { companyId: user.companyId },
      select: {
        id: true,
        plaka: true,
        arventoId: true
      }
    });

    // Şirket bazlı Arvento servisi oluştur
    const arventoService = new ArventoService(user.companyId);
    
    // Arvento araçlarını getir
    const arventoVehicles = await arventoService.getVehicles();

    let matchedCount = 0;
    let errors: string[] = [];

    // Plaka eşleştirmesi yap
    for (const arac of araclar) {
      // Zaten eşleşmiş araçları atla
      if (arac.arventoId) continue;

      // Plaka eşleşmesi ara
      const matchingArventoVehicle = arventoVehicles.find(av => 
        av.plate === arac.plaka
      );

      if (matchingArventoVehicle) {
        try {
          // Araç eşleştirmesini kaydet
          await prisma.arac.update({
            where: { id: arac.id },
            data: {
              arventoId: matchingArventoVehicle.id,
              arventoData: matchingArventoVehicle
            }
          });
          matchedCount++;
        } catch (error) {
          errors.push(`${arac.plaka}: Eşleştirme kaydedilemedi`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      matchedCount,
      totalAraclar: araclar.length,
      totalArventoVehicles: arventoVehicles.length,
      errors
    });
  } catch (error: any) {
    console.error('Arvento auto match error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    
    if (error.message === 'Company access denied') {
      return NextResponse.json({ error: 'Şirket erişimi reddedildi' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Otomatik eşleştirme başarısız' }, 
      { status: 500 }
    );
  }
}
