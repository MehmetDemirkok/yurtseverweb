# Arvento Entegrasyonu

Bu dokümantasyon, transfer yönetim sistemine eklenen Arvento entegrasyonunu açıklamaktadır.

## Özellikler

### 1. Araç Takibi
- Arvento'dan araç listesi çekme
- Araç konum bilgilerini alma
- Canlı takip özelliği
- Araç durumu güncellemeleri

### 2. Şoför Yönetimi
- Arvento'dan şoför listesi çekme
- Araç-şoför eşleştirmesi
- Şoför detay bilgileri

### 3. Konum Takibi
- Gerçek zamanlı konum bilgileri
- Konum geçmişi
- Hız ve yön bilgileri

## Kurulum

### 1. Environment Değişkenleri

`.env` dosyanıza aşağıdaki değişkenleri ekleyin:

```env
# Arvento API Konfigürasyonu
ARVENTO_API_KEY=your_arvento_api_key_here
ARVENTO_BASE_URL=https://api.arvento.com
```

### 2. API Anahtarı Alma

Arvento API anahtarınızı almak için:
1. Arvento hesabınıza giriş yapın
2. API bölümüne gidin
3. Yeni bir API anahtarı oluşturun
4. Bu anahtarı `ARVENTO_API_KEY` değişkenine ekleyin

## Kullanım

### Araçlar Sayfası

1. **Arvento Entegrasyonu Butonu**: Sayfa üst kısmında bulunan "Arvento Entegrasyonu" butonuna tıklayın
2. **Bağlantı Durumu**: Arvento bağlantısının durumunu kontrol edin
3. **Araç Eşleştirme**: Sistemdeki araçları Arvento'daki araçlarla eşleştirin
4. **Canlı Takip**: Canlı takip özelliğini açın/kapatın

### Tablo Görünümü

Araçlar tablosunda yeni sütunlar eklendi:

- **Arvento Durumu**: Araçların Arvento bağlantı durumu
- **Çevrimiçi/Çevrimdışı**: Gerçek zamanlı bağlantı durumu
- **Hız Bilgisi**: Anlık hız bilgileri

### Modal Özellikleri

Arvento Entegrasyonu modalında:

1. **Bağlantı Durumu**: API bağlantısının durumu
2. **Araç Eşleştirme**: Sistem araçları ile Arvento araçlarının eşleştirilmesi
3. **Arvento Araçları**: Arvento'dan gelen araç listesi
4. **Ayarlar**: Canlı takip ayarları

## API Endpoints

### Araçlar
- `GET /api/arvento/vehicles` - Tüm araçları getir
- `GET /api/arvento/vehicles/[id]` - Belirli bir aracı getir
- `PUT /api/arvento/vehicles/[id]` - Araç bilgilerini güncelle

### Konum
- `GET /api/arvento/vehicles/[id]/location` - Araç konumunu getir

### Canlı Takip
- `POST /api/arvento/live-tracking` - Canlı takip verilerini getir

## Veri Yapısı

### ArventoVehicle Interface
```typescript
interface ArventoVehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  fuelType: string;
  engineSize: string;
  transmission: string;
  color: string;
  vin: string;
  lastLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
    speed: number;
    heading: number;
  };
  status: 'active' | 'inactive' | 'maintenance';
  driver?: {
    id: string;
    name: string;
    phone: string;
  };
}
```

### ArventoLocation Interface
```typescript
interface ArventoLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed: number;
  heading: number;
  address?: string;
}
```

## Hata Yönetimi

Sistem aşağıdaki hata durumlarını yönetir:

1. **API Bağlantı Hatası**: Arvento API'sine bağlanamama
2. **Yetkilendirme Hatası**: Geçersiz API anahtarı
3. **Veri Eşleştirme Hatası**: Araç eşleştirme sorunları
4. **Konum Verisi Hatası**: Konum bilgilerinin alınamaması

## Güvenlik

- API anahtarları environment değişkenlerinde saklanır
- Tüm API istekleri yetkilendirme kontrolünden geçer
- Şirket bazlı veri izolasyonu sağlanır

## Performans

- Araç verileri cache'lenir
- Canlı takip sadece gerektiğinde aktif edilir
- API istekleri optimize edilmiştir

## Sorun Giderme

### Bağlantı Sorunları
1. API anahtarının doğru olduğunu kontrol edin
2. Arvento hesabınızın aktif olduğunu kontrol edin
3. API limitlerini kontrol edin

### Veri Eşleştirme Sorunları
1. Plaka numaralarının aynı formatta olduğunu kontrol edin
2. Araçların Arvento'da kayıtlı olduğunu kontrol edin

### Konum Verisi Sorunları
1. Araçların GPS cihazlarının çalıştığını kontrol edin
2. Son güncelleme zamanını kontrol edin

## Geliştirme

### Yeni Özellik Ekleme
1. `src/lib/arvento.ts` dosyasına yeni metodlar ekleyin
2. İlgili API endpoint'lerini oluşturun
3. Frontend bileşenlerini güncelleyin

### Test Etme
1. Arvento test ortamını kullanın
2. Mock veriler ile test edin
3. Gerçek veriler ile doğrulayın

## Destek

Sorunlarınız için:
1. Bu README dosyasını kontrol edin
2. Console loglarını inceleyin
3. Arvento dokümantasyonunu kontrol edin
4. Geliştirici ekibi ile iletişime geçin
