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
```

4. **Veritabanını hazırlayın**
```bash
npx prisma generate
npx prisma db push
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
- Prisma bağlantı havuzu optimizasyonu
- Query optimization
- Index'ler

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
```

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
- **Veritabanı Bağlantısı**: DATABASE_URL'i doğrulayın
- **Yetki Hatası**: Kullanıcı rolünü kontrol edin
- **Performance**: Cache ayarlarını kontrol edin

## 📄 Lisans

Bu proje özel kullanım için geliştirilmiştir.

---

**Not**: Bu sistem çok kiracılı yapıda tasarlanmıştır. Her şirket kendi verilerine sahiptir ve veriler arasında izolasyon sağlanmıştır.
