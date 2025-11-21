import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const companyId = user.companyId;

    // Tarih aralıkları
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    // Konaklama istatistikleri
    const totalAccommodations = await prisma.accommodation.count({
      where: { companyId },
    });

    const thisMonthAccommodations = await prisma.accommodation.count({
      where: {
        companyId,
        createdAt: { gte: thisMonth },
      },
    });

    const lastMonthAccommodations = await prisma.accommodation.count({
      where: {
        companyId,
        createdAt: { gte: lastMonth, lt: thisMonth },
      },
    });

    // Aktif misafirler (bugün içinde check-in/check-out olanlar)
    const activeGuests = await prisma.accommodation.count({
      where: {
        companyId,
        girisTarihi: { lte: today.toISOString().split('T')[0] },
        cikisTarihi: { gte: today.toISOString().split('T')[0] },
      },
    });

    // Toplam maliyet
    const totalCostResult = await prisma.accommodation.aggregate({
      where: { companyId },
      _sum: { toplamUcret: true },
    });
    const totalCost = totalCostResult._sum.toplamUcret || 0;

    // Bu ayın maliyeti
    const thisMonthCostResult = await prisma.accommodation.aggregate({
      where: {
        companyId,
        createdAt: { gte: thisMonth },
      },
      _sum: { toplamUcret: true },
    });
    const thisMonthCost = thisMonthCostResult._sum.toplamUcret || 0;

    // Satış istatistikleri
    const totalSales = await prisma.accommodationSale.count({
      where: { companyId },
    });

    const thisMonthSales = await prisma.accommodationSale.count({
      where: {
        companyId,
        createdAt: { gte: thisMonth },
      },
    });

    // Toplam satış geliri
    const totalRevenueResult = await prisma.accommodationSale.aggregate({
      where: { companyId },
      _sum: { toplamSatisFiyati: true },
    });
    const totalRevenue = totalRevenueResult._sum.toplamSatisFiyati || 0;

    // Bu ayın geliri
    const thisMonthRevenueResult = await prisma.accommodationSale.aggregate({
      where: {
        companyId,
        createdAt: { gte: thisMonth },
      },
      _sum: { toplamSatisFiyati: true },
    });
    const thisMonthRevenue = thisMonthRevenueResult._sum.toplamSatisFiyati || 0;

    // Toplam kar
    const totalProfitResult = await prisma.accommodationSale.aggregate({
      where: { companyId },
      _sum: { kar: true },
    });
    const totalProfit = totalProfitResult._sum.kar || 0;

    // Bu ayın karı
    const thisMonthProfitResult = await prisma.accommodationSale.aggregate({
      where: {
        companyId,
        createdAt: { gte: thisMonth },
      },
      _sum: { kar: true },
    });
    const thisMonthProfit = thisMonthProfitResult._sum.kar || 0;

    // Otel sayısı
    const uniqueHotels = await prisma.accommodation.findMany({
      where: { companyId },
      select: { otelAdi: true },
      distinct: ['otelAdi'],
    });
    const hotelCount = uniqueHotels.filter((h) => h.otelAdi).length;

    // Son 7 günün günlük istatistikleri (grafik için)
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dateEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const dayAccommodations = await prisma.accommodation.count({
        where: {
          companyId,
          createdAt: { gte: dateStart, lt: dateEnd },
        },
      });

      const daySales = await prisma.accommodationSale.count({
        where: {
          companyId,
          createdAt: { gte: dateStart, lt: dateEnd },
        },
      });

      const dayRevenue = await prisma.accommodationSale.aggregate({
        where: {
          companyId,
          createdAt: { gte: dateStart, lt: dateEnd },
        },
        _sum: { toplamSatisFiyati: true },
      });

      dailyStats.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' }),
        accommodations: dayAccommodations,
        sales: daySales,
        revenue: dayRevenue._sum.toplamSatisFiyati || 0,
      });
    }

    // Son 6 ayın aylık istatistikleri
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);

      const monthAccommodations = await prisma.accommodation.count({
        where: {
          companyId,
          createdAt: { gte: monthStart, lt: monthEnd },
        },
      });

      const monthSales = await prisma.accommodationSale.count({
        where: {
          companyId,
          createdAt: { gte: monthStart, lt: monthEnd },
        },
      });

      const monthRevenue = await prisma.accommodationSale.aggregate({
        where: {
          companyId,
          createdAt: { gte: monthStart, lt: monthEnd },
        },
        _sum: { toplamSatisFiyati: true },
      });

      monthlyStats.push({
        month: monthDate.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }),
        accommodations: monthAccommodations,
        sales: monthSales,
        revenue: monthRevenue._sum.toplamSatisFiyati || 0,
      });
    }

    // Son aktiviteler (son 10 kayıt)
    const recentAccommodations = await prisma.accommodation.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        adiSoyadi: true,
        otelAdi: true,
        girisTarihi: true,
        cikisTarihi: true,
        createdAt: true,
      },
    });

    const recentSales = await prisma.accommodationSale.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        adiSoyadi: true,
        otelAdi: true,
        toplamSatisFiyati: true,
        createdAt: true,
      },
    });

    // Karşılaştırma yüzdeleri
    const accommodationGrowth =
      lastMonthAccommodations > 0
        ? ((thisMonthAccommodations - lastMonthAccommodations) / lastMonthAccommodations) * 100
        : 0;

    return NextResponse.json({
      summary: {
        totalAccommodations,
        thisMonthAccommodations,
        accommodationGrowth: Math.round(accommodationGrowth * 10) / 10,
        activeGuests,
        totalCost,
        thisMonthCost,
        totalSales,
        thisMonthSales,
        totalRevenue,
        thisMonthRevenue,
        totalProfit,
        thisMonthProfit,
        hotelCount,
      },
      dailyStats,
      monthlyStats,
      recentActivities: [
        ...recentAccommodations.map((acc) => ({
          type: 'accommodation',
          id: acc.id,
          title: 'Yeni Konaklama Kaydı',
          description: `${acc.adiSoyadi} - ${acc.otelAdi || 'Otel belirtilmemiş'}`,
          date: acc.createdAt,
        })),
        ...recentSales.map((sale) => ({
          type: 'sale',
          id: sale.id,
          title: 'Yeni Satış Kaydı',
          description: `${sale.adiSoyadi} - ${sale.otelAdi || 'Otel belirtilmemiş'} (${sale.toplamSatisFiyati.toFixed(2)} ₺)`,
          date: sale.createdAt,
        })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10),
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

