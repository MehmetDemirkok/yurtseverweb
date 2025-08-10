// Basit in-memory cache sistemi
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  // Cache'e veri ekle
  set(key: string, data: any, ttl: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Cache'den veri al
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // TTL kontrolü
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  // Cache'den veri sil
  delete(key: string): void {
    this.cache.delete(key);
  }

  // Belirli bir pattern'e uyan tüm cache'leri sil
  deletePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Tüm cache'i temizle
  clear(): void {
    this.cache.clear();
  }

  // Cache boyutunu al
  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
export const cache = new CacheManager();

// Cache key'leri oluşturmak için yardımcı fonksiyonlar
export const createCacheKey = (prefix: string, params: Record<string, any> = {}): string => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  
  return `${prefix}:${sortedParams}`;
};

// Cache wrapper fonksiyonu
export const withCache = async <T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = 60000
): Promise<T> => {
  // Cache'den kontrol et
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  // Fonksiyonu çalıştır ve cache'e kaydet
  const result = await fn();
  cache.set(key, result, ttl);
  
  return result;
};
