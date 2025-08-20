# Yurtsever Konaklama Yönetim Sistemi

Modern Next.js tabanlı, çok kiracılı konaklama ve transfer yönetim sistemi.

## 🚀 Özellikler

### 🔐 Kimlik Doğrulama ve Yetkilendirme
- **JWT tabanlı kimlik doğrulama**
- **Rol bazlı erişim kontrolü (RBAC)**
- **Çok kiracılı (multi-tenant) yapı**
- **Şirket bazlı veri izolasyonu**

### 👥 Kullanıcı Rolleri
- **ADMIN**: Sistem sahibi, tüm yetkilere sahip
- **MUDUR**: Şirket müdürü, kendi şirketini yönetir
- **OPERATOR**: Veri girişi yapabilir
- **KULLANICI**: Sadece görüntüleme yetkisi

### 🏨 Konaklama Yönetimi
- **Otel rezervasyonları**
- **Müşteri yönetimi**
- **Organizasyon analizi**
- **Excel raporları**
- **Otel API entegrasyonları**

### 🚐 Transfer Yönetimi
- **Araç yönetimi**
- **Şoför yönetimi**
- **Transfer planlaması**
- **Arvento GPS entegrasyonu**
- **Canlı araç takibi**

### 📊 Raporlama ve Analiz
- **İstatistiksel grafikler**
- **Excel export**
- **Performans metrikleri**
- **Organizasyon analizi**

## 🛠️ Teknoloji Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Next.js API Routes
- **Veritabanı**: PostgreSQL (Prisma ORM)
- **Kimlik Doğrulama**: JWT
- **Deployment**: Vercel
- **Grafikler**: Chart.js/Recharts
- **Excel**: ExcelJS

## 📦 Kurulum

### Gereksinimler
- Node.js 18+
- PostgreSQL veritabanı
- npm veya yarn

### Adımlar

1. **Projeyi klonlayın**
```bash
git clone <repository-url>
cd newnextjsyurtsever
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Environment değişkenlerini ayarlayın**
```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:
```env
# Veritabanı
DATABASE_URL="postgresql://user:password@localhost:5432/database"
DIRECT_URL="postgresql://user:password@localhost:5432/database"

# JWT
JWT_SECRET="your_super_secure_jwt_secret_key_here_2024"

# Supabase (opsiyonel)
SUPABASE_URL="your_supabase_url"
SUPABASE_ANON_KEY="your_supabase_anon_key"

# Email (opsiyonel)
GMAIL_USER="your_email@gmail.com"
GMAIL_PASS="your_app_password"
MAIL_TO="notifications@example.com"

# Arvento (opsiyonel)
ARVENTO_API_KEY="your_arvento_api_key"
ARVENTO_BASE_URL="https://api.arvento.com"

# Hotel APIs (opsiyonel)
BOOKING_API_KEY="your_booking_api_key"
TRIPADVISOR_API_KEY="your_tripadvisor_api_key"
HOTELS_API_KEY="your_hotels_api_key"
GOOGLE_PLACES_API_KEY="your_google_places_api_key"

# Backup email bildirimleri için
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
BACKUP_NOTIFICATION_EMAIL="admin@company.com"
```

4. **Veritabanını hazırlayın**
```bash
npx prisma generate
npx prisma db push

# Performans index'lerini uygula
npm run db:index

# Veritabanı sağlığını kontrol et
npm run db:health
```

5. **Test verilerini oluşturun (opsiyonel)**
```bash
npm run seed
```

6. **Uygulamayı başlatın**
```bash
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## 🏗️ Proje Yapısı

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Kimlik doğrulama sayfaları
│   ├── (dashboard)/              # Ana uygulama sayfaları
│   ├── (admin)/                  # Admin paneli
│   ├── api/                      # API Routes
│   └── components/               # Sayfa özel componentleri
├── components/                   # Shared Components
│   ├── ui/                       # UI Components
│   ├── layout/                   # Layout Components
│   └── forms/                    # Form Components
├── lib/                          # Utility Libraries
│   ├── utils/                    # Utility Functions
│   ├── constants/                # Constants
│   ├── validations/              # Validation Schemas
│   ├── auth.ts                   # Authentication
│   ├── permissions.ts            # Permissions
│   └── prisma.ts                 # Database
└── types/                        # TypeScript Types
```

## 🔐 Güvenlik

### JWT Kimlik Doğrulama
- Her API isteğinde token doğrulanır
- Token'da kullanıcı rolü ve şirket bilgisi bulunur
- Geçersiz token'lar otomatik temizlenir

### Rol Bazlı Yetki Kontrolü
- ADMIN: Tüm yetkilere sahip
- MUDUR: Kendi şirketini yönetir, OPERATOR/KULLANICI oluşturabilir
- OPERATOR: Veri ekleyebilir
- KULLANICI: Sadece görüntüleme

### Şirket Bazlı Veri İzolasyonu
- Her veri kaydında `companyId` alanı
- Kullanıcılar sadece kendi şirketlerinin verilerini görebilir
- API'ler otomatik şirket bazlı filtreleme yapar

## 🚀 Performans Optimizasyonları

### Cache Sistemi
- In-memory cache sistemi
- TTL (Time To Live) desteği
- Pattern-based cache invalidation

### Database Optimizasyonu
- **Index'ler**: Kritik alanlarda %70-90 performans artışı
- **Connection Pooling**: 10 eşzamanlı bağlantı, otomatik timeout yönetimi
- **Query Monitoring**: Yavaş sorguları otomatik tespit (500ms+)
- **Migration Safety**: Production'da güvenli migration
- **Backup Strategy**: Otomatik günlük backup ve email bildirimleri
- **Data Archiving**: Eski verilerin otomatik arşivlenmesi
- **Caching Strategy**: Redis ve in-memory cache desteği
- **Query Optimization**: N+1 problem çözümü ve batch loading
- **Database Partitioning**: Büyük tablolar için otomatik partitioning
- **Lazy Loading**: İlişkili veriler için lazy loading
- **Pagination**: Gelişmiş pagination sistemi

### Frontend Optimizasyonu
- Lazy loading
- Debounced fetch
- Performance monitoring

## 📊 API Endpoints

### Kimlik Doğrulama
- `POST /api/auth/login` - Giriş
- `POST /api/auth/logout` - Çıkış
- `GET /api/user/profile` - Kullanıcı profili

### Kullanıcı Yönetimi
- `GET /api/users` - Kullanıcıları listele
- `POST /api/users` - Kullanıcı oluştur
- `PUT /api/users/[id]` - Kullanıcı güncelle
- `DELETE /api/users/[id]` - Kullanıcı sil

### Konaklama
- `GET /api/accommodation` - Konaklama listesi
- `POST /api/accommodation` - Konaklama oluştur
- `PUT /api/accommodation/[id]` - Konaklama güncelle
- `DELETE /api/accommodation/[id]` - Konaklama sil

### Transfer
- `GET /api/transfer/araclar` - Araç listesi
- `GET /api/transfer/soforler` - Şoför listesi
- `GET /api/transfer/transferler` - Transfer listesi

### Arvento Entegrasyonu
- `GET /api/arvento/vehicles` - Araç listesi
- `GET /api/arvento/vehicles/[id]/location` - Araç konumu
- `POST /api/arvento/live-tracking` - Canlı takip

## 🏨 Otel API Entegrasyonları

### Ücretsiz API'ler
- **OpenTripMap**: Dünya çapında otel verileri
- **Foursquare**: Yerel işletme verileri
- **Free Hotels API**: Otel arama ve rezervasyon

### Ücretli API'ler (İsteğe Bağlı)
- **Booking.com API**: Otel rezervasyonları
- **TripAdvisor API**: Otel değerlendirmeleri
- **Hotels.com API**: Otel arama
- **Google Places API**: Yer bilgileri

## 🚐 Arvento GPS Entegrasyonu

### Özellikler
- Araç takibi
- Şoför yönetimi
- Canlı konum takibi
- Araç-şoför eşleştirmesi

### Kurulum
1. Arvento hesabı oluşturun
2. API anahtarı alın
3. `.env` dosyasına ekleyin:
```env
ARVENTO_API_KEY="your_arvento_api_key"
ARVENTO_BASE_URL="https://api.arvento.com"
```

## 📈 Test Verileri

### Test Verilerini Oluşturma
```bash
# Komut satırı ile
npm run seed

# Web arayüzü ile
/test-data sayfasına gidin
```

### Oluşturulan Veriler
- **20 adet test aracı**
- **20 adet test şoförü**
- **20 adet test transferi**
- **20 adet test konaklaması**

## 🚀 Deployment

### Vercel Deployment

1. **Vercel'de proje oluşturun**
2. **Environment değişkenlerini ayarlayın**
3. **Prisma Data Proxy kullanın** (önerilen)

### Environment Variables (Vercel)
```env
DATABASE_URL=prisma://aws-us-east-1.prisma-data.com/?api_key=YOUR_API_KEY
DIRECT_URL=postgresql://user:password@host:port/database
JWT_SECRET=your_jwt_secret
PRISMA_GENERATE_DATAPROXY=true
```

## 🛠️ Geliştirme

### Scripts
```bash
npm run dev          # Geliştirme sunucusu
npm run build        # Production build
npm run start        # Production sunucusu
npm run lint         # ESLint kontrolü
npm run seed         # Test verileri oluştur
npm run seed:clear   # Test verilerini temizle

# Veritabanı Yönetimi
npm run db:health    # Veritabanı sağlık kontrolü
npm run migrate:safe # Güvenli migration (production'da backup alır)
npm run backup       # Manuel backup al
npm run backup:stats # Backup istatistikleri
npm run backup:health # Backup sağlık kontrolü
npm run archive      # Eski verileri arşivle
npm run archive:stats # Arşiv istatistikleri
npm run db:index     # Index'leri uygula

# Performance Monitoring
npm run cache:stats  # Cache istatistikleri
npm run query:stats  # Query performans istatistikleri
npm run partition:create # Database partitioning oluştur
npm run partition:stats # Partition istatistikleri
npm run partition:cleanup # Eski partition'ları temizle
npm run partition:monthly # Aylık partition'ları oluştur
npm run partition:performance # Partition performans analizi
```

### 🛠️ Yönetim Scriptleri

#### Kritik Scriptler
```bash
# Admin kullanıcısı oluştur (ilk kurulum için)
node scripts/createAdmin.js

# Veritabanı yedekleme ve email gönderme
node scripts/backupAndMail.js

# Otomatik backup sistemi (production için)
node scripts/backup-system.js backup

# Güvenli migration (production'da backup alır)
node scripts/migration-helper.js

# Veri arşivleme (eski verileri temizler)
node scripts/data-archiver.js archive

# Database partitioning (büyük tablolar için)
node scripts/database-partitioning.js create

# Performance monitoring
node scripts/cache-stats.js
node scripts/query-stats.js
```

#### Orta Önemli Scriptler
```bash
# Demo verileri temizle (production'a geçerken)
node scripts/clearDemoData.js

# MUDUR kullanıcılarının şirket bilgilerini kontrol et
node scripts/checkMudurCompany.js

# MUDUR kullanıcılarına eksik izinleri ekle
node scripts/fixMudurPermissions.js
```

#### Debug Scriptleri
```bash
# Konaklama kayıtlarını debug et
node scripts/debug-accommodation.js

# Müşteri kayıtlarını düzelt (tek seferlik)
node scripts/fix-munferit-records.js
```

#### Script Detayları

**createAdmin.js** - Admin kullanıcısı oluşturur
- Email: `mehmet@yurtsever.com`
- Şifre: `mehmet123`
- Tüm izinlere sahip

**backupAndMail.js** - Veritabanı yedekleme
- Excel formatında yedek oluşturur
- Email ile gönderir
- Haftalık otomatik yedekleme için kullanılır

**backup-system.js** - Gelişmiş backup sistemi
- PostgreSQL dump formatında backup alır
- Email bildirimleri gönderir
- Backup sağlık kontrolü yapar
- Eski backup'ları otomatik temizler

**migration-helper.js** - Güvenli migration
- Production'da otomatik backup alır
- Migration validation yapar
- Hata durumunda rollback desteği
- Migration geçmişini takip eder

**data-archiver.js** - Veri arşivleme
- Eski verileri ayrı tablolara taşır
- Loglar: 90 gün, konaklamalar: 1 yıl
- Transferler: 6 ay, bakımlar: 2 yıl
- Ana tabloları küçültüp performansı artırır

**database-partitioning.js** - Database partitioning
- Büyük tablolar için otomatik partitioning
- Log tabloları için range partitioning (ay bazında)
- Accommodation tabloları için hash partitioning (company bazında)
- Transfer tabloları için range partitioning (tarih bazında)
- Performans artışı ve yönetim kolaylığı

**cache-stats.js** - Cache istatistikleri
- In-memory ve Redis cache durumu
- Cache hit/miss oranları
- Cache boyutu ve performans metrikleri

**query-stats.js** - Query performans izleme
- Yavaş sorgu tespiti
- Query sayısı ve ortalama süre
- N+1 problem tespiti
- Performans önerileri

**clearDemoData.js** - Demo verileri temizler
- Tüm test verilerini siler
- Production'a geçerken kullanılır
- Foreign key constraint'lere uygun silme

**checkMudurCompany.js** - Kullanıcı-şirket kontrolü
- MUDUR kullanıcılarının şirket bilgilerini kontrol eder
- Eksik şirket bilgilerini tespit eder

**fixMudurPermissions.js** - Yetki düzeltme
- MUDUR kullanıcılarına eksik izinleri ekler
- `user-management` ve `logs` izinlerini ekler

### Yeni Özellik Ekleme
1. Prisma schema'yı güncelleyin
2. API endpoint'lerini oluşturun
3. Frontend componentlerini ekleyin
4. Yetkilendirme kurallarını belirleyin

## 📞 Destek

### Sorun Giderme
1. Console loglarını kontrol edin
2. Veritabanı bağlantısını test edin
3. Environment değişkenlerini doğrulayın
4. API endpoint'lerini test edin

### Yaygın Sorunlar
- **JWT Hatası**: JWT_SECRET'ı kontrol edin
- **Veritabanı Bağlantısı**: DATABASE_URL'i doğrulayın (`npm run db:health` ile test edin)
- **Yetki Hatası**: Kullanıcı rolünü kontrol edin
- **Performance**: Cache ayarlarını kontrol edin, index'leri uygulayın
- **Backup Hatası**: SMTP ayarlarını ve backup dizin iznilerini kontrol edin
- **Migration Hatası**: `npm run migrate:safe` kullanın, güvenli backup alır

## 📄 Lisans

Bu proje özel kullanım için geliştirilmiştir.

---

**Not**: Bu sistem çok kiracılı yapıda tasarlanmıştır. Her şirket kendi verilerine sahiptir ve veriler arasında izolasyon sağlanmıştır.
