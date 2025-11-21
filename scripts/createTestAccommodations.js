const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestAccommodations() {
  console.log('Konaklama alış test verileri oluşturuluyor...');

  try {
    // İlk şirketi bul
    const company = await prisma.company.findFirst({
      where: { status: 'ACTIVE' }
    });

    if (!company) {
      console.error('Aktif bir şirket bulunamadı! Lütfen önce bir şirket oluşturun.');
      process.exit(1);
    }

    console.log(`Şirket bulundu: ${company.name} (ID: ${company.id})`);

    const isimler = [
      'Ahmet', 'Mehmet', 'Ali', 'Veli', 'Hasan', 'Hüseyin', 'Mustafa', 'İbrahim', 
      'Ömer', 'Yusuf', 'Murat', 'Emre', 'Can', 'Burak', 'Serkan', 'Tolga', 
      'Erkan', 'Orhan', 'Osman', 'Kemal', 'Fatih', 'Burak', 'Deniz', 'Cem', 'Eren'
    ];
    
    const soyisimler = [
      'Yılmaz', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Yıldırım', 'Özkan', 'Aydın', 
      'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Erdoğan', 'Koç', 
      'Kurt', 'Şen', 'Güneş', 'Kaya', 'Öztürk', 'Aydın', 'Çakır', 'Yıldız', 'Şahin'
    ];
    
    const unvanlar = [
      'Mühendis', 'Doktor', 'Öğretmen', 'Avukat', 'Mimar', 'Diş Hekimi', 
      'Eczacı', 'Veteriner', 'Hemşire', 'Teknisyen', 'Müdür', 'Müdür Yardımcısı',
      'Uzman', 'Asistan', 'Koordinatör'
    ];
    
    const otelAdlari = [
      'Grand Hotel İstanbul', 'Palace Hotel Ankara', 'Resort Hotel Antalya', 
      'Business Hotel İzmir', 'Boutique Hotel Bursa', 'Luxury Hotel Bodrum',
      'City Hotel Trabzon', 'Airport Hotel İstanbul', 'Beach Hotel Antalya', 
      'Mountain Hotel Uludağ', 'Royal Hotel Cappadocia', 'Premium Hotel Marmaris',
      'Elite Hotel Kuşadası', 'Comfort Hotel Çeşme', 'Modern Hotel Alanya',
      'Classic Hotel Side', 'Elegant Hotel Kalkan', 'Superior Hotel Kaş',
      'Deluxe Hotel Fethiye', 'Exclusive Hotel Datça'
    ];
    
    const odaTipleri = ['Single Oda', 'Double Oda', 'Twin Oda', 'Suite'];
    const konaklamaTipleri = ['BB', 'HB', 'FB', 'UHD'];

    const accommodations = [];

    for (let i = 1; i <= 20; i++) {
      const ad = isimler[Math.floor(Math.random() * isimler.length)];
      const soyad = soyisimler[Math.floor(Math.random() * soyisimler.length)];
      const unvan = unvanlar[Math.floor(Math.random() * unvanlar.length)];
      const otelAdi = otelAdlari[Math.floor(Math.random() * otelAdlari.length)];
      const odaTipi = odaTipleri[Math.floor(Math.random() * odaTipleri.length)];
      const konaklamaTipi = konaklamaTipleri[Math.floor(Math.random() * konaklamaTipleri.length)];

      // Rastgele tarihler (bugünden 30 gün öncesi ile 60 gün sonrası arası)
      const today = new Date();
      const randomDays = Math.floor(Math.random() * 90) - 30;
      const girisTarihi = new Date(today);
      girisTarihi.setDate(girisTarihi.getDate() + randomDays);
      
      const cikisTarihi = new Date(girisTarihi);
      const nights = Math.floor(Math.random() * 7) + 1; // 1-7 gece
      cikisTarihi.setDate(cikisTarihi.getDate() + nights);

      // Gecelik ücret (100-1000 TL arası)
      const gecelikUcret = Math.floor(Math.random() * 900) + 100;
      const toplamUcret = gecelikUcret * nights;

      const accommodation = await prisma.accommodation.create({
        data: {
          adiSoyadi: `${ad} ${soyad}`,
          unvani: unvan,
          ulke: 'Türkiye',
          sehir: '',
          girisTarihi: girisTarihi.toISOString().split('T')[0],
          cikisTarihi: cikisTarihi.toISOString().split('T')[0],
          odaTipi: odaTipi,
          konaklamaTipi: konaklamaTipi,
          gecelikUcret: gecelikUcret,
          toplamUcret: toplamUcret,
          otelAdi: otelAdi,
          numberOfNights: nights,
          isMunferit: false, // Alış kaydı
          companyId: company.id
        }
      });

      accommodations.push(accommodation);
      console.log(`${i}. Konaklama oluşturuldu: ${accommodation.adiSoyadi} - ${accommodation.otelAdi} (${nights} gece, ₺${toplamUcret.toFixed(2)})`);
    }

    console.log(`\n✅ Toplam ${accommodations.length} adet konaklama alış kaydı başarıyla oluşturuldu!`);
    console.log(`Şirket: ${company.name}`);
    console.log(`Toplam Maliyet: ₺${accommodations.reduce((sum, acc) => sum + acc.toplamUcret, 0).toLocaleString('tr-TR')}`);
    
    return accommodations;
  } catch (error) {
    console.error('Test verileri oluşturulurken hata oluştu:', error);
    throw error;
  }
}

createTestAccommodations()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

