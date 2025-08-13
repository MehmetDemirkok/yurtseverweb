'use client';

import { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  FileDown,
  Mail,
  Phone,
  MapPin,
  Building,
  User
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Tedarikci {
  id: string;
  sirketAdi: string;
  yetkiliKisi: string | null;
  email: string | null;
  telefon: string | null;
  adres: string | null;
  sehir: string | null;
  ulke: string;
  vergiNo: string | null;
  vergiDairesi: string | null;
  hizmetTuru: string | null;
  notlar: string | null;
  durum: 'AKTIF' | 'PASIF' | 'ENGELLI';
  createdAt: string;
}

export default function TedarikcilerPage() {
  const [tedarikciler, setTedarikciler] = useState<Tedarikci[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDurum, setFilterDurum] = useState<string>('tümü');
  const [showModal, setShowModal] = useState(false);
  const [editingTedarikci, setEditingTedarikci] = useState<Tedarikci | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string>('');

  // İzin kontrolü fonksiyonu
  const hasPermission = (permission: string): boolean => {
    return userPermissions.includes(permission) || userRole === 'ADMIN';
  };

  // Sayfa erişim kontrolü
  const hasPageAccess = (): boolean => {
    // Admin her zaman erişebilir
    if (userRole === 'ADMIN') {
      return true;
    }
    // Diğer roller için tedarikciler permission kontrolü
    return hasPermission('tedarikciler');
  };

  // Form state
  const [formData, setFormData] = useState({
    sirketAdi: '',
    yetkiliKisi: '',
    email: '',
    telefon: '',
    adres: '',
    sehir: '',
    ulke: 'Türkiye',
    vergiNo: '',
    vergiDairesi: '',
    hizmetTuru: '',
    notlar: '',
    durum: 'AKTIF' as 'AKTIF' | 'PASIF' | 'ENGELLI'
  });
  
  // Form validation state
  const [formErrors, setFormErrors] = useState({
    sirketAdi: '',
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
    fetchTedarikciler();
  }, []);

  const fetchTedarikciler = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tedarikciler');
      if (response.ok) {
        const data = await response.json();
        // API'den gelen veri { tedarikciler: [...] } formatında
        setTedarikciler(data.tedarikciler || []);
      } else {
        console.error('Tedarikçiler alınamadı');
        setTedarikciler([]);
      }
    } catch (error) {
      console.error('Tedarikçiler alınamadı:', error);
      setTedarikciler([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validasyonu
    let hasError = false;
    const newErrors = { ...formErrors };
    
    // Şirket adı validasyonu
    if (!formData.sirketAdi.trim()) {
      newErrors.sirketAdi = 'Şirket adı alanı zorunludur';
      hasError = true;
    } else {
      newErrors.sirketAdi = '';
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
      if (editingTedarikci) {
        await updateTedarikci(editingTedarikci.id, formData);
      } else {
        await createTedarikci(formData);
      }
      setShowModal(false);
      setEditingTedarikci(null);
      resetForm();
      fetchTedarikciler();
    } catch (error: any) {
      console.error('Tedarikçi kaydedilemedi:', error);
      alert(error.message || 'Tedarikçi kaydedilemedi');
    }
  };

  const createTedarikci = async (data: typeof formData) => {
    const response = await fetch('/api/tedarikciler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Tedarikçi oluşturulamadı');
    }

    return response.json();
  };

  const updateTedarikci = async (id: string, data: typeof formData) => {
    const response = await fetch(`/api/tedarikciler/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Tedarikçi güncellenemedi');
    }

    return response.json();
  };

  const deleteTedarikci = async (id: string) => {
    if (window.confirm('Bu tedarikçiyi silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/tedarikciler/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          alert(errorData.error || 'Tedarikçi silinemedi');
          return;
        }

        fetchTedarikciler();
      } catch (error) {
        console.error('Tedarikçi silinemedi:', error);
        alert('Tedarikçi silinemedi');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      sirketAdi: '',
      yetkiliKisi: '',
      email: '',
      telefon: '',
      adres: '',
      sehir: '',
      ulke: 'Türkiye',
      vergiNo: '',
      vergiDairesi: '',
      hizmetTuru: '',
      notlar: '',
      durum: 'AKTIF'
    });
    
    setFormErrors({
      sirketAdi: '',
      email: ''
    });
  };

  const openEditModal = (tedarikci: Tedarikci) => {
    setEditingTedarikci(tedarikci);
    setFormData({
      sirketAdi: tedarikci.sirketAdi,
      yetkiliKisi: tedarikci.yetkiliKisi || '',
      email: tedarikci.email || '',
      telefon: tedarikci.telefon || '',
      adres: tedarikci.adres || '',
      sehir: tedarikci.sehir || '',
      ulke: tedarikci.ulke,
      vergiNo: tedarikci.vergiNo || '',
      vergiDairesi: tedarikci.vergiDairesi || '',
      hizmetTuru: tedarikci.hizmetTuru || '',
      notlar: tedarikci.notlar || '',
      durum: tedarikci.durum
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingTedarikci(null);
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
  
  // Excel'e aktarma fonksiyonu
  const exportToExcel = () => {
    const exportData = filteredTedarikciler.map(tedarikci => ({
      'Şirket Adı': tedarikci.sirketAdi,
      'Yetkili Kişi': tedarikci.yetkiliKisi || '-',
      'Email': tedarikci.email || '-',
      'Telefon': tedarikci.telefon || '-',
      'Şehir': tedarikci.sehir || '-',
      'Ülke': tedarikci.ulke,
      'Vergi No': tedarikci.vergiNo || '-',
      'Vergi Dairesi': tedarikci.vergiDairesi || '-',
      'Hizmet Türü': tedarikci.hizmetTuru || '-',
      'Durum': tedarikci.durum === 'AKTIF' ? 'Aktif' : 
               tedarikci.durum === 'PASIF' ? 'Pasif' : 'Engelli',
      'Notlar': tedarikci.notlar || '-',
      'Oluşturulma Tarihi': new Date(tedarikci.createdAt).toLocaleDateString('tr-TR')
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tedarikçiler');
    
    const today = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
    XLSX.writeFile(workbook, `Tedarikciler_${today}.xlsx`);
  };

  const filteredTedarikciler = tedarikciler?.filter(tedarikci => {
    const matchesSearch = tedarikci.sirketAdi.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (tedarikci.yetkiliKisi && tedarikci.yetkiliKisi.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (tedarikci.email && tedarikci.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (tedarikci.hizmetTuru && tedarikci.hizmetTuru.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDurum = filterDurum === 'tümü' || tedarikci.durum === filterDurum;
    return matchesSearch && matchesDurum;
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
    <div className="space-y-4">
      {/* Sayfa Başlığı - Kompakt */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Tedarikçi Yönetimi
          </h1>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            Hizmet sağlayıcıları ve tedarikçi firmalarını yönetin
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="mt-3 sm:mt-0 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-purple-500"
        >
          <Plus className="h-3 w-3 mr-1" />
          Yeni Tedarikçi
        </button>
      </div>

      {/* Filtreler - Kompakt */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ara
            </label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="text"
                placeholder="Şirket adı, yetkili kişi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 w-full border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Durum
            </label>
            <select
              value={filterDurum}
              onChange={(e) => setFilterDurum(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="tümü">Tümü</option>
              <option value="AKTIF">Aktif</option>
              <option value="PASIF">Pasif</option>
              <option value="ENGELLI">Engelli</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Excel'e Aktar
            </label>
            <button
              onClick={exportToExcel}
              className="w-full flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <FileDown className="h-3 w-3 mr-1" />
              Excel İndir
            </button>
          </div>
        </div>
      </div>

      {/* Tedarikçiler Tablosu - Responsive ve Kompakt */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {/* Desktop Tablosu */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Şirket/Yetkili
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İletişim
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Konum
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Hizmet/Vergi
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTedarikciler.map((tedarikci) => (
                <tr key={tedarikci.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div>
                      <div className="text-xs font-medium text-gray-900 dark:text-white flex items-center">
                        <Building className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="truncate max-w-32">{tedarikci.sirketAdi}</span>
                      </div>
                      {tedarikci.yetkiliKisi && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                          <User className="h-3 w-3 mr-1" />
                          <span className="truncate max-w-28">{tedarikci.yetkiliKisi}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                    {tedarikci.email && (
                      <div className="flex items-center mb-1">
                        <Mail className="h-3 w-3 mr-1" />
                        <span className="truncate max-w-32">{tedarikci.email}</span>
                      </div>
                    )}
                    {tedarikci.telefon && (
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        <span className="truncate max-w-24">{tedarikci.telefon}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="truncate max-w-24">
                        {tedarikci.sehir && `${tedarikci.sehir}, `}{tedarikci.ulke}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                    {tedarikci.hizmetTuru && (
                      <div className="mb-1">
                        <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 truncate max-w-20">
                          {tedarikci.hizmetTuru}
                        </span>
                      </div>
                    )}
                    {tedarikci.vergiNo && (
                      <div className="text-xs">VN: {tedarikci.vergiNo}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDurumRenk(tedarikci.durum)}`}>
                      {tedarikci.durum === 'AKTIF' && 'Aktif'}
                      {tedarikci.durum === 'PASIF' && 'Pasif'}
                      {tedarikci.durum === 'ENGELLI' && 'Engelli'}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => openEditModal(tedarikci)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteTedarikci(tedarikci.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobil Kart Görünümü */}
        <div className="lg:hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTedarikciler.map((tedarikci) => (
              <div key={tedarikci.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Şirket ve Yetkili */}
                    <div className="flex items-center mb-2">
                      <Building className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {tedarikci.sirketAdi}
                        </div>
                        {tedarikci.yetkiliKisi && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {tedarikci.yetkiliKisi}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* İletişim */}
                    <div className="flex items-center mb-2">
                      {tedarikci.email && (
                        <>
                          <Mail className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 mr-3 truncate">
                            {tedarikci.email}
                          </span>
                        </>
                      )}
                      {tedarikci.telefon && (
                        <>
                          <Phone className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {tedarikci.telefon}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Konum */}
                    <div className="flex items-center mb-2">
                      <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {tedarikci.sehir && `${tedarikci.sehir}, `}{tedarikci.ulke}
                      </span>
                    </div>

                    {/* Alt Bilgiler */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {tedarikci.hizmetTuru && (
                          <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {tedarikci.hizmetTuru}
                          </span>
                        )}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDurumRenk(tedarikci.durum)}`}>
                          {tedarikci.durum === 'AKTIF' && 'Aktif'}
                          {tedarikci.durum === 'PASIF' && 'Pasif'}
                          {tedarikci.durum === 'ENGELLI' && 'Engelli'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => openEditModal(tedarikci)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteTedarikci(tedarikci.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {filteredTedarikciler.length === 0 && (
          <div className="text-center py-8">
            <Truck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Tedarikçi bulunamadı
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Arama kriterlerinize uygun tedarikçi bulunmuyor.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingTedarikci ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi Ekle'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Şirket Adı *
                </label>
                <input
                  type="text"
                  value={formData.sirketAdi}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({...formData, sirketAdi: value});
                    if (!value.trim()) {
                      setFormErrors({...formErrors, sirketAdi: 'Şirket adı alanı zorunludur'});
                    } else {
                      setFormErrors({...formErrors, sirketAdi: ''});
                    }
                  }}
                  className={`w-full border ${formErrors.sirketAdi ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${formErrors.sirketAdi ? 'focus:ring-red-500' : 'focus:ring-purple-500'}`}
                  placeholder="Şirket adını girin"
                />
                {formErrors.sirketAdi && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.sirketAdi}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Yetkili Kişi
                </label>
                <input
                  type="text"
                  value={formData.yetkiliKisi}
                  onChange={(e) => setFormData({...formData, yetkiliKisi: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Yetkili kişi adı"
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
                    Hizmet Türü
                  </label>
                  <input
                    type="text"
                    value={formData.hizmetTuru}
                    onChange={(e) => setFormData({...formData, hizmetTuru: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ör: Transfer Hizmeti, Araç Kiralama"
                  />
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
                  placeholder="Tedarikçi hakkında notlar..."
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
                  {editingTedarikci ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
