const { fetchTurkeyHotels } = require('./fetchTurkeyHotels');

async function testEnhancedHotelFetch() {
  try {
    console.log('🧪 Geliştirilmiş otel çekme scripti test ediliyor...\n');
    
    const hotels = await fetchTurkeyHotels();
    
    console.log('\n📊 Test Sonuçları:');
    console.log(`✅ Toplam otel sayısı: ${hotels.length}`);
    
    // Şehir bazlı dağılım (ilk 10)
    const cityDistribution = {};
    hotels.forEach(hotel => {
      cityDistribution[hotel.sehir] = (cityDistribution[hotel.sehir] || 0) + 1;
    });
    
    console.log('\n🏙️ Şehir bazlı dağılım (ilk 10):');
    Object.entries(cityDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([city, count]) => {
        console.log(`  ${city}: ${count} otel`);
      });
    
    // Kaynak bazlı dağılım
    const sourceDistribution = {};
    hotels.forEach(hotel => {
      sourceDistribution[hotel.kaynak] = (sourceDistribution[hotel.kaynak] || 0) + 1;
    });
    
    console.log('\n📚 Kaynak bazlı dağılım:');
    Object.entries(sourceDistribution).forEach(([source, count]) => {
      console.log(`  ${source}: ${count} otel`);
    });
    
    // Yıldız bazlı dağılım
    const starDistribution = {};
    hotels.forEach(hotel => {
      starDistribution[hotel.yildizSayisi] = (starDistribution[hotel.yildizSayisi] || 0) + 1;
    });
    
    console.log('\n⭐ Yıldız bazlı dağılım:');
    Object.entries(starDistribution)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([stars, count]) => {
        console.log(`  ${stars} yıldız: ${count} otel`);
      });
    
    // Örnek oteller (ilk 5)
    console.log('\n🏨 Örnek oteller (ilk 5):');
    hotels.slice(0, 5).forEach((hotel, index) => {
      console.log(`  ${index + 1}. ${hotel.adi} (${hotel.sehir}) - ${hotel.yildizSayisi}⭐ - ${hotel.kaynak}`);
      console.log(`     Adres: ${hotel.adres}`);
    });
    
    // Adres kontrolü - şehir bazlı
    console.log('\n📍 Adres kontrolü (şehir bazlı):');
    const sampleCities = ['İstanbul', 'Ankara', 'İzmir', 'Antalya'];
    sampleCities.forEach(city => {
      const cityHotels = hotels.filter(h => h.sehir === city).slice(0, 2);
      console.log(`\n${city} örnekleri:`);
      cityHotels.forEach(hotel => {
        console.log(`  ${hotel.adi}: ${hotel.adres}`);
      });
    });
    
    console.log('\n🎉 Test başarıyla tamamlandı!');
    
  } catch (error) {
    console.error('❌ Test hatası:', error);
  }
}

testEnhancedHotelFetch();
