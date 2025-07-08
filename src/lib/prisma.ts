import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      },
    },
    // Bağlantı havuzu ayarları Prisma'nın güncel sürümünde doğrudan desteklenmiyor
    // Bu nedenle kaldırıldı
  });

// Hata yakalama ve loglama için try-catch bloğu kullanımı
// Event listener'lar yerine bu yaklaşımı kullanıyoruz
const enhancedPrisma = prisma.$extends({
  query: {
    async $allOperations({ operation, model, args, query }) {
      const start = performance.now();
      try {
        const result = await query(args);
        const end = performance.now();
        console.log(`${model}.${operation} took ${end - start}ms`);
        return result;
      } catch (error) {
        console.error(`Error in ${model}.${operation}:`, error);
        throw error;
      }
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;