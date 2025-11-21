import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const organizations = await prisma.organization.findMany({
      where: {
        companyId: user.companyId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(organizations);
  } catch (error: any) {
    console.error('Organizations fetch error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

