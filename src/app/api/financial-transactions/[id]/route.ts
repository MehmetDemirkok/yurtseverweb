import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

// GET - Tek bir finansal işlemi getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const transaction = await prisma.financialTransaction.findFirst({
      where: {
        id: parseInt(params.id),
        companyId: user.companyId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'İşlem bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(transaction);
  } catch (error: any) {
    console.error('Financial transaction GET error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

// PUT - Finansal işlemi güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    if (!['ADMIN', 'SIRKET_YONETICISI'].includes(user.role)) {
      return NextResponse.json({ error: 'İşlem düzenleme yetkiniz yok' }, { status: 403 });
    }

    const existingTransaction = await prisma.financialTransaction.findFirst({
      where: {
        id: parseInt(params.id),
        companyId: user.companyId,
      },
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: 'İşlem bulunamadı' }, { status: 404 });
    }

    const data = await request.json();
    const { type, category, description, amount, date, notes } = data;

    if (!type || !category || !description || !amount || !date) {
      return NextResponse.json({ error: 'Tüm zorunlu alanları doldurun' }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Tutar 0\'dan büyük olmalıdır' }, { status: 400 });
    }

    const transaction = await prisma.financialTransaction.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        type,
        category,
        description,
        amount: parseFloat(amount),
        date: new Date(date),
        notes: notes || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log kaydı
    await prisma.log.create({
      data: {
        action: 'UPDATE',
        modelName: 'FinancialTransaction',
        recordId: transaction.id,
        recordData: JSON.stringify(transaction),
        userId: user.id,
        companyId: user.companyId,
      },
    });

    return NextResponse.json(transaction);
  } catch (error: any) {
    console.error('Financial transaction PUT error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

// DELETE - Finansal işlemi sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    if (!['ADMIN', 'SIRKET_YONETICISI'].includes(user.role)) {
      return NextResponse.json({ error: 'İşlem silme yetkiniz yok' }, { status: 403 });
    }

    const existingTransaction = await prisma.financialTransaction.findFirst({
      where: {
        id: parseInt(params.id),
        companyId: user.companyId,
      },
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: 'İşlem bulunamadı' }, { status: 404 });
    }

    await prisma.financialTransaction.delete({
      where: {
        id: parseInt(params.id),
      },
    });

    // Log kaydı
    await prisma.log.create({
      data: {
        action: 'DELETE',
        modelName: 'FinancialTransaction',
        recordId: parseInt(params.id),
        recordData: JSON.stringify(existingTransaction),
        userId: user.id,
        companyId: user.companyId,
      },
    });

    return NextResponse.json({ message: 'İşlem başarıyla silindi' });
  } catch (error: any) {
    console.error('Financial transaction DELETE error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

