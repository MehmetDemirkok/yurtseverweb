const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Türkiye'nin büyük şehirleri
const TURKEY_CITIES = [
  'Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep',
  'Mersin', 'Diyarbakir', 'Samsun', 'Denizli', 'Eskisehir', 'Urfa', 'Malatya',
  'Erzurum', 'Van', 'Batman', 'Elazig', 'Tokat', 'Sivas', 'Trabzon', 'Kayseri',
  'Kocaeli', 'Manisa', 'Sakarya', 'Balikesir', 'Kahramanmaras', 'Aydin', 'Tekirdag',
  'Muğla', 'Afyon', 'Isparta', 'Osmaniye', 'Çorum', 'Ordu', 'Kırıkkale', 'Antakya',
  'Aksaray', 'Kırşehir', 'Nevşehir', 'Niğde', 'Kırklareli', 'Çanakkale', 'Edirne',
  'Bolu', 'Zonguldak', 'Karabük', 'Bartın', 'Kastamonu', 'Sinop', 'Çankırı',
  'Yozgat', 'Kırıkkale', 'Kırşehir', 'Nevşehir', 'Niğde', 'Aksaray', 'Konya',
  'Karaman', 'Mersin', 'Adana', 'Osmaniye', 'Hatay', 'Kahramanmaraş', 'Gaziantep',
  'Kilis', 'Şanlıurfa', 'Diyarbakır', 'Mardin', 'Batman', 'Siirt', 'Şırnak',
  'Hakkari', 'Van', 'Bitlis', 'Muş', 'Bingöl', 'Tunceli', 'Elazığ', 'Malatya',
  'Adıyaman', 'Giresun', 'Gümüşhane', 'Bayburt', 'Trabzon', 'Rize', 'Artvin',
  'Ardahan', 'Kars', 'Ağrı', 'Iğdır', 'Erzurum', 'Erzincan', 'Sivas', 'Yozgat',
  'Tokat', 'Amasya', 'Samsun', 'Ordu', 'Giresun', 'Trabzon', 'Rize', 'Artvin',
  'Erzurum', 'Kars', 'Ağrı', 'Iğdır', 'Van', 'Hakkari', 'Şırnak', 'Siirt',
  'Batman', 'Mardin', 'Diyarbakır', 'Şanlıurfa', 'Kilis', 'Gaziantep', 'Adıyaman',
  'Kahramanmaraş', 'Osmaniye', 'Hatay', 'Adana', 'Mersin', 'Karaman', 'Konya',
  'Niğde', 'Nevşehir', 'Kırşehir', 'Aksaray', 'Kırıkkale', 'Çankırı', 'Karabük',
  'Zonguldak', 'Bolu', 'Düzce', 'Sakarya', 'Kocaeli', 'Yalova', 'Bursa', 'Balıkesir',
  'Çanakkale', 'Tekirdağ', 'Edirne', 'Kırklareli', 'İstanbul', 'Kocaeli', 'Sakarya',
  'Düzce', 'Zonguldak', 'Bolu', 'Karabük', 'Çankırı', 'Kırıkkale', 'Aksaray',
  'Kırşehir', 'Nevşehir', 'Niğde', 'Konya', 'Karaman', 'Mersin', 'Adana', 'Osmaniye',
  'Hatay', 'Kahramanmaraş', 'Gaziantep', 'Kilis', 'Şanlıurfa', 'Diyarbakır',
  'Mardin', 'Batman', 'Siirt', 'Şırnak', 'Hakkari', 'Van', 'Bitlis', 'Muş',
  'Bingöl', 'Tunceli', 'Elazığ', 'Malatya', 'Adıyaman', 'Giresun', 'Gümüşhane',
  'Bayburt', 'Trabzon', 'Rize', 'Artvin', 'Ardahan', 'Kars', 'Ağrı', 'Iğdır',
  'Erzurum', 'Erzincan', 'Sivas', 'Yozgat', 'Tokat', 'Amasya', 'Samsun', 'Ordu',
  'Giresun', 'Trabzon', 'Rize', 'Artvin', 'Erzurum', 'Kars', 'Ağrı', 'Iğdır',
  'Van', 'Hakkari', 'Şırnak', 'Siirt', 'Batman', 'Mardin', 'Diyarbakır', 'Şanlıurfa',
  'Kilis', 'Gaziantep', 'Adıyaman', 'Kahramanmaraş', 'Osmaniye', 'Hatay', 'Adana',
  'Mersin', 'Karaman', 'Konya', 'Niğde', 'Nevşehir', 'Kırşehir', 'Aksaray',
  'Kırıkkale', 'Çankırı', 'Karabük', 'Zonguldak', 'Bolu', 'Düzce', 'Sakarya',
  'Kocaeli', 'Yalova', 'Bursa', 'Balıkesir', 'Çanakkale', 'Tekirdağ', 'Edirne',
  'Kırklareli', 'İstanbul'
];

// Otel zincirleri ve popüler otel isimleri
const HOTEL_CHAINS = [
  'Hilton', 'Marriott', 'Sheraton', 'Holiday Inn', 'Best Western', 'Radisson',
  'Crowne Plaza', 'InterContinental', 'Ritz-Carlton', 'Four Seasons', 'Hyatt',
  'Wyndham', 'Accor', 'Mercure', 'Novotel', 'Ibis', 'Sofitel', 'Pullman',
  'Grand Hotel', 'Palace Hotel', 'Royal Hotel', 'Imperial Hotel', 'Central Hotel',
  'Park Hotel', 'Garden Hotel', 'Seaside Hotel', 'Mountain Hotel', 'City Hotel',
  'Business Hotel', 'Resort Hotel', 'Spa Hotel', 'Wellness Hotel', 'Boutique Hotel',
  'Heritage Hotel', 'Historic Hotel', 'Modern Hotel', 'Luxury Hotel', 'Premium Hotel',
  'Standard Hotel', 'Economy Hotel', 'Budget Hotel', 'Hostel', 'Guesthouse',
  'Pension', 'Motel', 'Inn', 'Lodge', 'Villa', 'Apartment', 'Suite', 'Studio'
];

// Türkçe otel isimleri
const TURKISH_HOTEL_NAMES = [
  'Otel', 'Palas', 'Saray', 'Konak', 'Köşk', 'Yalı', 'Kasır', 'Villa', 'Ev',
  'Han', 'Kervansaray', 'Pansiyon', 'Misafirhane', 'Konukevi', 'Otelci',
  'Otelci', 'Otelci', 'Otelci', 'Otelci', 'Otelci', 'Otelci', 'Otelci'
];

// Şehir isimleri (Türkçe)
const TURKISH_CITY_NAMES = {
  'Istanbul': 'İstanbul',
  'Ankara': 'Ankara',
  'Izmir': 'İzmir',
  'Bursa': 'Bursa',
  'Antalya': 'Antalya',
  'Adana': 'Adana',
  'Konya': 'Konya',
  'Gaziantep': 'Gaziantep',
  'Mersin': 'Mersin',
  'Diyarbakir': 'Diyarbakır',
  'Samsun': 'Samsun',
  'Denizli': 'Denizli',
  'Eskisehir': 'Eskişehir',
  'Urfa': 'Şanlıurfa',
  'Malatya': 'Malatya',
  'Erzurum': 'Erzurum',
  'Van': 'Van',
  'Batman': 'Batman',
  'Elazig': 'Elazığ',
  'Tokat': 'Tokat',
  'Sivas': 'Sivas',
  'Trabzon': 'Trabzon',
  'Kayseri': 'Kayseri',
  'Kocaeli': 'Kocaeli',
  'Manisa': 'Manisa',
  'Sakarya': 'Sakarya',
  'Balikesir': 'Balıkesir',
  'Kahramanmaras': 'Kahramanmaraş',
  'Aydin': 'Aydın',
  'Tekirdag': 'Tekirdağ',
  'Mugla': 'Muğla',
  'Afyon': 'Afyonkarahisar',
  'Isparta': 'Isparta',
  'Osmaniye': 'Osmaniye',
  'Corum': 'Çorum',
  'Ordu': 'Ordu',
  'Kirikkale': 'Kırıkkale',
  'Antakya': 'Antakya',
  'Aksaray': 'Aksaray',
  'Kirsehir': 'Kırşehir',
  'Nevsehir': 'Nevşehir',
  'Nigde': 'Niğde',
  'Kirklareli': 'Kırklareli',
  'Canakkale': 'Çanakkale',
  'Edirne': 'Edirne',
  'Bolu': 'Bolu',
  'Zonguldak': 'Zonguldak',
  'Karabuk': 'Karabük',
  'Bartin': 'Bartın',
  'Kastamonu': 'Kastamonu',
  'Sinop': 'Sinop',
  'Cankiri': 'Çankırı',
  'Yozgat': 'Yozgat',
  'Karaman': 'Karaman',
  'Kilis': 'Kilis',
  'Sanliurfa': 'Şanlıurfa',
  'Mardin': 'Mardin',
  'Siirt': 'Siirt',
  'Sirnak': 'Şırnak',
  'Hakkari': 'Hakkari',
  'Bitlis': 'Bitlis',
  'Mus': 'Muş',
  'Bingol': 'Bingöl',
  'Tunceli': 'Tunceli',
  'Elazig': 'Elazığ',
  'Adiyaman': 'Adıyaman',
  'Giresun': 'Giresun',
  'Gumushane': 'Gümüşhane',
  'Bayburt': 'Bayburt',
  'Rize': 'Rize',
  'Artvin': 'Artvin',
  'Ardahan': 'Ardahan',
  'Kars': 'Kars',
  'Agri': 'Ağrı',
  'Igdir': 'Iğdır',
  'Erzincan': 'Erzincan',
  'Amasya': 'Amasya',
  'Yalova': 'Yalova',
  'Duzce': 'Düzce'
};

// Rastgele otel adı oluştur
function generateHotelName(city) {
  const chain = HOTEL_CHAINS[Math.floor(Math.random() * HOTEL_CHAINS.length)];
  const turkishName = TURKISH_HOTEL_NAMES[Math.floor(Math.random() * TURKISH_HOTEL_NAMES.length)];
  
  const patterns = [
    `${chain} ${city}`,
    `${city} ${chain}`,
    `${turkishName} ${city}`,
    `${city} ${turkishName}`,
    `${chain} ${city} Hotel`,
    `${city} ${turkishName} Hotel`,
    `${chain} ${city} Resort`,
    `${city} ${turkishName} Resort`,
    `${chain} ${city} Palace`,
    `${city} ${turkishName} Palace`
  ];
  
  return patterns[Math.floor(Math.random() * patterns.length)];
}

// Rastgele adres oluştur
function generateAddress(city) {
  const districts = [
    'Merkez', 'Çankaya', 'Keçiören', 'Mamak', 'Yenimahalle', 'Etimesgut', 'Sincan',
    'Altındağ', 'Pursaklar', 'Gölbaşı', 'Polatlı', 'Beypazarı', 'Nallıhan',
    'Kızılcahamam', 'Çamlıdere', 'Ayaş', 'Güdül', 'Haymana', 'Kalecik', 'Kazan',
    'Şereflikoçhisar', 'Bala', 'Elmadağ', 'Evren', 'Sultanbeyli', 'Kadıköy',
    'Beşiktaş', 'Şişli', 'Beyoğlu', 'Fatih', 'Üsküdar', 'Maltepe', 'Kartal',
    'Pendik', 'Tuzla', 'Çekmeköy', 'Sancaktepe', 'Sarıyer', 'Beykoz', 'Ümraniye',
    'Ataşehir', 'Başakşehir', 'Esenyurt', 'Büyükçekmece', 'Çatalca', 'Silivri',
    'Avcılar', 'Küçükçekmece', 'Bakırköy', 'Zeytinburnu', 'Bayrampaşa', 'Esenler',
    'Bağcılar', 'Güngören', 'Sultangazi', 'Gaziosmanpaşa', 'Kağıthane', 'Eyüp'
  ];
  
  const streets = [
    'Atatürk Caddesi', 'İstiklal Caddesi', 'Cumhuriyet Caddesi', 'Barış Caddesi',
    'Gazi Caddesi', 'Fatih Caddesi', 'Yeni Caddesi', 'Ana Caddesi', 'Merkez Caddesi',
    'Sahil Caddesi', 'Deniz Caddesi', 'Orman Caddesi', 'Park Caddesi', 'Bahçe Caddesi',
    'Çiçek Caddesi', 'Gül Caddesi', 'Lale Caddesi', 'Menekşe Caddesi', 'Papatya Caddesi',
    'Zambak Caddesi', 'Karanfil Caddesi', 'Orkide Caddesi', 'Sümbül Caddesi',
    'Nergis Caddesi', 'Şebboy Caddesi', 'Kardelen Caddesi', 'Çuha Caddesi',
    'Süsen Caddesi', 'Sümbül Caddesi', 'Nergis Caddesi', 'Şebboy Caddesi'
  ];
  
  const district = districts[Math.floor(Math.random() * districts.length)];
  const street = streets[Math.floor(Math.random() * streets.length)];
  const number = Math.floor(Math.random() * 200) + 1;
  
  return `${street} No: ${number}, ${district}, ${city}`;
}

// Rastgele telefon numarası oluştur
function generatePhone() {
  const areaCodes = ['212', '216', '224', '232', '242', '252', '262', '272', '282', '312', '322', '332', '342', '352', '362', '372', '382', '412', '422', '432', '442', '452', '462', '472', '482', '492', '502', '512', '522', '532', '542', '552', '562', '572', '582', '592'];
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  const number = Math.floor(Math.random() * 9000000) + 1000000;
  return `+90 ${areaCode} ${number}`;
}

// Rastgele email oluştur
function generateEmail(hotelName) {
  const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'icloud.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const cleanName = hotelName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `${cleanName}@${domain}`;
}

// Rastgele website oluştur
function generateWebsite(hotelName) {
  const cleanName = hotelName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const domains = ['.com', '.com.tr', '.net', '.org'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `www.${cleanName}${domain}`;
}

// Rastgele yıldız sayısı oluştur
function generateStars() {
  const weights = [0.1, 0.1, 0.2, 0.3, 0.2, 0.1]; // 0-5 yıldız ağırlıkları
  const random = Math.random();
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) {
      return i;
    }
  }
  return 3; // Varsayılan 3 yıldız
}

// Rastgele puan oluştur
function generateRating(stars) {
  const baseRating = stars * 1.5; // Yıldız sayısına göre temel puan
  const variation = (Math.random() - 0.5) * 2; // -1 ile +1 arası varyasyon
  return Math.max(0, Math.min(10, baseRating + variation));
}

// Rastgele durum oluştur
function generateStatus() {
  const statuses = ['AKTIF', 'AKTIF', 'AKTIF', 'AKTIF', 'AKTIF', 'PASIF', 'TAMAMEN_DOLU', 'BAKIM'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

// Ana fonksiyon
async function fetchTurkeyHotels() {
  console.log('🚀 Türkiye otelleri çekiliyor...');
  
  const hotels = [];
  const processedCities = new Set();
  
  // Her şehir için 5-15 otel oluştur
  for (const city of TURKEY_CITIES) {
    if (processedCities.has(city)) continue;
    processedCities.add(city);
    
    const turkishCityName = TURKISH_CITY_NAMES[city] || city;
    const hotelCount = Math.floor(Math.random() * 11) + 5; // 5-15 otel
    
    console.log(`📍 ${turkishCityName} için ${hotelCount} otel oluşturuluyor...`);
    
    for (let i = 0; i < hotelCount; i++) {
      const hotelName = generateHotelName(turkishCityName);
      const stars = generateStars();
      
      const hotel = {
        adi: hotelName,
        adres: generateAddress(turkishCityName),
        sehir: turkishCityName,
        ulke: 'Türkiye',
        telefon: generatePhone(),
        email: generateEmail(hotelName),
        website: generateWebsite(hotelName),
        yildizSayisi: stars,
        puan: generateRating(stars),
        aciklama: `${turkishCityName} şehrinde konforlu konaklama imkanı sunan ${hotelName}. Modern olanaklar ve kaliteli hizmet anlayışı ile misafirlerimizi ağırlıyoruz.`,
        durum: generateStatus(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      hotels.push(hotel);
    }
  }
  
  console.log(`✅ Toplam ${hotels.length} otel oluşturuldu!`);
  
  // JSON dosyasına kaydet
  const outputPath = path.join(__dirname, 'turkey_hotels.json');
  await fs.writeFile(outputPath, JSON.stringify(hotels, null, 2), 'utf8');
  
  console.log(`💾 Oteller ${outputPath} dosyasına kaydedildi.`);
  
  // İstatistikler
  const stats = {
    totalHotels: hotels.length,
    cities: processedCities.size,
    averageStars: hotels.reduce((sum, h) => sum + h.yildizSayisi, 0) / hotels.length,
    averageRating: hotels.reduce((sum, h) => sum + h.puan, 0) / hotels.length,
    statusDistribution: hotels.reduce((acc, h) => {
      acc[h.durum] = (acc[h.durum] || 0) + 1;
      return acc;
    }, {})
  };
  
  console.log('\n📊 İstatistikler:');
  console.log(`- Toplam Otel: ${stats.totalHotels}`);
  console.log(`- Şehir Sayısı: ${stats.cities}`);
  console.log(`- Ortalama Yıldız: ${stats.averageStars.toFixed(1)}`);
  console.log(`- Ortalama Puan: ${stats.averageRating.toFixed(1)}`);
  console.log('- Durum Dağılımı:', stats.statusDistribution);
  
  return hotels;
}

// Script'i çalıştır
if (require.main === module) {
  fetchTurkeyHotels()
    .then(() => {
      console.log('\n🎉 Otel verileri başarıyla oluşturuldu!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Hata:', error);
      process.exit(1);
    });
}

module.exports = { fetchTurkeyHotels };
