const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDemoData() {
  console.log('Demo verileri temizleniyor...');
  
  try {
    // İlişkili verileri önce sil (foreign key constraint'ler nedeniyle)
    console.log('Yolcular siliniyor...');
    await prisma.yolcu.deleteMany();
    
    console.log('Transferler siliniyor...');
    await prisma.transfer.deleteMany();
    
    console.log('Araç bakımları siliniyor...');
    await prisma.aracBakim.deleteMany();
    
    console.log('Şoförler siliniyor...');
    await prisma.sofor.deleteMany();
    
    console.log('Araçlar siliniyor...');
    await prisma.arac.deleteMany();
    
    console.log('Konaklamalar siliniyor...');
    await prisma.accommodation.deleteMany();
    
    console.log('Organizasyonlar siliniyor...');
    await prisma.organization.deleteMany();
    
    console.log('Oteller siliniyor...');
    await prisma.hotel.deleteMany();
    
    console.log('Cariler siliniyor...');
    await prisma.cari.deleteMany();
    
    console.log('Tedarikçiler siliniyor...');
    await prisma.tedarikci.deleteMany();
    
    console.log('Loglar siliniyor...');
    await prisma.log.deleteMany();
    
    console.log('Kullanıcılar siliniyor...');
    await prisma.user.deleteMany();
    
    console.log('Şirketler siliniyor...');
    await prisma.company.deleteMany();
    
    console.log('✅ Tüm demo verileri başarıyla temizlendi!');
    
  } catch (error) {
    console.error('❌ Demo verileri temizlenirken hata oluştu:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearDemoData();
