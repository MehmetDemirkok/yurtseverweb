# Performance Optimizasyonları

Bu dokümantasyon, Supabase'den gelen verilerin geç yüklenmesi sorununu çözmek için uygulanan optimizasyonları açıklar.

## 🚀 Uygulanan Optimizasyonlar

### 1. Prisma Bağlantı Havuzu Optimizasyonu

**Dosya:** `src/lib/prisma.ts`

- Bağlantı havuzu ayarları optimize edildi
- Minimum ve maksimum bağlantı sayıları ayarlandı
- Zaman aşımı süreleri optimize edildi
- Gereksiz log'lar kaldırıldı

```typescript
// Bağlantı havuzu ayarları
__internal: {
  engine: {
    connectionLimit: 20,
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
    },
  },
}
```

### 2. Cache Sistemi

**Dosya:** `src/lib/cache.ts`

- In-memory cache sistemi eklendi
- TTL (Time To Live) desteği
- Pattern-based cache invalidation
- Cache wrapper fonksiyonları

```typescript
// Cache kullanımı
const result = await withCache(
  'users:list',
  () => prisma.user.findMany(),
  300000 // 5 dakika
);
```

### 3. API Route Optimizasyonu

**Dosya:** `src/lib/api-utils.ts`

- Cache'li API handler wrapper
- Pagination helper fonksiyonları
- Performance monitoring
- Standardized API responses

```typescript
// Optimize edilmiş API route
export async function GET(request: NextRequest) {
  const result = await withApiCache(
    cacheKey,
    () => prisma.user.findMany(),
    CACHE_TTL.MEDIUM
  );
  
  return apiResponse.success(result);
}
```

### 4. Frontend Fetch Optimizasyonu

**Dosya:** `src/lib/fetch-utils.ts`

- Cache'li fetch fonksiyonları
- Debounced fetch
- Retry mechanism
- Loading state management

```typescript
// Cache'li fetch
const data = await fetchWithCache('/api/users', {}, 60000);

// Debounced fetch
const debouncedFetch = createDebouncedFetch(300);
const data = await debouncedFetch('/api/users');
```

### 5. Performance Monitoring

**Dosya:** `src/hooks/usePerformance.ts`

- Component render performance tracking
- API call performance monitoring
- Slow operation detection
- Performance statistics

```typescript
// Component performance tracking
const { renderCount } = usePerformance('UserList');

// API performance tracking
const { trackApiCall } = useApiPerformance();
const data = await trackApiCall('getUsers', () => fetch('/api/users'));
```

## 📊 Performance Metrikleri

### Cache Hit Rate
- Cache hit rate'i %80+ olmalı
- Cache miss durumunda yavaş sorgular loglanır

### API Response Time
- Normal API call'lar: < 500ms
- Yavaş API call'lar: 500ms - 1000ms (loglanır)
- Çok yavaş API call'lar: > 1000ms (uyarı)

### Database Query Time
- Normal sorgular: < 100ms
- Yavaş sorgular: 100ms - 500ms (loglanır)
- Çok yavaş sorgular: > 500ms (uyarı)

## 🔧 Kullanım Örnekleri

### 1. Cache'li API Route Oluşturma

```typescript
// src/app/api/users/route.ts
import { withApiCache, apiResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  const cacheKey = 'users:list';
  
  const users = await withApiCache(
    cacheKey,
    () => prisma.user.findMany(),
    300000 // 5 dakika cache
  );
  
  return apiResponse.success(users);
}
```

### 2. Frontend'de Cache'li Fetch

```typescript
// Component içinde
import { fetchWithCache } from '@/lib/fetch-utils';

const [users, setUsers] = useState([]);

useEffect(() => {
  const loadUsers = async () => {
    const data = await fetchWithCache('/api/users', {}, 60000);
    setUsers(data.users);
  };
  
  loadUsers();
}, []);
```

### 3. Performance Monitoring

```typescript
// Component içinde
import { usePerformance, useApiPerformance } from '@/hooks/usePerformance';

function UserList() {
  usePerformance('UserList');
  const { trackApiCall } = useApiPerformance();
  
  const loadUsers = async () => {
    const data = await trackApiCall('getUsers', () => 
      fetch('/api/users').then(res => res.json())
    );
    setUsers(data.users);
  };
}
```

## 🛠️ Monitoring ve Debugging

### 1. Console Logları

Performance monitoring otomatik olarak console'a log yazar:

```
Slow query: User.findMany took 750ms
Slow API call: getUsers took 1200ms
Slow render in UserList: 45ms (render #5)
```

### 2. Cache Statistics

```typescript
import { cache } from '@/lib/cache';

// Cache boyutu
console.log('Cache size:', cache.size());

// Cache temizleme
cache.deletePattern('users');
```

### 3. API Statistics

```typescript
import { useApiPerformance } from '@/hooks/usePerformance';

const { getApiStats } = useApiPerformance();

// Belirli API istatistikleri
const userStats = getApiStats('getUsers');
console.log('User API stats:', userStats);

// Tüm API istatistikleri
const allStats = getApiStats();
console.log('All API stats:', allStats);
```

## 🚨 Troubleshooting

### Yavaş Sorgular

1. **Cache Hit Rate Düşük**: Cache TTL'lerini artırın
2. **Database Connection Pool**: Bağlantı havuzu ayarlarını kontrol edin
3. **N+1 Queries**: Include/select kullanarak gereksiz sorguları önleyin

### Memory Leaks

1. **Cache Size**: Cache boyutunu kontrol edin
2. **Component Unmount**: useEffect cleanup fonksiyonlarını kullanın
3. **Event Listeners**: Event listener'ları temizleyin

### Network Issues

1. **Retry Mechanism**: Otomatik retry kullanın
2. **Timeout Settings**: Timeout sürelerini artırın
3. **Error Handling**: Hata durumlarını handle edin

## 📈 Performance İyileştirme Önerileri

### 1. Database Indexes
```sql
-- Sık kullanılan sorgular için index'ler
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### 2. Query Optimization
```typescript
// Gereksiz alanları seçmeyin
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    // password: false, // Hassas veri
  }
});
```

### 3. Pagination
```typescript
// Büyük veri setleri için pagination kullanın
const users = await prisma.user.findMany({
  skip: (page - 1) * limit,
  take: limit,
});
```

### 4. Lazy Loading
```typescript
// Büyük component'ları lazy load edin
const UserList = lazy(() => import('./UserList'));
```

Bu optimizasyonlar sayesinde Supabase'den gelen verilerin yüklenme süreleri önemli ölçüde azalacaktır.
