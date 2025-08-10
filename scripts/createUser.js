const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUser() {
  try {
    // Önce mevcut bir company bul
    const existingCompany = await prisma.company.findFirst();
    
    if (!existingCompany) {
      console.log('❌ Hiç company bulunamadı! Önce bir company oluşturun.');
      return;
    }

    console.log('✅ Company bulundu:', existingCompany.name);

    // Kullanıcı bilgileri
    const userData = {
      email: 'yurtsever@yurtsever.com',
      name: 'Yurtsever Kullanıcı',
      password: 'yurtsever123',
      role: 'KULLANICI',
      permissions: ['home', 'accommodation'], // Temel izinler
      companyId: existingCompany.id
    };

    // Email kontrolü
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      console.log('❌ Bu email adresi zaten kullanılıyor!');
      console.log('Email:', existingUser.email);
      console.log('ID:', existingUser.id);
      return;
    }

    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Kullanıcıyı oluştur
    const newUser = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        role: userData.role,
        permissions: userData.permissions,
        companyId: userData.companyId
      }
    });

    console.log('✅ Kullanıcı başarıyla oluşturuldu!');
    console.log('📧 Email:', userData.email);
    console.log('🔑 Şifre:', userData.password);
    console.log('👤 Ad:', userData.name);
    console.log('🎭 Rol:', userData.role);
    console.log('🆔 ID:', newUser.id);
    console.log('🏢 Company:', existingCompany.name);
    console.log('📋 İzinler:', userData.permissions.join(', '));

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
