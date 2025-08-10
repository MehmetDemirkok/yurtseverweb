const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function importHotelsToDB() {
  try {
    console.log('📥 Oteller veritabanına aktarılıyor...');
    
    // Dinamik otel oluşturma fonksiyonları
    const TURKEY_CITIES = [
      'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Mersin', 'Diyarbakır',
      'Samsun', 'Denizli', 'Eskişehir', 'Şanlıurfa', 'Malatya', 'Erzurum', 'Van', 'Batman', 'Elazığ', 'Tokat',
      'Sivas', 'Trabzon', 'Kayseri', 'Kocaeli', 'Manisa', 'Sakarya', 'Balıkesir', 'Kahramanmaraş', 'Aydın', 'Tekirdağ',
      'Muğla', 'Afyonkarahisar', 'Isparta', 'Osmaniye', 'Çorum', 'Ordu', 'Kırıkkale', 'Antakya', 'Aksaray', 'Kırşehir',
      'Nevşehir', 'Niğde', 'Kırklareli', 'Çanakkale', 'Edirne', 'Bolu', 'Zonguldak', 'Karabük', 'Bartın', 'Kastamonu',
      'Sinop', 'Çankırı', 'Yozgat', 'Karaman', 'Hatay', 'Kahramanmaraş', 'Kilis', 'Şanlıurfa', 'Diyarbakır', 'Mardin',
      'Siirt', 'Şırnak', 'Hakkari', 'Bitlis', 'Muş', 'Bingöl', 'Tunceli', 'Elazığ', 'Adıyaman', 'Giresun',
      'Gümüşhane', 'Bayburt', 'Rize', 'Artvin', 'Ardahan', 'Kars', 'Ağrı', 'Iğdır', 'Erzincan', 'Amasya',
      'Düzce', 'Yalova', 'Balıkesir', 'Tekirdağ', 'İstanbul'
    ];

    const HOTEL_CHAINS = ['Hilton', 'Marriott', 'Sheraton', 'Holiday Inn', 'Best Western', 'Radisson', 'Wyndham', 'InterContinental', 'Hyatt', 'Ritz-Carlton'];
    const TURKISH_HOTEL_NAMES = ['Palas', 'Saray', 'Konak', 'Resort', 'Hotel', 'Otel', 'Pansiyon', 'Butik', 'Grand', 'Royal', 'Elite', 'Premium', 'Luxury', 'Comfort', 'Express'];
    const TURKISH_CITY_NAMES = ['Merkez', 'Sahil', 'Tarihi', 'Yeni', 'Eski', 'Modern', 'Klasik', 'Geleneksel', 'Çağdaş', 'Lüks'];

    function generateHotelName(city) {
      const chain = HOTEL_CHAINS[Math.floor(Math.random() * HOTEL_CHAINS.length)];
      const turkishName = TURKISH_HOTEL_NAMES[Math.floor(Math.random() * TURKISH_HOTEL_NAMES.length)];
      const cityName = TURKISH_CITY_NAMES[Math.floor(Math.random() * TURKISH_CITY_NAMES.length)];
      
      const patterns = [
        `${chain} ${city}`,
        `${city} ${turkishName}`,
        `${cityName} ${turkishName} ${city}`,
        `${turkishName} ${city}`,
        `${chain} ${turkishName} ${city}`
      ];
      
      return patterns[Math.floor(Math.random() * patterns.length)];
    }

    // Şehir bazlı otel isimleri oluştur (daha tutarlı)
    function generateCityBasedHotels(city) {
      const hotels = [];
      const baseNames = [
        `${city} Merkez Hotel`,
        `${city} Sahil Resort`,
        `${city} Tarihi Konak`,
        `${city} Modern Otel`,
        `${city} Grand Hotel`,
        `${city} Royal Palace`,
        `${city} Elite Hotel`,
        `${city} Premium Resort`,
        `${city} Comfort Inn`,
        `${city} Express Hotel`,
        `${city} Butik Otel`,
        `${city} Luxury Resort`,
        `${city} Classic Hotel`,
        `${city} Contemporary Inn`,
        `${city} Traditional Konak`
      ];
      
      // Her şehir için sabit sayıda otel oluştur
      const hotelCount = Math.min(15, baseNames.length);
      
      for (let i = 0; i < hotelCount; i++) {
        const baseName = baseNames[i];
        const stars = generateStars();
        
        const hotel = {
          adi: baseName,
          adres: generateAddress(city),
          sehir: city,
          ulke: 'Türkiye',
          telefon: generatePhone(),
          email: generateEmail(baseName),
          website: generateWebsite(baseName),
          yildizSayisi: stars,
          puan: generateRating(stars),
          aciklama: `${city} şehrinde konforlu konaklama imkanı sunan ${baseName}. Modern olanaklar ve kaliteli hizmet anlayışı ile misafirlerimizi ağırlıyoruz.`,
          durum: generateStatus()
        };
        
        hotels.push(hotel);
      }
      
      return hotels;
    }

    function generateAddress(city) {
      const streets = ['Atatürk Caddesi', 'Cumhuriyet Caddesi', 'İstiklal Caddesi', 'Sahil Caddesi', 'Gazi Caddesi', 'Deniz Caddesi', 'Mevlana Caddesi', 'Zeugma Caddesi', 'Marina Caddesi', 'Sur Caddesi'];
      const street = streets[Math.floor(Math.random() * streets.length)];
      const number = Math.floor(Math.random() * 100) + 1;
      const district = ['Beşiktaş', 'Çankaya', 'Konak', 'Nilüfer', 'Kemer', 'Seyhan', 'Selçuklu', 'Şehitkamil', 'Yenişehir', 'Sur'][Math.floor(Math.random() * 10)];
      
      return `${street} No: ${number}, ${district}, ${city}`;
    }

    function generatePhone() {
      const areaCodes = ['212', '312', '232', '224', '242', '322', '332', '342', '324', '412'];
      const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
      const number = Math.floor(Math.random() * 9000000) + 1000000;
      return `+90 ${areaCode} ${number}`;
    }

    function generateEmail(hotelName) {
      const cleanName = hotelName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];
      const domain = domains[Math.floor(Math.random() * domains.length)];
      return `${cleanName}@${domain}`;
    }

    function generateWebsite(hotelName) {
      const cleanName = hotelName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const domains = ['com', 'net', 'org', 'tr'];
      const domain = domains[Math.floor(Math.random() * domains.length)];
      return `www.${cleanName}.${domain}`;
    }

    function generateStars() {
      const weights = [0.1, 0.1, 0.2, 0.3, 0.2, 0.1]; // 0,1,2,3,4,5 yıldız ağırlıkları
      const random = Math.random();
      let cumulative = 0;
      for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (random <= cumulative) return i;
      }
      return 3;
    }

    function generateRating(stars) {
      const baseRating = stars * 1.5;
      const variation = (Math.random() - 0.5) * 2;
      return Math.max(0, Math.min(10, baseRating + variation));
    }

    function generateStatus() {
      const statuses = ['AKTIF', 'PASIF', 'TAMAMEN_DOLU', 'BAKIM'];
      const weights = [0.6, 0.1, 0.1, 0.2];
      const random = Math.random();
      let cumulative = 0;
      for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (random <= cumulative) return statuses[i];
      }
      return 'AKTIF';
    }

    // Dinamik otel oluştur (şehir bazlı sabit isimler)
    const hotels = [];
    const processedCities = new Set();
    
    // Her şehir için sabit otel isimleri oluştur
    for (const city of TURKEY_CITIES) {
      if (processedCities.has(city)) continue;
      processedCities.add(city);
      
      console.log(`📍 ${city} için oteller oluşturuluyor...`);
      
      const cityHotels = generateCityBasedHotels(city);
      hotels.push(...cityHotels);
    }
    
    console.log(`📊 ${hotels.length} otel bulundu.`);
    
    // Mevcut otelleri kontrol et
    const existingHotels = await prisma.hotel.findMany({
      select: { adi: true, sehir: true }
    });
    
    // Mevcut otel isimlerini set'e çevir (hızlı arama için)
    const existingHotelSet = new Set(
      existingHotels.map(hotel => `${hotel.adi.toLowerCase()}-${hotel.sehir.toLowerCase()}`)
    );
    
    // Sadece yeni otelleri filtrele
    const newHotels = hotels.filter(hotel => {
      const hotelKey = `${hotel.adi.toLowerCase()}-${hotel.sehir.toLowerCase()}`;
      return !existingHotelSet.has(hotelKey);
    });
    
    console.log(`📊 ${hotels.length} otel bulundu, ${newHotels.length} tanesi yeni!`);
    
    if (newHotels.length === 0) {
      console.log('✅ Tüm oteller zaten mevcut! Yeni otel eklenmedi.');
      return { count: 0 };
    }
    
    // Sadece yeni otelleri veritabanına kaydet
    const result = await prisma.hotel.createMany({
      data: newHotels,
    });
    
    console.log(`✅ ${result.count} otel başarıyla veritabanına eklendi!`);
    
    // İstatistikler
    const stats = {
      totalHotels: hotels.length,
      createdHotels: result.count,
      skippedHotels: hotels.length - result.count,
      averageStars: hotels.reduce((sum, h) => sum + h.yildizSayisi, 0) / hotels.length,
      averageRating: hotels.reduce((sum, h) => sum + h.puan, 0) / hotels.length,
      statusDistribution: hotels.reduce((acc, h) => {
        acc[h.durum] = (acc[h.durum] || 0) + 1;
        return acc;
      }, {})
    };
    
    console.log('\n📊 İstatistikler:');
    console.log(`- Toplam Otel: ${stats.totalHotels}`);
    console.log(`- Eklenen Otel: ${stats.createdHotels}`);
    console.log(`- Atlanan Otel: ${stats.skippedHotels}`);
    console.log(`- Ortalama Yıldız: ${stats.averageStars.toFixed(1)}`);
    console.log(`- Ortalama Puan: ${stats.averageRating.toFixed(1)}`);
    console.log('- Durum Dağılımı:', stats.statusDistribution);
    
    return result;
    
  } catch (error) {
    console.error('❌ Hata:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Script'i çalıştır
if (require.main === module) {
  importHotelsToDB()
    .then(() => {
      console.log('\n🎉 Oteller başarıyla veritabanına aktarıldı!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Hata:', error);
      process.exit(1);
    });
}

module.exports = { importHotelsToDB };
