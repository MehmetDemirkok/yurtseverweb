'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  Car,
  Search,
  UserCheck
} from 'lucide-react';

interface Sofor {
  id: string;
  ad: string;
  soyad: string;
  telefon: string;
  ehliyetSinifi: string;
  ehliyetSiniflari: string[];
  srcBelgeleri: string[];
  atananAracId: string | null;
  atananArac: {
    id: string;
    plaka: string;
  } | null;
  durum: 'MUSAIT' | 'TRANSFERDE' | 'IZINLI';
  createdAt: string;
  updatedAt?: string;
}

export default function SoforlerPage() {
  const [soforler, setSoforler] = useState<Sofor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDurum, setFilterDurum] = useState<string>('tümü');
  const [showModal, setShowModal] = useState(false);
  const [editingSofor, setEditingSofor] = useState<Sofor | null>(null);
  const [araclar, setAraclar] = useState<any[]>([]);
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
    ad: '',
    soyad: '',
    telefon: '',
    ehliyetSinifi: 'B',
    ehliyetSiniflari: ['B'] as string[],
    srcBelgeleri: [] as string[],
    atananAracId: '',
    durum: 'MUSAIT' as 'MUSAIT' | 'TRANSFERDE' | 'IZINLI'
  });
  
  // Form validation state
  const [formErrors, setFormErrors] = useState({
    ad: '',
    soyad: '',
    telefon: ''
  });
  
  // Telefon numarası validasyonu
  const validateTelefon = (telefon: string) => {
    // Türkiye telefon formatı: 05XX XXX XX XX veya 5XX XXX XX XX
    const telefonRegex = /^(0?5[0-9]{2})[\s]?([0-9]{3})[\s]?([0-9]{2})[\s]?([0-9]{2})$/;
    return telefonRegex.test(telefon);
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
    fetchSoforler();
    fetchAraclar();
  }, []);

  const fetchSoforler = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/moduller/transfer/soforler');
      if (response.ok) {
        const data = await response.json();
        setSoforler(data.soforler);
      } else {
        console.error('Şoförler alınamadı');
      }
    } catch (error) {
      console.error('Şoförler alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAraclar = async () => {
    try {
      const response = await fetch('/api/moduller/transfer/araclar');
      if (response.ok) {
        const data = await response.json();
        setAraclar(data.araclar);
      }
    } catch (error) {
      console.error('Araçlar alınamadı:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validasyonu
    let hasError = false;
    const newErrors = { ...formErrors };
    
    // Ad validasyonu
    if (!formData.ad.trim()) {
      newErrors.ad = 'Ad alanı zorunludur';
      hasError = true;
    } else {
      newErrors.ad = '';
    }
    
    // Soyad validasyonu
    if (!formData.soyad.trim()) {
      newErrors.soyad = 'Soyad alanı zorunludur';
      hasError = true;
    } else {
      newErrors.soyad = '';
    }
    
    // Telefon validasyonu
    if (!formData.telefon.trim()) {
      newErrors.telefon = 'Telefon alanı zorunludur';
      hasError = true;
    } else if (!validateTelefon(formData.telefon)) {
      newErrors.telefon = 'Geçerli bir telefon numarası giriniz (örn: 0555 123 45 67)';
      hasError = true;
    } else {
      newErrors.telefon = '';
    }
    
    setFormErrors(newErrors);
    
    if (hasError) {
      alert('Lütfen form alanlarını kontrol ediniz');
      return;
    }
    
    try {
      if (editingSofor) {
        // Güncelleme işlemi
        await updateSofor(editingSofor.id, formData);
      } else {
        // Yeni şoför ekleme
        await createSofor(formData);
      }
      setShowModal(false);
      setEditingSofor(null);
      resetForm();
      fetchSoforler();
    } catch (error: any) {
      console.error('Şoför kaydedilemedi:', error);
      alert(error.message || 'Şoför kaydedilemedi');
    }
  };

  const createSofor = async (data: typeof formData) => {
    const response = await fetch('/api/moduller/transfer/soforler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Şoför oluşturulamadı');
    }

    return response.json();
  };

  const updateSofor = async (id: string, data: typeof formData) => {
    const response = await fetch(`/api/moduller/transfer/soforler/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Şoför güncellenemedi');
    }

    return response.json();
  };

  const deleteSofor = async (id: string) => {
    if (window.confirm('Bu şoförü silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/moduller/transfer/soforler/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          alert(errorData.error || 'Şoför silinemedi');
          return;
        }

        fetchSoforler();
      } catch (error) {
        console.error('Şoför silinemedi:', error);
        alert('Şoför silinemedi');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      ad: '',
      soyad: '',
      telefon: '',
      ehliyetSinifi: 'B',
      ehliyetSiniflari: ['B'] as string[],
      srcBelgeleri: [] as string[],
      atananAracId: '',
      durum: 'MUSAIT' as 'MUSAIT' | 'TRANSFERDE' | 'IZINLI'
    });
    
    setFormErrors({
      ad: '',
      soyad: '',
      telefon: ''
    });
  };

  const openEditModal = (sofor: Sofor) => {
    setEditingSofor(sofor);
    setFormData({
      ad: sofor.ad,
      soyad: sofor.soyad,
      telefon: sofor.telefon,
      ehliyetSinifi: sofor.ehliyetSinifi,
      ehliyetSiniflari: sofor.ehliyetSiniflari || [sofor.ehliyetSinifi] as string[], // Geriye uyumluluk için
      srcBelgeleri: sofor.srcBelgeleri || [] as string[],
      atananAracId: sofor.atananAracId || '',
      durum: sofor.durum as 'MUSAIT' | 'TRANSFERDE' | 'IZINLI'
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingSofor(null);
    resetForm();
    setShowModal(true);
  };

  const getDurumRenk = (durum: string) => {
    switch (durum) {
      case 'MUSAIT': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'TRANSFERDE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'IZINLI': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const filteredSoforler = soforler.filter(sofor => {
    const matchesSearch = sofor.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sofor.soyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sofor.telefon.includes(searchTerm);
    const matchesFilter = filterDurum === 'tümü' || sofor.durum === filterDurum;
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
            Şoför Yönetimi
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Şoför ekleme, düzenleme ve takip işlemleri
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Şoför
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
                placeholder="Ad, soyad veya telefon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
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
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
                             <option value="tümü">Tümü</option>
               <option value="MUSAIT">Müsait</option>
               <option value="TRANSFERDE">Transferde</option>
               <option value="IZINLI">İzinli</option>
            </select>
          </div>
        </div>
      </div>

      {/* Şoförler Tablosu */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ad Soyad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Telefon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ehliyet Sınıfı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Atanan Araç
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Kayıt Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSoforler.map((sofor) => (
                <tr key={sofor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <UserCheck className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {sofor.ad} {sofor.soyad}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {sofor.telefon}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(sofor.ehliyetSiniflari) ? sofor.ehliyetSiniflari.map((ehliyet, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {ehliyet}
                        </span>
                      )) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {sofor.ehliyetSinifi}
                        </span>
                      )}
                      {Array.isArray(sofor.srcBelgeleri) && sofor.srcBelgeleri.length > 0 && sofor.srcBelgeleri.map((src, index) => (
                        <span key={`src-${index}`} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          {src}
                        </span>
                      ))}
                    </div>
                  </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                     {sofor.atananArac ? (
                       <div className="flex items-center">
                         <Car className="h-4 w-4 mr-1" />
                         {sofor.atananArac.plaka}
                       </div>
                     ) : (
                       <span className="text-gray-400 dark:text-gray-500">Atanmamış</span>
                     )}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                                         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDurumRenk(sofor.durum)}`}>
                       {sofor.durum === 'MUSAIT' && 'Müsait'}
                       {sofor.durum === 'TRANSFERDE' && 'Transferde'}
                       {sofor.durum === 'IZINLI' && 'İzinli'}
                     </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(sofor.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(sofor)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteSofor(sofor.id)}
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
        {filteredSoforler.length === 0 && (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Şoför bulunamadı
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Arama kriterlerinize uygun şoför bulunmuyor.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingSofor ? 'Şoför Düzenle' : 'Yeni Şoför Ekle'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ad
                  </label>
                  <input
                    type="text"
                    value={formData.ad}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({...formData, ad: value});
                      if (!value.trim()) {
                        setFormErrors({...formErrors, ad: 'Ad alanı zorunludur'});
                      } else {
                        setFormErrors({...formErrors, ad: ''});
                      }
                    }}
                    className={`w-full border ${formErrors.ad ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${formErrors.ad ? 'focus:ring-red-500' : 'focus:ring-green-500'}`}
                    placeholder="Ad girin"
                  />
                  {formErrors.ad && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.ad}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Soyad
                  </label>
                  <input
                    type="text"
                    value={formData.soyad}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({...formData, soyad: value});
                      if (!value.trim()) {
                        setFormErrors({...formErrors, soyad: 'Soyad alanı zorunludur'});
                      } else {
                        setFormErrors({...formErrors, soyad: ''});
                      }
                    }}
                    className={`w-full border ${formErrors.soyad ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${formErrors.soyad ? 'focus:ring-red-500' : 'focus:ring-green-500'}`}
                    placeholder="Soyad girin"
                  />
                  {formErrors.soyad && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.soyad}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.telefon}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({...formData, telefon: value});
                    if (!value.trim()) {
                      setFormErrors({...formErrors, telefon: 'Telefon alanı zorunludur'});
                    } else if (!validateTelefon(value)) {
                      setFormErrors({...formErrors, telefon: 'Geçerli bir telefon numarası giriniz (örn: 0555 123 45 67)'});
                    } else {
                      setFormErrors({...formErrors, telefon: ''});
                    }
                  }}
                  className={`w-full border ${formErrors.telefon ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${formErrors.telefon ? 'focus:ring-red-500' : 'focus:ring-green-500'}`}
                  placeholder="Telefon numarası girin (0555 123 45 67)"
                />
                {formErrors.telefon && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.telefon}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ehliyet Sınıfları
                </label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {['A1', 'A2', 'A', 'B1', 'B', 'C1', 'C', 'D1', 'D', 'BE', 'C1E', 'CE', 'D1E', 'DE', 'F', 'G', 'M'].map((ehliyet) => (
                    <div key={ehliyet} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`ehliyet-${ehliyet}`}
                        checked={formData.ehliyetSiniflari.includes(ehliyet)}
                        onChange={(e) => {
                           if (e.target.checked) {
                             setFormData({
                               ...formData,
                               ehliyetSiniflari: [...formData.ehliyetSiniflari, ehliyet] as string[],
                               ehliyetSinifi: formData.ehliyetSiniflari.length === 0 ? ehliyet : formData.ehliyetSinifi
                             });
                           } else {
                             const updatedEhliyetler = formData.ehliyetSiniflari.filter(e => e !== ehliyet) as string[];
                             setFormData({
                               ...formData,
                               ehliyetSiniflari: updatedEhliyetler,
                               ehliyetSinifi: updatedEhliyetler.length > 0 ? updatedEhliyetler[0] : ''
                             });
                           }
                         }}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`ehliyet-${ehliyet}`} className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                        {ehliyet}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  SRC Belgeleri
                </label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {['SRC1', 'SRC2', 'SRC3', 'SRC4', 'SRC5'].map((src) => (
                    <div key={src} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`src-${src}`}
                        checked={formData.srcBelgeleri.includes(src)}
                        onChange={(e) => {
                           if (e.target.checked) {
                             setFormData({...formData, srcBelgeleri: [...formData.srcBelgeleri, src] as string[]});
                           } else {
                             setFormData({...formData, srcBelgeleri: formData.srcBelgeleri.filter(s => s !== src) as string[]});
                           }
                         }}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`src-${src}`} className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                        {src}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Atanan Araç
                </label>
                <select
                  value={formData.atananAracId}
                  onChange={(e) => setFormData({...formData, atananAracId: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Araç Atanmamış</option>
                  {araclar.map((arac) => (
                    <option key={arac.id} value={arac.id}>
                      {arac.plaka} - {arac.marka} {arac.model}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Durum
                </label>
                <select
                  value={formData.durum}
                  onChange={(e) => setFormData({...formData, durum: e.target.value as any})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                                     <option value="MUSAIT">Müsait</option>
                   <option value="TRANSFERDE">Transferde</option>
                   <option value="IZINLI">İzinli</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {editingSofor ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}