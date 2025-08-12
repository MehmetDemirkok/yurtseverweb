import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyAccess } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Kullanıcı yetkilendirmesi
    const user = await requireCompanyAccess();

    // Şirketin Arvento konfigürasyonunu getir
    const config = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: {
        arventoApiKey: true,
        arventoBaseUrl: true,
        arventoLastTest: true,
        arventoIsConnected: true
      }
    });

    return NextResponse.json({
      apiKey: config?.arventoApiKey || '',
      baseUrl: config?.arventoBaseUrl || 'https://api.arvento.com',
      isConnected: config?.arventoIsConnected || false,
      lastTest: config?.arventoLastTest?.toISOString() || null
    });
  } catch (error: any) {
    console.error('Arvento config GET error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    
    if (error.message === 'Company access denied') {
      return NextResponse.json({ error: 'Şirket erişimi reddedildi' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Konfigürasyon alınamadı' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Kullanıcı yetkilendirmesi
    const user = await requireCompanyAccess();

    const { apiKey, baseUrl } = await request.json();

    if (!apiKey || !baseUrl) {
      return NextResponse.json(
        { error: 'API anahtarı ve URL gerekli' }, 
        { status: 400 }
      );
    }

    // Şirketin Arvento konfigürasyonunu güncelle
    await prisma.company.update({
      where: { id: user.companyId },
      data: {
        arventoApiKey: apiKey,
        arventoBaseUrl: baseUrl,
        arventoLastTest: new Date(),
        arventoIsConnected: false // Test edilene kadar false
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Arvento config POST error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    
    if (error.message === 'Company access denied') {
      return NextResponse.json({ error: 'Şirket erişimi reddedildi' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Konfigürasyon kaydedilemedi' }, 
      { status: 500 }
    );
  }
}
