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
      email: 'yurtsever@yurtsever.com',
      name: 'Yurtsever Admin',
      password: 'yurtsever123',
      role: 'ADMIN',
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


async function createTestOteller(companyId) {
  console.log('Test otelleri oluşturuluyor...');
  
  const otelAdlari = ['Grand Hotel', 'Palace Hotel', 'Resort Hotel', 'Business Hotel', 'Boutique Hotel', 'Luxury Hotel', 'City Hotel', 'Airport Hotel', 'Beach Hotel', 'Mountain Hotel', 'Royal Hotel', 'Premium Hotel', 'Elite Hotel', 'Comfort Hotel', 'Modern Hotel', 'Classic Hotel', 'Elegant Hotel', 'Superior Hotel', 'Deluxe Hotel', 'Exclusive Hotel'];
  const sehirler = ['İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Adana', 'Gaziantep', 'Konya', 'Mersin', 'Diyarbakır', 'Trabzon', 'Eskişehir', 'Kayseri', 'Samsun', 'Denizli', 'Balıkesir', 'Aydın', 'Manisa', 'Tekirdağ', 'Sakarya'];
  const durumlar = ['AKTIF', 'PASIF', 'TAMAMEN_DOLU', 'BAKIM'];
  
  const oteller = [];
  
  for (let i = 1; i <= 20; i++) {
    const otelAdi = otelAdlari[Math.floor(Math.random() * otelAdlari.length)];
    const sehir = sehirler[Math.floor(Math.random() * sehirler.length)];
    const durum = durumlar[Math.floor(Math.random() * durumlar.length)];
    const telefon = `+90 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`;
    
    const otel = await prisma.hotel.create({
      data: {
        adi: otelAdi,
        adres: `${sehir} Merkez, ${Math.floor(Math.random() * 100) + 1}. Sokak No:${Math.floor(Math.random() * 100) + 1}`,
        sehir: sehir,
        ulke: 'Türkiye',
        telefon: telefon,
        email: `${otelAdi.toLowerCase().replace(/\s+/g, '')}@${sehir.toLowerCase()}.com`,
        website: `www.${otelAdi.toLowerCase().replace(/\s+/g, '')}.com`,
        yildizSayisi: Math.floor(Math.random() * 5) + 1,
        puan: Math.random() * 5,
        aciklama: `${sehir} şehrinin en güzel otellerinden biri olan ${otelAdi}`,
        durum: durum,
        companyId: companyId
      }
    });
    
    oteller.push(otel);
    console.log(`Otel oluşturuldu: ${otel.adi} - ${otel.sehir}`);
  }
  
  return oteller;
}


async function createTestOrganizasyonlar(companyId, oteller) {
  console.log('Test organizasyonları oluşturuluyor...');
  
  const organizasyonAdlari = ['Yaz Turu 2024', 'Kış Turu 2024', 'Bahar Turu 2024'];
  const sehirler = ['İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Adana', 'Gaziantep', 'Konya', 'Mersin', 'Diyarbakır'];
  
  const organizasyonlar = [];
  
  for (let i = 1; i <= 3; i++) {
    const organizasyonAdi = organizasyonAdlari[i - 1];
    const sehir = sehirler[Math.floor(Math.random() * sehirler.length)];
    const otelId = oteller.length > 0 ? oteller[Math.floor(Math.random() * oteller.length)].id : null;
    
    // Rastgele tarihler
    const baslangicTarihi = new Date();
    baslangicTarihi.setDate(baslangicTarihi.getDate() + Math.floor(Math.random() * 90) + 30);
    
    const bitisTarihi = new Date(baslangicTarihi);
    bitisTarihi.setDate(bitisTarihi.getDate() + Math.floor(Math.random() * 7) + 3);
    
    const organizasyon = await prisma.organization.create({
      data: {
        name: organizasyonAdi,
        description: `${organizasyonAdi} organizasyonu ${sehir} şehrinde gerçekleşecektir`,
        contactPerson: `Organizasyon Sorumlusu ${i}`,
        contactEmail: `org${i}@yurtsever.com`,
        contactPhone: `+90 5${Math.floor(Math.random() * 9) + 3}${Math.floor(Math.random() * 90000000) + 10000000}`,
        baslangicTarihi: baslangicTarihi,
        bitisTarihi: bitisTarihi,
        lokasyon: `${sehir} Merkez`,
        sehir: sehir,
        ulke: 'Türkiye',
        status: 'ACTIVE',
        companyId: companyId,
        hotelId: otelId
      }
    });
    
    organizasyonlar.push(organizasyon);
    console.log(`Organizasyon oluşturuldu: ${organizasyon.name} - ${organizasyon.sehir}`);
  }
  
  return organizasyonlar;
}


async function createTestMunferitKonaklamalar(companyId) {
  console.log('Test münferit konaklamaları oluşturuluyor...');
  
  const isimler = ['Ahmet', 'Mehmet', 'Ali', 'Veli', 'Hasan', 'Hüseyin', 'Mustafa', 'İbrahim', 'Ömer', 'Yusuf', 'Murat', 'Emre', 'Can', 'Burak', 'Serkan', 'Tolga', 'Erkan', 'Orhan', 'Osman', 'Kemal'];
  const soyisimler = ['Yılmaz', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Yıldırım', 'Özkan', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Erdoğan', 'Koç', 'Kurt', 'Özkan', 'Şen', 'Güneş'];
  const unvanlar = ['Mühendis', 'Doktor', 'Öğretmen', 'Avukat', 'Mimar', 'Diş Hekimi', 'Eczacı', 'Veteriner', 'Hemşire', 'Teknisyen'];
  const sehirler = ['İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Adana', 'Gaziantep', 'Konya', 'Mersin', 'Diyarbakır'];
  const odaTipleri = ['Tek Kişilik', 'Çift Kişilik', 'Üç Kişilik', 'Suit', 'Deluxe', 'Standart'];
  const konaklamaTipleri = ['Yarım Pansiyon', 'Tam Pansiyon', 'Ultra Her Şey Dahil', 'Sadece Kahvaltı', 'Oda Kahvaltı'];
  const otelAdlari = ['Grand Hotel', 'Palace Hotel', 'Resort Hotel', 'Business Hotel', 'Boutique Hotel', 'Luxury Hotel', 'City Hotel', 'Airport Hotel', 'Beach Hotel', 'Mountain Hotel'];
  
  const konaklamalar = [];
  
  for (let i = 1; i <= 20; i++) {
    const ad = isimler[Math.floor(Math.random() * isimler.length)];
    const soyad = soyisimler[Math.floor(Math.random() * soyisimler.length)];
    const unvan = unvanlar[Math.floor(Math.random() * unvanlar.length)];
    const sehir = sehirler[Math.floor(Math.random() * sehirler.length)];
    const odaTipi = odaTipleri[Math.floor(Math.random() * odaTipleri.length)];
    const konaklamaTipi = konaklamaTipleri[Math.floor(Math.random() * konaklamaTipleri.length)];
    const otelAdi = otelAdlari[Math.floor(Math.random() * otelAdlari.length)];
    
    // Rastgele tarihler
    const girisTarihi = new Date();
    girisTarihi.setDate(girisTarihi.getDate() + Math.floor(Math.random() * 30));
    
    const cikisTarihi = new Date(girisTarihi);
    cikisTarihi.setDate(cikisTarihi.getDate() + Math.floor(Math.random() * 7) + 1);
    
    const numberOfNights = Math.ceil((cikisTarihi - girisTarihi) / (1000 * 60 * 60 * 24));
    const gecelikUcret = Math.floor(Math.random() * 500) + 100;
    const toplamUcret = gecelikUcret * numberOfNights;
    
    const konaklama = await prisma.accommodation.create({
      data: {
        adiSoyadi: `${ad} ${soyad}`,
        unvani: unvan,
        ulke: 'Türkiye',
        sehir: sehir,
        girisTarihi: girisTarihi.toISOString().split('T')[0],
        cikisTarihi: cikisTarihi.toISOString().split('T')[0],
        odaTipi: odaTipi,
        konaklamaTipi: konaklamaTipi,
        gecelikUcret: gecelikUcret,
        toplamUcret: toplamUcret,
        otelAdi: otelAdi,
        numberOfNights: numberOfNights,
        isMunferit: true, // Münferit konaklama
        companyId: companyId
      }
    });
    
    konaklamalar.push(konaklama);
    console.log(`Münferit konaklama oluşturuldu: ${konaklama.adiSoyadi} - ${konaklama.otelAdi}`);
  }
  
  return konaklamalar;
}

async function createTestOrganizasyonKonaklamalari(companyId, organizasyonlar) {
  console.log('Test organizasyon konaklamaları oluşturuluyor...');
  
  const isimler = ['Ahmet', 'Mehmet', 'Ali', 'Veli', 'Hasan', 'Hüseyin', 'Mustafa', 'İbrahim', 'Ömer', 'Yusuf', 'Murat', 'Emre', 'Can', 'Burak', 'Serkan', 'Tolga', 'Erkan', 'Orhan', 'Osman', 'Kemal'];
  const soyisimler = ['Yılmaz', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Yıldırım', 'Özkan', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Erdoğan', 'Koç', 'Kurt', 'Özkan', 'Şen', 'Güneş'];
  const unvanlar = ['Mühendis', 'Doktor', 'Öğretmen', 'Avukat', 'Mimar', 'Diş Hekimi', 'Eczacı', 'Veteriner', 'Hemşire', 'Teknisyen'];
  const odaTipleri = ['Tek Kişilik', 'Çift Kişilik', 'Üç Kişilik', 'Suit', 'Deluxe', 'Standart'];
  const konaklamaTipleri = ['Yarım Pansiyon', 'Tam Pansiyon', 'Ultra Her Şey Dahil', 'Sadece Kahvaltı', 'Oda Kahvaltı'];
  const otelAdlari = ['Grand Hotel', 'Palace Hotel', 'Resort Hotel', 'Business Hotel', 'Boutique Hotel', 'Luxury Hotel', 'City Hotel', 'Airport Hotel', 'Beach Hotel', 'Mountain Hotel'];
  
  const konaklamalar = [];
  
  for (let i = 1; i <= 30; i++) {
    const ad = isimler[Math.floor(Math.random() * isimler.length)];
    const soyad = soyisimler[Math.floor(Math.random() * soyisimler.length)];
    const unvan = unvanlar[Math.floor(Math.random() * unvanlar.length)];
    const organizasyon = organizasyonlar[Math.floor(Math.random() * organizasyonlar.length)];
    const odaTipi = odaTipleri[Math.floor(Math.random() * odaTipleri.length)];
    const konaklamaTipi = konaklamaTipleri[Math.floor(Math.random() * konaklamaTipleri.length)];
    const otelAdi = otelAdlari[Math.floor(Math.random() * otelAdlari.length)];
    
    // Organizasyon tarihlerine göre konaklama tarihleri
    const girisTarihi = new Date(organizasyon.baslangicTarihi);
    girisTarihi.setDate(girisTarihi.getDate() + Math.floor(Math.random() * 3));
    
    const cikisTarihi = new Date(girisTarihi);
    cikisTarihi.setDate(cikisTarihi.getDate() + Math.floor(Math.random() * 3) + 1);
    
    const numberOfNights = Math.ceil((cikisTarihi - girisTarihi) / (1000 * 60 * 60 * 24));
    const gecelikUcret = Math.floor(Math.random() * 500) + 100;
    const toplamUcret = gecelikUcret * numberOfNights;
    
    const konaklama = await prisma.accommodation.create({
      data: {
        adiSoyadi: `${ad} ${soyad}`,
        unvani: unvan,
        ulke: 'Türkiye',
        sehir: organizasyon.sehir,
        girisTarihi: girisTarihi.toISOString().split('T')[0],
        cikisTarihi: cikisTarihi.toISOString().split('T')[0],
        odaTipi: odaTipi,
        konaklamaTipi: konaklamaTipi,
        gecelikUcret: gecelikUcret,
        toplamUcret: toplamUcret,
        otelAdi: otelAdi,
        numberOfNights: numberOfNights,
        isMunferit: false, // Organizasyon konaklaması
        organizasyonAdi: organizasyon.name,
        organizationId: organizasyon.id,
        companyId: companyId
      }
    });
    
    konaklamalar.push(konaklama);
    console.log(`Organizasyon konaklaması oluşturuldu: ${konaklama.adiSoyadi} - ${organizasyon.name}`);
  }
  
  return konaklamalar;
}

async function clearAllTestData() {
  console.log('Tüm test verileri temizleniyor...');
  
  try {
    // İlişkili verileri önce sil
    await prisma.accommodationSale.deleteMany();
    await prisma.accommodation.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.hotel.deleteMany();
    await prisma.log.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
    
    console.log('Tüm test verileri başarıyla temizlendi.');
  } catch (error) {
    console.error('Test verileri temizlenirken hata oluştu:', error);
    throw error;
  }
}

async function main() {
  console.log('Seeding started...');

  try {
    // Önce tüm verileri temizle
    console.log('Mevcut veriler temizleniyor...');
    await clearAllTestData();
    
    // Şirketleri oluştur
    const companies = await createCompanies();
    
    // Kullanıcıları oluştur
    await createUsers(companies);

    // Test verilerini oluştur
    const oteller = await createTestOteller(companies[0].id);
    const organizasyonlar = await createTestOrganizasyonlar(companies[0].id, oteller);
    const munferitKonaklamalar = await createTestMunferitKonaklamalar(companies[0].id);
    const organizasyonKonaklamalari = await createTestOrganizasyonKonaklamalari(companies[0].id, organizasyonlar);

    console.log('\n=== SEEDING TAMAMLANDI ===');
    console.log('Oluşturulan kullanıcılar:');
    console.log('1. Yurtsever Admin (yurtsever@yurtsever.com) - ADMIN');
    console.log('\nOluşturulan test verileri:');
    console.log(`- ${oteller.length} adet otel`);
    console.log(`- ${organizasyonlar.length} adet organizasyon`);
    console.log(`- ${munferitKonaklamalar.length} adet münferit konaklama`);
    console.log(`- ${organizasyonKonaklamalari.length} adet organizasyon konaklaması`);
    console.log('\nTest verilerini temizlemek için: npm run seed:clear');
    
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
}

// Test verilerini temizleme fonksiyonu
async function clearTestData() {
  console.log('Test verileri temizleniyor...');
  await clearAllTestData();
  console.log('Test verileri başarıyla temizlendi.');
}

// Komut satırı argümanlarını kontrol et
const args = process.argv.slice(2);
if (args.includes('--clear')) {
  clearTestData()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} else {
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
} 