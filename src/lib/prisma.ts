import { PrismaClient, Prisma } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Prisma istemcisi oluşturulurken log seviyesini ortama göre ayarlıyoruz
const prismaClientOptions: Prisma.PrismaClientOptions = {
  log: process.env.NODE_ENV === 'production' 
    ? ['query', 'info', 'warn', 'error']
    : ['query', 'error', 'warn'],
};

// Bağlantı hatalarını yönetmek için yeniden deneme mekanizması
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Veritabanı URL'i Prisma tarafından otomatik olarak .env veya .env.production dosyasından alınır
// DATABASE_URL ve DIRECT_URL değişkenleri schema.prisma dosyasında tanımlanmıştır
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    ...prismaClientOptions,
    log: ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Hata yakalama, loglama ve yeniden deneme için geliştirilmiş Prisma istemcisi
export const enhancedPrisma = prisma.$extends({
  query: {
    async $allOperations({ operation, model, args, query }) {
      const start = performance.now();
      let retries = 0;
      let lastError: any;
      
      while (retries < MAX_RETRIES) {
        try {
          const result = await query(args);
          const end = performance.now();
          console.log(`${model}.${operation} took ${end - start}ms`);
          return result;
        } catch (error: any) {
          lastError = error;
          console.error(`Error in ${model}.${operation} (attempt ${retries + 1}/${MAX_RETRIES}):`, error);
          
          // Bağlantı hatası veya geçici hata ise yeniden dene
          if (
            error.message?.includes('fetch failed') ||
            error.message?.includes('connection') ||
            error.message?.includes('timeout') ||
            error.code === 'P1001' || // Veritabanına erişilemiyor
            error.code === 'P1002' || // Veritabanına bağlanılamıyor
            error.code === 'P1008' || // Zaman aşımı
            error.code === 'P1017'    // Sunucu bağlantısı kaybedildi
          ) {
            retries++;
            if (retries < MAX_RETRIES) {
              console.log(`Retrying in ${RETRY_DELAY_MS}ms...`);
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
              continue;
            }
          } else {
            // Yeniden denemeye uygun olmayan hata, hemen fırlat
            break;
          }
        }
      }
      
      // Tüm yeniden denemeler başarısız oldu veya yeniden denemeye uygun olmayan hata
      console.error(`All retries failed for ${model}.${operation}`);
      throw lastError;
    },
  },
});

// Sadece bir kez export et
export default prisma;