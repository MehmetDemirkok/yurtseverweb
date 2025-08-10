import { NextRequest } from 'next/server';
import { enhancedPrisma } from '@/lib/prisma';
import { 
  apiResponse, 
  withApiCache, 
  createCacheKey, 
  createPaginationParams,
  createSearchParams,
  withPerformanceMonitoring 
} from '@/lib/api-utils';

// Cache TTL'leri (milisaniye)
const CACHE_TTL = {
  SHORT: 30000,    // 30 saniye
  MEDIUM: 300000,  // 5 dakika
  LONG: 1800000,   // 30 dakika
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = createPaginationParams(searchParams);
    const { search, sortBy, sortOrder } = createSearchParams(searchParams);

    // Cache key oluştur
    const cacheKey = createCacheKey('users', {
      page,
      limit,
      search,
      sortBy,
      sortOrder
    });

    // Cache'li veri alma
    const result = await withApiCache(
      cacheKey,
      async () => {
        return await withPerformanceMonitoring('getUsers', async () => {
          const where = search ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          } : {};

          const [users, total] = await Promise.all([
            enhancedPrisma.user.findMany({
              where,
              skip,
              take: limit,
              orderBy: { [sortBy]: sortOrder },
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                // Gereksiz alanları seçme
                // password: false, // Hassas veri
              }
            }),
            enhancedPrisma.user.count({ where })
          ]);

          return {
            users,
            pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit)
            }
          };
        });
      },
      CACHE_TTL.MEDIUM
    );

    return apiResponse.success(result);

  } catch (error) {
    console.error('Error in users API:', error);
    return apiResponse.serverError('Kullanıcılar alınırken hata oluştu');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = await withPerformanceMonitoring('createUser', async () => {
      return await enhancedPrisma.user.create({
        data: body,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        }
      });
    });

    // Cache'i temizle
    // invalidateCache('users');

    return apiResponse.success(result, 201);

  } catch (error) {
    console.error('Error creating user:', error);
    return apiResponse.serverError('Kullanıcı oluşturulurken hata oluştu');
  }
}
