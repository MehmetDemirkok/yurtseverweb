import { NextRequest, NextResponse } from 'next/server';
import { hotelApiService } from '@/lib/hotel-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || 'İstanbul';
    const limit = parseInt(searchParams.get('limit') || '5');

    console.log(`🧪 API Test: ${city} için ${limit} otel test ediliyor...`);

    // API'lerden test verisi çek
    const hotels = await hotelApiService.fetchHotelsFromAllSources(city, limit);

    // Test sonuçlarını hazırla
    const testResults = {
      city,
      limit,
      totalHotels: hotels.length,
      hotels: hotels.map(hotel => ({
        name: hotel.name,
        address: hotel.address,
        city: hotel.city,
        stars: hotel.stars,
        rating: hotel.rating,
        source: 'API'
      })),
      apiStatus: {
        // Ücretsiz API'ler
        opentripmap: 'Free - No Key Required',
        foursquare: 'Free - No Key Required',
        'free-hotels': 'Free - No Key Required',
        // Ücretli API'ler
        booking: process.env.BOOKING_API_KEY ? 'Configured' : 'Not Configured',
        tripadvisor: process.env.TRIPADVISOR_API_KEY ? 'Configured' : 'Not Configured',
        hotels: process.env.HOTELS_API_KEY ? 'Configured' : 'Not Configured',
        google: process.env.GOOGLE_PLACES_API_KEY ? 'Configured' : 'Not Configured'
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasApiKeys: !!(process.env.BOOKING_API_KEY || process.env.TRIPADVISOR_API_KEY || process.env.HOTELS_API_KEY || process.env.GOOGLE_PLACES_API_KEY)
      }
    };

    return NextResponse.json({
      success: true,
      message: 'API test başarılı',
      data: testResults
    });

  } catch (error) {
    console.error('❌ API test hatası:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'API test başarısız',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        apiStatus: {
          // Ücretsiz API'ler
          opentripmap: 'Free - No Key Required',
          foursquare: 'Free - No Key Required',
          'free-hotels': 'Free - No Key Required',
          // Ücretli API'ler
          booking: process.env.BOOKING_API_KEY ? 'Configured' : 'Not Configured',
          tripadvisor: process.env.TRIPADVISOR_API_KEY ? 'Configured' : 'Not Configured',
          hotels: process.env.HOTELS_API_KEY ? 'Configured' : 'Not Configured',
          google: process.env.GOOGLE_PLACES_API_KEY ? 'Configured' : 'Not Configured'
        }
      },
      { status: 500 }
    );
  }
}
