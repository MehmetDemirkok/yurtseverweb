import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import { PRO_PLAN_PRICE } from '@/lib/utils/payment';

// Ödeme oluştur
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken();
    
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    if (!user.companyId) {
      return NextResponse.json({ error: 'Şirket bilgisi bulunamadı' }, { status: 400 });
    }

    const data = await request.json();
    const { plan = 'PRO', paymentMethod = 'manual' } = data;

    // Şirket bilgisini kontrol et
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
    });

    if (!company) {
      return NextResponse.json({ error: 'Şirket bulunamadı' }, { status: 404 });
    }

    // Ödeme kaydı oluştur
    const payment = await prisma.payment.create({
      data: {
        companyId: user.companyId,
        amount: PRO_PLAN_PRICE,
        currency: 'USD',
        plan: plan as 'PRO',
        status: 'PENDING',
        paymentMethod: paymentMethod,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({
      payment,
      message: 'Ödeme kaydı oluşturuldu',
    });
  } catch (error: any) {
    console.error('Payment POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// Ödeme tamamla (ödeme yapıldıktan sonra planı güncelle)
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken();
    
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    if (!user.companyId) {
      return NextResponse.json({ error: 'Şirket bilgisi bulunamadı' }, { status: 400 });
    }

    const data = await request.json();
    const { paymentId, transactionId, status } = data;

    if (!paymentId) {
      return NextResponse.json({ error: 'Ödeme ID gerekli' }, { status: 400 });
    }

    // Ödeme kaydını bul
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        companyId: user.companyId,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Ödeme kaydı bulunamadı' }, { status: 404 });
    }

    // Ödeme durumunu güncelle
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: status || 'COMPLETED',
        transactionId: transactionId || payment.transactionId,
        paidAt: status === 'COMPLETED' ? new Date() : null,
      },
    });

    // Eğer ödeme tamamlandıysa, şirket planını güncelle
    if (status === 'COMPLETED' || updatedPayment.status === 'COMPLETED') {
      // Pro plan 1 yıl geçerli
      const planExpiresAt = new Date();
      planExpiresAt.setFullYear(planExpiresAt.getFullYear() + 1);

      await prisma.company.update({
        where: { id: user.companyId },
        data: {
          plan: 'PRO',
          planExpiresAt: planExpiresAt,
          freeLimitReached: false,
        },
      });
    }

    return NextResponse.json({
      payment: updatedPayment,
      message: 'Ödeme başarıyla tamamlandı',
    });
  } catch (error: any) {
    console.error('Payment PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// Ödeme geçmişini getir
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken();
    
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    if (!user.companyId) {
      return NextResponse.json({ error: 'Şirket bilgisi bulunamadı' }, { status: 400 });
    }

    const payments = await prisma.payment.findMany({
      where: {
        companyId: user.companyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ payments });
  } catch (error: any) {
    console.error('Payment GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

