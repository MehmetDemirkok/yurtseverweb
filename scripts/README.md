# Türkiye Otelleri Script'leri

Bu klasörde Türkiye'deki otelleri çekmek ve yönetmek için kullanılan script'ler bulunmaktadır.

## 📁 Dosyalar

- `fetchTurkeyHotels.js` - Türkiye otellerini oluşturan ana script (rastgele)
- `importHotelsToDB.js` - Dinamik otel oluşturup veritabanına aktaran script (önerilen)
- `turkey_hotels.json` - Oluşturulan otellerin JSON dosyası (otomatik oluşturulur)
- `turkey_hotels_fixed.json` - Sabit Türkiye otelleri listesi (eski versiyon)

## 🚀 Kullanım

### 1. Otelleri Oluştur ve JSON'a Kaydet

```bash
npm run fetch-hotels
```

Bu komut:
- Türkiye'nin 85 şehrinde toplam ~850 otel oluşturur (rastgele)
- Her şehir için 5-15 otel oluşturur
- Otelleri `turkey_hotels.json` dosyasına kaydeder
- İstatistikleri konsola yazdırır

**Not**: Bu script her çalıştığında farklı otel isimleri oluşturur, bu yüzden duplicate kontrolü çalışmaz.

### 1.1. Dinamik Otel Oluşturma (Önerilen)

```bash
npm run import-hotels
# veya
npm run generate-hotels
```

Bu komut:
- Her şehir için sabit otel isimleri oluşturur
- Duplicate kontrolü yapar (otel adı + şehir)
- Sadece yeni otelleri ekler
- Mevcut otelleri atlar
- Her çalıştırmada aynı otel isimleri oluşturur (tutarlı)

### 2. Otelleri Veritabanına Aktar

```bash
npm run import-hotels
```

Bu komut:
- Her şehir için sabit otel isimleri oluşturur
- Duplicate kontrolü yapar (otel adı + şehir)
- Sadece yeni otelleri veritabanına kaydeder
- Mevcut otelleri atlar
- İstatistikleri konsola yazdırır

### 3. Web Arayüzünden Çekme

Oteller sayfasında "Türkiye Otellerini Çek" butonuna tıklayarak da otelleri çekebilirsiniz.

## 📊 Oluşturulan Veriler

### Otel Bilgileri
- **Adı**: Rastgele otel zincirleri ve Türkçe isimler
- **Adres**: Gerçekçi Türkçe adresler
- **Şehir**: Türkiye'nin 85 şehri
- **Ülke**: Türkiye
- **Telefon**: Gerçekçi Türkiye telefon numaraları
- **Email**: Otel adına göre oluşturulan email'ler
- **Website**: Otel adına göre oluşturulan website'ler
- **Yıldız**: 0-5 arası rastgele (ağırlıklı dağılım)
- **Puan**: 0-10 arası (yıldız sayısına göre)
- **Durum**: AKTIF, PASIF, TAMAMEN_DOLU, BAKIM

### İstatistikler
- **Toplam Otel**: ~850
- **Şehir Sayısı**: 85
- **Ortalama Yıldız**: ~2.7
- **Ortalama Puan**: ~4.0

## 🎯 Özellikler

### Otel İsimleri
- Uluslararası otel zincirleri (Hilton, Marriott, vb.)
- Türkçe otel isimleri (Palas, Saray, Konak, vb.)
- Şehir bazlı isimlendirme

### Adresler
- Gerçekçi Türkçe cadde isimleri
- Mahalle/district isimleri
- Şehir bazlı adresleme

### Telefon Numaraları
- Gerçek Türkiye alan kodları
- Gerçekçi format (+90 XXX XXX XXXX)

### Yıldız ve Puan Dağılımı
- Gerçekçi ağırlıklı dağılım
- Yıldız sayısına göre puan hesaplama
- Çeşitli kalite seviyeleri

## ⚠️ Notlar

1. **Duplicate Kontrolü**: 
   - Güncellenmiş script (`importHotelsToDB.js`) otel adı + şehir kombinasyonuna göre kontrol yapar
   - Her şehir için sabit otel isimleri kullanır (tutarlı)
   - Rastgele script (`fetchTurkeyHotels.js`) her çalıştığında farklı isimler oluşturur
2. **Veritabanı Bağlantısı**: Script'ler çalışmadan önce veritabanı bağlantısını kontrol edin
3. **Büyük Veri**: 1170+ otel oluşturmak biraz zaman alabilir
4. **Yasal Uyarı**: Bu script sadece test amaçlıdır, gerçek otel verileri için resmi API'ler kullanın
5. **Önerilen Kullanım**: Güncellenmiş otel oluşturma (`importHotelsToDB.js`) kullanın

## 🔧 Geliştirme

### Yeni Şehir Ekleme
`fetchTurkeyHotels.js` dosyasındaki `TURKEY_CITIES` dizisine yeni şehirler ekleyebilirsiniz.

### Otel İsimleri Değiştirme
`HOTEL_CHAINS` ve `TURKISH_HOTEL_NAMES` dizilerini düzenleyebilirsiniz.

### Adres Formatı
`generateAddress()` fonksiyonunu düzenleyerek adres formatını değiştirebilirsiniz.

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Console çıktılarını kontrol edin
2. Veritabanı bağlantısını kontrol edin
3. Prisma schema'sının güncel olduğundan emin olun
