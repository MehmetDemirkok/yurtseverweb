const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugAccommodation() {
  try {
    console.log('🔍 Debugging accommodation records...\n');
    
    // Tüm konaklama kayıtlarını getir
    const allAccommodations = await prisma.accommodation.findMany({
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });
    
    console.log(`📊 Total accommodation records: ${allAccommodations.length}\n`);
    
    // Her kaydı detaylı göster
    allAccommodations.forEach((record, index) => {
      console.log(`📝 Record ${index + 1}:`);
      console.log(`   ID: ${record.id}`);
      console.log(`   Ad Soyad: ${record.adiSoyadi}`);
      console.log(`   Company ID: ${record.companyId}`);
      console.log(`   Company Name: ${record.company?.name || 'N/A'}`);
      console.log(`   Organization ID: ${record.organizationId || 'null'}`);
      console.log(`   Organization Name: ${record.organization?.name || 'N/A'}`);
      console.log(`   Created At: ${record.createdAt}`);
      console.log(`   Is Munferit: ${record.isMunferit}`);
      console.log('---');
    });
    
    // Kullanıcıları da kontrol et
    console.log('\n👥 Users:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    users.forEach(user => {
      console.log(`   User ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Company: ${user.company?.name} (ID: ${user.companyId})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAccommodation();
