import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

// GET - Finansal işlemleri listele
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const whereClause: any = {
      companyId: user.companyId,
    };

    if (type) {
      whereClause.type = type;
    }

    if (category) {
      whereClause.category = category;
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate);
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.financialTransaction.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.financialTransaction.count({
        where: whereClause,
      }),
    ]);

    // İstatistikler
    const stats = await prisma.financialTransaction.aggregate({
      where: whereClause,
      _sum: {
        amount: true,
      },
    });

    const incomeStats = await prisma.financialTransaction.aggregate({
      where: {
        ...whereClause,
        type: 'GELIR',
      },
      _sum: {
        amount: true,
      },
    });

    const expenseStats = await prisma.financialTransaction.aggregate({
      where: {
        ...whereClause,
        type: 'GIDER',
      },
      _sum: {
        amount: true,
      },
    });

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total: stats._sum.amount || 0,
        income: incomeStats._sum.amount || 0,
        expense: expenseStats._sum.amount || 0,
        profit: (incomeStats._sum.amount || 0) - (expenseStats._sum.amount || 0),
      },
    });
  } catch (error: any) {
    console.error('Financial transactions GET error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

// POST - Yeni finansal işlem oluştur
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    if (!['ADMIN', 'SIRKET_YONETICISI'].includes(user.role)) {
      return NextResponse.json({ error: 'İşlem ekleme yetkiniz yok' }, { status: 403 });
    }

    const data = await request.json();
    const { type, category, description, amount, date, notes } = data;

    if (!type || !category || !description || !amount || !date) {
      return NextResponse.json({ error: 'Tüm zorunlu alanları doldurun' }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Tutar 0\'dan büyük olmalıdır' }, { status: 400 });
    }

    const transaction = await prisma.financialTransaction.create({
      data: {
        type,
        category,
        description,
        amount: parseFloat(amount),
        date: new Date(date),
        notes: notes || null,
        companyId: user.companyId,
        userId: user.id,
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
        action: 'CREATE',
        modelName: 'FinancialTransaction',
        recordId: transaction.id,
        recordData: JSON.stringify(transaction),
        userId: user.id,
        companyId: user.companyId,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    console.error('Financial transaction POST error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

