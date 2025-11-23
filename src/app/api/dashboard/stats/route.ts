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
    const todayStr = today.toISOString().split('T')[0];
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    // Tüm temel istatistikleri paralel olarak çek
    const [
      totalAccommodations,
      thisMonthAccommodations,
      lastMonthAccommodations,
      activeGuests,
      totalCostResult,
      thisMonthCostResult,
      totalSales,
      thisMonthSales,
      totalRevenueResult,
      thisMonthRevenueResult,
      totalProfitResult,
      thisMonthProfitResult,
      hotelCountResult,
    ] = await Promise.all([
      // Konaklama istatistikleri
      prisma.accommodation.count({ where: { companyId } }),
      prisma.accommodation.count({
        where: { companyId, createdAt: { gte: thisMonth } },
      }),
      prisma.accommodation.count({
        where: { companyId, createdAt: { gte: lastMonth, lt: thisMonth } },
      }),
      prisma.accommodation.count({
        where: {
          companyId,
          girisTarihi: { lte: todayStr },
          cikisTarihi: { gte: todayStr },
        },
      }),
      // Maliyet istatistikleri
      prisma.accommodation.aggregate({
        where: { companyId },
        _sum: { toplamUcret: true },
      }),
      prisma.accommodation.aggregate({
        where: { companyId, createdAt: { gte: thisMonth } },
        _sum: { toplamUcret: true },
      }),
      // Satış istatistikleri
      prisma.accommodationSale.count({ where: { companyId } }),
      prisma.accommodationSale.count({
        where: { companyId, createdAt: { gte: thisMonth } },
      }),
      // Gelir istatistikleri
      prisma.accommodationSale.aggregate({
        where: { companyId },
        _sum: { toplamSatisFiyati: true },
      }),
      prisma.accommodationSale.aggregate({
        where: { companyId, createdAt: { gte: thisMonth } },
        _sum: { toplamSatisFiyati: true },
      }),
      // Kar istatistikleri
      prisma.accommodationSale.aggregate({
        where: { companyId },
        _sum: { kar: true },
      }),
      prisma.accommodationSale.aggregate({
        where: { companyId, createdAt: { gte: thisMonth } },
        _sum: { kar: true },
      }),
      // Otel sayısı - distinct count ile optimize edilmiş
      prisma.accommodation.groupBy({
        by: ['otelAdi'],
        where: { companyId, otelAdi: { not: null } },
      }),
    ]);

    const totalCost = totalCostResult._sum.toplamUcret || 0;
    const thisMonthCost = thisMonthCostResult._sum.toplamUcret || 0;
    const totalRevenue = totalRevenueResult._sum.toplamSatisFiyati || 0;
    const thisMonthRevenue = thisMonthRevenueResult._sum.toplamSatisFiyati || 0;
    const totalProfit = totalProfitResult._sum.kar || 0;
    const thisMonthProfit = thisMonthProfitResult._sum.kar || 0;
    const hotelCount = hotelCountResult.length;

    // Son 7 günün günlük istatistikleri (grafik için) - Optimize edilmiş
    const dailyDateRanges = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dateEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      dailyDateRanges.push({ date, dateStart, dateEnd });
    }

    // Tüm günlük sorguları paralel olarak çalıştır
    const dailyQueries = dailyDateRanges.flatMap(({ dateStart, dateEnd }) => [
      prisma.accommodation.count({
        where: { companyId, createdAt: { gte: dateStart, lt: dateEnd } },
      }),
      prisma.accommodationSale.count({
        where: { companyId, createdAt: { gte: dateStart, lt: dateEnd } },
      }),
      prisma.accommodationSale.aggregate({
        where: { companyId, createdAt: { gte: dateStart, lt: dateEnd } },
        _sum: { toplamSatisFiyati: true },
      }),
    ]);

    const dailyResults = await Promise.all(dailyQueries);

    const dailyStats = dailyDateRanges.map(({ date }, index) => {
      const baseIndex = index * 3;
      return {
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' }),
        accommodations: dailyResults[baseIndex],
        sales: dailyResults[baseIndex + 1],
        revenue: dailyResults[baseIndex + 2]._sum.toplamSatisFiyati || 0,
      };
    });

    // Son 6 ayın aylık istatistikleri - Optimize edilmiş
    const monthlyDateRanges = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
      monthlyDateRanges.push({ monthDate, monthStart, monthEnd });
    }

    // Tüm aylık sorguları paralel olarak çalıştır
    const monthlyQueries = monthlyDateRanges.flatMap(({ monthStart, monthEnd }) => [
      prisma.accommodation.count({
        where: { companyId, createdAt: { gte: monthStart, lt: monthEnd } },
      }),
      prisma.accommodationSale.count({
        where: { companyId, createdAt: { gte: monthStart, lt: monthEnd } },
      }),
      prisma.accommodationSale.aggregate({
        where: { companyId, createdAt: { gte: monthStart, lt: monthEnd } },
        _sum: { toplamSatisFiyati: true },
      }),
    ]);

    const monthlyResults = await Promise.all(monthlyQueries);

    const monthlyStats = monthlyDateRanges.map(({ monthDate }, index) => {
      const baseIndex = index * 3;
      return {
        month: monthDate.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }),
        accommodations: monthlyResults[baseIndex],
        sales: monthlyResults[baseIndex + 1],
        revenue: monthlyResults[baseIndex + 2]._sum.toplamSatisFiyati || 0,
      };
    });

    // Son aktiviteler (son 10 kayıt) - Paralel çek
    const [recentAccommodations, recentSales] = await Promise.all([
      prisma.accommodation.findMany({
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
      }),
      prisma.accommodationSale.findMany({
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
      }),
    ]);

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

