export interface ArventoVehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  fuelType: string;
  engineSize: string;
  transmission: string;
  color: string;
  vin: string;
  lastLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
    speed: number;
    heading: number;
  };
  status: 'active' | 'inactive' | 'maintenance';
  driver?: {
    id: string;
    name: string;
    phone: string;
  };
}

export interface ArventoLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed: number;
  heading: number;
  address?: string;
}

export interface ArventoDriver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseClass: string;
  status: 'active' | 'inactive';
}

class ArventoService {
  private apiKey: string;
  private baseUrl: string;
  private companyId?: number;

  constructor(companyId?: number) {
    this.companyId = companyId;
    this.apiKey = process.env.ARVENTO_API_KEY || '';
    this.baseUrl = process.env.ARVENTO_BASE_URL || 'https://api.arvento.com';
  }

  // Şirket konfigürasyonunu yükle
  async loadCompanyConfig() {
    if (!this.companyId) return;
    
    try {
      const { prisma } = await import('@/lib/prisma');
      const company = await prisma.company.findUnique({
        where: { id: this.companyId },
        select: {
          arventoApiKey: true,
          arventoBaseUrl: true
        }
      });
      
      if (company?.arventoApiKey) {
        this.apiKey = company.arventoApiKey;
      }
      if (company?.arventoBaseUrl) {
        this.baseUrl = company.arventoBaseUrl;
      }
    } catch (error) {
      console.error('Şirket konfigürasyonu yüklenemedi:', error);
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Arvento API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Araç listesini getir
  async getVehicles(): Promise<ArventoVehicle[]> {
    try {
      // Şirket konfigürasyonunu yükle
      await this.loadCompanyConfig();
      
      // Mock data - gerçek API kurulana kadar
      if (!this.apiKey || this.apiKey === '') {
        return [
          {
            id: 'mock-1',
            plate: '34 ABC 123',
            brand: 'Mercedes',
            model: 'Sprinter',
            year: 2022,
            fuelType: 'Diesel',
            engineSize: '2.2L',
            transmission: 'Automatic',
            color: 'White',
            vin: 'MOCK123456789',
            status: 'active',
            lastLocation: {
              latitude: 41.0082,
              longitude: 28.9784,
              timestamp: new Date().toISOString(),
              speed: 45,
              heading: 180
            }
          },
          {
            id: 'mock-2',
            plate: '06 DEF 456',
            brand: 'Ford',
            model: 'Transit',
            year: 2021,
            fuelType: 'Diesel',
            engineSize: '2.0L',
            transmission: 'Manual',
            color: 'Blue',
            vin: 'MOCK987654321',
            status: 'active',
            lastLocation: {
              latitude: 39.9334,
              longitude: 32.8597,
              timestamp: new Date().toISOString(),
              speed: 0,
              heading: 90
            }
          }
        ];
      }
      
      const data = await this.makeRequest('/vehicles');
      return data.vehicles || [];
    } catch (error) {
      console.error('Arvento vehicles fetch error:', error);
      // Hata durumunda boş array döndür
      return [];
    }
  }

  // Belirli bir aracın detaylarını getir
  async getVehicle(vehicleId: string): Promise<ArventoVehicle> {
    try {
      // Şirket konfigürasyonunu yükle
      await this.loadCompanyConfig();
      
      // Mock data - gerçek API kurulana kadar
      if (!this.apiKey || this.apiKey === '') {
        const mockVehicles = await this.getVehicles();
        const vehicle = mockVehicles.find(v => v.id === vehicleId);
        if (vehicle) {
          return vehicle;
        }
        throw new Error('Vehicle not found');
      }
      
      const data = await this.makeRequest(`/vehicles/${vehicleId}`);
      return data.vehicle;
    } catch (error) {
      console.error('Arvento vehicle fetch error:', error);
      throw error;
    }
  }

  // Aracın son konumunu getir
  async getVehicleLocation(vehicleId: string): Promise<ArventoLocation> {
    try {
      // Şirket konfigürasyonunu yükle
      await this.loadCompanyConfig();
      
      // Mock data - gerçek API kurulana kadar
      if (!this.apiKey || this.apiKey === '') {
        const vehicle = await this.getVehicle(vehicleId);
        if (vehicle.lastLocation) {
          return vehicle.lastLocation;
        }
        throw new Error('Location not found');
      }
      
      const data = await this.makeRequest(`/vehicles/${vehicleId}/location`);
      return data.location;
    } catch (error) {
      console.error('Arvento vehicle location fetch error:', error);
      throw error;
    }
  }

  // Aracın konum geçmişini getir
  async getVehicleLocationHistory(
    vehicleId: string, 
    startDate: string, 
    endDate: string
  ): Promise<ArventoLocation[]> {
    try {
      const data = await this.makeRequest(
        `/vehicles/${vehicleId}/location-history?start=${startDate}&end=${endDate}`
      );
      return data.locations || [];
    } catch (error) {
      console.error('Arvento vehicle location history fetch error:', error);
      throw error;
    }
  }

  // Şoför listesini getir
  async getDrivers(): Promise<ArventoDriver[]> {
    try {
      const data = await this.makeRequest('/drivers');
      return data.drivers || [];
    } catch (error) {
      console.error('Arvento drivers fetch error:', error);
      throw error;
    }
  }

  // Belirli bir şoförün detaylarını getir
  async getDriver(driverId: string): Promise<ArventoDriver> {
    try {
      const data = await this.makeRequest(`/drivers/${driverId}`);
      return data.driver;
    } catch (error) {
      console.error('Arvento driver fetch error:', error);
      throw error;
    }
  }

  // Araç-şoför eşleştirmesi yap
  async assignDriverToVehicle(vehicleId: string, driverId: string): Promise<void> {
    try {
      await this.makeRequest(`/vehicles/${vehicleId}/assign-driver`, {
        method: 'POST',
        body: JSON.stringify({ driverId }),
      });
    } catch (error) {
      console.error('Arvento driver assignment error:', error);
      throw error;
    }
  }

  // Araç-şoför eşleştirmesini kaldır
  async unassignDriverFromVehicle(vehicleId: string): Promise<void> {
    try {
      await this.makeRequest(`/vehicles/${vehicleId}/unassign-driver`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Arvento driver unassignment error:', error);
      throw error;
    }
  }

  // Araç durumunu güncelle
  async updateVehicleStatus(vehicleId: string, status: string): Promise<void> {
    try {
      await this.makeRequest(`/vehicles/${vehicleId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error('Arvento vehicle status update error:', error);
      throw error;
    }
  }

  // Canlı takip verilerini getir
  async getLiveTracking(vehicleIds: string[]): Promise<ArventoVehicle[]> {
    try {
      // Şirket konfigürasyonunu yükle
      await this.loadCompanyConfig();
      
      // Mock data - gerçek API kurulana kadar
      if (!this.apiKey || this.apiKey === '') {
        const allVehicles = await this.getVehicles();
        return allVehicles.filter(v => vehicleIds.includes(v.id));
      }
      
      const data = await this.makeRequest('/live-tracking', {
        method: 'POST',
        body: JSON.stringify({ vehicleIds }),
      });
      return data.vehicles || [];
    } catch (error) {
      console.error('Arvento live tracking error:', error);
      return [];
    }
  }
}

// Global instance - geriye uyumluluk için
export const arventoService = new ArventoService();

// Şirket bazlı instance oluşturmak için
export { ArventoService };
