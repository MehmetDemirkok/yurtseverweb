import { prisma } from '@/lib/prisma';

// Free plan limitleri
export const FREE_PLAN_LIMITS = {
  ACCOMMODATION: 10, // Konaklama alış limiti
  ACCOMMODATION_SALE: 10, // Konaklama satış limiti
};

// Pro plan fiyatı
export const PRO_PLAN_PRICE = 10; // USD

/**
 * Şirketin plan durumunu kontrol et
 */
export async function checkCompanyPlan(companyId: number) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      plan: true,
      freeLimitReached: true,
      planExpiresAt: true,
    },
  });

  if (!company) {
    throw new Error('Şirket bulunamadı');
  }

  return company;
}

/**
 * Şirketin konaklama alış sayısını kontrol et
 */
export async function getAccommodationCount(companyId: number): Promise<number> {
  const count = await prisma.accommodation.count({
    where: { companyId },
  });

  return count;
}

/**
 * Şirketin konaklama satış sayısını kontrol et
 */
export async function getAccommodationSaleCount(companyId: number): Promise<number> {
  const count = await prisma.accommodationSale.count({
    where: { companyId },
  });

  return count;
}

/**
 * Şirketin free plan limitine ulaşıp ulaşmadığını kontrol et
 */
export async function checkFreePlanLimit(companyId: number): Promise<{
  canAdd: boolean;
  accommodationCount: number;
  accommodationSaleCount: number;
  limitReached: boolean;
}> {
  const company = await checkCompanyPlan(companyId);

  // Pro plan varsa limit yok
  if (company.plan === 'PRO') {
    // Plan süresi dolmuş mu kontrol et
    if (company.planExpiresAt && company.planExpiresAt < new Date()) {
      // Plan süresi dolmuş, free plana dön
      await prisma.company.update({
        where: { id: companyId },
        data: {
          plan: 'FREE',
          planExpiresAt: null,
        },
      });
    } else {
      return {
        canAdd: true,
        accommodationCount: 0,
        accommodationSaleCount: 0,
        limitReached: false,
      };
    }
  }

  // Free plan için limit kontrolü
  const accommodationCount = await getAccommodationCount(companyId);
  const accommodationSaleCount = await getAccommodationSaleCount(companyId);

  const accommodationLimitReached = accommodationCount >= FREE_PLAN_LIMITS.ACCOMMODATION;
  const saleLimitReached = accommodationSaleCount >= FREE_PLAN_LIMITS.ACCOMMODATION_SALE;
  const limitReached = accommodationLimitReached || saleLimitReached;

  // Limit durumunu güncelle
  if (limitReached && !company.freeLimitReached) {
    await prisma.company.update({
      where: { id: companyId },
      data: { freeLimitReached: true },
    });
  }

  return {
    canAdd: !limitReached,
    accommodationCount,
    accommodationSaleCount,
    limitReached,
  };
}

/**
 * Şirketin limit durumunu kontrol et ve ödeme gerekip gerekmediğini döndür
 */
export async function checkPaymentRequired(companyId: number, type: 'accommodation' | 'accommodationSale'): Promise<{
  paymentRequired: boolean;
  message: string;
  accommodationCount: number;
  accommodationSaleCount: number;
}> {
  const limitCheck = await checkFreePlanLimit(companyId);
  const company = await checkCompanyPlan(companyId);

  // Pro plan varsa ödeme gerekmez
  if (company.plan === 'PRO' && company.planExpiresAt && company.planExpiresAt > new Date()) {
    return {
      paymentRequired: false,
      message: '',
      accommodationCount: limitCheck.accommodationCount,
      accommodationSaleCount: limitCheck.accommodationSaleCount,
    };
  }

  // Free plan limit kontrolü
  if (type === 'accommodation' && limitCheck.accommodationCount >= FREE_PLAN_LIMITS.ACCOMMODATION) {
    return {
      paymentRequired: true,
      message: `Ücretsiz plan limitine ulaştınız. ${FREE_PLAN_LIMITS.ACCOMMODATION} konaklama alış kaydı eklediniz. Pro plana geçmek için ödeme yapın.`,
      accommodationCount: limitCheck.accommodationCount,
      accommodationSaleCount: limitCheck.accommodationSaleCount,
    };
  }

  if (type === 'accommodationSale' && limitCheck.accommodationSaleCount >= FREE_PLAN_LIMITS.ACCOMMODATION_SALE) {
    return {
      paymentRequired: true,
      message: `Ücretsiz plan limitine ulaştınız. ${FREE_PLAN_LIMITS.ACCOMMODATION_SALE} konaklama satış kaydı eklediniz. Pro plana geçmek için ödeme yapın.`,
      accommodationCount: limitCheck.accommodationCount,
      accommodationSaleCount: limitCheck.accommodationSaleCount,
    };
  }

  return {
    paymentRequired: false,
    message: '',
    accommodationCount: limitCheck.accommodationCount,
    accommodationSaleCount: limitCheck.accommodationSaleCount,
  };
}

