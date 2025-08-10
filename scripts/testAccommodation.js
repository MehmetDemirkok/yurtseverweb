const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

async function testAccommodation() {
  try {
    // Yeni oluşturduğumuz kullanıcıyı bul
    const user = await prisma.user.findFirst({
      where: { email: 'yurtsever@yurtsever.com' }
    });

    if (!user) {
      console.log('❌ Kullanıcı bulunamadı!');
      return;
    }

    console.log('✅ Kullanıcı bulundu:', user.email);
    console.log('🏢 Company ID:', user.companyId);

    // JWT token oluştur
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role,
        companyId: user.companyId
      }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );

    console.log('✅ JWT token oluşturuldu');

    // Test verisi
    const testData = {
      adiSoyadi: 'Test Kullanıcı',
      unvani: 'Test Ünvan',
      ulke: 'Türkiye',
      sehir: 'İstanbul',
      girisTarihi: '2025-01-15',
      cikisTarihi: '2025-01-18',
      odaTipi: 'Single Oda',
      konaklamaTipi: 'BB',
      faturaEdildi: false,
      gecelikUcret: 5000,
      toplamUcret: 15000,
      organizasyonAdi: 'Test Organizasyon',
      otelAdi: 'Test Otel',
      kurumCari: 'Test Kurum',
      numberOfNights: 3
    };

    // API'yi test et
    const response = await fetch('http://localhost:3000/api/accommodation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('📊 API Yanıtı:');
    console.log('Status:', response.status);
    console.log(JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Konaklama kaydı başarıyla oluşturuldu!');
      console.log('🆔 Kayıt ID:', result.id);
    } else {
      console.log('❌ Konaklama kaydı oluşturulamadı!');
      console.log('Hata:', result.error);
    }

  } catch (error) {
    console.error('❌ Test hatası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAccommodation();

