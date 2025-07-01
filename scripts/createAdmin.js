const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Admin kullanıcı bilgileri
    const adminData = {
      email: 'admin@yurtsever.com',
      name: 'Admin User',
      password: 'admin123', // Bu şifreyi değiştirin!
      role: 'ADMIN',
      permissions: ['dashboard', 'sales', 'statistics'] // Tüm izinler
    };

    // Email kontrolü
    const existingUser = await prisma.user.findUnique({
      where: { email: adminData.email }
    });

    if (existingUser) {
      console.log('Admin kullanıcısı zaten mevcut!');
      return;
    }

    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Admin kullanıcısını oluştur
    const adminUser = await prisma.user.create({
      data: {
        email: adminData.email,
        name: adminData.name,
        password: hashedPassword,
        role: adminData.role,
        permissions: adminData.permissions
      }
    });

    console.log('Admin kullanıcısı başarıyla oluşturuldu!');
    console.log('Email:', adminData.email);
    console.log('Şifre:', adminData.password);
    console.log('Role:', adminData.role);
    console.log('ID:', adminUser.id);

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser(); 