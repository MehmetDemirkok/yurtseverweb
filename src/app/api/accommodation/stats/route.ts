import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    
    // Toplam kayıt sayısı
    const totalRecords = await prisma.accommodation.count({
      where: {
        companyId: user.companyId
      }
    });
    
    // Münferit konaklama sayısı
    const munferitRecords = await prisma.accommodation.count({
      where: {
        companyId: user.companyId,
        isMunferit: true
      }
    });
    
    // Organizasyon kayıtları sayısı
    const organizationRecords = await prisma.accommodation.count({
      where: {
        companyId: user.companyId,
        isMunferit: false,
        organizationId: {
          not: null
        }
      }
    });
    
    // Aktif organizasyon sayısı
    const activeOrganizations = await prisma.organization.count({
      where: {
        companyId: user.companyId,
        status: 'ACTIVE'
      }
    });
    
    return NextResponse.json({
      totalRecords,
      munferitRecords,
      organizationRecords,
      activeOrganizations
    });
  } catch (error: any) {
    console.error('Accommodation stats error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
