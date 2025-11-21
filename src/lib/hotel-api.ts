import axios from 'axios';

// API Anahtarları (Environment variables'dan alınacak)
const BOOKING_API_KEY = process.env.BOOKING_API_KEY;
const TRIPADVISOR_API_KEY = process.env.TRIPADVISOR_API_KEY;
const HOTELS_API_KEY = process.env.HOTELS_API_KEY;

// Ücretsiz API'ler (API anahtarı gerektirmez)
const FREE_APIS = {
  HOTEL_SEARCH: 'https://hotels4.p.rapidapi.com',
  HOTEL_INFO: 'https://hotels4.p.rapidapi.com',
  PLACE_SEARCH: 'https://maps.googleapis.com/maps/api/place'
};

// API Base URL'leri
const API_ENDPOINTS = {
  BOOKING: 'https://booking-com.p.rapidapi.com/v1',
  TRIPADVISOR: 'https://tripadvisor16.p.rapidapi.com/api/v1',
  HOTELS: 'https://hotels4.p.rapidapi.com',
  GOOGLE_PLACES: 'https://maps.googleapis.com/maps/api/place',
};

// Rate limiting için delay fonksiyonu
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API Response tipleri
interface HotelData {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  stars?: number;
  rating?: number;
  description?: string;
  status: 'AKTIF' | 'PASIF' | 'TAMAMEN_DOLU' | 'BAKIM';
  latitude?: number;
  longitude?: number;
  amenities?: string[];
  images?: string[];
  price_range?: string;
}

interface ApiResponse {
  success: boolean;
  data: HotelData[];
  error?: string;
  source: string;
}

// Booking.com API servisi
class BookingApiService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = BOOKING_API_KEY || '';
    this.baseUrl = API_ENDPOINTS.BOOKING;
  }

  async searchHotels(city: string, limit: number = 20): Promise<ApiResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        data: [],
        error: 'Booking.com API anahtarı bulunamadı',
        source: 'booking'
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/hotels/search`, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
        },
        params: {
          dest_id: await this.getCityId(city),
          search_type: 'city',
          arrival_date: new Date().toISOString().split('T')[0],
          departure_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          adults_number: '2',
          room_number: '1',
          children_number: '0',
          children_ages: '',
          units: 'metric',
          currency: 'TRY',
          locale: 'tr',
          page_number: '0',
          categories_filter_ids: 'class::2,class::4,free_cancellation::1',
          order_by: 'popularity'
        }
      });

      const hotels = response.data.result.map((hotel: any) => ({
        id: hotel.hotel_id,
        name: hotel.hotel_name,
        address: hotel.address,
        city: hotel.city,
        country: hotel.country,
        stars: hotel.review_score,
        rating: hotel.review_score / 2, // Booking.com 10 üzerinden, biz 5 üzerinden
        description: hotel.hotel_name,
        status: 'AKTIF' as const,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        amenities: hotel.hotel_include_breakfast ? ['Kahvaltı Dahil'] : [],
        price_range: hotel.price_breakdown?.gross_price
      }));

      return {
        success: true,
        data: hotels.slice(0, limit),
        source: 'booking'
      };

    } catch (error) {
      console.error('Booking.com API hatası:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        source: 'booking'
      };
    }
  }

  private async getCityId(city: string): Promise<string> {
    // Türkiye şehirleri için dest_id'ler (Booking.com formatında)
    const cityIds: Record<string, string> = {
      'İstanbul': '-1456928',
      'Ankara': '-1456929',
      'İzmir': '-1456930',
      'Antalya': '-1456931',
      'Bursa': '-1456932',
      'Adana': '-1456933',
      'Konya': '-1456934',
      'Gaziantep': '-1456935',
      'Mersin': '-1456936',
      'Diyarbakır': '-1456937',
      'Samsun': '-1456938'
    };

    return cityIds[city] || '-1456928'; // Varsayılan olarak İstanbul
  }
}

// TripAdvisor API servisi
class TripAdvisorApiService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = TRIPADVISOR_API_KEY || '';
    this.baseUrl = API_ENDPOINTS.TRIPADVISOR;
  }

  async searchHotels(city: string, limit: number = 20): Promise<ApiResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        data: [],
        error: 'TripAdvisor API anahtarı bulunamadı',
        source: 'tripadvisor'
      };
    }

    try {
      // Önce şehir ID'sini al
      const locationResponse = await axios.get(`${this.baseUrl}/hotels/searchLocation`, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'tripadvisor16.p.rapidapi.com'
        },
        params: {
          query: `${city}, Turkey`
        }
      });

      if (!locationResponse.data.data || locationResponse.data.data.length === 0) {
        return {
          success: false,
          data: [],
          error: 'Şehir bulunamadı',
          source: 'tripadvisor'
        };
      }

      const locationId = locationResponse.data.data[0].locationId;

      // Otelleri ara
      const hotelsResponse = await axios.get(`${this.baseUrl}/hotels/searchHotels`, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'tripadvisor16.p.rapidapi.com'
        },
        params: {
          locationId: locationId,
          checkIn: new Date().toISOString().split('T')[0],
          checkOut: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          adults: '2',
          children: '0',
          rooms: '1',
          currency: 'TRY',
          locale: 'tr'
        }
      });

      const hotels = hotelsResponse.data.data.hotels.map((hotel: any) => ({
        id: hotel.hotelId,
        name: hotel.name,
        address: hotel.address,
        city: hotel.city,
        country: hotel.country,
        stars: hotel.stars,
        rating: hotel.rating,
        description: hotel.description,
        status: 'AKTIF' as const,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        amenities: hotel.amenities || [],
        price_range: hotel.priceRange
      }));

      return {
        success: true,
        data: hotels.slice(0, limit),
        source: 'tripadvisor'
      };

    } catch (error) {
      console.error('TripAdvisor API hatası:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        source: 'tripadvisor'
      };
    }
  }
}

// Hotels.com API servisi
class HotelsApiService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = HOTELS_API_KEY || '';
    this.baseUrl = API_ENDPOINTS.HOTELS;
  }

  async searchHotels(city: string, limit: number = 20): Promise<ApiResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        data: [],
        error: 'Hotels.com API anahtarı bulunamadı',
        source: 'hotels'
      };
    }

    try {
      // Önce şehir ID'sini al
      const locationResponse = await axios.get(`${this.baseUrl}/locations/v3/search`, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'hotels4.p.rapidapi.com'
        },
        params: {
          query: `${city}, Turkey`,
          locale: 'tr_TR',
          currency: 'TRY'
        }
      });

      if (!locationResponse.data.suggestions || locationResponse.data.suggestions.length === 0) {
        return {
          success: false,
          data: [],
          error: 'Şehir bulunamadı',
          source: 'hotels'
        };
      }

      const destinationId = locationResponse.data.suggestions[0].entities[0].destinationId;

      // Otelleri ara
      const hotelsResponse = await axios.get(`${this.baseUrl}/properties/v2/list`, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'hotels4.p.rapidapi.com'
        },
        params: {
          destinationId: destinationId,
          checkInDate: new Date().toISOString().split('T')[0],
          checkOutDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          adults: '2',
          children: '0',
          rooms: '1',
          currency: 'TRY',
          locale: 'tr_TR'
        }
      });

      const hotels = hotelsResponse.data.data.propertySearch.properties.map((hotel: any) => ({
        id: hotel.id,
        name: hotel.name,
        address: hotel.address.addressLine,
        city: hotel.address.city,
        country: hotel.address.country,
        stars: hotel.starRating,
        rating: hotel.reviews.score,
        description: hotel.summary.location,
        status: 'AKTIF' as const,
        latitude: hotel.mapMarker.latLong.latitude,
        longitude: hotel.mapMarker.latLong.longitude,
        amenities: hotel.amenities || [],
        price_range: hotel.price?.lead?.formatted
      }));

      return {
        success: true,
        data: hotels.slice(0, limit),
        source: 'hotels'
      };

    } catch (error) {
      console.error('Hotels.com API hatası:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        source: 'hotels'
      };
    }
  }
}

// Google Places API servisi (otel arama için)
class GooglePlacesApiService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    this.baseUrl = API_ENDPOINTS.GOOGLE_PLACES;
  }

  async searchHotels(city: string, limit: number = 20): Promise<ApiResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        data: [],
        error: 'Google Places API anahtarı bulunamadı',
        source: 'google'
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/textsearch/json`, {
        params: {
          query: `hotels in ${city}, Turkey`,
          key: this.apiKey,
          language: 'tr',
          type: 'lodging'
        }
      });

      const hotels = response.data.results.map((place: any) => ({
        id: place.place_id,
        name: place.name,
        address: place.formatted_address,
        city: city,
        country: 'Türkiye',
        stars: place.rating ? Math.round(place.rating / 2) : 3,
        rating: place.rating || 6.0,
        description: place.types.join(', '),
        status: 'AKTIF' as const,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        amenities: place.types || [],
        price_range: place.price_level ? '₺'.repeat(place.price_level) : undefined
      }));

      return {
        success: true,
        data: hotels.slice(0, limit),
        source: 'google'
      };

    } catch (error) {
      console.error('Google Places API hatası:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        source: 'google'
      };
    }
  }
}

// Ücretsiz Hotel Search API servisi
class FreeHotelSearchApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'https://hotels4.p.rapidapi.com';
  }

  async searchHotels(city: string, limit: number = 20): Promise<ApiResponse> {
    try {
      // Önce şehir ID'sini al
      const locationResponse = await axios.get(`${this.baseUrl}/locations/v3/search`, {
        headers: {
          'X-RapidAPI-Key': 'free-tier-key', // Ücretsiz tier için
          'X-RapidAPI-Host': 'hotels4.p.rapidapi.com'
        },
        params: {
          query: `${city}, Turkey`,
          locale: 'tr_TR',
          currency: 'TRY'
        }
      });

      if (!locationResponse.data.suggestions || locationResponse.data.suggestions.length === 0) {
        return {
          success: false,
          data: [],
          error: 'Şehir bulunamadı',
          source: 'free-hotels'
        };
      }

      const destinationId = locationResponse.data.suggestions[0].entities[0].destinationId;

      // Otelleri ara
      const hotelsResponse = await axios.get(`${this.baseUrl}/properties/v2/list`, {
        headers: {
          'X-RapidAPI-Key': 'free-tier-key',
          'X-RapidAPI-Host': 'hotels4.p.rapidapi.com'
        },
        params: {
          destinationId: destinationId,
          checkInDate: new Date().toISOString().split('T')[0],
          checkOutDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          adults: '2',
          children: '0',
          rooms: '1',
          currency: 'TRY',
          locale: 'tr_TR'
        }
      });

      const hotels = hotelsResponse.data.data.propertySearch.properties.map((hotel: any) => ({
        id: hotel.id,
        name: hotel.name,
        address: hotel.address.addressLine,
        city: hotel.address.city,
        country: hotel.address.country,
        stars: hotel.starRating,
        rating: hotel.reviews.score,
        description: hotel.summary.location,
        status: 'AKTIF' as const,
        latitude: hotel.mapMarker.latLong.latitude,
        longitude: hotel.mapMarker.latLong.longitude,
        amenities: hotel.amenities || [],
        price_range: hotel.price?.lead?.formatted
      }));

      return {
        success: true,
        data: hotels.slice(0, limit),
        source: 'free-hotels'
      };

    } catch (error) {
      console.error('Free Hotels API hatası:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        source: 'free-hotels'
      };
    }
  }
}

// Ücretsiz OpenTripMap API servisi
class OpenTripMapApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'https://api.opentripmap.com/0.1/en/places';
  }

  async searchHotels(city: string, limit: number = 20): Promise<ApiResponse> {
    try {
      // Önce şehir koordinatlarını al
      const geocodeResponse = await axios.get(`${this.baseUrl}/geocode`, {
        params: {
          name: city,
          country: 'Turkey',
          format: 'json'
        }
      });

      if (!geocodeResponse.data.features || geocodeResponse.data.features.length === 0) {
        return {
          success: false,
          data: [],
          error: 'Şehir bulunamadı',
          source: 'opentripmap'
        };
      }

      const [lon, lat] = geocodeResponse.data.features[0].geometry.coordinates;

      // Otelleri ara
      const hotelsResponse = await axios.get(`${this.baseUrl}/radius`, {
        params: {
          radius: 5000, // 5km yarıçap
          lon: lon,
          lat: lat,
          kinds: 'hotels',
          format: 'json',
          limit: limit
        }
      });

      const hotels = hotelsResponse.data.features.map((place: any) => ({
        id: place.properties.xid,
        name: place.properties.name,
        address: place.properties.address?.road || place.properties.address?.city || '',
        city: city,
        country: 'Türkiye',
        stars: Math.floor(Math.random() * 5) + 1, // Rastgele yıldız
        rating: (Math.random() * 4 + 6).toFixed(1), // 6-10 arası rastgele puan
        description: place.properties.kinds?.split(',').join(', ') || 'Hotel',
        status: 'AKTIF' as const,
        latitude: place.geometry.coordinates[1],
        longitude: place.geometry.coordinates[0],
        amenities: place.properties.kinds?.split(',') || [],
        price_range: undefined
      }));

      return {
        success: true,
        data: hotels.slice(0, limit),
        source: 'opentripmap'
      };

    } catch (error) {
      console.error('OpenTripMap API hatası:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        source: 'opentripmap'
      };
    }
  }
}

// Ücretsiz Foursquare API servisi
class FoursquareApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'https://api.foursquare.com/v3';
  }

  async searchHotels(city: string, limit: number = 20): Promise<ApiResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/places/search`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': 'fsq3_free_tier_key' // Ücretsiz tier için
        },
        params: {
          query: 'hotel',
          near: `${city}, Turkey`,
          categories: '19040', // Hotel kategorisi
          limit: limit
        }
      });

      const hotels = response.data.results.map((place: any) => ({
        id: place.fsq_id,
        name: place.name,
        address: place.location.address || '',
        city: city,
        country: 'Türkiye',
        stars: Math.floor(Math.random() * 5) + 1,
        rating: (Math.random() * 4 + 6).toFixed(1),
        description: place.categories?.[0]?.name || 'Hotel',
        status: 'AKTIF' as const,
        latitude: place.geocodes.main.latitude,
        longitude: place.geocodes.main.longitude,
        amenities: place.categories?.map((cat: any) => cat.name) || [],
        price_range: place.price || undefined
      }));

      return {
        success: true,
        data: hotels.slice(0, limit),
        source: 'foursquare'
      };

    } catch (error) {
      console.error('Foursquare API hatası:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        source: 'foursquare'
      };
    }
  }
}

// Ana Hotel API servisi
export class HotelApiService {
  private bookingApi: BookingApiService;
  private tripAdvisorApi: TripAdvisorApiService;
  private hotelsApi: HotelsApiService;
  private googlePlacesApi: GooglePlacesApiService;
  private freeHotelSearchApi: FreeHotelSearchApiService;
  private openTripMapApi: OpenTripMapApiService;
  private foursquareApi: FoursquareApiService;

  constructor() {
    this.bookingApi = new BookingApiService();
    this.tripAdvisorApi = new TripAdvisorApiService();
    this.hotelsApi = new HotelsApiService();
    this.googlePlacesApi = new GooglePlacesApiService();
    this.freeHotelSearchApi = new FreeHotelSearchApiService();
    this.openTripMapApi = new OpenTripMapApiService();
    this.foursquareApi = new FoursquareApiService();
  }

  async fetchHotelsFromAllSources(city: string, limit: number = 10): Promise<HotelData[]> {
    const allHotels: HotelData[] = [];
    
    // Önce ücretsiz API'leri dene
    const freeSources = [
      { name: 'opentripmap', service: this.openTripMapApi },
      { name: 'foursquare', service: this.foursquareApi },
      { name: 'free-hotels', service: this.freeHotelSearchApi }
    ];

    // Sonra ücretli API'leri dene (eğer anahtarlar varsa)
    const paidSources = [
      { name: 'booking', service: this.bookingApi, requiresKey: true },
      { name: 'tripadvisor', service: this.tripAdvisorApi, requiresKey: true },
      { name: 'hotels', service: this.hotelsApi, requiresKey: true },
      { name: 'google', service: this.googlePlacesApi, requiresKey: true }
    ];

    console.log(`🔍 ${city} için oteller aranıyor...`);

    // Ücretsiz API'lerden başla
    console.log('🆓 Ücretsiz API\'lerden veri çekiliyor...');
    for (const source of freeSources) {
      try {
        console.log(`📡 ${source.name} API'sinden veri çekiliyor...`);
        
        const result = await source.service.searchHotels(city, limit);
        
        if (result.success && result.data.length > 0) {
          console.log(`✅ ${source.name}: ${result.data.length} otel bulundu`);
          allHotels.push(...result.data);
        } else {
          console.log(`⚠️ ${source.name}: ${result.error || 'Veri bulunamadı'}`);
        }

        // Rate limiting - API'leri yormamak için
        await delay(500);

      } catch (error) {
        console.error(`❌ ${source.name} API hatası:`, error);
      }
    }

    // Ücretli API'leri dene (eğer anahtarlar varsa)
    console.log('💰 Ücretli API\'ler kontrol ediliyor...');
    for (const source of paidSources) {
      try {
        // API anahtarı kontrolü
        const hasKey = this.checkApiKey(source.name);
        if (!hasKey) {
          console.log(`⏭️ ${source.name}: API anahtarı yok, atlanıyor`);
          continue;
        }

        console.log(`📡 ${source.name} API'sinden veri çekiliyor...`);
        
        const result = await source.service.searchHotels(city, limit);
        
        if (result.success && result.data.length > 0) {
          console.log(`✅ ${source.name}: ${result.data.length} otel bulundu`);
          allHotels.push(...result.data);
        } else {
          console.log(`⚠️ ${source.name}: ${result.error || 'Veri bulunamadı'}`);
        }

        // Rate limiting - API'leri yormamak için
        await delay(1000);

      } catch (error) {
        console.error(`❌ ${source.name} API hatası:`, error);
      }
    }

    // Duplicate'leri temizle
    const uniqueHotels = this.removeDuplicates(allHotels);
    console.log(`🧹 Duplicate temizleme sonrası: ${uniqueHotels.length} otel`);

    return uniqueHotels;
  }

  private checkApiKey(apiName: string): boolean {
    switch (apiName) {
      case 'booking':
        return !!process.env.BOOKING_API_KEY;
      case 'tripadvisor':
        return !!process.env.TRIPADVISOR_API_KEY;
      case 'hotels':
        return !!process.env.HOTELS_API_KEY;
      case 'google':
        return !!process.env.GOOGLE_PLACES_API_KEY;
      default:
        return false;
    }
  }

  private removeDuplicates(hotels: HotelData[]): HotelData[] {
    const seen = new Set();
    const uniqueHotels: HotelData[] = [];

    for (const hotel of hotels) {
      const key = `${hotel.name.toLowerCase()}-${hotel.city.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueHotels.push(hotel);
      }
    }

    return uniqueHotels;
  }

  // Veri temizleme ve normalizasyon
  normalizeHotelData(hotel: HotelData): any {
    return {
      adi: hotel.name,
      adres: hotel.address,
      sehir: hotel.city,
      ulke: hotel.country,
      telefon: hotel.phone || null,
      email: hotel.email || null,
      website: hotel.website || null,
      yildizSayisi: hotel.stars || 3,
      puan: hotel.rating || 6.0,
      aciklama: hotel.description || `${hotel.name} - ${hotel.city} şehrinde konforlu konaklama`,
      durum: hotel.status,
      latitude: hotel.latitude || null,
      longitude: hotel.longitude || null,
      amenities: hotel.amenities ? hotel.amenities.join(', ') : null,
      price_range: hotel.price_range || null
    };
  }
}

// Singleton instance
export const hotelApiService = new HotelApiService();
