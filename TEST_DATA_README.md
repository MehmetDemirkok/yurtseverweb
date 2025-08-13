# Test Verileri Yönetimi

Bu dokümantasyon, projenizde test verilerini nasıl yöneteceğinizi açıklar.

## Özellikler

- **Araçlar**: 20 adet test araç verisi
- **Şoförler**: 20 adet test şoför verisi  
- **Transferler**: 20 adet test transfer verisi
- **Konaklamalar**: 20 adet test konaklama verisi

## Kullanım Yöntemleri

### 1. Komut Satırı ile

#### Test Verilerini Oluşturma
```bash
# Tüm test verilerini oluştur (mevcut verileri temizler)
npm run seed

# Sadece test verilerini oluştur
npm run seed:test
```

#### Test Verilerini Temizleme
```bash
# Tüm test verilerini temizle
npm run seed:clear
```

### 2. Web Arayüzü ile

1. Tarayıcınızda `/test-data` sayfasına gidin
2. "Test Verileri Oluştur" butonuna tıklayın
3. Veya "Test Verilerini Temizle" butonuna tıklayın

### 3. API ile

#### Test Verilerini Oluşturma
```bash
curl -X POST http://localhost:3000/api/test-data \
  -H "Content-Type: application/json" \
  -d '{"action": "generate"}'
```

#### Test Verilerini Temizleme
```bash
curl -X POST http://localhost:3000/api/test-data \
  -H "Content-Type: application/json" \
  -d '{"action": "clear"}'
```

#### Mevcut Veri Sayısını Alma
```bash
curl http://localhost:3000/api/test-data
```

## Oluşturulan Test Verileri

### Araçlar (20 adet)
- **Plaka**: Rastgele Türkiye plaka formatı (34 ABC 123)
- **Marka**: Mercedes, BMW, Audi, Volkswagen, Ford, Toyota, Honda, Hyundai, Kia, Renault
- **Model**: Sprinter, Vito, Transit, Hiace, Crafter, Ducato, Daily, Master, Boxer, Relay
- **Araç Tipi**: Binek, Minibüs, Midibüs, Otobüs
- **Durum**: Müsait, Transferde, Bakımda
- **Yolcu Kapasitesi**: 4-50 arası rastgele
- **Koordinatlar**: Türkiye sınırları içinde rastgele

### Şoförler (20 adet)
- **İsim**: Türkçe isimler (Ahmet, Mehmet, Ali, vb.)
- **Soyisim**: Türkçe soyisimler (Yılmaz, Demir, Çelik, vb.)
- **Telefon**: +90 5XX XXX XXXX formatında
- **Ehliyet Sınıfı**: B, C, D, E
- **Durum**: Müsait, Transferde, İzinli
- **SRC Belgeleri**: SRC1, SRC2

### Transferler (20 adet)
- **Kalkış Yeri**: Türkiye havalimanları
- **Varış Yeri**: Şehir merkezleri
- **Tarih**: Bugünden 30 gün öncesi ile 30 gün sonrası arası
- **Saat**: 00:00 - 23:59 arası rastgele
- **Yolcu Sayısı**: 1-50 arası rastgele
- **Durum**: Beklemede, Yolda, Tamamlandı, İptal
- **Fiyat**: 100-1100 TL arası rastgele
- **Araç/Şoför**: Mevcut araç ve şoförlerle otomatik ilişkilendirme

### Konaklamalar (20 adet)
- **Kişi Bilgileri**: Rastgele isim ve soyisim
- **Ünvan**: Mühendis, Doktor, Öğretmen, vb.
- **Şehir**: Türkiye şehirleri
- **Otel**: Grand Hotel, Palace Hotel, Resort Hotel, vb.
- **Oda Tipi**: Tek Kişilik, Çift Kişilik, Suit, vb.
- **Konaklama Tipi**: Yarım Pansiyon, Tam Pansiyon, vb.
- **Tarihler**: Gelecek 30 gün içinde rastgele
- **Fiyat**: 100-600 TL/gece arası rastgele

## Güvenlik ve Önemli Notlar

1. **Test Verileri**: Bu veriler sadece geliştirme ve test amaçlıdır
2. **Gerçek Veriler**: Test verileri gerçek verilerle karışmaz
3. **Temizleme**: Temizleme işlemi geri alınamaz
4. **Yedekleme**: Önemli verilerinizi yedekleyin
5. **Üretim**: Üretim ortamında test verilerini kullanmayın

## Sorun Giderme

### Veritabanı Bağlantı Hatası
```bash
# Veritabanı bağlantısını kontrol edin
npx prisma db push

# Prisma client'ı yeniden oluşturun
npx prisma generate
```

### Yetki Hatası
- Kullanıcının ADMIN rolüne sahip olduğundan emin olun
- Veritabanı kullanıcısının gerekli yetkilere sahip olduğunu kontrol edin

### Performans Sorunları
- Büyük veri setlerinde işlem biraz zaman alabilir
- Tarayıcıda sayfayı yenileyin ve işlemin tamamlanmasını bekleyin

## Geliştirici Notları

### Yeni Test Verisi Ekleme
1. `prisma/seed.js` dosyasında ilgili fonksiyonu güncelleyin
2. API endpoint'ini güncelleyin (`src/app/api/test-data/route.ts`)
3. Web arayüzünü güncelleyin (`src/app/(dashboard)/test-data/page.tsx`)

### Özelleştirme
- Test veri sayısını değiştirmek için döngü sayısını güncelleyin
- Yeni veri türleri eklemek için schema'yı güncelleyin
- Farklı veri formatları için fonksiyonları özelleştirin

## İletişim

Herhangi bir sorun yaşarsanız veya öneriniz varsa, lütfen geliştirici ekibiyle iletişime geçin.
