'use client';

import { useState, useEffect } from 'react';
import { 
  Car, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  Search,
  Filter
} from 'lucide-react';

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

  // İzin kontrolü fonksiyonu
  const hasPermission = (permission: string): boolean => {
    return userPermissions.includes(permission) || userRole === 'ADMIN';
  };

  // Sayfa erişim kontrolü
  const hasPageAccess = (): boolean => {
    return hasPermission('transfer') || userRole === 'ADMIN';
  };

  // Form state
  const [formData, setFormData] = useState({
    plaka: '',
    marka: '',
    model: '',
    aracTipi: 'BINEK' as const,
    yolcuKapasitesi: 4,
    durum: 'MUSAIT' as const
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
  }, []);

  const fetchAraclar = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/moduller/transfer/araclar');
      if (response.ok) {
        const data = await response.json();
        setAraclar(data.araclar);
      } else {
        console.error('Araçlar alınamadı');
      }
    } catch (error) {
      console.error('Araçlar alınamadı:', error);
    } finally {
      setLoading(false);
    }
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
      aracTipi: arac.aracTipi,
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

  const filteredAraclar = araclar.filter(arac => {
    const matchesSearch = arac.plaka.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         arac.marka.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         arac.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterDurum === 'tümü' || arac.durum === filterDurum;
    return matchesSearch && matchesFilter;
  });

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
        <button
          onClick={openCreateModal}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Araç
        </button>
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
                    {arac.aracTipi === 'BINEK' && 'Binek Otomobil'}
                    {arac.aracTipi === 'MINIBUS' && 'Minibüs'}
                    {arac.aracTipi === 'MIDIBUS' && 'Midibüs'}
                    {arac.aracTipi === 'OTOBUS' && 'Otobüs'}
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

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(arac.sonGuncelleme).toLocaleString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(arac)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteArac(arac.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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
                  <option value="BINEK">Binek Otomobil</option>
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
    </div>
  );
}