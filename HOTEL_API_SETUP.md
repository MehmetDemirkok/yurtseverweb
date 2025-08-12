# Otel API'leri Kurulum Rehberi

Bu rehber, projenizde gerçek otel verilerini çekmek için gerekli API anahtarlarının nasıl alınacağını açıklar.

## 🔑 API Anahtarları

### 🆓 Ücretsiz API'ler (Anahtar Gerektirmez)

#### 1. OpenTripMap API
- **URL**: https://opentripmap.io/
- **Fiyat**: Tamamen ücretsiz
- **Limit**: Günlük 5000 istek
- **Özellikler**: Dünya çapında otel verileri
- **Kurulum**: Hiçbir kurulum gerekmez, otomatik çalışır

#### 2. Foursquare API
- **URL**: https://developer.foursquare.com/
- **Fiyat**: Ücretsiz tier mevcut
- **Limit**: Günlük 950 istek
- **Özellikler**: Yerel işletme verileri
- **Kurulum**: Hiçbir kurulum gerekmez, otomatik çalışır

#### 3. Free Hotels API
- **URL**: https://rapidapi.com/apidojo/api/hotels4/
- **Fiyat**: Ücretsiz tier mevcut
- **Limit**: Günlük 100 istek
- **Özellikler**: Otel arama ve rezervasyon
- **Kurulum**: Hiçbir kurulum gerekmez, otomatik çalışır

### 💰 Ücretli API'ler (İsteğe Bağlı)

#### 4. Booking.com API (RapidAPI)
- **URL**: https://rapidapi.com/3b-data-3b-data-default/api/booking-com/
- **Fiyat**: Ücretsiz plan mevcut (günlük 100 istek)
- **Kurulum**:
  1. RapidAPI'ye kayıt olun
  2. Booking.com API'sini abone olun
  3. API anahtarınızı kopyalayın
  4. `.env` dosyasına `BOOKING_API_KEY="your-key"` ekleyin

#### 5. TripAdvisor API (RapidAPI)
- **URL**: https://rapidapi.com/apidojo/api/tripadvisor1/
- **Fiyat**: Ücretsiz plan mevcut (günlük 50 istek)
- **Kurulum**:
  1. RapidAPI'de TripAdvisor API'sini abone olun
  2. API anahtarınızı kopyalayın
  3. `.env` dosyasına `TRIPADVISOR_API_KEY="your-key"` ekleyin

#### 6. Hotels.com API (RapidAPI)
- **URL**: https://rapidapi.com/apidojo/api/hotels4/
- **Fiyat**: Ücretsiz plan mevcut (günlük 100 istek)
- **Kurulum**:
  1. RapidAPI'de Hotels.com API'sini abone olun
  2. API anahtarınızı kopyalayın
  3. `.env` dosyasına `HOTELS_API_KEY="your-key"` ekleyin

#### 7. Google Places API
- **URL**: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
- **Fiyat**: İlk 1000 istek ücretsiz, sonrası $0.017/1000 istek
- **Kurulum**:
  1. Google Cloud Console'a gidin
  2. Places API'yi etkinleştirin
  3. API anahtarı oluşturun
  4. `.env` dosyasına `GOOGLE_PLACES_API_KEY="your-key"` ekleyin

## 📝 Environment Variables

### 🆓 Ücretsiz API'ler
Ücretsiz API'ler için hiçbir environment variable gerekmez. Sistem otomatik olarak çalışır.

### 💰 Ücretli API'ler (İsteğe Bağlı)
Eğer ücretli API'leri de kullanmak istiyorsanız, `.env` dosyanıza şu değişkenleri ekleyin:

```env
# Ücretli Hotel APIs (İsteğe Bağlı)
BOOKING_API_KEY="your-booking-com-rapidapi-key"
TRIPADVISOR_API_KEY="your-tripadvisor-rapidapi-key"
HOTELS_API_KEY="your-hotels-com-rapidapi-key"
GOOGLE_PLACES_API_KEY="your-google-places-api-key"
```

## 🚀 Kullanım

### 🆓 Ücretsiz API'ler ile Hemen Başlayın

1. Uygulamayı başlatın: `npm run dev`
2. Oteller sayfasına gidin
3. "API'leri Test Et" butonu ile ücretsiz API'leri test edin
4. "API'lerden Otelleri Çek" butonu ile verileri çekin

**Not**: Ücretsiz API'ler otomatik olarak çalışır, hiçbir kurulum gerekmez!

### 💰 Ücretli API'ler (İsteğe Bağlı)

Eğer ücretli API'leri de kullanmak istiyorsanız:

1. API anahtarlarınızı `.env` dosyasına ekleyin
2. Uygulamayı yeniden başlatın: `npm run dev`
3. "API'leri Test Et" butonu ile tüm API'leri test edin
4. "API'lerden Otelleri Çek" butonu ile verileri çekin

## ⚠️ Önemli Notlar

### Rate Limiting
- Her API'nin kendi rate limit'i vardır
- Sistem otomatik olarak API'leri yormamak için 2 saniye bekler
- Büyük şehirler için daha fazla otel çekilir

### Hata Yönetimi
- API hatası durumunda sistem fallback veriler oluşturur
- Tüm API'ler başarısız olursa rastgele otel verileri üretilir
- Hata logları console'da görüntülenir

### Veri Kalitesi
- API'lerden gelen veriler otomatik olarak normalize edilir
- Duplicate oteller otomatik olarak temizlenir
- Mevcut oteller tekrar eklenmez

## 🔧 Alternatif Çözümler

### Sadece Google Places API
Eğer diğer API'leri kullanmak istemiyorsanız, sadece Google Places API'yi kullanabilirsiniz:

```typescript
// src/lib/hotel-api.ts dosyasında
const sources = [
  { name: 'google', service: this.googlePlacesApi }
];
```

### Manuel Veri Ekleme
API'ler olmadan da otelleri manuel olarak ekleyebilirsiniz:
1. "Yeni Otel Ekle" butonunu kullanın
2. Otel bilgilerini manuel olarak girin
3. Kaydedin

## 📊 API İstatistikleri

Sistem her çekme işleminde şu istatistikleri verir:
- Toplam otel sayısı
- Yeni eklenen otel sayısı
- Atlanan otel sayısı
- Şehir sayısı
- Ortalama yıldız ve puan
- Durum dağılımı
- API başarı/hata oranları

## 🆘 Sorun Giderme

### API Anahtarı Hatası
```
❌ booking: Booking.com API anahtarı bulunamadı
```
**Çözüm**: `.env` dosyasında API anahtarınızı kontrol edin

### Rate Limit Hatası
```
❌ booking: Rate limit exceeded
```
**Çözüm**: Birkaç dakika bekleyin veya ücretli plana geçin

### Şehir Bulunamadı Hatası
```
⚠️ tripadvisor: Şehir bulunamadı
```
**Çözüm**: Şehir adının doğru yazıldığından emin olun

## 💡 İpuçları

1. **Ücretsiz Planlar**: Başlangıç için ücretsiz planları kullanın
2. **Test**: Önce küçük bir şehirle test edin
3. **Backup**: API'ler çalışmazsa fallback veriler kullanılır
4. **Monitoring**: Console loglarını takip edin
5. **Optimization**: Gereksiz API çağrılarından kaçının

## 📞 Destek

Sorun yaşarsanız:
1. Console loglarını kontrol edin
2. API anahtarlarınızı doğrulayın
3. Rate limit'leri kontrol edin
4. Network bağlantınızı test edin
