import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyAccess } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { arventoService } from '@/lib/arvento';

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

    // Geçici olarak Arvento servisini test konfigürasyonu ile test et
    const testService = {
      apiKey,
      baseUrl,
      async testConnection() {
        try {
          const response = await fetch(`${baseUrl}/vehicles`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            return { success: true, vehicleCount: data.vehicles?.length || 0 };
          } else {
            return { success: false, error: `HTTP ${response.status}` };
          }
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    };

    // Bağlantıyı test et
    const testResult = await testService.testConnection();

    // Test sonucunu veritabanına kaydet
    await prisma.company.update({
      where: { id: user.companyId },
      data: {
        arventoApiKey: apiKey,
        arventoBaseUrl: baseUrl,
        arventoLastTest: new Date(),
        arventoIsConnected: testResult.success
      }
    });

    return NextResponse.json({
      success: testResult.success,
      vehicleCount: testResult.vehicleCount,
      error: testResult.error
    });
  } catch (error: any) {
    console.error('Arvento test connection error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    
    if (error.message === 'Company access denied') {
      return NextResponse.json({ error: 'Şirket erişimi reddedildi' }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: 'Bağlantı testi başarısız' }, 
      { status: 500 }
    );
  }
}
