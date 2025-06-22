const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

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