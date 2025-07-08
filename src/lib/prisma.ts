import { PrismaClient, Prisma } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Prisma istemcisi oluşturulurken log seviyesini ortama göre ayarlıyoruz
const prismaClientOptions: Prisma.PrismaClientOptions = {
  log: process.env.NODE_ENV === 'production' 
    ? ['error', 'warn']
    : ['query', 'error', 'warn'],
};

// Veritabanı URL'i Prisma tarafından otomatik olarak .env veya .env.production dosyasından alınır
// DATABASE_URL ve DIRECT_URL değişkenleri schema.prisma dosyasında tanımlanmıştır
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(prismaClientOptions);

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