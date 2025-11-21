import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const accommodations = await prisma.accommodation.findMany({
      where: {
        organizasyonAdi: {
          not: null,
        },
      },
      select: {
        organizasyonAdi: true,
      },
      distinct: ['organizasyonAdi'],
    });

    const organizationNames = accommodations.map((acc: { organizasyonAdi: string | null }) => acc.organizasyonAdi).filter((name: string | null): name is string => name !== null);

    return NextResponse.json(organizationNames);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 