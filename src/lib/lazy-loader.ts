import { prisma } from './prisma'
import { cache, CACHE_KEYS } from './cache'

/**
 * Lazy Loading Sistemi
 * 
 * İlişkili veriler için lazy loading implementasyonu.
 * Performansı artırmak için verileri ihtiyaç duyulduğunda yükler.
 */

// Lazy loading konfigürasyonu
interface LazyLoadConfig {
  enabled: boolean
  cacheEnabled: boolean
  cacheTTL: number
  batchSize: number
}

const DEFAULT_CONFIG: LazyLoadConfig = {
  enabled: true,
  cacheEnabled: true,
  cacheTTL: 5 * 60 * 1000, // 5 dakika
  batchSize: 50
}

// Lazy loading manager
class LazyLoader {
  private config: LazyLoadConfig
  private loadingPromises: Map<string, Promise<any>> = new Map()

  constructor(config: Partial<LazyLoadConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Lazy loading için veri yükle
   */
  async loadData<T>(
    key: string,
    loader: () => Promise<T>,
    options: { cache?: boolean; ttl?: number } = {}
  ): Promise<T> {
    const cacheKey = `lazy:${key}`
    const useCache = options.cache ?? this.config.cacheEnabled
    const ttl = options.ttl ?? this.config.cacheTTL

    // Eğer zaten yükleniyorsa, mevcut promise'i döndür
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!
    }

    // Cache'den kontrol et
    if (useCache) {
      const cached = await cache.get<T>(cacheKey)
      if (cached !== null) {
        return cached
      }
    }

    // Yeni loading promise oluştur
    const loadingPromise = this.executeLoader(loader, cacheKey, useCache, ttl)
    this.loadingPromises.set(cacheKey, loadingPromise)

    try {
      const result = await loadingPromise
      return result
    } finally {
      // Loading tamamlandıktan sonra promise'i temizle
      this.loadingPromises.delete(cacheKey)
    }
  }

  /**
   * Loader'ı çalıştır ve cache'e kaydet
   */
  private async executeLoader<T>(
    loader: () => Promise<T>,
    cacheKey: string,
    useCache: boolean,
    ttl: number
  ): Promise<T> {
    try {
      const result = await loader()
      
      // Cache'e kaydet
      if (useCache) {
        await cache.set(cacheKey, result, { ttl })
      }
      
      return result
    } catch (error) {
      console.error(`Lazy loading error for ${cacheKey}:`, error)
      throw error
    }
  }

  /**
   * Batch lazy loading
   */
  async loadBatch<T>(
    keys: string[],
    loader: (keys: string[]) => Promise<T[]>,
    options: { cache?: boolean; ttl?: number } = {}
  ): Promise<T[]> {
    const cacheKey = `lazy:batch:${keys.sort().join('|')}`
    const useCache = options.cache ?? this.config.cacheEnabled
    const ttl = options.ttl ?? this.config.cacheTTL

    // Cache'den kontrol et
    if (useCache) {
      const cached = await cache.get<T[]>(cacheKey)
      if (cached !== null) {
        return cached
      }
    }

    // Batch loading promise oluştur
    const loadingPromise = this.executeLoader(
      () => loader(keys),
      cacheKey,
      useCache,
      ttl
    )

    this.loadingPromises.set(cacheKey, loadingPromise)

    try {
      const result = await loadingPromise
      return result
    } finally {
      this.loadingPromises.delete(cacheKey)
    }
  }

  /**
   * Cache'i temizle
   */
  async clearCache(pattern?: string): Promise<void> {
    if (pattern) {
      await cache.clearPattern(`lazy:${pattern}`)
    } else {
      await cache.clearPattern('lazy:')
    }
  }

  /**
   * Loading durumunu kontrol et
   */
  isLoading(key: string): boolean {
    return this.loadingPromises.has(`lazy:${key}`)
  }

  /**
   * Aktif loading sayısını al
   */
  getActiveLoadings(): number {
    return this.loadingPromises.size
  }
}

// Global lazy loader instance
export const lazyLoader = new LazyLoader()

/**
 * Lazy loading decorator'ları
 */
export function lazyLoad<T>(
  keyGenerator: (...args: any[]) => string,
  loader: (...args: any[]) => Promise<T>,
  options: { cache?: boolean; ttl?: number } = {}
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const key = keyGenerator(...args)
      return await lazyLoader.loadData(key, () => loader(...args), options)
    }
  }
}

/**
 * Lazy loading utilities
 */
export const lazyLoadUtils = {
  /**
   * Accommodation ilişkili verilerini lazy load et
   */
  async loadAccommodationRelations(accommodationId: number, companyId: number) {
    return await lazyLoader.loadData(
      `accommodation:${accommodationId}:relations`,
      async () => {
        const accommodation = await prisma.accommodation.findUnique({
          where: { id: accommodationId, companyId },
          include: {
            company: true,
            organization: {
              include: {
                hotel: true
              }
            }
          }
        })
        return accommodation
      },
      { cache: true, ttl: 10 * 60 * 1000 } // 10 dakika
    )
  },

  /**
   * Transfer ilişkili verilerini lazy load et
   */
  async loadTransferRelations(transferId: string, companyId: number) {
    return await lazyLoader.loadData(
      `transfer:${transferId}:relations`,
      async () => {
        const transfer = await prisma.transfer.findUnique({
          where: { id: transferId, companyId },
          include: {
            company: true,
            arac: true,
            sofor: true,
            cari: true,
            tedarikci: true,
            yolcular: true
          }
        })
        return transfer
      },
      { cache: true, ttl: 5 * 60 * 1000 } // 5 dakika
    )
  },

  /**
   * Araç ilişkili verilerini lazy load et
   */
  async loadVehicleRelations(vehicleId: string, companyId: number) {
    return await lazyLoader.loadData(
      `vehicle:${vehicleId}:relations`,
      async () => {
        const vehicle = await prisma.arac.findUnique({
          where: { id: vehicleId, companyId },
          include: {
            company: true,
            soforler: true,
            transferler: {
              take: 10,
              orderBy: { createdAt: 'desc' }
            },
            bakimlar: {
              take: 5,
              orderBy: { planlananTarih: 'desc' },
              include: {
                user: true
              }
            }
          }
        })
        return vehicle
      },
      { cache: true, ttl: 15 * 60 * 1000 } // 15 dakika
    )
  },

  /**
   * Şoför ilişkili verilerini lazy load et
   */
  async loadDriverRelations(driverId: string, companyId: number) {
    return await lazyLoader.loadData(
      `driver:${driverId}:relations`,
      async () => {
        const driver = await prisma.sofor.findUnique({
          where: { id: driverId, companyId },
          include: {
            company: true,
            atananArac: true,
            transferler: {
              take: 10,
              orderBy: { createdAt: 'desc' }
            }
          }
        })
        return driver
      },
      { cache: true, ttl: 10 * 60 * 1000 } // 10 dakika
    )
  },

  /**
   * Hotel ilişkili verilerini lazy load et
   */
  async loadHotelRelations(hotelId: number, companyId: number) {
    return await lazyLoader.loadData(
      `hotel:${hotelId}:relations`,
      async () => {
        const hotel = await prisma.hotel.findUnique({
          where: { id: hotelId, companyId },
          include: {
            company: true,
            organizations: {
              take: 10,
              orderBy: { createdAt: 'desc' }
            }
          }
        })
        return hotel
      },
      { cache: true, ttl: 30 * 60 * 1000 } // 30 dakika
    )
  }
}

/**
 * Lazy loading hooks (React için)
 */
export const useLazyLoad = <T>(
  key: string,
  loader: () => Promise<T>,
  options: { cache?: boolean; ttl?: number } = {}
) => {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    let mounted = true

    const loadData = async () => {
      if (lazyLoader.isLoading(key)) {
        return // Zaten yükleniyor
      }

      setLoading(true)
      setError(null)

      try {
        const result = await lazyLoader.loadData(key, loader, options)
        if (mounted) {
          setData(result)
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [key])

  return { data, loading, error }
}

/**
 * Lazy loading middleware
 */
export function lazyLoadingMiddleware() {
  return async (req: any, res: any, next: any) => {
    // Lazy loading istatistiklerini response header'a ekle
    res.setHeader('X-Lazy-Loading-Active', lazyLoader.getActiveLoadings())
    
    next()
  }
}

/**
 * Lazy loading performance monitoring
 */
export class LazyLoadingMonitor {
  private static instance: LazyLoadingMonitor
  private metrics: Array<{
    key: string
    duration: number
    timestamp: Date
    success: boolean
  }> = []

  static getInstance(): LazyLoadingMonitor {
    if (!LazyLoadingMonitor.instance) {
      LazyLoadingMonitor.instance = new LazyLoadingMonitor()
    }
    return LazyLoadingMonitor.instance
  }

  /**
   * Metrik kaydet
   */
  recordMetric(key: string, duration: number, success: boolean) {
    this.metrics.push({
      key,
      duration,
      timestamp: new Date(),
      success
    })

    // Son 1000 metriği tut
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }
  }

  /**
   * İstatistikleri al
   */
  getStats() {
    const total = this.metrics.length
    const successful = this.metrics.filter(m => m.success).length
    const failed = total - successful
    const avgDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0) / total

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      averageDuration: avgDuration,
      recentMetrics: this.metrics.slice(-10)
    }
  }

  /**
   * Metrikleri temizle
   */
  clearMetrics() {
    this.metrics = []
  }
}

export const lazyLoadingMonitor = LazyLoadingMonitor.getInstance()

export default lazyLoader
