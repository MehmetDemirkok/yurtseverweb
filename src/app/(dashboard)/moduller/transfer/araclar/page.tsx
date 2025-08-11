'use client';

import { useState, useEffect } from 'react';
import { 
  Car, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  Search,
  Filter,
  MapPin,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings
} from 'lucide-react';
import { ArventoVehicle } from '@/lib/arvento';

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
  arventoId?: string; // Arvento entegrasyonu için
  arventoData?: ArventoVehicle; // Arvento verileri
}

export default function AraclarPage() {
  const [araclar, setAraclar] = useState<Arac[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDurum, setFilterDurum] = useState<string>('tümü');
  const [showModal, setShowModal] = useState(false);
  const [editingArac, setEditingArac] = useState<Arac | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  
  // Arvento entegrasyonu için state'ler
  const [arventoVehicles, setArventoVehicles] = useState<ArventoVehicle[]>([]);
  const [arventoLoading, setArventoLoading] = useState(false);
  const [showArventoModal, setShowArventoModal] = useState(false);
  const [selectedArventoVehicle, setSelectedArventoVehicle] = useState<ArventoVehicle | null>(null);
  const [liveTrackingEnabled, setLiveTrackingEnabled] = useState(false);

  // İzin kontrolü fonksiyonu
  const hasPermission = (permission: string): boolean => {
    return userPermissions.includes(permission) || userRole === 'ADMIN';
  };

  // Sayfa erişim kontrolü
  const hasPageAccess = (): boolean => {
    // Admin her zaman erişebilir
    if (userRole === 'ADMIN') {
      console.log('Admin access granted for araclar page');
      return true;
    }
    // Diğer roller için transfer permission kontrolü
    const hasAccess = hasPermission('transfer');
    console.log('Page access check:', { userRole, userPermissions, hasAccess });
    return hasAccess;
  };

  // Form state
  const [formData, setFormData] = useState({
    plaka: '',
    marka: '',
    model: '',
    aracTipi: 'BINEK' as 'BINEK' | 'MINIBUS' | 'MIDIBUS' | 'OTOBUS',
    yolcuKapasitesi: 4,
    durum: 'MUSAIT' as 'MUSAIT' | 'TRANSFERDE' | 'BAKIMDA'
  });
  
  // Form validation
  const [formErrors, setFormErrors] = useState({
    plaka: '',
    marka: '',
    model: '',
    aracTipi: '',
    yolcuKapasitesi: ''
  });
  
  // Plaka formatını kontrol eden fonksiyon
  const validatePlaka = (plaka: string) => {
    // Türk plaka formatı: 2 rakam + boşluk + 1-3 harf + boşluk + 2-4 rakam
    const plakaRegex = /^(0[1-9]|[1-7][0-9]|8[0-1])\s[A-Z]{1,3}\s\d{2,4}$/;
    return plakaRegex.test(plaka.toUpperCase());
  };

  useEffect(() => {
    // Kullanıcı bilgilerini al
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

    fetchUserData();
    fetchAraclar();
    fetchArventoVehicles();
  }, []);

  // Canlı takip için interval
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (liveTrackingEnabled) {
      interval = setInterval(() => {
        const arventoIds = araclar
          .filter(a => a.arventoId)
          .map(a => a.arventoId!);
        
        if (arventoIds.length > 0) {
          fetchLiveTracking(arventoIds).then(vehicles => {
            if (vehicles && vehicles.length > 0) {
              setAraclar(prev => 
                prev.map(arac => {
                  const arventoVehicle = vehicles.find(v => v.id === arac.arventoId);
                  if (arventoVehicle) {
                    return {
                      ...arac,
                      arventoData: arventoVehicle
                    };
                  }
                  return arac;
                })
              );
            }
          });
        }
      }, 30000); // 30 saniyede bir güncelle
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [liveTrackingEnabled, araclar]);

  const fetchAraclar = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/moduller/transfer/araclar');
      if (response.ok) {
        const data = await response.json();
        // API doğrudan array döndürüyor, data.araclar değil
        setAraclar(Array.isArray(data) ? data : []);
      } else {
        console.error('Araçlar alınamadı');
        setAraclar([]);
      }
    } catch (error) {
      console.error('Araçlar alınamadı:', error);
      setAraclar([]);
    } finally {
      setLoading(false);
    }
  };

  // Arvento araçlarını getir
  const fetchArventoVehicles = async () => {
    try {
      setArventoLoading(true);
      const response = await fetch('/api/arvento/vehicles');
      if (response.ok) {
        const data = await response.json();
        setArventoVehicles(Array.isArray(data) ? data : []);
      } else {
        console.error('Arvento araçları alınamadı');
        setArventoVehicles([]);
      }
    } catch (error) {
      console.error('Arvento araçları alınamadı:', error);
      setArventoVehicles([]);
    } finally {
      setArventoLoading(false);
    }
  };

  // Arvento araç detaylarını getir
  const fetchArventoVehicleDetails = async (arventoId: string) => {
    try {
      const response = await fetch(`/api/arvento/vehicles/${arventoId}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Arvento araç detayları alınamadı:', error);
    }
    return null;
  };

  // Arvento araç konumunu getir
  const fetchArventoVehicleLocation = async (arventoId: string) => {
    try {
      const response = await fetch(`/api/arvento/vehicles/${arventoId}/location`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Arvento araç konumu alınamadı:', error);
    }
    return null;
  };

  // Canlı takip verilerini getir
  const fetchLiveTracking = async (vehicleIds: string[]) => {
    try {
      const response = await fetch('/api/arvento/live-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vehicleIds }),
      });
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Canlı takip verileri alınamadı:', error);
    }
    return [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validasyonu
    let hasError = false;
    const newErrors = { ...formErrors };
    
    // Plaka validasyonu
    if (!formData.plaka.trim()) {
      newErrors.plaka = 'Plaka alanı zorunludur';
      hasError = true;
    } else if (!validatePlaka(formData.plaka)) {
      newErrors.plaka = 'Geçerli bir plaka formatı giriniz (örn: 34 ABC 123)';
      hasError = true;
    } else {
      newErrors.plaka = '';
    }
    
    // Marka validasyonu
    if (!formData.marka.trim()) {
      newErrors.marka = 'Marka alanı zorunludur';
      hasError = true;
    } else {
      newErrors.marka = '';
    }
    
    // Model validasyonu
    if (!formData.model.trim()) {
      newErrors.model = 'Model alanı zorunludur';
      hasError = true;
    } else {
      newErrors.model = '';
    }
    
    // Yolcu kapasitesi validasyonu
    if (isNaN(formData.yolcuKapasitesi) || formData.yolcuKapasitesi < 1) {
      newErrors.yolcuKapasitesi = 'Geçerli bir yolcu kapasitesi giriniz (en az 1)';
      hasError = true;
    } else {
      newErrors.yolcuKapasitesi = '';
    }
    
    setFormErrors(newErrors);
    
    if (hasError) {
      return;
    }
    
    try {
      if (editingArac) {
        // Güncelleme işlemi
        await updateArac(editingArac.id, formData);
      } else {
        // Yeni araç ekleme
        await createArac(formData);
      }
      setShowModal(false);
      setEditingArac(null);
      resetForm();
      fetchAraclar();
    } catch (error: any) {
      console.error('Araç kaydedilemedi:', error);
      // API'den gelen hata mesajını göster
      if (error.message) {
        alert(error.message);
      }
    }
  };

  const createArac = async (data: typeof formData) => {
    const response = await fetch('/api/moduller/transfer/araclar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Araç oluşturulamadı');
    }

    return response.json();
  };

  const updateArac = async (id: string, data: typeof formData) => {
    const response = await fetch(`/api/moduller/transfer/araclar/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Araç güncellenemedi');
    }

    return response.json();
  };

  const deleteArac = async (id: string) => {
    if (window.confirm('Bu aracı silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/moduller/transfer/araclar/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          alert(errorData.error || 'Araç silinemedi');
          return;
        }

        fetchAraclar();
      } catch (error) {
        console.error('Araç silinemedi:', error);
        alert('Araç silinemedi');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      plaka: '',
      marka: '',
      model: '',
      aracTipi: 'BINEK',
      yolcuKapasitesi: 4,
      durum: 'MUSAIT'
    });
    setFormErrors({
      plaka: '',
      marka: '',
      model: '',
      aracTipi: '',
      yolcuKapasitesi: ''
    });
  };

  const openEditModal = (arac: Arac) => {
    setEditingArac(arac);
    setFormData({
      plaka: arac.plaka,
      marka: arac.marka,
      model: arac.model,
      aracTipi: arac.aracTipi || 'BINEK',
      yolcuKapasitesi: arac.yolcuKapasitesi,
      durum: arac.durum
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingArac(null);
    resetForm();
    setShowModal(true);
  };

  const getDurumRenk = (durum: string) => {
    switch (durum) {
      case 'MUSAIT': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'TRANSFERDE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'BAKIMDA': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getAracTipiText = (aracTipi: string) => {
    switch (aracTipi) {
      case 'BINEK':
        return 'Binek / Otomobil';
      case 'MINIBUS':
        return 'Minibüs';
      case 'MIDIBUS':
        return 'Midibüs';
      case 'OTOBUS':
        return 'Otobüs';
      default:
        return aracTipi;
    }
  };

  // Arvento araç durumunu kontrol et
  const getArventoStatus = (arac: Arac) => {
    if (!arac.arventoData) return null;
    
    const hasLocation = arac.arventoData.lastLocation;
    const isOnline = hasLocation && 
      new Date(arac.arventoData.lastLocation.timestamp).getTime() > Date.now() - 5 * 60 * 1000; // 5 dakika
    
    return {
      isOnline,
      hasLocation,
      lastUpdate: arac.arventoData.lastLocation?.timestamp,
      speed: arac.arventoData.lastLocation?.speed,
      heading: arac.arventoData.lastLocation?.heading
    };
  };

  // Arvento araç eşleştirme
  const matchArventoVehicle = (arac: Arac) => {
    return arventoVehicles.find(av => av.plate === arac.plaka);
  };

  // Arvento araç detaylarını yükle
  const loadArventoDetails = async (arac: Arac) => {
    const matchedVehicle = matchArventoVehicle(arac);
    if (matchedVehicle) {
      const details = await fetchArventoVehicleDetails(matchedVehicle.id);
      const location = await fetchArventoVehicleLocation(matchedVehicle.id);
      
      if (details) {
        const updatedArac = {
          ...arac,
          arventoId: matchedVehicle.id,
          arventoData: {
            ...details,
            lastLocation: location
          }
        };
        
        setAraclar(prev => 
          prev.map(a => a.id === arac.id ? updatedArac : a)
        );
      }
    }
  };

  const filteredAraclar = araclar?.filter(arac => {
    const matchesSearch = arac.plaka.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         arac.marka.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         arac.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterDurum === 'tümü' || arac.durum === filterDurum;
    return matchesSearch && matchesFilter;
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Sayfa erişim kontrolü
  if (!hasPageAccess()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
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
            Araç Yönetimi
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Araç ekleme, düzenleme ve takip işlemleri
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={() => setShowArventoModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Settings className="h-4 w-4 mr-2" />
            Arvento Entegrasyonu
          </button>
          <button
            onClick={() => {
              setLiveTrackingEnabled(!liveTrackingEnabled);
              if (!liveTrackingEnabled) {
                // Canlı takibi başlat
                const arventoIds = araclar
                  .filter(a => a.arventoId)
                  .map(a => a.arventoId!);
                if (arventoIds.length > 0) {
                  fetchLiveTracking(arventoIds);
                }
              }
            }}
            className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              liveTrackingEnabled 
                ? 'border-green-300 text-green-700 bg-green-50 dark:bg-green-900 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-800' 
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {liveTrackingEnabled ? <Wifi className="h-4 w-4 mr-2" /> : <WifiOff className="h-4 w-4 mr-2" />}
            {liveTrackingEnabled ? 'Canlı Takip Açık' : 'Canlı Takip'}
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Araç
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ara
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Plaka, marka veya model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Durum Filtresi
            </label>
            <select
              value={filterDurum}
              onChange={(e) => setFilterDurum(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                             <option value="tümü">Tümü</option>
               <option value="MUSAIT">Müsait</option>
               <option value="TRANSFERDE">Transferde</option>
               <option value="BAKIMDA">Bakımda</option>
            </select>
          </div>
        </div>
      </div>

      {/* Araçlar Tablosu */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Plaka
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Marka/Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Araç Tipi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Kapasite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Arvento Durumu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Son Güncelleme
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAraclar.map((arac) => (
                <tr key={arac.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {arac.plaka}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {arac.marka} {arac.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {getAracTipiText(arac.aracTipi)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {arac.yolcuKapasitesi} kişi
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDurumRenk(arac.durum)}`}>
                      {arac.durum === 'MUSAIT' && 'Müsait'}
                      {arac.durum === 'TRANSFERDE' && 'Transferde'}
                      {arac.durum === 'BAKIMDA' && 'Bakımda'}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const arventoStatus = getArventoStatus(arac);
                      if (!arventoStatus) {
                        return (
                          <div className="flex items-center">
                            <WifiOff className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">Bağlı Değil</span>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="flex items-center">
                          {arventoStatus.isOnline ? (
                            <Wifi className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <WifiOff className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <div className="text-xs">
                            <div className={`font-medium ${arventoStatus.isOnline ? 'text-green-700' : 'text-red-700'}`}>
                              {arventoStatus.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                            </div>
                            {arventoStatus.speed !== undefined && (
                              <div className="text-gray-500">
                                {arventoStatus.speed} km/h
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(arac.sonGuncelleme).toLocaleString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(arac)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {arac.arventoId && (
                        <button
                          onClick={() => loadArventoDetails(arac)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Arvento Detayları"
                        >
                          <MapPin className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteArac(arac.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAraclar.length === 0 && (
          <div className="text-center py-8">
            <Car className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Araç bulunamadı
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Arama kriterlerinize uygun araç bulunmuyor.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingArac ? 'Araç Düzenle' : 'Yeni Araç Ekle'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plaka
                </label>
                <input
                  type="text"
                  value={formData.plaka}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    setFormData({...formData, plaka: value});
                    // Anlık validasyon
                    if (value && !validatePlaka(value)) {
                      setFormErrors({...formErrors, plaka: 'Geçerli bir plaka formatı giriniz (örn: 34 ABC 123)'});
                    } else {
                      setFormErrors({...formErrors, plaka: ''});
                    }
                  }}
                  className={`w-full border ${formErrors.plaka ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${formErrors.plaka ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                  placeholder="Plaka girin (34 ABC 123)"
                />
                {formErrors.plaka && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.plaka}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Marka
                  </label>
                  <input
                    type="text"
                    value={formData.marka}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({...formData, marka: value});
                      if (!value.trim()) {
                        setFormErrors({...formErrors, marka: 'Marka alanı zorunludur'});
                      } else {
                        setFormErrors({...formErrors, marka: ''});
                      }
                    }}
                    className={`w-full border ${formErrors.marka ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${formErrors.marka ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                    placeholder="Marka girin"
                  />
                  {formErrors.marka && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.marka}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({...formData, model: value});
                      if (!value.trim()) {
                        setFormErrors({...formErrors, model: 'Model alanı zorunludur'});
                      } else {
                        setFormErrors({...formErrors, model: ''});
                      }
                    }}
                    className={`w-full border ${formErrors.model ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${formErrors.model ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                    placeholder="Model girin"
                  />
                  {formErrors.model && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.model}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Araç Tipi
                </label>
                <select
                  value={formData.aracTipi}
                  onChange={(e) => setFormData({...formData, aracTipi: e.target.value as any})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BINEK">Binek / Otomobil</option>
                  <option value="MINIBUS">Minibüs</option>
                  <option value="MIDIBUS">Midibüs</option>
                  <option value="OTOBUS">Otobüs</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Yolcu Kapasitesi
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.yolcuKapasitesi}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setFormData({...formData, yolcuKapasitesi: value});
                    if (isNaN(value) || value < 1) {
                      setFormErrors({...formErrors, yolcuKapasitesi: 'Geçerli bir yolcu kapasitesi giriniz (en az 1)'});
                    } else {
                      setFormErrors({...formErrors, yolcuKapasitesi: ''});
                    }
                  }}
                  className={`w-full border ${formErrors.yolcuKapasitesi ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${formErrors.yolcuKapasitesi ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                />
                {formErrors.yolcuKapasitesi && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.yolcuKapasitesi}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Durum
                </label>
                <select
                  value={formData.durum}
                  onChange={(e) => setFormData({...formData, durum: e.target.value as any})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                                     <option value="MUSAIT">Müsait</option>
                   <option value="TRANSFERDE">Transferde</option>
                   <option value="BAKIMDA">Bakımda</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingArac ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Arvento Entegrasyonu Modal */}
      {showArventoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Arvento Entegrasyonu
              </h2>
              <button
                onClick={() => setShowArventoModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Arvento Bağlantı Durumu */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Bağlantı Durumu
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    {arventoLoading ? (
                      <RefreshCw className="h-4 w-4 text-blue-500 animate-spin mr-2" />
                    ) : arventoVehicles.length > 0 ? (
                      <Wifi className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {arventoLoading 
                        ? 'Bağlantı kontrol ediliyor...' 
                        : arventoVehicles.length > 0 
                          ? `${arventoVehicles.length} araç Arvento'da bulundu` 
                          : 'Arvento bağlantısı kurulamadı'
                      }
                    </span>
                  </div>
                  <button
                    onClick={fetchArventoVehicles}
                    disabled={arventoLoading}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                  >
                    Yenile
                  </button>
                </div>
              </div>

              {/* Araç Eşleştirme */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                  Araç Eşleştirme
                </h3>
                <div className="space-y-3">
                  {araclar.map(arac => {
                    const matchedVehicle = matchArventoVehicle(arac);
                    return (
                      <div key={arac.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Car className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {arac.plaka} - {arac.marka} {arac.model}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {getAracTipiText(arac.aracTipi)} • {arac.yolcuKapasitesi} kişi
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {matchedVehicle ? (
                            <div className="flex items-center text-green-600 dark:text-green-400">
                              <Wifi className="h-4 w-4 mr-1" />
                              <span className="text-sm">Eşleşti</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-gray-500 dark:text-gray-400">
                              <WifiOff className="h-4 w-4 mr-1" />
                              <span className="text-sm">Eşleşmedi</span>
                            </div>
                          )}
                          {matchedVehicle && (
                            <button
                              onClick={() => loadArventoDetails(arac)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Arvento Araçları */}
              {arventoVehicles.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                    Arvento Araçları ({arventoVehicles.length})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {arventoVehicles.map(vehicle => (
                      <div key={vehicle.id} className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 rounded">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {vehicle.plate} - {vehicle.brand} {vehicle.model}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {vehicle.year} • {vehicle.fuelType} • {vehicle.transmission}
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
                          {vehicle.driver && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Şoför: {vehicle.driver.name}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ayarlar */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Ayarlar
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Canlı Takip
                    </span>
                    <button
                      onClick={() => setLiveTrackingEnabled(!liveTrackingEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        liveTrackingEnabled 
                          ? 'bg-blue-600' 
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        liveTrackingEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Canlı takip açıkken araçların konumları otomatik olarak güncellenir.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setShowArventoModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}