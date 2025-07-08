const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function main() {
  console.log('Özel demo veri oluşturma başladı...');

  // 5 farklı kurum
  const kurumlar = [
    'ABC Holding',
    'XYZ Teknoloji',
    'Delta Turizm',
    'Omega Danışmanlık',
    'Sigma İnşaat'
  ];

  // 3 farklı organizasyon
  const organizasyonlar = [
    'Yıllık Toplantı',
    'Proje Lansmanı',
    'Eğitim Programı'
  ];

  // Otel listesi
  const oteller = [
    'Hilton Hotel',
    'Sheraton Resort',
    'Marriott Plaza',
    'Radisson Blue',
    'Swissotel'
  ];

  // Her kurum ve organizasyon kombinasyonu için konaklama kayıtları oluştur
  // Toplamda 5 kurum x 3 organizasyon = 15 kombinasyon
  // Her kombinasyon için yaklaşık 3-4 kayıt oluşturarak toplamda 50 kayıt elde edeceğiz
  let toplamKayit = 0;

  for (const kurum of kurumlar) {
    for (const organizasyon of organizasyonlar) {
      // Her kurum-organizasyon kombinasyonu için 3-4 kayıt oluştur
      const kayitSayisi = 4; // Sabit 4 kayıt oluştur
      
      for (let i = 0; i < kayitSayisi; i++) {
        const startDate = faker.date.recent({ days: 60 });
        const numberOfNights = faker.number.int({ min: 2, max: 10 });
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + numberOfNights);
        const nightlyRate = faker.number.float({ min: 100, max: 500, multipleOf: 0.01 });
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
            organizasyonAdi: organizasyon,
            otelAdi: faker.helpers.arrayElement(oteller),
            kurumCari: kurum,
            numberOfNights: numberOfNights,
          },
        });
        
        toplamKayit++;
      }
    }
  }

  console.log('Özel demo veri oluşturma tamamlandı.');
  console.log(`Toplam ${toplamKayit} konaklama kaydı oluşturuldu.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });