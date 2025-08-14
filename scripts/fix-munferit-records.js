const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMunferitRecords() {
  try {
    console.log('🔧 Fixing munferit records...\n');
    
    // Company ID 4'teki tüm kayıtları getir
    const records = await prisma.accommodation.findMany({
      where: { companyId: 4 },
      select: {
        id: true,
        adiSoyadi: true,
        isMunferit: true,
        organizationId: true
      }
    });
    
    console.log(`📊 Found ${records.length} records for company 4:\n`);
    
    records.forEach(record => {
      console.log(`   ID: ${record.id}, Ad: ${record.adiSoyadi}, isMunferit: ${record.isMunferit}, organizationId: ${record.organizationId}`);
    });
    
    // organizationId null olan kayıtları isMunferit=true yap
    const recordsToUpdate = records.filter(record => record.organizationId === null);
    
    if (recordsToUpdate.length > 0) {
      console.log(`\n🔧 Updating ${recordsToUpdate.length} records to isMunferit=true...`);
      
      for (const record of recordsToUpdate) {
        await prisma.accommodation.update({
          where: { id: record.id },
          data: { isMunferit: true }
        });
        console.log(`   ✅ Updated record ${record.id}`);
      }
      
      console.log('\n✅ All records updated successfully!');
    } else {
      console.log('\nℹ️ No records need updating.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMunferitRecords();
