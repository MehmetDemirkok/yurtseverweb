const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

async function testHotelFetch() {
  try {
    // Admin kullanıcısını bul
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@yurtsever.com' }
    });

    if (!adminUser) {
      console.log('❌ Admin kullanıcısı bulunamadı!');
      return;
    }

    console.log('✅ Admin kullanıcısı bulundu:', adminUser.email);

    // JWT token oluştur
    const token = jwt.sign(
      { 
        id: adminUser.id, 
        email: adminUser.email,
        role: adminUser.role 
      }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );

    console.log('✅ JWT token oluşturuldu');

    // API'yi test et
    const response = await fetch('http://localhost:3000/api/konaklama/oteller/fetch-turkey-hotels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`
      }
    });

    const result = await response.json();
    
    console.log('📊 API Yanıtı:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ Otel çekme işlemi başarılı!');
      console.log(`📈 ${result.count} otel eklendi`);
    } else {
      console.log('❌ Otel çekme işlemi başarısız!');
      console.log('Hata:', result.error);
    }

  } catch (error) {
    console.error('❌ Test hatası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testHotelFetch();
