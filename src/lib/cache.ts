import { LRUCache } from 'lru-cache'

/**
 * Gelişmiş Caching Sistemi
 * 
 * Bu sistem hem in-memory hem de Redis cache desteği sağlar.
 * Production'da Redis, development'ta in-memory cache kullanır.
 */

// Cache konfigürasyonu
const CACHE_CONFIG = {
  // In-memory cache ayarları
  max: 500, // Maksimum cache item sayısı
  ttl: 1000 * 60 * 5, // 5 dakika default TTL
  updateAgeOnGet: true, // Access edildiğinde age'i güncelle
  allowStale: false, // Expired item'ları döndürme
}

// In-memory LRU cache
const memoryCache = new LRUCache<string, any>(CACHE_CONFIG)

// Redis client (opsiyonel)
let redisClient: any = null

// Redis bağlantısını başlat
async function initRedis() {
  if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
    try {
      const Redis = require('ioredis')
      redisClient = new Redis(process.env.REDIS_URL, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      })
      
      console.log('Redis cache bağlantısı başarılı')
    } catch (error) {
      console.warn('Redis bağlantısı başarısız, in-memory cache kullanılıyor:', error)
      redisClient = null
    }
  }
}

// Cache key generator
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|')
  
  return `${prefix}:${sortedParams}`
}

// Cache interface
interface CacheOptions {
  ttl?: number // Time to live (ms)
  prefix?: string // Cache key prefix
  tags?: string[] // Cache tags for invalidation
}

// Ana cache fonksiyonları
export class CacheManager {
  private static instance: CacheManager
  private cache: LRUCache<string, any>
  private redis: any

  private constructor() {
    this.cache = memoryCache
    this.redis = redisClient
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  /**
   * Cache'den veri al
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Önce in-memory cache'e bak
      const memoryResult = this.cache.get(key)
      if (memoryResult !== undefined) {
        return memoryResult as T
      }

      // Redis varsa Redis'e bak
      if (this.redis) {
        const redisResult = await this.redis.get(key)
        if (redisResult) {
          const parsed = JSON.parse(redisResult)
          // In-memory'ye de ekle
          this.cache.set(key, parsed)
          return parsed as T
        }
      }

      return null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  /**
   * Cache'e veri kaydet
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || CACHE_CONFIG.ttl

      // In-memory cache'e kaydet
      this.cache.set(key, value, { ttl })

      // Redis varsa Redis'e de kaydet
      if (this.redis) {
        await this.redis.setex(key, Math.floor(ttl / 1000), JSON.stringify(value))
      }
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  /**
   * Cache'den veri sil
   */
  async delete(key: string): Promise<void> {
    try {
      // In-memory'den sil
      this.cache.delete(key)

      // Redis varsa Redis'den de sil
      if (this.redis) {
        await this.redis.del(key)
      }
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  /**
   * Pattern ile cache temizle
   */
  async clearPattern(pattern: string): Promise<void> {
    try {
      // In-memory cache'den pattern'e uyan key'leri sil
      const keys = this.cache.keys()
      const matchingKeys = keys.filter(key => key.includes(pattern))
      matchingKeys.forEach(key => this.cache.delete(key))

      // Redis varsa Redis'den de sil
      if (this.redis) {
        const redisKeys = await this.redis.keys(pattern)
        if (redisKeys.length > 0) {
          await this.redis.del(...redisKeys)
        }
      }
    } catch (error) {
      console.error('Cache clear pattern error:', error)
    }
  }

  /**
   * Tüm cache'i temizle
   */
  async clear(): Promise<void> {
    try {
      // In-memory cache'i temizle
      this.cache.clear()

      // Redis varsa Redis'i de temizle
      if (this.redis) {
        await this.redis.flushdb()
      }
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }

  /**
   * Cache istatistikleri
   */
  getStats() {
    const memoryStats = {
      size: this.cache.size,
      max: this.cache.max,
      hits: this.cache.hits,
      misses: this.cache.misses,
      hitRate: this.cache.hitRate,
    }

    return {
      memory: memoryStats,
      redis: this.redis ? 'connected' : 'disabled',
      type: this.redis ? 'redis' : 'memory',
    }
  }
}

// Cache decorator'ları
export function withCache<T>(
  keyGenerator: (...args: any[]) => string,
  options: CacheOptions = {}
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheManager = CacheManager.getInstance()
      const cacheKey = keyGenerator(...args)
      
      // Cache'den veri almayı dene
      const cached = await cacheManager.get<T>(cacheKey)
      if (cached !== null) {
        return cached
      }

      // Cache'de yoksa method'u çalıştır
      const result = await method.apply(this, args)
      
      // Sonucu cache'e kaydet
      await cacheManager.set(cacheKey, result, options)
      
      return result
    }
  }
}

// Utility fonksiyonları
export const cache = CacheManager.getInstance()

// Cache key patterns
export const CACHE_KEYS = {
  USER: (id: string) => `user:${id}`,
  COMPANY: (id: string) => `company:${id}`,
  ACCOMMODATIONS: (companyId: string, filters?: any) => 
    generateCacheKey('accommodations', { companyId, ...filters }),
  TRANSFERS: (companyId: string, filters?: any) => 
    generateCacheKey('transfers', { companyId, ...filters }),
  VEHICLES: (companyId: string) => `vehicles:${companyId}`,
  DRIVERS: (companyId: string) => `drivers:${companyId}`,
  HOTELS: (companyId: string) => `hotels:${companyId}`,
  STATS: (companyId: string, period: string) => `stats:${companyId}:${period}`,
}

// Cache invalidation patterns
export const CACHE_PATTERNS = {
  USER: 'user:',
  COMPANY: 'company:',
  ACCOMMODATIONS: 'accommodations:',
  TRANSFERS: 'transfers:',
  VEHICLES: 'vehicles:',
  DRIVERS: 'drivers:',
  HOTELS: 'hotels:',
  STATS: 'stats:',
}

// Cache middleware
export function cacheMiddleware(options: CacheOptions = {}) {
  return async (req: any, res: any, next: any) => {
    const cacheManager = CacheManager.getInstance()
    
    // GET request'leri için cache kullan
    if (req.method === 'GET') {
      const cacheKey = generateCacheKey(req.url, req.query)
      const cached = await cacheManager.get(cacheKey)
      
      if (cached !== null) {
        return res.json(cached)
      }
      
      // Original send method'u sakla
      const originalSend = res.json
      res.json = function(data: any) {
        // Response'u cache'e kaydet
        cacheManager.set(cacheKey, data, options)
        return originalSend.call(this, data)
      }
    }
    
    next()
  }
}

// Redis'i başlat
initRedis()

export default cache
