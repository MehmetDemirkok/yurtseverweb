import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();
    const id = parseInt(params.id);
    const data = await request.json();

    const sale = await prisma.accommodationSale.update({
      where: { id },
      data: {
        ...data,
        kalanTutar: data.toplamSatisFiyati - (data.odenenTutar || 0),
      },
    });

    await prisma.log.create({
      data: {
        action: 'UPDATE',
        modelName: 'AccommodationSale',
        recordId: sale.id,
        recordData: JSON.stringify(sale),
        userId: user.id,
        companyId: user.companyId,
      },
    });

    return NextResponse.json(sale);
  } catch (error: any) {
    console.error('AccommodationSale PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();
    const id = parseInt(params.id);

    const sale = await prisma.accommodationSale.delete({
      where: { id },
    });

    await prisma.log.create({
      data: {
        action: 'DELETE',
        modelName: 'AccommodationSale',
        recordId: sale.id,
        recordData: JSON.stringify(sale),
        userId: user.id,
        companyId: user.companyId,
      },
    });

    return NextResponse.json({ message: 'Satış kaydı silindi' });
  } catch (error: any) {
    console.error('AccommodationSale DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
