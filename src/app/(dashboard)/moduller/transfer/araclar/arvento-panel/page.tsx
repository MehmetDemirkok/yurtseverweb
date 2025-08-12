'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  MapPin, 
  Car, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Save, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle,
  X,
  Link,
  Unlink,
  Globe,
  Clock,
  Speed,
  Navigation
} from 'lucide-react';
import { ArventoVehicle } from '@/lib/arvento';
import VehicleMap from '@/components/VehicleMap';

interface Arac {
  id: string;
  plaka: string;
  marka: string;
  model: string;
  aracTipi: 'BINEK' | 'MINIBUS' | 'MIDIBUS' | 'OTOBUS';
  yolcuKapasitesi: number;
  durum: 'MUSAIT' | 'BAKIMDA' | 'TRANSFERDE';
  sonGuncelleme: string;
  createdAt: string;
  updatedAt: string;
  companyId: number;
  arventoId?: string;
  arventoData?: ArventoVehicle;
}

interface ArventoConfig {
  apiKey: string;
  baseUrl: string;
  isConnected: boolean;
  lastTest: string | null;
}

export default function ArventoPanelPage() {
  const [araclar, setAraclar] = useState<Arac[]>([]);
  const [arventoVehicles, setArventoVehicles] = useState<ArventoVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [arventoLoading, setArventoLoading] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  
  // Arvento konfigürasyonu
  const [arventoConfig, setArventoConfig] = useState<ArventoConfig>({
    apiKey: '',
    baseUrl: 'https://api.arvento.com',
    isConnected: false,
    lastTest: null
  });
  
  // UI state'leri
  const [showApiKey, setShowApiKey] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<ArventoVehicle | null>(null);
  const [liveTrackingEnabled, setLiveTrackingEnabled] = useState(false);
  const [matchingMode, setMatchingMode] = useState<'auto' | 'manual'>('auto');

  // İzin kontrolü
  const hasPermission = (permission: string): boolean => {
    return userPermissions.includes(permission) || userRole === 'ADMIN';
  };

  const hasPageAccess = (): boolean => {
    if (userRole === 'ADMIN') return true;
    return hasPermission('transfer');
  };

  useEffect(() => {
    fetchUserData();
    fetchAraclar();
    loadArventoConfig();
  }, []);

  // Canlı takip için interval
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (liveTrackingEnabled && arventoConfig.isConnected) {
      interval = setInterval(() => {
        fetchArventoVehicles();
      }, 30000); // 30 saniyede bir güncelle
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [liveTrackingEnabled, arventoConfig.isConnected]);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/user', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUserPermissions(data.user.permissions || []);
        setUserRole(data.user.role || '');
      }
    } catch (error) {
      console.error('Kullanıcı bilgileri alınamadı:', error);
    }
  };

  const fetchAraclar = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/moduller/transfer/araclar');
      if (response.ok) {
        const data = await response.json();
        setAraclar(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Araçlar alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadArventoConfig = async () => {
    try {
      const response = await fetch('/api/arvento/config');
      if (response.ok) {
        const config = await response.json();
        setArventoConfig(config);
      }
    } catch (error) {
      console.error('Arvento konfigürasyonu yüklenemedi:', error);
    }
  };

  const saveArventoConfig = async () => {
    try {
      const response = await fetch('/api/arvento/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arventoConfig)
      });
      
      if (response.ok) {
        alert('Arvento konfigürasyonu kaydedildi');
        await testArventoConnection();
      } else {
        alert('Konfigürasyon kaydedilemedi');
      }
    } catch (error) {
      console.error('Konfigürasyon kaydedilemedi:', error);
      alert('Konfigürasyon kaydedilemedi');
    }
  };

  const testArventoConnection = async () => {
    try {
      setArventoLoading(true);
      const response = await fetch('/api/arvento/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arventoConfig)
      });
      
      if (response.ok) {
        const result = await response.json();
        setArventoConfig(prev => ({
          ...prev,
          isConnected: result.success,
          lastTest: new Date().toISOString()
        }));
        
        if (result.success) {
          await fetchArventoVehicles();
        }
      }
    } catch (error) {
      console.error('Bağlantı testi başarısız:', error);
      setArventoConfig(prev => ({
        ...prev,
        isConnected: false,
        lastTest: new Date().toISOString()
      }));
    } finally {
      setArventoLoading(false);
    }
  };

  const fetchArventoVehicles = async () => {
    try {
      const response = await fetch('/api/arvento/vehicles');
      if (response.ok) {
        const data = await response.json();
        setArventoVehicles(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Arvento araçları alınamadı:', error);
    }
  };

  const matchVehicle = async (arac: Arac, arventoVehicle: ArventoVehicle) => {
    try {
      const response = await fetch(`/api/moduller/transfer/araclar/${arac.id}/match-arvento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arventoId: arventoVehicle.id })
      });
      
      if (response.ok) {
        await fetchAraclar();
        alert('Araç eşleştirildi');
      }
    } catch (error) {
      console.error('Araç eşleştirilemedi:', error);
      alert('Araç eşleştirilemedi');
    }
  };

  const unmatchVehicle = async (arac: Arac) => {
    try {
      const response = await fetch(`/api/moduller/transfer/araclar/${arac.id}/unmatch-arvento`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchAraclar();
        alert('Araç eşleştirmesi kaldırıldı');
      }
    } catch (error) {
      console.error('Eşleştirme kaldırılamadı:', error);
      alert('Eşleştirme kaldırılamadı');
    }
  };

  const autoMatchVehicles = async () => {
    try {
      const response = await fetch('/api/arvento/auto-match', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        await fetchAraclar();
        
        // Sonuçları göster
        const message = `Otomatik eşleştirme tamamlandı!\n\n` +
          `Eşleştirilen araç: ${result.matchedCount}\n` +
          `Toplam sistem araç: ${result.totalAraclar}\n` +
          `Toplam Arvento araç: ${result.totalArventoVehicles}`;
        
        if (result.errors && result.errors.length > 0) {
          alert(message + `\n\nHatalar:\n${result.errors.join('\n')}`);
        } else {
          alert(message);
        }
      }
    } catch (error) {
      console.error('Otomatik eşleştirme başarısız:', error);
      alert('Otomatik eşleştirme başarısız');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasPageAccess()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Erişim Kısıtlı</h2>
          <p className="text-gray-600 mb-4">Bu sayfaya erişim izniniz bulunmamaktadır.</p>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sayfa Başlığı */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Arvento Entegrasyon Paneli
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Arvento API konfigürasyonu ve araç eşleştirme yönetimi
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={() => setShowMap(!showMap)}
            disabled={!arventoConfig.isConnected || arventoVehicles.length === 0}
            className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              showMap 
                ? 'border-green-300 text-green-700 bg-green-50 dark:bg-green-900 dark:text-green-200' 
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {showMap ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showMap ? 'Haritayı Gizle' : 'Haritayı Göster'}
            {!arventoConfig.isConnected && <span className="ml-1 text-xs">(Bağlantı gerekli)</span>}
          </button>
          <button
            onClick={() => setLiveTrackingEnabled(!liveTrackingEnabled)}
            disabled={!arventoConfig.isConnected}
            className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              liveTrackingEnabled 
                ? 'border-green-300 text-green-700 bg-green-50 dark:bg-green-900 dark:text-green-200' 
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {liveTrackingEnabled ? <Wifi className="h-4 w-4 mr-2" /> : <WifiOff className="h-4 w-4 mr-2" />}
            {liveTrackingEnabled ? 'Canlı Takip Açık' : 'Canlı Takip'}
            {!arventoConfig.isConnected && <span className="ml-1 text-xs">(Bağlantı gerekli)</span>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Panel - Konfigürasyon */}
        <div className="lg:col-span-1 space-y-6">
          {/* Arvento Konfigürasyonu */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              <Settings className="h-5 w-5 inline mr-2" />
              Arvento Konfigürasyonu
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Anahtarı
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={arventoConfig.apiKey}
                    onChange={(e) => setArventoConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="w-full pr-10 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Arvento API anahtarınızı girin"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API URL
                </label>
                <input
                  type="text"
                  value={arventoConfig.baseUrl}
                  onChange={(e) => setArventoConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://api.arvento.com"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={saveArventoConfig}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Kaydet
                </button>
                <button
                  onClick={testArventoConnection}
                  disabled={arventoLoading}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {arventoLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Globe className="h-4 w-4 mr-2" />
                  )}
                  Test Et
                </button>
              </div>

              {/* Bağlantı Durumu */}
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                {arventoConfig.isConnected ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <X className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {arventoConfig.isConnected ? 'Bağlantı Başarılı' : 'Bağlantı Başarısız'}
                  </div>
                  {arventoConfig.lastTest && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Son test: {new Date(arventoConfig.lastTest).toLocaleString('tr-TR')}
                    </div>
                  )}
                  {arventoConfig.isConnected && arventoVehicles.length > 0 && (
                    <div className="text-xs text-green-600 dark:text-green-400">
                      {arventoVehicles.length} araç bulundu
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Eşleştirme Ayarları */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              <Link className="h-5 w-5 inline mr-2" />
              Eşleştirme Ayarları
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Eşleştirme Modu
                </label>
                <select
                  value={matchingMode}
                  onChange={(e) => setMatchingMode(e.target.value as 'auto' | 'manual')}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="auto">Otomatik (Plaka Eşleştirme)</option>
                  <option value="manual">Manuel Eşleştirme</option>
                </select>
              </div>

              <button
                onClick={autoMatchVehicles}
                disabled={!arventoConfig.isConnected}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <Link className="h-4 w-4 mr-2" />
                Otomatik Eşleştir
              </button>
            </div>
          </div>
        </div>

        {/* Sağ Panel - Araç Listesi */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sistem Araçları */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                <Car className="h-5 w-5 inline mr-2" />
                Sistem Araçları ({araclar.length})
              </h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {araclar.filter(a => a.arventoId).length} eşleşmiş / {araclar.length} toplam
              </div>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {araclar.map(arac => {
                const matchedArventoVehicle = arventoVehicles.find(av => av.id === arac.arventoId);
                const autoMatchCandidate = arventoVehicles.find(av => av.plate === arac.plaka);
                
                return (
                  <div key={arac.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Car className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {arac.plaka} - {arac.marka} {arac.model}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {arac.aracTipi} • {arac.yolcuKapasitesi} kişi • {arac.durum}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {matchedArventoVehicle ? (
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <Link className="h-4 w-4 mr-1" />
                          <span className="text-sm">Eşleşti</span>
                          <button
                            onClick={() => unmatchVehicle(arac)}
                            className="ml-2 text-red-600 hover:text-red-800"
                            title="Eşleştirmeyi Kaldır"
                          >
                            <Unlink className="h-4 w-4" />
                          </button>
                        </div>
                      ) : autoMatchCandidate ? (
                        <div className="flex items-center space-x-2">
                          <div className="text-yellow-600 dark:text-yellow-400">
                            <span className="text-sm">Eşleşebilir</span>
                          </div>
                          <button
                            onClick={() => matchVehicle(arac, autoMatchCandidate)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Eşleştir"
                          >
                            <Link className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-gray-500 dark:text-gray-400">
                          <span className="text-sm">Eşleşmedi</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Arvento Araçları */}
          {arventoConfig.isConnected && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  <Globe className="h-5 w-5 inline mr-2" />
                  Arvento Araçları ({arventoVehicles.length})
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {arventoVehicles.filter(v => araclar.some(a => a.arventoId === v.id)).length} eşleşmiş / {arventoVehicles.length} toplam
                </div>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {arventoVehicles.map(vehicle => {
                  const matchedArac = araclar.find(a => a.arventoId === vehicle.id);
                  
                  return (
                    <div key={vehicle.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Car className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {vehicle.plate} - {vehicle.brand} {vehicle.model}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {vehicle.year} • {vehicle.fuelType} • {vehicle.transmission}
                          </div>
                          {vehicle.lastLocation && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center space-x-2 mt-1">
                              <MapPin className="h-3 w-3" />
                              <span>{vehicle.lastLocation.latitude.toFixed(4)}, {vehicle.lastLocation.longitude.toFixed(4)}</span>
                              {vehicle.lastLocation.speed !== undefined && (
                                <>
                                  <Speed className="h-3 w-3" />
                                  <span>{vehicle.lastLocation.speed} km/h</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          vehicle.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : vehicle.status === 'maintenance'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {vehicle.status === 'active' ? 'Aktif' : 
                           vehicle.status === 'maintenance' ? 'Bakımda' : 'Pasif'}
                        </span>
                        
                        {matchedArac ? (
                          <div className="text-green-600 dark:text-green-400">
                            <span className="text-sm">Eşleşti</span>
                          </div>
                        ) : (
                          <div className="text-gray-500 dark:text-gray-400">
                            <span className="text-sm">Eşleşmedi</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Harita Modal */}
      {showMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-7xl max-h-[95vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Araç Konumları Haritası
              </h2>
              <button
                onClick={() => setShowMap(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="h-[calc(95vh-120px)]">
              <VehicleMap
                vehicles={arventoVehicles.filter(v => v.lastLocation)}
                onVehicleSelect={setSelectedVehicle}
                selectedVehicle={selectedVehicle}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
