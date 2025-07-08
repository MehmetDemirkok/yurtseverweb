const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Demo verileri temizleme işlemi başlatılıyor...');

  // Demo verilerini tanımlayan özellikler
  const demoOrganizations = [
    'TechCorp', 'Innovate LLC', 'Global Summit', 'TEST ORGANİZASYONU', 
    'Yıllık Konferans', 'Eğitim Semineri', 'Ürün Lansmanı', 'Müşteri Buluşması', 'Teknoloji Zirvesi',
    'Yıllık Toplantı', 'Proje Lansmanı', 'Eğitim Programı'
  ];
  const demoCariKurum = [
    'CARI-TEST1234', 'TEST KURUMU', 'CARI-DEMO1', 'CARI-DEMO2', 'CARI-DEMO3', 'CARI-DEMO4', 'CARI-DEMO5',
    'ABC Holding', 'XYZ Teknoloji', 'Delta Turizm', 'Omega Danışmanlık', 'Sigma İnşaat'
  ];
  const demoHotel = 'TEST OTELİ';

  // 1. Demo organizasyonlarına ait konaklama kayıtlarını temizle
  const deletedAccommodations = await prisma.accommodation.deleteMany({
    where: {
      OR: [
        { organizasyonAdi: { in: demoOrganizations } },
        { kurumCari: { in: demoCariKurum } },
        { otelAdi: demoHotel },
        // CARI- ile başlayan kurumCari değerleri (seedDemoData.js'den gelen)
        { kurumCari: { startsWith: 'CARI-' } }
      ]
    },
  });

  console.log(`${deletedAccommodations.count} adet demo konaklama kaydı silindi.`);

  // 2. Demo organizasyonlarına ait satış kayıtlarını temizle
  const deletedSales = await prisma.sale.deleteMany({
    where: {
      organizasyonAdi: { in: demoOrganizations }
    },
  });

  console.log(`${deletedSales.count} adet demo satış kaydı silindi.`);

  // 3. Demo işlemleri temizle
  const deletedTransactions = await prisma.transaction.deleteMany({
    where: {
      OR: [
        ...demoOrganizations.map(org => ({
          description: { contains: org }
        })),
        ...demoCariKurum.map(cari => ({
          description: { contains: cari }
        })),
        { description: { contains: 'Alış İşlemi' } },
        { description: { contains: 'Satış İşlemi' } }
      ]
    },
  });

  console.log(`${deletedTransactions.count} adet demo işlem kaydı silindi.`);

  console.log('Demo verileri temizleme işlemi tamamlandı.');
}

main()
  .catch((e) => {
    console.error('Hata oluştu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });