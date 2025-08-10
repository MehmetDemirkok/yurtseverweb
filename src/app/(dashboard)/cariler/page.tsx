'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  FileDown,
  Mail,
  Phone,
  MapPin,
  Building
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Cari {
  id: string;
  ad: string;
  soyad: string | null;
  sirket: string | null;
  email: string | null;
  telefon: string | null;
  adres: string | null;
  sehir: string | null;
  ulke: string;
  vergiNo: string | null;
  vergiDairesi: string | null;
  notlar: string | null;
  tip: 'MUSTERI' | 'BAYI' | 'KURUMSAL';
  durum: 'AKTIF' | 'PASIF' | 'ENGELLI';
  createdAt: string;
}

export default function CarilerPage() {
  const [cariler, setCariler] = useState<Cari[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTip, setFilterTip] = useState<string>('tümü');
  const [filterDurum, setFilterDurum] = useState<string>('tümü');
  const [showModal, setShowModal] = useState(false);
  const [editingCari, setEditingCari] = useState<Cari | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string>('');

  // İzin kontrolü fonksiyonu
  const hasPermission = (permission: string): boolean => {
    return userPermissions.includes(permission) || userRole === 'ADMIN';
  };

  // Sayfa erişim kontrolü
  const hasPageAccess = (): boolean => {
    return hasPermission('cariler') || userRole === 'ADMIN';
  };

  // Form state
  const [formData, setFormData] = useState({
    ad: '',
    soyad: '',
    sirket: '',
    email: '',
    telefon: '',
    adres: '',
    sehir: '',
    ulke: 'Türkiye',
    vergiNo: '',
    vergiDairesi: '',
    notlar: '',
    tip: 'MUSTERI' as 'MUSTERI' | 'BAYI' | 'KURUMSAL',
    durum: 'AKTIF' as 'AKTIF' | 'PASIF' | 'ENGELLI'
  });
  
  // Form validation state
  const [formErrors, setFormErrors] = useState({
    ad: '',
    email: ''
  });

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
    fetchCariler();
  }, []);

  const fetchCariler = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cariler');
      if (response.ok) {
        const data = await response.json();
        setCariler(data.cariler);
      } else {
        console.error('Cariler alınamadı');
      }
    } catch (error) {
      console.error('Cariler alınamadı:', error);
    } finally {
      setLoading(false);
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
    
    // Email validasyonu (varsa)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçersiz email formatı';
      hasError = true;
    } else {
      newErrors.email = '';
    }
    
    setFormErrors(newErrors);
    
    if (hasError) {
      alert('Lütfen form alanlarını kontrol ediniz');
      return;
    }
    
    try {
      if (editingCari) {
        await updateCari(editingCari.id, formData);
      } else {
        await createCari(formData);
      }
      setShowModal(false);
      setEditingCari(null);
      resetForm();
      fetchCariler();
    } catch (error: any) {
      console.error('Cari kaydedilemedi:', error);
      alert(error.message || 'Cari kaydedilemedi');
    }
  };

  const createCari = async (data: typeof formData) => {
    const response = await fetch('/api/cariler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Cari oluşturulamadı');
    }

    return response.json();
  };

  const updateCari = async (id: string, data: typeof formData) => {
    const response = await fetch(`/api/cariler/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Cari güncellenemedi');
    }

    return response.json();
  };

  const deleteCari = async (id: string) => {
    if (window.confirm('Bu cariyi silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/cariler/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          alert(errorData.error || 'Cari silinemedi');
          return;
        }

        fetchCariler();
      } catch (error) {
        console.error('Cari silinemedi:', error);
        alert('Cari silinemedi');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      ad: '',
      soyad: '',
      sirket: '',
      email: '',
      telefon: '',
      adres: '',
      sehir: '',
      ulke: 'Türkiye',
      vergiNo: '',
      vergiDairesi: '',
      notlar: '',
      tip: 'MUSTERI',
      durum: 'AKTIF'
    });
    
    setFormErrors({
      ad: '',
      email: ''
    });
  };

  const openEditModal = (cari: Cari) => {
    setEditingCari(cari);
    setFormData({
      ad: cari.ad,
      soyad: cari.soyad || '',
      sirket: cari.sirket || '',
      email: cari.email || '',
      telefon: cari.telefon || '',
      adres: cari.adres || '',
      sehir: cari.sehir || '',
      ulke: cari.ulke,
      vergiNo: cari.vergiNo || '',
      vergiDairesi: cari.vergiDairesi || '',
      notlar: cari.notlar || '',
      tip: cari.tip,
      durum: cari.durum
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingCari(null);
    resetForm();
    setShowModal(true);
  };

  const getDurumRenk = (durum: string) => {
    switch (durum) {
      case 'AKTIF': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PASIF': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'ENGELLI': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTipRenk = (tip: string) => {
    switch (tip) {
      case 'MUSTERI': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'BAYI': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'KURUMSAL': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };
  
  // Excel'e aktarma fonksiyonu
  const exportToExcel = () => {
    const exportData = filteredCariler.map(cari => ({
      'Ad': cari.ad,
      'Soyad': cari.soyad || '-',
      'Şirket': cari.sirket || '-',
      'Email': cari.email || '-',
      'Telefon': cari.telefon || '-',
      'Şehir': cari.sehir || '-',
      'Ülke': cari.ulke,
      'Vergi No': cari.vergiNo || '-',
      'Vergi Dairesi': cari.vergiDairesi || '-',
      'Tip': cari.tip === 'MUSTERI' ? 'Müşteri' : 
            cari.tip === 'BAYI' ? 'Bayi' : 'Kurumsal',
      'Durum': cari.durum === 'AKTIF' ? 'Aktif' : 
               cari.durum === 'PASIF' ? 'Pasif' : 'Engelli',
      'Notlar': cari.notlar || '-',
      'Oluşturulma Tarihi': new Date(cari.createdAt).toLocaleDateString('tr-TR')
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cariler');
    
    const today = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
    XLSX.writeFile(workbook, `Cariler_${today}.xlsx`);
  };

  const filteredCariler = cariler.filter(cari => {
    const matchesSearch = cari.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (cari.soyad && cari.soyad.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (cari.sirket && cari.sirket.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (cari.email && cari.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTip = filterTip === 'tümü' || cari.tip === filterTip;
    const matchesDurum = filterDurum === 'tümü' || cari.durum === filterDurum;
    return matchesSearch && matchesTip && matchesDurum;
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
            Cari Yönetimi
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Müşteri, bayi ve kurumsal cari kayıtlarını yönetin
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Cari
        </button>
      </div>

      {/* Filtreler */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ara
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Ad, soyad, şirket, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tip Filtresi
            </label>
            <select
              value={filterTip}
              onChange={(e) => setFilterTip(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="tümü">Tümü</option>
              <option value="MUSTERI">Müşteri</option>
              <option value="BAYI">Bayi</option>
              <option value="KURUMSAL">Kurumsal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Durum Filtresi
            </label>
            <select
              value={filterDurum}
              onChange={(e) => setFilterDurum(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="tümü">Tümü</option>
              <option value="AKTIF">Aktif</option>
              <option value="PASIF">Pasif</option>
              <option value="ENGELLI">Engelli</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Excel'e Aktar
            </label>
            <button
              onClick={exportToExcel}
              className="w-full flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-green-600 hover:bg-green-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Excel İndir
            </button>
          </div>
        </div>
      </div>

      {/* Cariler Tablosu */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Kişi/Şirket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İletişim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Konum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Vergi Bilgisi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tip/Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCariler.map((cari) => (
                <tr key={cari.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {cari.ad} {cari.soyad}
                      </div>
                      {cari.sirket && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <Building className="h-3 w-3 mr-1" />
                          {cari.sirket}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {cari.email && (
                      <div className="flex items-center mb-1">
                        <Mail className="h-3 w-3 mr-1" />
                        {cari.email}
                      </div>
                    )}
                    {cari.telefon && (
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {cari.telefon}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {cari.sehir && `${cari.sehir}, `}{cari.ulke}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {cari.vergiNo && (
                      <div>VN: {cari.vergiNo}</div>
                    )}
                    {cari.vergiDairesi && (
                      <div>VD: {cari.vergiDairesi}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipRenk(cari.tip)}`}>
                        {cari.tip === 'MUSTERI' && 'Müşteri'}
                        {cari.tip === 'BAYI' && 'Bayi'}
                        {cari.tip === 'KURUMSAL' && 'Kurumsal'}
                      </span>
                      <br />
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDurumRenk(cari.durum)}`}>
                        {cari.durum === 'AKTIF' && 'Aktif'}
                        {cari.durum === 'PASIF' && 'Pasif'}
                        {cari.durum === 'ENGELLI' && 'Engelli'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(cari)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteCari(cari.id)}
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
        {filteredCariler.length === 0 && (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Cari bulunamadı
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Arama kriterlerinize uygun cari bulunmuyor.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingCari ? 'Cari Düzenle' : 'Yeni Cari Ekle'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ad *
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
                    className={`w-full border ${formErrors.ad ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${formErrors.ad ? 'focus:ring-red-500' : 'focus:ring-purple-500'}`}
                    placeholder="Adını girin"
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
                    onChange={(e) => setFormData({...formData, soyad: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Soyadını girin"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Şirket
                </label>
                <input
                  type="text"
                  value={formData.sirket}
                  onChange={(e) => setFormData({...formData, sirket: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Şirket adını girin"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({...formData, email: value});
                      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        setFormErrors({...formErrors, email: 'Geçersiz email formatı'});
                      } else {
                        setFormErrors({...formErrors, email: ''});
                      }
                    }}
                    className={`w-full border ${formErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${formErrors.email ? 'focus:ring-red-500' : 'focus:ring-purple-500'}`}
                    placeholder="email@example.com"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={formData.telefon}
                    onChange={(e) => setFormData({...formData, telefon: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="05XX XXX XX XX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adres
                </label>
                <textarea
                  value={formData.adres}
                  onChange={(e) => setFormData({...formData, adres: e.target.value})}
                  rows={2}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Tam adres bilgisi"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Şehir
                  </label>
                  <input
                    type="text"
                    value={formData.sehir}
                    onChange={(e) => setFormData({...formData, sehir: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Şehir"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ülke
                  </label>
                  <input
                    type="text"
                    value={formData.ulke}
                    onChange={(e) => setFormData({...formData, ulke: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ülke"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vergi No
                  </label>
                  <input
                    type="text"
                    value={formData.vergiNo}
                    onChange={(e) => setFormData({...formData, vergiNo: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Vergi numarası"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vergi Dairesi
                  </label>
                  <input
                    type="text"
                    value={formData.vergiDairesi}
                    onChange={(e) => setFormData({...formData, vergiDairesi: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Vergi dairesi"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tip
                  </label>
                  <select
                    value={formData.tip}
                    onChange={(e) => setFormData({...formData, tip: e.target.value as any})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="MUSTERI">Müşteri</option>
                    <option value="BAYI">Bayi</option>
                    <option value="KURUMSAL">Kurumsal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Durum
                  </label>
                  <select
                    value={formData.durum}
                    onChange={(e) => setFormData({...formData, durum: e.target.value as any})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="AKTIF">Aktif</option>
                    <option value="PASIF">Pasif</option>
                    <option value="ENGELLI">Engelli</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notlar
                </label>
                <textarea
                  value={formData.notlar}
                  onChange={(e) => setFormData({...formData, notlar: e.target.value})}
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Cari hakkında notlar..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  {editingCari ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
