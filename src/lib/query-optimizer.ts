import { prisma } from './prisma'

/**
 * Query Optimizer
 * 
 * N+1 query problemlerini çözmek ve performansı artırmak için
 * gelişmiş query optimizasyon araçları.
 */

// Query performance monitoring
interface QueryMetrics {
  query: string
  duration: number
  timestamp: Date
  model: string
  action: string
}

class QueryOptimizer {
  private static instance: QueryOptimizer
  private slowQueries: QueryMetrics[] = []
  private queryCount = 0
  private totalDuration = 0

  static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer()
    }
    return QueryOptimizer.instance
  }

  /**
   * Query performansını izle
   */
  trackQuery(query: string, duration: number, model: string, action: string) {
    this.queryCount++
    this.totalDuration += duration

    // Yavaş sorguları kaydet (500ms üzeri)
    if (duration > 500) {
      this.slowQueries.push({
        query,
        duration,
        timestamp: new Date(),
        model,
        action
      })

      // Son 100 yavaş sorguyu tut
      if (this.slowQueries.length > 100) {
        this.slowQueries = this.slowQueries.slice(-100)
      }
    }
  }

  /**
   * Performans istatistikleri
   */
  getStats() {
    return {
      totalQueries: this.queryCount,
      totalDuration: this.totalDuration,
      averageDuration: this.queryCount > 0 ? this.totalDuration / this.queryCount : 0,
      slowQueries: this.slowQueries.length,
      recentSlowQueries: this.slowQueries.slice(-10)
    }
  }

  /**
   * Yavaş sorguları temizle
   */
  clearSlowQueries() {
    this.slowQueries = []
  }
}

// Global query optimizer instance
export const queryOptimizer = QueryOptimizer.getInstance()

/**
 * Include helper - N+1 problemlerini önler
 */
export const includeHelper = {
  // Accommodation için gerekli ilişkiler
  accommodation: {
    company: true,
    organization: {
      include: {
        hotel: true
      }
    }
  },

  // Transfer için gerekli ilişkiler
  transfer: {
    company: true,
    arac: true,
    sofor: true,
    cari: true,
    tedarikci: true,
    yolcular: true
  },

  // Arac için gerekli ilişkiler
  arac: {
    company: true,
    soforler: true,
    transferler: true,
    bakimlar: {
      include: {
        user: true
      }
    }
  },

  // Sofor için gerekli ilişkiler
  sofor: {
    company: true,
    atananArac: true,
    transferler: true
  },

  // Hotel için gerekli ilişkiler
  hotel: {
    company: true,
    organizations: true
  },

  // Organization için gerekli ilişkiler
  organization: {
    company: true,
    hotel: true,
    accommodations: true
  },

  // User için gerekli ilişkiler
  user: {
    company: true,
    logs: true,
    aracBakimlar: true
  }
}

/**
 * Batch query helper - Toplu veri çekme
 */
export class BatchQueryHelper {
  /**
   * Accommodation'ları toplu çek
   */
  static async getAccommodationsBatch(ids: number[], companyId: number) {
    return await prisma.accommodation.findMany({
      where: {
        id: { in: ids },
        companyId
      },
      include: includeHelper.accommodation
    })
  }

  /**
   * Transfer'leri toplu çek
   */
  static async getTransfersBatch(ids: string[], companyId: number) {
    return await prisma.transfer.findMany({
      where: {
        id: { in: ids },
        companyId
      },
      include: includeHelper.transfer
    })
  }

  /**
   * Araçları toplu çek
   */
  static async getVehiclesBatch(ids: string[], companyId: number) {
    return await prisma.arac.findMany({
      where: {
        id: { in: ids },
        companyId
      },
      include: includeHelper.arac
    })
  }

  /**
   * Şoförleri toplu çek
   */
  static async getDriversBatch(ids: string[], companyId: number) {
    return await prisma.sofor.findMany({
      where: {
        id: { in: ids },
        companyId
      },
      include: includeHelper.sofor
    })
  }
}

/**
 * Optimized query fonksiyonları
 */
export const optimizedQueries = {
  /**
   * Dashboard istatistikleri - tek sorguda
   */
  async getDashboardStats(companyId: number) {
    const startTime = Date.now()
    
    try {
      const [
        accommodationCount,
        transferCount,
        vehicleCount,
        driverCount,
        recentAccommodations,
        recentTransfers
      ] = await Promise.all([
        prisma.accommodation.count({ where: { companyId } }),
        prisma.transfer.count({ where: { companyId } }),
        prisma.arac.count({ where: { companyId } }),
        prisma.sofor.count({ where: { companyId } }),
        prisma.accommodation.findMany({
          where: { companyId },
          take: 5,
          orderBy: { id: 'desc' },
          include: includeHelper.accommodation
        }),
        prisma.transfer.findMany({
          where: { companyId },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: includeHelper.transfer
        })
      ])

      const duration = Date.now() - startTime
      queryOptimizer.trackQuery('dashboard_stats', duration, 'dashboard', 'read')

      return {
        accommodationCount,
        transferCount,
        vehicleCount,
        driverCount,
        recentAccommodations,
        recentTransfers
      }
    } catch (error) {
      console.error('Dashboard stats query error:', error)
      throw error
    }
  },

  /**
   * Accommodation listesi - optimized
   */
  async getAccommodationsList(companyId: number, filters: any = {}, page = 1, limit = 20) {
    const startTime = Date.now()
    
    try {
      const skip = (page - 1) * limit
      
      const [accommodations, total] = await Promise.all([
        prisma.accommodation.findMany({
          where: {
            companyId,
            ...filters
          },
          skip,
          take: limit,
          orderBy: { id: 'desc' },
          include: includeHelper.accommodation
        }),
        prisma.accommodation.count({
          where: {
            companyId,
            ...filters
          }
        })
      ])

      const duration = Date.now() - startTime
      queryOptimizer.trackQuery('accommodations_list', duration, 'accommodation', 'read')

      return {
        data: accommodations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Accommodations list query error:', error)
      throw error
    }
  },

  /**
   * Transfer listesi - optimized
   */
  async getTransfersList(companyId: number, filters: any = {}, page = 1, limit = 20) {
    const startTime = Date.now()
    
    try {
      const skip = (page - 1) * limit
      
      const [transfers, total] = await Promise.all([
        prisma.transfer.findMany({
          where: {
            companyId,
            ...filters
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: includeHelper.transfer
        }),
        prisma.transfer.count({
          where: {
            companyId,
            ...filters
          }
        })
      ])

      const duration = Date.now() - startTime
      queryOptimizer.trackQuery('transfers_list', duration, 'transfer', 'read')

      return {
        data: transfers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Transfers list query error:', error)
      throw error
    }
  },

  /**
   * Araç listesi - optimized
   */
  async getVehiclesList(companyId: number, filters: any = {}, page = 1, limit = 20) {
    const startTime = Date.now()
    
    try {
      const skip = (page - 1) * limit
      
      const [vehicles, total] = await Promise.all([
        prisma.arac.findMany({
          where: {
            companyId,
            ...filters
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: includeHelper.arac
        }),
        prisma.arac.count({
          where: {
            companyId,
            ...filters
          }
        })
      ])

      const duration = Date.now() - startTime
      queryOptimizer.trackQuery('vehicles_list', duration, 'arac', 'read')

      return {
        data: vehicles,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Vehicles list query error:', error)
      throw error
    }
  }
}

/**
 * Query performance middleware
 */
export function queryPerformanceMiddleware() {
  return async (req: any, res: any, next: any) => {
    const startTime = Date.now()
    
    // Response'u intercept et
    const originalSend = res.json
    res.json = function(data: any) {
      const duration = Date.now() - startTime
      
      // Query performansını izle
      queryOptimizer.trackQuery(
        `${req.method} ${req.url}`,
        duration,
        'api',
        req.method.toLowerCase()
      )
      
      return originalSend.call(this, data)
    }
    
    next()
  }
}

/**
 * Query optimization utilities
 */
export const queryUtils = {
  /**
   * N+1 problem tespiti
   */
  detectNPlusOne(queries: any[]) {
    const patterns = new Map<string, number>()
    
    queries.forEach(query => {
      const pattern = `${query.model}.${query.action}`
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1)
    })
    
    const nPlusOneQueries = Array.from(patterns.entries())
      .filter(([_, count]) => count > 5) // 5'ten fazla aynı sorgu varsa N+1 olabilir
      .map(([pattern, count]) => ({ pattern, count }))
    
    return nPlusOneQueries
  },

  /**
   * Query optimization önerileri
   */
  getOptimizationSuggestions(stats: any) {
    const suggestions = []
    
    if (stats.averageDuration > 100) {
      suggestions.push('Ortalama sorgu süresi yüksek. Index\'leri kontrol edin.')
    }
    
    if (stats.slowQueries > 10) {
      suggestions.push('Çok sayıda yavaş sorgu var. Query optimizasyonu gerekli.')
    }
    
    if (stats.totalQueries > 1000) {
      suggestions.push('Çok fazla sorgu var. Caching stratejisi uygulayın.')
    }
    
    return suggestions
  }
}

export default queryOptimizer
