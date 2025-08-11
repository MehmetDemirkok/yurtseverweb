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

  constructor() {
    this.apiKey = process.env.ARVENTO_API_KEY || '';
    this.baseUrl = process.env.ARVENTO_BASE_URL || 'https://api.arvento.com';
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
      const data = await this.makeRequest('/vehicles');
      return data.vehicles || [];
    } catch (error) {
      console.error('Arvento vehicles fetch error:', error);
      throw error;
    }
  }

  // Belirli bir aracın detaylarını getir
  async getVehicle(vehicleId: string): Promise<ArventoVehicle> {
    try {
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
      const data = await this.makeRequest('/live-tracking', {
        method: 'POST',
        body: JSON.stringify({ vehicleIds }),
      });
      return data.vehicles || [];
    } catch (error) {
      console.error('Arvento live tracking error:', error);
      throw error;
    }
  }
}

export const arventoService = new ArventoService();
