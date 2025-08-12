const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createCompanies() {
  console.log('Şirketler oluşturuluyor...');
  
  const companies = [
    {
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
  ];

  const createdCompanies = [];
  for (const companyData of companies) {
    const company = await prisma.company.create({
      data: companyData
    });
    createdCompanies.push(company);
    console.log(`Şirket oluşturuldu: ${company.name}`);
  }

  return createdCompanies;
}

async function createUsers(companies) {
  console.log('Kullanıcılar oluşturuluyor...');
  
  const users = [
    {
      email: 'admin@yurtsever.com',
      name: 'Mehmet Demirkök',
      password: 'admin123',
      role: 'ADMIN',
      companyId: companies[0].id
    },
    {
      email: 'yurtsever@yurtsever.com',
      name: 'Mustafa Yurtsever',
      password: 'manager123',
      role: 'MUDUR',
      companyId: companies[0].id
    }
  ];

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        role: userData.role,
        companyId: userData.companyId
      }
    });
    console.log(`Kullanıcı oluşturuldu: ${user.name} (${user.email})`);
  }
}

async function main() {
  console.log('Seeding started...');

  try {
    // Önce tüm verileri temizle
    console.log('Mevcut veriler temizleniyor...');
    await prisma.log.deleteMany();
    await prisma.yolcu.deleteMany();
    await prisma.transfer.deleteMany();
    await prisma.sofor.deleteMany();
    await prisma.arac.deleteMany();
    await prisma.accommodation.deleteMany();
    await prisma.hotel.deleteMany();
    await prisma.cari.deleteMany();
    await prisma.tedarikci.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
    
    console.log('Veriler temizlendi.');
    
    // Şirketleri oluştur
    const companies = await createCompanies();
    
    // Kullanıcıları oluştur
    await createUsers(companies);

    console.log('Seeding finished successfully.');
    console.log('Oluşturulan kullanıcılar:');
    console.log('1. Mehmet Demirkök (admin@yurtsever.com) - ADMIN');
    console.log('2. Mustafa Yurtsever (yurtsever@yurtsever.com) - MUDUR');
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 