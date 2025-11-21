require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetAccommodationsForTest() {
  try {
    // İlk aktif şirketi bul
    const company = await prisma.company.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { id: 'asc' }
    });

    if (!company) {
      console.error('Aktif şirket bulunamadı!');
      return;
    }

    console.log(`Şirket bulundu: ${company.name} (ID: ${company.id})`);

    // Mevcut kayıt sayısını kontrol et
    const currentCount = await prisma.accommodation.count({
      where: { companyId: company.id }
    });

    console.log(`Mevcut konaklama kayıt sayısı: ${currentCount}`);

    if (currentCount === 0) {
      console.log('Zaten kayıt yok, temizleme gerekmiyor.');
      return;
    }

    // Tüm konaklama kayıtlarını sil
    const deleted = await prisma.accommodation.deleteMany({
      where: { companyId: company.id }
    });

    console.log(`\n✅ ${deleted.count} adet konaklama kaydı silindi!`);
    console.log(`\nŞimdi 10 test kaydı eklemek için: npm run add-test-accommodations`);

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAccommodationsForTest();

