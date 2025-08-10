# Organizasyonlar Sayfası

## Genel Bakış

Organizasyonlar sayfası, konaklama kayıtlarından organizasyon adlarını çekerek istatistiksel analizler sunan bir yönetim sayfasıdır. Bu sayfa `/konaklama/organizasyonlar` URL'inde bulunur.

## Özellikler

### 📊 İstatistik Kartları
- **Toplam Organizasyon**: Sistemdeki benzersiz organizasyon sayısı
- **Toplam Konaklama**: Tüm organizasyonların toplam konaklama sayısı
- **Toplam Gelir**: Tüm organizasyonların toplam geliri
- **Ortalama Gelir**: Organizasyon başına ortalama gelir

### 🔍 Filtreleme ve Arama
- Organizasyon adına göre arama
- Şehir adına göre filtreleme
- Otel adına göre filtreleme
- Gerçek zamanlı arama

### 📋 Organizasyon Tablosu
Her organizasyon için şu bilgiler gösterilir:
- **Organizasyon Adı**: Konaklama kayıtlarından çıkarılan organizasyon adı
- **Konaklama Sayısı**: O organizasyona ait konaklama kayıt sayısı
- **Toplam Gelir**: O organizasyonun toplam geliri
- **Ortalama Kalış**: O organizasyonun ortalama konaklama süresi
- **Son Aktivite**: O organizasyonun son konaklama tarihi
- **Şehirler**: O organizasyonun konakladığı şehirler (en fazla 3 gösterilir)
- **Oteller**: O organizasyonun konakladığı oteller (en fazla 2 gösterilir)

### 📈 Sıralama
Tüm sütunlar tıklanabilir ve şu alanlara göre sıralama yapılabilir:
- Organizasyon Adı (A-Z / Z-A)
- Konaklama Sayısı (Artan / Azalan)
- Toplam Gelir (Artan / Azalan)
- Ortalama Kalış (Artan / Azalan)
- Son Aktivite (Artan / Azalan)

## Teknik Detaylar

### API Endpoint'leri
- `GET /api/organizations`: Benzersiz organizasyon adlarını döner
- `GET /api/accommodation?organizasyonAdi={name}`: Belirli organizasyona ait konaklama kayıtlarını döner

### Veri İşleme
1. Organizasyon adları `Accommodation` tablosundan çekilir
2. Her organizasyon için detaylı istatistikler hesaplanır:
   - Toplam gelir hesaplaması
   - Ortalama konaklama süresi hesaplaması
   - Benzersiz şehir ve otel listeleri
   - Son aktivite tarihi

### Yetkilendirme
- **ADMIN**: Tam erişim
- **MUDUR**: Tam erişim
- **OPERATOR**: Görüntüleme erişimi
- **KULLANICI**: Görüntüleme erişimi

Sayfa `accommodation` permission'ına sahip kullanıcılar tarafından erişilebilir.

## Kullanım

1. Sidebar'dan "Organizasyonlar" linkine tıklayın
2. Sayfa yüklendiğinde tüm organizasyonlar ve istatistikler görüntülenir
3. Arama kutusunu kullanarak organizasyonları filtreleyin
4. Sütun başlıklarına tıklayarak sıralama yapın
5. "Temizle" butonuna tıklayarak filtreleri sıfırlayın

## Responsive Tasarım

Sayfa mobil ve masaüstü cihazlarda uyumlu çalışır:
- Mobilde tek sütunlu layout
- Masaüstünde çok sütunlu layout
- Responsive tablo tasarımı
- Mobilde yatay kaydırma

## Performans

- Lazy loading ile veri yükleme
- Debounced arama
- Optimized API calls
- Efficient data processing
