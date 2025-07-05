const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function main() {
  console.log('Demo veri ekleme başladı...');

  // Üç farklı organizasyon adı
  const organizations = ['TechCorp', 'Innovate LLC', 'Global Summit'];
  
  // Otel isimleri listesi
  const hotelNames = [
    'Grand Hotel', 'Hilton', 'Marriott', 'Sheraton', 'Radisson Blu',
    'Four Seasons', 'Ritz-Carlton', 'InterContinental', 'Hyatt Regency', 'Swissotel'
  ];

  // Oda tipleri
  const roomTypes = ['Single Oda', 'Double Oda', 'Triple Oda', 'Suit Oda', 'Executive Oda', 'Deluxe Oda'];
  
  // Konaklama tipleri
  const accommodationTypes = ['BB', 'HB', 'FB', 'AI', 'UAI'];
  
  // Ülkeler ve şehirler
  const countries = [
    { country: 'Türkiye', cities: ['İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa'] },
    { country: 'Almanya', cities: ['Berlin', 'Münih', 'Hamburg', 'Frankfurt', 'Köln'] },
    { country: 'İngiltere', cities: ['Londra', 'Manchester', 'Liverpool', 'Birmingham', 'Leeds'] },
    { country: 'Fransa', cities: ['Paris', 'Marsilya', 'Lyon', 'Nice', 'Toulouse'] },
    { country: 'İtalya', cities: ['Roma', 'Milano', 'Venedik', 'Floransa', 'Napoli'] }
  ];

  // Unvanlar
  const titles = [
    'CEO', 'CTO', 'CFO', 'COO', 'Genel Müdür',
    'Satış Müdürü', 'Pazarlama Müdürü', 'İK Müdürü', 'Proje Yöneticisi',
    'Yazılım Mühendisi', 'Sistem Mimarı', 'Veri Analisti', 'Ürün Müdürü', 'Danışman'
  ];

  // Her organizasyon için 20 kayıt oluştur (toplam 60 kayıt)
  for (const org of organizations) {
    console.log(`${org} için veri ekleniyor...`);
    
    for (let i = 0; i < 20; i++) {
      // Rastgele bir ülke ve şehir seç
      const countryInfo = faker.helpers.arrayElement(countries);
      const country = countryInfo.country;
      const city = faker.helpers.arrayElement(countryInfo.cities);
      
      // Rastgele tarihler oluştur (son 90 gün içinde)
      const startDate = faker.date.recent({ days: 90 });
      const numberOfNights = faker.number.int({ min: 1, max: 14 });
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + numberOfNights);
      
      // Gecelik ücret ve toplam ücret hesapla
      const nightlyRate = faker.number.float({ min: 80, max: 500, multipleOf: 0.01 });
      const totalCost = nightlyRate * numberOfNights;

      // Rastgele bir otel adı seç
      const hotelName = faker.helpers.arrayElement(hotelNames);
      
      // Rastgele bir unvan seç
      const title = faker.helpers.arrayElement(titles);
      
      // Konaklama kaydı oluştur
      await prisma.accommodation.create({
        data: {
          adiSoyadi: faker.person.fullName(),
          unvani: title,
          ulke: country,
          sehir: city,
          girisTarihi: startDate.toISOString().split('T')[0], // YYYY-MM-DD formatında
          cikisTarihi: endDate.toISOString().split('T')[0],   // YYYY-MM-DD formatında
          odaTipi: faker.helpers.arrayElement(roomTypes),
          konaklamaTipi: faker.helpers.arrayElement(accommodationTypes),
          faturaEdildi: faker.datatype.boolean(),
          gecelikUcret: nightlyRate,
          toplamUcret: totalCost,
          organizasyonAdi: org,
          otelAdi: hotelName,
          kurumCari: `CARI-${faker.string.alphanumeric(8).toUpperCase()}`,
          numberOfNights: numberOfNights,
        },
      });
    }
  }

  console.log('Demo veri ekleme tamamlandı. Toplam 60 kayıt eklendi.');
}

main()
  .catch((e) => {
    console.error('Hata oluştu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });