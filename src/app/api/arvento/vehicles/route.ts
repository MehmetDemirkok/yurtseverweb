import { NextRequest, NextResponse } from 'next/server';
import { arventoService } from '@/lib/arvento';
import { requireCompanyAccess } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Kullanıcı yetkilendirmesi
    await requireCompanyAccess();

    // Arvento'dan araçları getir
    const vehicles = await arventoService.getVehicles();

    return NextResponse.json(vehicles);
  } catch (error: any) {
    console.error('Arvento vehicles API error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    
    if (error.message === 'Company access denied') {
      return NextResponse.json({ error: 'Şirket erişimi reddedildi' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Arvento araçları alınamadı' }, 
      { status: 500 }
    );
  }
}
