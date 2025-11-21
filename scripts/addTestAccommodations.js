require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test verileri için isimler
const names = [
  'Ahmet Yılmaz',
  'Ayşe Demir',
  'Mehmet Kaya',
  'Fatma Şahin',
  'Ali Öztürk',
  'Zeynep Arslan',
  'Mustafa Çelik',
  'Elif Yıldız',
  'Can Aydın',
  'Selin Özdemir'
];

const titles = [
  'Müdür',
  'Genel Müdür',
  'Yönetici',
  'Müdür Yardımcısı',
  'Koordinatör',
  'Uzman',
  'Asistan',
  'Danışman',
  'Temsilci',
  'Sorumlu'
];

const hotels = [
  'Grand Hotel Istanbul',
  'Hilton Istanbul',
  'Marriott Hotel',
  'Swissotel The Bosphorus',
  'Conrad Istanbul',
  'Four Seasons Hotel',
  'Ritz-Carlton',
  'Park Hyatt',
  'Shangri-La',
  'Ciragan Palace'
];

const cities = ['İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bodrum', 'Kapadokya', 'Pamukkale', 'Alanya', 'Marmaris', 'Kuşadası'];
const countries = ['Türkiye', 'Türkiye', 'Türkiye', 'Türkiye', 'Türkiye', 'Türkiye', 'Türkiye', 'Türkiye', 'Türkiye', 'Türkiye'];
const roomTypes = ['Standart', 'Deluxe', 'Suite', 'Junior Suite', 'Executive', 'Presidential', 'Family', 'Double', 'Single', 'Twin'];
const accommodationTypes = ['Otel', 'Otel', 'Otel', 'Otel', 'Otel', 'Otel', 'Otel', 'Otel', 'Otel', 'Otel'];

function getRandomDate(start, days) {
  const date = new Date();
  date.setDate(date.getDate() + start);
  return date.toISOString().split('T')[0];
}

async function addTestAccommodations() {
  try {
    // İlk aktif şirketi bul
    const company = await prisma.company.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { id: 'asc' }
    });

    if (!company) {
      console.error('Aktif şirket bulunamadı!');
      console.log('Lütfen önce bir şirket oluşturun.');
      return;
    }

    console.log(`Şirket bulundu: ${company.name} (ID: ${company.id})`);

    // Mevcut kayıt sayısını kontrol et
    const currentCount = await prisma.accommodation.count({
      where: { companyId: company.id }
    });

    console.log(`Mevcut konaklama kayıt sayısı: ${currentCount}`);

    // 10 test kaydı oluştur
    const accommodations = [];
    const today = new Date();

    for (let i = 0; i < 10; i++) {
      const checkInDays = i * 7; // Her kayıt 7 gün arayla
      const nights = Math.floor(Math.random() * 5) + 1; // 1-5 gece
      const checkInDate = getRandomDate(checkInDays, 0);
      const checkOutDate = getRandomDate(checkInDays + nights, 0);
      const nightlyRate = Math.floor(Math.random() * 200) + 50; // 50-250 TL
      const totalCost = nightlyRate * nights;

      const accommodation = {
        adiSoyadi: names[i],
        unvani: titles[i],
        ulke: countries[i],
        sehir: cities[i],
        girisTarihi: checkInDate,
        cikisTarihi: checkOutDate,
        odaTipi: roomTypes[i],
        konaklamaTipi: accommodationTypes[i],
        gecelikUcret: nightlyRate,
        toplamUcret: totalCost,
        otelAdi: hotels[i],
        numberOfNights: nights,
        companyId: company.id,
        isMunferit: false,
        isTransferred: false
      };

      accommodations.push(accommodation);
    }

    // Toplu ekleme
    const created = await prisma.accommodation.createMany({
      data: accommodations,
      skipDuplicates: true
    });

    console.log(`\n✅ ${created.count} adet test konaklama kaydı başarıyla eklendi!`);
    console.log(`\nŞirket: ${company.name}`);
    console.log(`Toplam kayıt sayısı: ${currentCount + created.count}`);
    console.log(`\nEklenen kayıtlar:`);
    
    const addedRecords = await prisma.accommodation.findMany({
      where: { companyId: company.id },
      orderBy: { id: 'desc' },
      take: 10,
      select: {
        id: true,
        adiSoyadi: true,
        otelAdi: true,
        girisTarihi: true,
        cikisTarihi: true,
        toplamUcret: true
      }
    });

    addedRecords.forEach((record, index) => {
      console.log(`${index + 1}. ${record.adiSoyadi} - ${record.otelAdi} (${record.girisTarihi} - ${record.cikisTarihi}) - ${record.toplamUcret} TL`);
    });

    console.log(`\n💡 Ödeme sistemini test etmek için:`);
    console.log(`   - Şu anda ${currentCount + created.count} konaklama kaydı var`);
    console.log(`   - Limit 10 kayıt, yeni bir kayıt eklemeyi deneyin`);
    console.log(`   - Ödeme modal'ı açılmalı`);

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestAccommodations();

