'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Car, Navigation, Speed, Clock } from 'lucide-react';
import { ArventoVehicle } from '@/lib/arvento';

interface VehicleMapProps {
  vehicles: ArventoVehicle[];
  onVehicleSelect?: (vehicle: ArventoVehicle) => void;
  selectedVehicle?: ArventoVehicle | null;
}

interface MapVehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  lastUpdate: string;
  status: string;
}

export default function VehicleMap({ vehicles, onVehicleSelect, selectedVehicle }: VehicleMapProps) {
  const [mapVehicles, setMapVehicles] = useState<MapVehicle[]>([]);
  const [mapCenter, setMapCenter] = useState({ lat: 39.9334, lng: 32.8597 }); // Ankara merkez
  const [zoom, setZoom] = useState(10);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Araçları harita formatına dönüştür
    const vehiclesWithLocation = vehicles
      .filter(v => v.lastLocation)
      .map(v => ({
        id: v.id,
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        latitude: v.lastLocation!.latitude,
        longitude: v.lastLocation!.longitude,
        speed: v.lastLocation!.speed,
        heading: v.lastLocation!.heading,
        lastUpdate: v.lastLocation!.timestamp,
        status: v.status
      }));

    setMapVehicles(vehiclesWithLocation);

    // Araçlar varsa harita merkezini ayarla
    if (vehiclesWithLocation.length > 0) {
      const avgLat = vehiclesWithLocation.reduce((sum, v) => sum + v.latitude, 0) / vehiclesWithLocation.length;
      const avgLng = vehiclesWithLocation.reduce((sum, v) => sum + v.longitude, 0) / vehiclesWithLocation.length;
      setMapCenter({ lat: avgLat, lng: avgLng });
    }
  }, [vehicles]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'inactive': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSpeedColor = (speed?: number) => {
    if (!speed) return 'text-gray-500';
    if (speed > 80) return 'text-red-500';
    if (speed > 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins} dk önce`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} saat önce`;
    return date.toLocaleDateString('tr-TR');
  };

  const getHeadingIcon = (heading?: number) => {
    if (heading === undefined) return '↑';
    
    const directions = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
      {/* Harita Container */}
      <div ref={mapRef} className="w-full h-full relative">
        {/* Basit Harita Görünümü - Gerçek harita entegrasyonu için placeholder */}
        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Araç Konumları Haritası
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {mapVehicles.length} araç konumu görüntüleniyor
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Google Maps veya OpenStreetMap entegrasyonu yakında eklenecek
            </p>
          </div>
        </div>

        {/* Araç Konumları */}
        {mapVehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-110 ${
              selectedVehicle?.id === vehicle.id ? 'z-20' : 'z-10'
            }`}
            style={{
              left: `${((vehicle.longitude + 180) / 360) * 100}%`,
              top: `${((90 - vehicle.latitude) / 180) * 100}%`,
            }}
            onClick={() => onVehicleSelect?.(vehicles.find(v => v.id === vehicle.id)!)}
          >
            {/* Araç İkonu */}
            <div className={`relative ${selectedVehicle?.id === vehicle.id ? 'scale-125' : ''}`}>
              <div className={`w-8 h-8 rounded-full ${getStatusColor(vehicle.status)} flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800`}>
                <Car className="h-4 w-4 text-white" />
              </div>
              
              {/* Hız Göstergesi */}
              {vehicle.speed !== undefined && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded px-2 py-1 text-xs shadow-lg border">
                  <div className={`font-medium ${getSpeedColor(vehicle.speed)}`}>
                    {vehicle.speed} km/h
                  </div>
                </div>
              )}

              {/* Yön Göstergesi */}
              {vehicle.heading !== undefined && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded px-2 py-1 text-xs shadow-lg border">
                  <div className="flex items-center space-x-1">
                    <Navigation className="h-3 w-3" />
                    <span>{getHeadingIcon(vehicle.heading)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Kontrol Paneli */}
      <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 min-w-[250px]">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
          Araç Durumları
        </h4>
        
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {mapVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className={`p-2 rounded cursor-pointer transition-colors ${
                selectedVehicle?.id === vehicle.id
                  ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => onVehicleSelect?.(vehicles.find(v => v.id === vehicle.id)!)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(vehicle.status)}`} />
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white">
                      {vehicle.plate}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {vehicle.brand} {vehicle.model}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {vehicle.speed !== undefined && (
                    <div className={`text-xs font-medium ${getSpeedColor(vehicle.speed)}`}>
                      {vehicle.speed} km/h
                    </div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(vehicle.lastUpdate)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {mapVehicles.length === 0 && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            <Car className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Konum bilgisi olan araç bulunamadı</p>
          </div>
        )}
      </div>

      {/* Harita Kontrolleri */}
      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
        <div className="flex flex-col space-y-1">
          <button
            onClick={() => setZoom(Math.min(zoom + 1, 18))}
            className="w-8 h-8 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex items-center justify-center text-gray-600 dark:text-gray-300"
          >
            +
          </button>
          <button
            onClick={() => setZoom(Math.max(zoom - 1, 1))}
            className="w-8 h-8 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex items-center justify-center text-gray-600 dark:text-gray-300"
          >
            −
          </button>
        </div>
      </div>

      {/* Seçili Araç Detayları */}
      {selectedVehicle && (
        <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-[300px]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Araç Detayları
            </h4>
            <button
              onClick={() => onVehicleSelect?.(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2">
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedVehicle.plate}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.year})
              </div>
            </div>
            
            {selectedVehicle.lastLocation && (
              <div className="space-y-1">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <MapPin className="h-3 w-3 inline mr-1" />
                  {selectedVehicle.lastLocation.latitude.toFixed(6)}, {selectedVehicle.lastLocation.longitude.toFixed(6)}
                </div>
                
                {selectedVehicle.lastLocation.speed !== undefined && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <Speed className="h-3 w-3 inline mr-1" />
                    {selectedVehicle.lastLocation.speed} km/h
                  </div>
                )}
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {formatTime(selectedVehicle.lastLocation.timestamp)}
                </div>
              </div>
            )}
            
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                selectedVehicle.status === 'active' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : selectedVehicle.status === 'maintenance'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {selectedVehicle.status === 'active' ? 'Aktif' : 
                 selectedVehicle.status === 'maintenance' ? 'Bakımda' : 'Pasif'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
