import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Türkiye'nin büyük şehirleri
const TURKEY_CITIES = [
  'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep',
  'Mersin', 'Diyarbakır', 'Samsun', 'Denizli', 'Eskişehir', 'Şanlıurfa', 'Malatya',
  'Erzurum', 'Van', 'Batman', 'Elazığ', 'Tokat', 'Sivas', 'Trabzon', 'Kayseri',
  'Kocaeli', 'Manisa', 'Sakarya', 'Balıkesir', 'Kahramanmaraş', 'Aydın', 'Tekirdağ',
  'Muğla', 'Afyonkarahisar', 'Isparta', 'Osmaniye', 'Çorum', 'Ordu', 'Kırıkkale', 'Antakya',
  'Aksaray', 'Kırşehir', 'Nevşehir', 'Niğde', 'Kırklareli', 'Çanakkale', 'Edirne',
  'Bolu', 'Zonguldak', 'Karabük', 'Bartın', 'Kastamonu', 'Sinop', 'Çankırı',
  'Yozgat', 'Karaman', 'Kilis', 'Mardin', 'Siirt', 'Şırnak', 'Hakkari', 'Bitlis',
  'Muş', 'Bingöl', 'Tunceli', 'Adıyaman', 'Giresun', 'Gümüşhane', 'Bayburt', 'Rize',
  'Artvin', 'Ardahan', 'Kars', 'Ağrı', 'Iğdır', 'Erzincan', 'Amasya', 'Yalova', 'Düzce'
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
  'Han', 'Kervansaray', 'Pansiyon', 'Misafirhane', 'Konukevi'
];

// Rastgele otel adı oluştur
function generateHotelName(city: string): string {
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
function generateAddress(city: string): string {
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
function generatePhone(): string {
  const areaCodes = ['212', '216', '224', '232', '242', '252', '262', '272', '282', '312', '322', '332', '342', '352', '362', '372', '382', '412', '422', '432', '442', '452', '462', '472', '482', '492', '502', '512', '522', '532', '542', '552', '562', '572', '582', '592'];
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  const number = Math.floor(Math.random() * 9000000) + 1000000;
  return `+90 ${areaCode} ${number}`;
}

// Rastgele email oluştur
function generateEmail(hotelName: string): string {
  const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'icloud.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const cleanName = hotelName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `${cleanName}@${domain}`;
}

// Rastgele website oluştur
function generateWebsite(hotelName: string): string {
  const cleanName = hotelName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const domains = ['.com', '.com.tr', '.net', '.org'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `www.${cleanName}${domain}`;
}

// Rastgele yıldız sayısı oluştur
function generateStars(): number {
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
function generateRating(stars: number): number {
  const baseRating = stars * 1.5; // Yıldız sayısına göre temel puan
  const variation = (Math.random() - 0.5) * 2; // -1 ile +1 arası varyasyon
  return Math.max(0, Math.min(10, baseRating + variation));
}

// Rastgele durum oluştur
function generateStatus(): 'AKTIF' | 'PASIF' | 'TAMAMEN_DOLU' | 'BAKIM' {
  const statuses = ['AKTIF', 'AKTIF', 'AKTIF', 'AKTIF', 'AKTIF', 'PASIF', 'TAMAMEN_DOLU', 'BAKIM'] as const;
  return statuses[Math.floor(Math.random() * statuses.length)];
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Türkiye otelleri çekiliyor...');
    
    // Şehir bazlı otel isimleri oluştur (daha tutarlı)
    function generateCityBasedHotels(city: string) {
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
          durum: generateStatus(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        hotels.push(hotel);
      }
      
      return hotels;
    }
    
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
    
    console.log(`✅ Toplam ${hotels.length} otel oluşturuldu!`);
    
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
    
    console.log(`📊 ${hotels.length} otel oluşturuldu, ${newHotels.length} tanesi yeni!`);
    
    if (newHotels.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'Tüm oteller zaten mevcut! Yeni otel eklenmedi.',
        stats: {
          totalHotels: hotels.length,
          createdHotels: 0,
          skippedHotels: hotels.length,
          cities: processedCities.size,
          averageStars: hotels.reduce((sum, h) => sum + h.yildizSayisi, 0) / hotels.length,
          averageRating: hotels.reduce((sum, h) => sum + h.puan, 0) / hotels.length,
          statusDistribution: hotels.reduce((acc, h) => {
            acc[h.durum] = (acc[h.durum] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      });
    }
    
    // Sadece yeni otelleri veritabanına kaydet
    const createdHotels = await prisma.hotel.createMany({
      data: newHotels,
    });
    
    console.log(`💾 ${createdHotels.count} otel veritabanına kaydedildi.`);
    
    // İstatistikler
    const stats = {
      totalHotels: hotels.length,
      createdHotels: createdHotels.count,
      skippedHotels: hotels.length - createdHotels.count,
      cities: processedCities.size,
      averageStars: hotels.reduce((sum, h) => sum + h.yildizSayisi, 0) / hotels.length,
      averageRating: hotels.reduce((sum, h) => sum + h.puan, 0) / hotels.length,
      statusDistribution: hotels.reduce((acc, h) => {
        acc[h.durum] = (acc[h.durum] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
    
    console.log('\n📊 İstatistikler:', stats);
    
    return NextResponse.json({
      success: true,
      count: createdHotels.count,
      message: createdHotels.count > 0 
        ? `${createdHotels.count} yeni otel eklendi! ${hotels.length - createdHotels.count} otel zaten mevcuttu.`
        : 'Tüm oteller zaten mevcut! Yeni otel eklenmedi.',
      stats
    });
    
  } catch (error) {
    console.error('❌ Otel çekme hatası:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Otel çekme işlemi başarısız oldu!',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
