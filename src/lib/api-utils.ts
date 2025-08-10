import { NextResponse } from 'next/server';
import { cache, withCache, createCacheKey } from './cache';

// API response wrapper
export const apiResponse = {
  success: <T>(data: T, status: number = 200) => {
    return NextResponse.json({ success: true, data }, { status });
  },
  
  error: (message: string, status: number = 400) => {
    return NextResponse.json({ success: false, error: message }, { status });
  },
  
  serverError: (message: string = 'Sunucu hatası') => {
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
};

// Cache'li API handler wrapper
export const withApiCache = <T>(
  cacheKey: string,
  handler: () => Promise<T>,
  ttl: number = 60000
) => {
  return withCache(cacheKey, handler, ttl);
};

// Pagination helper
export const createPaginationParams = (searchParams: URLSearchParams) => {
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100); // Max 100
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

// Search helper
export const createSearchParams = (searchParams: URLSearchParams) => {
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  
  return { search, sortBy, sortOrder };
};

// Cache invalidation helper
export const invalidateCache = (pattern: string) => {
  cache.deletePattern(pattern);
};

// Performance monitoring
export const withPerformanceMonitoring = async <T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    // Yavaş işlemleri logla
    if (duration > 1000) {
      console.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`Error in ${name} after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
};
