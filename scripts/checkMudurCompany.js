const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMudurCompany() {
  try {
    console.log('MUDUR kullanıcılarının şirket bilgileri kontrol ediliyor...');
    
    // MUDUR rolündeki tüm kullanıcıları bul
    const mudurUsers = await prisma.user.findMany({
      where: {
        role: 'MUDUR'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log(`${mudurUsers.length} MUDUR kullanıcısı bulundu.`);
    
    // Her MUDUR kullanıcısı için şirket bilgisini kontrol et
    for (const user of mudurUsers) {
      console.log(`\n👤 Kullanıcı: ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   CompanyId: ${user.companyId}`);
      
      if (user.company) {
        console.log(`   Şirket: ${user.company.name} (${user.company.email})`);
      } else {
        console.log(`   ❌ Şirket bilgisi bulunamadı!`);
      }
    }
    
    // Şirketleri listele
    console.log('\n📋 Mevcut şirketler:');
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    
    companies.forEach(company => {
      console.log(`   ${company.id}: ${company.name} (${company.email})`);
    });
    
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Scripti çalıştır
checkMudurCompany();
