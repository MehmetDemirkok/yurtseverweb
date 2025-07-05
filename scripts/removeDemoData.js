// Demo verileri kaldırmak için script
// Çalıştırmak için: node scripts/removeDemoData.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('Demo verileri kaldırma işlemi başlatılıyor...');
    
    // Tüm konaklama kayıtlarını doğrudan Prisma ile çek
    const records = await prisma.accommodation.findMany();
    
    // Demo kayıtları filtrele
    const demoRecords = records.filter(record => 
      (record.adiSoyadi && record.adiSoyadi.includes('Demo Kullanıcı')) || // demoAccommodation.js'den gelen kayıtlar
      (record.organizasyonAdi && ['TechCorp', 'Innovate LLC'].includes(record.organizasyonAdi)) // seed.js'den gelen kayıtlar
    );
    
    if (demoRecords.length === 0) {
      console.log('Silinecek demo veri bulunamadı.');
      return;
    }
    
    console.log(`${demoRecords.length} adet demo veri bulundu. Siliniyor...`);
    
    // Demo kayıtları sil
    const result = await prisma.accommodation.deleteMany({
      where: {
        id: {
          in: demoRecords.map(record => record.id)
        }
      }
    });
    
    console.log(`${result.count} adet demo veri başarıyla silindi.`);
  } catch (err) {
    console.error('Hata:', err);
  } finally {
    await prisma.$disconnect();
  }
})();