const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function main() {
  console.log('Aynı cari, kurum ve organizasyon ile 20 demo kayıt ekleniyor...');

  const ortakCari = 'CARI-TEST1234';
  const ortakKurum = 'TEST KURUMU';
  const ortakOrganizasyon = 'TEST ORGANİZASYONU';
  const ortakOtel = 'TEST OTELİ';

  const roomTypes = ['Single Oda', 'Double Oda', 'Triple Oda', 'Suit Oda', 'Executive Oda', 'Deluxe Oda'];
  const accommodationTypes = ['BB', 'HB', 'FB', 'AI', 'UAI'];
  const countries = [
    { country: 'Türkiye', cities: ['İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa'] },
    { country: 'Almanya', cities: ['Berlin', 'Münih', 'Hamburg', 'Frankfurt', 'Köln'] },
    { country: 'İngiltere', cities: ['Londra', 'Manchester', 'Liverpool', 'Birmingham', 'Leeds'] },
    { country: 'Fransa', cities: ['Paris', 'Marsilya', 'Lyon', 'Nice', 'Toulouse'] },
    { country: 'İtalya', cities: ['Roma', 'Milano', 'Venedik', 'Floransa', 'Napoli'] }
  ];
  const titles = [
    'CEO', 'CTO', 'CFO', 'COO', 'Genel Müdür',
    'Satış Müdürü', 'Pazarlama Müdürü', 'İK Müdürü', 'Proje Yöneticisi',
    'Yazılım Mühendisi', 'Sistem Mimarı', 'Veri Analisti', 'Ürün Müdürü', 'Danışman'
  ];

  for (let i = 0; i < 20; i++) {
    const countryInfo = faker.helpers.arrayElement(countries);
    const country = countryInfo.country;
    const city = faker.helpers.arrayElement(countryInfo.cities);
    const startDate = faker.date.recent({ days: 90 });
    const numberOfNights = faker.number.int({ min: 1, max: 14 });
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + numberOfNights);
    const nightlyRate = faker.number.float({ min: 80, max: 500, multipleOf: 0.01 });
    const totalCost = nightlyRate * numberOfNights;
    const title = faker.helpers.arrayElement(titles);

    await prisma.accommodation.create({
      data: {
        adiSoyadi: faker.person.fullName(),
        unvani: title,
        ulke: country,
        sehir: city,
        girisTarihi: startDate.toISOString().split('T')[0],
        cikisTarihi: endDate.toISOString().split('T')[0],
        odaTipi: faker.helpers.arrayElement(roomTypes),
        konaklamaTipi: faker.helpers.arrayElement(accommodationTypes),
        faturaEdildi: false,
        gecelikUcret: nightlyRate,
        toplamUcret: totalCost,
        organizasyonAdi: ortakOrganizasyon,
        otelAdi: ortakOtel,
        kurumCari: ortakKurum,
        numberOfNights: numberOfNights,
      },
    });
  }

  console.log('20 kayıt başarıyla eklendi. Hepsinin cari, kurum ve organizasyon adı aynı!');
}

main()
  .catch((e) => {
    console.error('Hata oluştu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 