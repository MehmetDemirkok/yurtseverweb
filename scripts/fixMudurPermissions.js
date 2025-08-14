const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMudurPermissions() {
  try {
    console.log('MUDUR rolündeki kullanıcıların izinleri güncelleniyor...');
    
    // MUDUR rolündeki tüm kullanıcıları bul
    const mudurUsers = await prisma.user.findMany({
      where: {
        role: 'MUDUR'
      },
      select: {
        id: true,
        email: true,
        name: true,
        permissions: true
      }
    });
    
    console.log(`${mudurUsers.length} MUDUR kullanıcısı bulundu.`);
    
    // Her MUDUR kullanıcısı için gerekli izinleri ekle
    for (const user of mudurUsers) {
      const currentPermissions = user.permissions || [];
      const requiredPermissions = ['user-management', 'logs'];
      let updatedPermissions = [...currentPermissions];
      let hasChanges = false;
      
      requiredPermissions.forEach(permission => {
        if (!currentPermissions.includes(permission)) {
          updatedPermissions.push(permission);
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        await prisma.user.update({
          where: { id: user.id },
          data: { permissions: updatedPermissions }
        });
        
        console.log(`✅ ${user.email} (${user.name}) kullanıcısına izinler eklendi:`, updatedPermissions);
      } else {
        console.log(`ℹ️  ${user.email} (${user.name}) kullanıcısında tüm izinler zaten mevcut.`);
      }
    }
    
    console.log('✅ Tüm MUDUR kullanıcılarının izinleri güncellendi!');
    
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Scripti çalıştır
fixMudurPermissions();
