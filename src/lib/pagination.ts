import { prisma } from './prisma'
import { cache, CACHE_KEYS } from './cache'

/**
 * Gelişmiş Pagination Sistemi
 * 
 * Tüm liste endpoint'leri için tutarlı pagination implementasyonu.
 * Cache desteği ve performans optimizasyonu ile.
 */

// Pagination konfigürasyonu
interface PaginationConfig {
  defaultPage: number
  defaultLimit: number
  maxLimit: number
  cacheEnabled: boolean
  cacheTTL: number
}

const DEFAULT_CONFIG: PaginationConfig = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
  cacheEnabled: true,
  cacheTTL: 5 * 60 * 1000 // 5 dakika
}

// Pagination parametreleri
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  filters?: Record<string, any>
}

// Pagination sonucu
export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
    nextPage?: number
    prevPage?: number
  }
  meta: {
    totalItems: number
    itemsOnPage: number
    firstItem: number
    lastItem: number
  }
}

// Pagination helper class
export class PaginationHelper {
  private config: PaginationConfig

  constructor(config: Partial<PaginationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Pagination parametrelerini normalize et
   */
  normalizeParams(params: PaginationParams): Required<PaginationParams> {
    const page = Math.max(1, params.page || this.config.defaultPage)
    const limit = Math.min(
      this.config.maxLimit,
      Math.max(1, params.limit || this.config.defaultLimit)
    )
    const sortBy = params.sortBy || 'createdAt'
    const sortOrder = params.sortOrder || 'desc'
    const search = params.search || ''
    const filters = params.filters || {}

    return {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      filters
    }
  }

  /**
   * Pagination sonucunu hesapla
   */
  calculatePagination(
    data: any[],
    total: number,
    page: number,
    limit: number
  ): PaginationResult<any> {
    const pages = Math.ceil(total / limit)
    const hasNext = page < pages
    const hasPrev = page > 1

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext,
        hasPrev,
        nextPage: hasNext ? page + 1 : undefined,
        prevPage: hasPrev ? page - 1 : undefined
      },
      meta: {
        totalItems: total,
        itemsOnPage: data.length,
        firstItem: (page - 1) * limit + 1,
        lastItem: (page - 1) * limit + data.length
      }
    }
  }

  /**
   * Cache key oluştur
   */
  generateCacheKey(
    model: string,
    companyId: number,
    params: Required<PaginationParams>
  ): string {
    const paramsString = JSON.stringify({
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      search: params.search,
      filters: params.filters
    })

    return `${model}:pagination:${companyId}:${Buffer.from(paramsString).toString('base64')}`
  }
}

// Global pagination helper
export const paginationHelper = new PaginationHelper()

/**
 * Generic pagination fonksiyonu
 */
export async function paginate<T>(
  model: any,
  companyId: number,
  params: PaginationParams,
  options: {
    include?: any
    where?: any
    cache?: boolean
    ttl?: number
  } = {}
): Promise<PaginationResult<T>> {
  const normalizedParams = paginationHelper.normalizeParams(params)
  const { page, limit, sortBy, sortOrder, search, filters } = normalizedParams
  const { include, where = {}, cache: useCache = true, ttl } = options

  const skip = (page - 1) * limit
  const cacheKey = paginationHelper.generateCacheKey(
    model.$modelName || 'unknown',
    companyId,
    normalizedParams
  )

  // Cache'den kontrol et
  if (useCache) {
    const cached = await cache.get<PaginationResult<T>>(cacheKey)
    if (cached !== null) {
      return cached
    }
  }

  // Where koşullarını oluştur
  const whereConditions = {
    companyId,
    ...where,
    ...filters
  }

  // Search varsa ekle
  if (search) {
    // Model'e göre search alanlarını belirle
    const searchFields = getSearchFields(model.$modelName)
    if (searchFields.length > 0) {
      whereConditions.OR = searchFields.map(field => ({
        [field]: {
          contains: search,
          mode: 'insensitive'
        }
      }))
    }
  }

  // Order by koşulunu oluştur
  const orderBy = {
    [sortBy]: sortOrder
  }

  try {
    // Paralel olarak data ve count çek
    const [data, total] = await Promise.all([
      model.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy,
        include
      }),
      model.count({
        where: whereConditions
      })
    ])

    const result = paginationHelper.calculatePagination(data, total, page, limit)

    // Cache'e kaydet
    if (useCache) {
      await cache.set(cacheKey, result, { ttl: ttl || DEFAULT_CONFIG.cacheTTL })
    }

    return result
  } catch (error) {
    console.error('Pagination error:', error)
    throw error
  }
}

/**
 * Model'e göre search alanlarını belirle
 */
function getSearchFields(modelName: string): string[] {
  const searchFieldsMap: Record<string, string[]> = {
    Accommodation: ['adiSoyadi', 'unvani', 'sehir', 'otelAdi'],
    Transfer: ['kalkisYeri', 'varisYeri', 'notlar'],
    Arac: ['plaka', 'marka', 'model'],
    Sofor: ['ad', 'soyad', 'telefon'],
    Hotel: ['adi', 'sehir', 'adres'],
    Cari: ['ad', 'soyad', 'sirket', 'sehir'],
    Tedarikci: ['sirketAdi', 'yetkiliKisi', 'sehir'],
    Organization: ['name', 'description', 'lokasyon']
  }

  return searchFieldsMap[modelName] || []
}

/**
 * Specific pagination fonksiyonları
 */
export const paginationUtils = {
  /**
   * Accommodation pagination
   */
  async paginateAccommodations(
    companyId: number,
    params: PaginationParams
  ): Promise<PaginationResult<any>> {
    return await paginate(
      prisma.accommodation,
      companyId,
      params,
      {
        include: {
          company: true,
          organization: {
            include: {
              hotel: true
            }
          }
        }
      }
    )
  },

  /**
   * Transfer pagination
   */
  async paginateTransfers(
    companyId: number,
    params: PaginationParams
  ): Promise<PaginationResult<any>> {
    return await paginate(
      prisma.transfer,
      companyId,
      params,
      {
        include: {
          company: true,
          arac: true,
          sofor: true,
          cari: true,
          tedarikci: true,
          yolcular: true
        }
      }
    )
  },

  /**
   * Vehicle pagination
   */
  async paginateVehicles(
    companyId: number,
    params: PaginationParams
  ): Promise<PaginationResult<any>> {
    return await paginate(
      prisma.arac,
      companyId,
      params,
      {
        include: {
          company: true,
          soforler: true,
          transferler: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    )
  },

  /**
   * Driver pagination
   */
  async paginateDrivers(
    companyId: number,
    params: PaginationParams
  ): Promise<PaginationResult<any>> {
    return await paginate(
      prisma.sofor,
      companyId,
      params,
      {
        include: {
          company: true,
          atananArac: true,
          transferler: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    )
  },

  /**
   * Hotel pagination
   */
  async paginateHotels(
    companyId: number,
    params: PaginationParams
  ): Promise<PaginationResult<any>> {
    return await paginate(
      prisma.hotel,
      companyId,
      params,
      {
        include: {
          company: true,
          organizations: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    )
  },

  /**
   * Cari pagination
   */
  async paginateCaris(
    companyId: number,
    params: PaginationParams
  ): Promise<PaginationResult<any>> {
    return await paginate(
      prisma.cari,
      companyId,
      params,
      {
        include: {
          company: true,
          transferler: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    )
  },

  /**
   * Tedarikci pagination
   */
  async paginateTedarikciler(
    companyId: number,
    params: PaginationParams
  ): Promise<PaginationResult<any>> {
    return await paginate(
      prisma.tedarikci,
      companyId,
      params,
      {
        include: {
          company: true,
          transferler: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    )
  }
}

/**
 * Pagination middleware
 */
export function paginationMiddleware() {
  return (req: any, res: any, next: any) => {
    // Query parametrelerini parse et
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const sortBy = req.query.sortBy || 'createdAt'
    const sortOrder = req.query.sortOrder || 'desc'
    const search = req.query.search || ''
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {}

    // Pagination parametrelerini request'e ekle
    req.pagination = {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      filters
    }

    next()
  }
}

/**
 * Pagination response helper
 */
export function createPaginationResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  additionalMeta?: Record<string, any>
): PaginationResult<T> {
  const result = paginationHelper.calculatePagination(data, total, page, limit)
  
  if (additionalMeta) {
    result.meta = { ...result.meta, ...additionalMeta }
  }

  return result
}

/**
 * Pagination cache utilities
 */
export const paginationCache = {
  /**
   * Pagination cache'ini temizle
   */
  async clearCache(model?: string, companyId?: number): Promise<void> {
    if (model && companyId) {
      await cache.clearPattern(`${model}:pagination:${companyId}:`)
    } else if (model) {
      await cache.clearPattern(`${model}:pagination:`)
    } else {
      await cache.clearPattern('pagination:')
    }
  },

  /**
   * Cache istatistikleri
   */
  async getCacheStats(): Promise<any> {
    return await cache.getStats()
  }
}

/**
 * Pagination performance monitoring
 */
export class PaginationMonitor {
  private static instance: PaginationMonitor
  private metrics: Array<{
    model: string
    duration: number
    page: number
    limit: number
    timestamp: Date
  }> = []

  static getInstance(): PaginationMonitor {
    if (!PaginationMonitor.instance) {
      PaginationMonitor.instance = new PaginationMonitor()
    }
    return PaginationMonitor.instance
  }

  /**
   * Metrik kaydet
   */
  recordMetric(model: string, duration: number, page: number, limit: number) {
    this.metrics.push({
      model,
      duration,
      page,
      limit,
      timestamp: new Date()
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
    const avgDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0) / total
    const avgPage = this.metrics.reduce((sum, m) => sum + m.page, 0) / total
    const avgLimit = this.metrics.reduce((sum, m) => sum + m.limit, 0) / total

    // Model bazında istatistikler
    const modelStats = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.model]) {
        acc[metric.model] = { count: 0, totalDuration: 0 }
      }
      acc[metric.model].count++
      acc[metric.model].totalDuration += metric.duration
      return acc
    }, {} as Record<string, { count: number; totalDuration: number }>)

    return {
      total,
      averageDuration: avgDuration,
      averagePage: avgPage,
      averageLimit: avgLimit,
      modelStats,
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

export const paginationMonitor = PaginationMonitor.getInstance()

export default paginationHelper
