// Frontend için optimize edilmiş fetch fonksiyonları

// Cache için basit Map
const fetchCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Fetch wrapper with cache
export const fetchWithCache = async <T>(
  url: string,
  options: RequestInit = {},
  ttl: number = 60000
): Promise<T> => {
  const cacheKey = `${url}:${JSON.stringify(options)}`;
  const now = Date.now();
  
  // Cache kontrolü
  const cached = fetchCache.get(cacheKey);
  if (cached && now - cached.timestamp < cached.ttl) {
    return cached.data;
  }

  // Fetch yap
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  // Cache'e kaydet
  fetchCache.set(cacheKey, {
    data,
    timestamp: now,
    ttl
  });

  return data;
};

// Debounced fetch
export const createDebouncedFetch = (delay: number = 300) => {
  let timeoutId: NodeJS.Timeout;
  
  return <T>(url: string, options?: RequestInit): Promise<T> => {
    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(async () => {
        try {
          const result = await fetchWithCache<T>(url, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
};

// Retry mechanism
export const fetchWithRetry = async <T>(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchWithCache<T>(url, options);
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError!;
};

// Cache temizleme
export const clearFetchCache = (pattern?: string) => {
  if (pattern) {
    for (const key of fetchCache.keys()) {
      if (key.includes(pattern)) {
        fetchCache.delete(key);
      }
    }
  } else {
    fetchCache.clear();
  }
};

// Loading state management
export const createLoadingState = () => {
  let loading = false;
  let error: string | null = null;
  
  return {
    get loading() { return loading; },
    get error() { return error; },
    
    setLoading: (value: boolean) => { loading = value; },
    setError: (value: string | null) => { error = value; },
    
    reset: () => {
      loading = false;
      error = null;
    }
  };
};
