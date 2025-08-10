import { useEffect, useRef } from 'react';

// Performance monitoring hook
export const usePerformance = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current++;
    const currentTime = performance.now();
    const renderTime = currentTime - lastRenderTime.current;
    
    // Yavaş render'ları logla
    if (renderTime > 16) { // 60fps = 16ms per frame
      console.warn(`Slow render in ${componentName}: ${renderTime.toFixed(2)}ms (render #${renderCount.current})`);
    }
    
    lastRenderTime.current = currentTime;
  });

  return {
    renderCount: renderCount.current,
    getRenderTime: () => performance.now() - lastRenderTime.current
  };
};

// API call performance monitoring
export const useApiPerformance = () => {
  const apiCallTimes = useRef<Map<string, number[]>>(new Map());

  const trackApiCall = async <T>(
    name: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      // API call sürelerini kaydet
      if (!apiCallTimes.current.has(name)) {
        apiCallTimes.current.set(name, []);
      }
      apiCallTimes.current.get(name)!.push(duration);
      
      // Yavaş API call'ları logla
      if (duration > 1000) {
        console.warn(`Slow API call: ${name} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`API call failed: ${name} after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  };

  const getApiStats = (name?: string) => {
    if (name) {
      const times = apiCallTimes.current.get(name) || [];
      if (times.length === 0) return null;
      
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      
      return { name, avg, min, max, count: times.length };
    }
    
    // Tüm API call istatistikleri
    const stats: Record<string, any> = {};
    for (const [apiName, times] of apiCallTimes.current.entries()) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      
      stats[apiName] = { avg, min, max, count: times.length };
    }
    
    return stats;
  };

  return {
    trackApiCall,
    getApiStats
  };
};
