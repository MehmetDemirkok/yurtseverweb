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

    // Arvento'dan araç detaylarını getir
    const vehicle = await arventoService.getVehicle(vehicleId);

    return NextResponse.json(vehicle);
  } catch (error: any) {
    console.error('Arvento vehicle API error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    
    if (error.message === 'Company access denied') {
      return NextResponse.json({ error: 'Şirket erişimi reddedildi' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Araç detayları alınamadı' }, 
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsData = await params;
    
    // Kullanıcı yetkilendirmesi
    await requireCompanyAccess();

    const vehicleId = paramsData.id;
    const data = await request.json();

    // Araç durumunu güncelle
    if (data.status) {
      await arventoService.updateVehicleStatus(vehicleId, data.status);
    }

    // Şoför ataması
    if (data.driverId) {
      await arventoService.assignDriverToVehicle(vehicleId, data.driverId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Arvento vehicle update API error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    
    if (error.message === 'Company access denied') {
      return NextResponse.json({ error: 'Şirket erişimi reddedildi' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Araç güncellenemedi' }, 
      { status: 500 }
    );
  }
}
