# Scripts Klasörü

Bu klasörde proje yönetimi ve veri işlemleri için kullanılan script'ler bulunmaktadır.

## ⚠️ Önemli Değişiklik

**Otel çekme işlemleri artık API tabanlı olarak yapılmaktadır.** Eski script tabanlı sistem kaldırılmıştır.

## 📁 Mevcut Dosyalar

### 👤 Kullanıcı Yönetimi
- `createAdmin.js` - Admin kullanıcısı oluşturma scripti

### 💾 Veri Yedekleme
- `backupAndMail.js` - Veritabanı yedekleme ve email gönderme scripti

### 🧹 Yardımcı Scriptler
- `clearCookies.js` - Tarayıcı çerezlerini temizleme scripti

## 🚀 Yeni API Tabanlı Sistem

Otel verileri artık gerçek API'lerden çekilmektedir:

### Desteklenen API'ler:
- **Booking.com API** (RapidAPI)
- **TripAdvisor API** (RapidAPI)  
- **Hotels.com API** (RapidAPI)
- **Google Places API**

### Kullanım:
1. API anahtarlarını `.env` dosyasına ekleyin
2. Oteller sayfasına gidin
3. "API'leri Test Et" butonu ile API'leri test edin
4. "API'lerden Otelleri Çek" butonu ile verileri çekin

### Detaylı Kurulum:
`HOTEL_API_SETUP.md` dosyasını inceleyin.

## 👤 Admin Kullanıcı Oluşturma

```bash
node scripts/createAdmin.js
```

Bu script:
- Admin kullanıcısı oluşturur
- Email: `admin@yurtsever.com`
- Şifre: `admin123` (değiştirmeyi unutmayın!)
- Tüm izinlere sahip

## 💾 Veritabanı Yedekleme

```bash
node scripts/backupAndMail.js
```

Bu script:
- Veritabanından verileri çeker
- Excel dosyası oluşturur
- Email ile gönderir
- Haftalık otomatik yedekleme için kullanılır

## 🧹 Çerez Temizleme

```bash
node scripts/clearCookies.js
```

Bu script:
- Tarayıcı çerezlerini temizler
- Test amaçlı kullanılır

## 📊 API İstatistikleri

Sistem her çekme işleminde şu istatistikleri verir:
- Toplam otel sayısı
- Yeni eklenen otel sayısı
- Atlanan otel sayısı
- Şehir sayısı
- Ortalama yıldız ve puan
- Durum dağılımı
- API başarı/hata oranları

## ⚠️ Notlar

1. **API Anahtarları**: Gerekli API anahtarlarının `.env` dosyasında tanımlanması gerekir
2. **Rate Limiting**: Her API'nin kendi rate limit'i vardır, sistem otomatik olarak bekler
3. **Hata Yönetimi**: API hatası durumunda sistem fallback veriler oluşturur
4. **Veri Kalitesi**: API'lerden gelen veriler otomatik olarak normalize edilir
5. **Duplicate Kontrolü**: Mevcut oteller tekrar eklenmez

## 🔧 Geliştirme

### Yeni API Ekleme
`src/lib/hotel-api.ts` dosyasına yeni API servisleri ekleyebilirsiniz.

### API Konfigürasyonu
Environment variables ile API anahtarlarını yönetebilirsiniz.

### Rate Limiting
API'leri yormamak için delay sürelerini ayarlayabilirsiniz.

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Console loglarını kontrol edin
2. API anahtarlarınızı doğrulayın
3. Rate limit'leri kontrol edin
4. Network bağlantınızı test edin

## 🔗 İlgili Dosyalar

- `HOTEL_API_SETUP.md` - API kurulum rehberi
- `src/lib/hotel-api.ts` - API servisleri
- `src/app/api/konaklama/oteller/fetch-turkey-hotels/route.ts` - API endpoint
- `src/app/api/konaklama/oteller/test-apis/route.ts` - Test endpoint
