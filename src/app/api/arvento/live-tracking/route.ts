import { NextRequest, NextResponse } from 'next/server';
import { arventoService } from '@/lib/arvento';
import { requireCompanyAccess } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Kullanıcı yetkilendirmesi
    await requireCompanyAccess();

    const { vehicleIds } = await request.json();

    if (!vehicleIds || !Array.isArray(vehicleIds)) {
      return NextResponse.json(
        { error: 'Geçerli araç ID\'leri gerekli' }, 
        { status: 400 }
      );
    }

    // Arvento'dan canlı takip verilerini getir
    const vehicles = await arventoService.getLiveTracking(vehicleIds);

    return NextResponse.json(vehicles);
  } catch (error: any) {
    console.error('Arvento live tracking API error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    
    if (error.message === 'Company access denied') {
      return NextResponse.json({ error: 'Şirket erişimi reddedildi' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Canlı takip verileri alınamadı' }, 
      { status: 500 }
    );
  }
}
