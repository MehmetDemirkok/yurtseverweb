require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Önce şirket oluştur (eğer yoksa)
    let company = await prisma.company.findFirst({
      where: { email: 'info@yurtsever.com' }
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'Yurtsever Turizm A.Ş.',
          email: 'info@yurtsever.com',
          phone: '+90 212 555 0123',
          address: 'İstanbul, Türkiye',
          city: 'İstanbul',
          country: 'Türkiye',
          taxNumber: '1234567890',
          taxOffice: 'İstanbul Vergi Dairesi',
          status: 'ACTIVE'
        }
      });
      console.log('Şirket oluşturuldu:', company.name);
    }

    // Admin kullanıcı bilgileri
    const adminData = {
      email: 'mehmet@yurtsever.com',
      name: 'Mehmet Admin',
      password: 'mehmet123',
      role: 'ADMIN',
      permissions: ['dashboard', 'sales', 'statistics', 'admin', 'users', 'companies', 'logs'],
      companyId: company.id
    };

    // Email kontrolü
    const existingUser = await prisma.user.findUnique({
      where: { email: adminData.email }
    });

    if (existingUser) {
      console.log('Admin kullanıcısı zaten mevcut!');
      console.log('Email:', existingUser.email);
      console.log('Role:', existingUser.role);
      console.log('ID:', existingUser.id);
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
        permissions: adminData.permissions,
        companyId: adminData.companyId
      }
    });

    console.log('Admin kullanıcısı başarıyla oluşturuldu!');
    console.log('Email:', adminData.email);
    console.log('Şifre:', adminData.password);
    console.log('Role:', adminData.role);
    console.log('ID:', adminUser.id);
    console.log('Şirket:', company.name);

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser(); 