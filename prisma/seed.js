const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function seedAccommodations() {
  const kurumlar = [
    { name: 'Kurum A', organizasyonlar: ['OrgA1', 'OrgA2'] },
    { name: 'Kurum B', organizasyonlar: ['OrgB1', 'OrgB2'] },
    { name: 'Kurum C', organizasyonlar: ['OrgC1', 'OrgC2'] },
  ];
  const odaTipleri = ['Single Oda', 'Double Oda', 'Suite'];
  const konaklamaTipleri = ['BB', 'HB', 'FB', 'UHD'];
  const ulkeler = ['Türkiye', 'Almanya', 'Fransa'];
  const sehirler = ['İstanbul', 'Berlin', 'Paris'];
  const now = new Date();

  let count = 0;
  for (const kurum of kurumlar) {
    for (const org of kurum.organizasyonlar) {
      for (let i = 0; i < 50 / (kurumlar.length * kurum.organizasyonlar.length); i++) {
        const girisTarihi = new Date(now.getFullYear(), now.getMonth(), now.getDate() - Math.floor(Math.random() * 30));
        const cikisTarihi = new Date(girisTarihi);
        cikisTarihi.setDate(girisTarihi.getDate() + 2 + Math.floor(Math.random() * 5));
        const numberOfNights = Math.max(1, Math.round((cikisTarihi - girisTarihi) / (1000 * 60 * 60 * 24)));
        const gecelikUcret = 100 + Math.floor(Math.random() * 200);
        await prisma.accommodation.create({
          data: {
            adiSoyadi: `Demo Kullanıcı ${++count}`,
            unvani: `Unvan ${count}`,
            ulke: ulkeler[Math.floor(Math.random() * ulkeler.length)],
            sehir: sehirler[Math.floor(Math.random() * sehirler.length)],
            girisTarihi: girisTarihi.toISOString().slice(0, 10),
            cikisTarihi: cikisTarihi.toISOString().slice(0, 10),
            odaTipi: odaTipleri[Math.floor(Math.random() * odaTipleri.length)],
            konaklamaTipi: konaklamaTipleri[Math.floor(Math.random() * konaklamaTipleri.length)],
            faturaEdildi: Math.random() > 0.5,
            gecelikUcret,
            toplamUcret: gecelikUcret * numberOfNights,
            organizasyonAdi: org,
            otelAdi: `Otel ${org}`,
            kurumCari: kurum.name,
          }
        });
      }
    }
  }
  console.log('Demo Accommodation kayıtları eklendi!');
}

async function main() {
  console.log('Seeding started...');

  // İki organizasyon adı
  const organizations = ['TechCorp', 'Innovate LLC'];

  for (const org of organizations) {
    for (let i = 0; i < 10; i++) {
      const startDate = faker.date.recent({ days: 30 });
      const numberOfNights = faker.number.int({ min: 2, max: 10 });
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + numberOfNights);
      const nightlyRate = faker.number.float({ min: 80, max: 250, multipleOf: 0.01 });
      const totalCost = nightlyRate * numberOfNights;

      await prisma.accommodation.create({
        data: {
          adiSoyadi: faker.person.fullName(),
          unvani: faker.person.jobTitle(),
          ulke: faker.location.country(),
          sehir: faker.location.city(),
          girisTarihi: startDate.toISOString().split('T')[0], // YYYY-MM-DD formatında
          cikisTarihi: endDate.toISOString().split('T')[0],   // YYYY-MM-DD formatında
          odaTipi: faker.helpers.arrayElement(['Single Oda', 'Double Oda', 'Triple Oda', 'Suit Oda']),
          konaklamaTipi: faker.helpers.arrayElement(['BB', 'HB', 'FB', 'UHD']),
          faturaEdildi: faker.datatype.boolean(),
          gecelikUcret: nightlyRate,
          toplamUcret: totalCost,
          organizasyonAdi: org,
          otelAdi: faker.company.name() + ' Hotel',
          kurumCari: `CARI-${faker.string.alphanumeric(8).toUpperCase()}`,
          numberOfNights: numberOfNights,
        },
      });
    }
  }

  await seedAccommodations();

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 