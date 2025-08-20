import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pooling optimizasyonu
  __internal: {
    engine: {
      // Connection pool boyutu
      connectionLimit: 10,
      // Connection timeout (ms)
      connectionTimeout: 30000,
      // Query timeout (ms)
      queryTimeout: 30000,
      // Idle timeout (ms)
      idleTimeout: 60000,
      // Max idle connections
      maxIdleConnections: 5,
    },
  },
})

// Development ortamında global prisma instance'ını koru
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown için cleanup fonksiyonu
export async function cleanup() {
  await prisma.$disconnect()
}

// Process termination sinyallerini dinle
process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

// Health check fonksiyonu
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'healthy', timestamp: new Date().toISOString() }
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    }
  }
}

// Performance monitoring için query middleware
prisma.$use(async (params, next) => {
  const start = Date.now()
  const result = await next(params)
  const duration = Date.now() - start
  
  // Yavaş sorguları logla (500ms üzeri)
  if (duration > 500) {
    console.warn(`Slow query detected: ${params.model}.${params.action} took ${duration}ms`)
  }
  
  // Development ortamında tüm sorguları logla
  if (process.env.NODE_ENV === 'development') {
    console.log(`Query: ${params.model}.${params.action} - ${duration}ms`)
  }
  
  return result
})

export default prisma
