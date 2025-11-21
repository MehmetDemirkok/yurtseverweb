import { NextRequest, NextResponse } from 'next/server';
import { arventoService } from '@/lib/arvento';
import { requireCompanyAccess } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsData = await params;
    
    // Kullanıcı yetkilendirmesi
    await requireCompanyAccess();

    const vehicleId = paramsData.id;

    // Arvento'dan araç konumunu getir
    const location = await arventoService.getVehicleLocation(vehicleId);

    return NextResponse.json(location);
  } catch (error: any) {
    console.error('Arvento vehicle location API error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    
    if (error.message === 'Company access denied') {
      return NextResponse.json({ error: 'Şirket erişimi reddedildi' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Araç konumu alınamadı' }, 
      { status: 500 }
    );
  }
}
