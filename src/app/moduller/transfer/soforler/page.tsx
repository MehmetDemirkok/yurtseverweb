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
  atananAracId: string | null;
  atananArac: {
    id: string;
    plaka: string;
  } | null;
  durum: 'MUSAIT' | 'TRANSFERDE' | 'IZINLI';
  createdAt: string;
}

export default function SoforlerPage() {
  const [soforler, setSoforler] = useState<Sofor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDurum, setFilterDurum] = useState<string>('tümü');
  const [showModal, setShowModal] = useState(false);
  const [editingSofor, setEditingSofor] = useState<Sofor | null>(null);
  const [araclar, setAraclar] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    ad: '',
    soyad: '',
    telefon: '',
    ehliyetSinifi: 'B',
    atananAracId: '',
    durum: 'MUSAIT' as const
  });

  useEffect(() => {
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
    } catch (error) {
      console.error('Şoför kaydedilemedi:', error);
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
      atananAracId: '',
      durum: 'MUSAIT'
    });
  };

  const openEditModal = (sofor: Sofor) => {
    setEditingSofor(sofor);
    setFormData({
      ad: sofor.ad,
      soyad: sofor.soyad,
      telefon: sofor.telefon,
      ehliyetSinifi: sofor.ehliyetSinifi,
      atananAracId: sofor.atananAracId || '',
      durum: sofor.durum
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
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {sofor.ehliyetSinifi}
                    </span>
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
                    required
                    value={formData.ad}
                    onChange={(e) => setFormData({...formData, ad: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Ad girin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Soyad
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.soyad}
                    onChange={(e) => setFormData({...formData, soyad: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Soyad girin"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  required
                  value={formData.telefon}
                  onChange={(e) => setFormData({...formData, telefon: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                      placeholder="Telefon numarası girin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ehliyet Sınıfı
                </label>
                <select
                  value={formData.ehliyetSinifi}
                  onChange={(e) => setFormData({...formData, ehliyetSinifi: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="B">B - Otomobil</option>
                  <option value="C">C - Kamyon</option>
                  <option value="D">D - Minibüs</option>
                  <option value="E">E - Çekici</option>
                </select>
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