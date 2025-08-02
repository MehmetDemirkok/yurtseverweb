'use client';

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  Users,
  Car,
  Search,
  Calendar,
  Filter
} from 'lucide-react';

interface Transfer {
  id: string;
  kalkisYeri: string;
  varisYeri: string;
  kalkisSaati: string;
  kalkisTarihi: string;
  yolcuSayisi: number;
  aracId: string | null;
  arac: {
    id: string;
    plaka: string;
  } | null;
  soforId: string | null;
  sofor: {
    id: string;
    ad: string;
    soyad: string;
  } | null;
  durum: 'BEKLEMEDE' | 'YOLDA' | 'TAMAMLANDI' | 'IPTAL';
  notlar: string;
  createdAt: string;
}

export default function TransferlerPage() {
  const [transferler, setTransferler] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDurum, setFilterDurum] = useState<string>('tümü');
  const [filterTarih, setFilterTarih] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);
  const [araclar, setAraclar] = useState<any[]>([]);
  const [soforler, setSoforler] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    kalkisYeri: '',
    varisYeri: '',
    kalkisSaati: '',
    kalkisTarihi: '',
    yolcuSayisi: 1,
    aracId: '',
    soforId: '',
    durum: 'BEKLEMEDE' as const,
    notlar: ''
  });

  useEffect(() => {
    fetchTransferler();
    fetchAraclar();
    fetchSoforler();
  }, []);

  const fetchTransferler = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/moduller/transfer/transferler');
      if (response.ok) {
        const data = await response.json();
        setTransferler(data.transferler);
      } else {
        console.error('Transferler alınamadı');
      }
    } catch (error) {
      console.error('Transferler alınamadı:', error);
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

  const fetchSoforler = async () => {
    try {
      const response = await fetch('/api/moduller/transfer/soforler');
      if (response.ok) {
        const data = await response.json();
        setSoforler(data.soforler);
      }
    } catch (error) {
      console.error('Şoförler alınamadı:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTransfer) {
        // Güncelleme işlemi
        await updateTransfer(editingTransfer.id, formData);
      } else {
        // Yeni transfer ekleme
        await createTransfer(formData);
      }
      setShowModal(false);
      setEditingTransfer(null);
      resetForm();
      fetchTransferler();
    } catch (error) {
      console.error('Transfer kaydedilemedi:', error);
    }
  };

  const createTransfer = async (data: typeof formData) => {
    const response = await fetch('/api/moduller/transfer/transferler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Transfer oluşturulamadı');
    }

    return response.json();
  };

  const updateTransfer = async (id: string, data: typeof formData) => {
    const response = await fetch(`/api/moduller/transfer/transferler/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Transfer güncellenemedi');
    }

    return response.json();
  };

  const deleteTransfer = async (id: string) => {
    if (window.confirm('Bu transferi silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/moduller/transfer/transferler/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          alert(errorData.error || 'Transfer silinemedi');
          return;
        }

        fetchTransferler();
      } catch (error) {
        console.error('Transfer silinemedi:', error);
        alert('Transfer silinemedi');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      kalkisYeri: '',
      varisYeri: '',
      kalkisSaati: '',
      kalkisTarihi: '',
      yolcuSayisi: 1,
      aracId: '',
      soforId: '',
      durum: 'BEKLEMEDE',
      notlar: ''
    });
  };

  const openEditModal = (transfer: Transfer) => {
    setEditingTransfer(transfer);
    setFormData({
      kalkisYeri: transfer.kalkisYeri,
      varisYeri: transfer.varisYeri,
      kalkisSaati: transfer.kalkisSaati,
      kalkisTarihi: transfer.kalkisTarihi,
      yolcuSayisi: transfer.yolcuSayisi,
      aracId: transfer.aracId || '',
      soforId: transfer.soforId || '',
      durum: transfer.durum,
      notlar: transfer.notlar
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingTransfer(null);
    resetForm();
    setShowModal(true);
  };

  const getDurumRenk = (durum: string) => {
    switch (durum) {
      case 'BEKLEMEDE': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'YOLDA': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'TAMAMLANDI': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'IPTAL': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const filteredTransferler = transferler.filter(transfer => {
    const matchesSearch = transfer.kalkisYeri.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.varisYeri.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.soforAdi?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterDurum === 'tümü' || transfer.durum === filterDurum;
    const matchesDate = !filterTarih || transfer.kalkisTarihi === filterTarih;
    return matchesSearch && matchesFilter && matchesDate;
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
            Transfer Yönetimi
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Transfer oluşturma, düzenleme ve takip işlemleri
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Transfer
        </button>
      </div>

      {/* Filtreler */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ara
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Kalkış, varış veya şoför..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
                             <option value="tümü">Tümü</option>
               <option value="BEKLEMEDE">Beklemede</option>
               <option value="YOLDA">Yolda</option>
               <option value="TAMAMLANDI">Tamamlandı</option>
               <option value="IPTAL">İptal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tarih Filtresi
            </label>
            <input
              type="date"
              value={filterTarih}
              onChange={(e) => setFilterTarih(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Transferler Tablosu */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Kalkış → Varış
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tarih/Saat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Yolcu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Araç/Şoför
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Notlar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransferler.map((transfer) => (
                <tr key={transfer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {transfer.kalkisYeri}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      → {transfer.varisYeri}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(transfer.kalkisTarihi).toLocaleDateString('tr-TR')}
                    </div>
                    <div className="flex items-center mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      {transfer.kalkisSaati}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {transfer.yolcuSayisi} kişi
                    </div>
                  </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                     {transfer.arac && transfer.sofor ? (
                       <div>
                         <div className="flex items-center">
                           <Car className="h-4 w-4 mr-1" />
                           {transfer.arac.plaka}
                         </div>
                         <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                           {transfer.sofor.ad} {transfer.sofor.soyad}
                         </div>
                       </div>
                     ) : (
                       <span className="text-gray-400 dark:text-gray-500">Atanmamış</span>
                     )}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                                         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDurumRenk(transfer.durum)}`}>
                       {transfer.durum === 'BEKLEMEDE' && 'Beklemede'}
                       {transfer.durum === 'YOLDA' && 'Yolda'}
                       {transfer.durum === 'TAMAMLANDI' && 'Tamamlandı'}
                       {transfer.durum === 'IPTAL' && 'İptal'}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="max-w-xs truncate">
                      {transfer.notlar || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(transfer)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteTransfer(transfer.id)}
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
        {filteredTransferler.length === 0 && (
          <div className="text-center py-8">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Transfer bulunamadı
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Arama kriterlerinize uygun transfer bulunmuyor.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingTransfer ? 'Transfer Düzenle' : 'Yeni Transfer Ekle'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kalkış Yeri
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.kalkisYeri}
                    onChange={(e) => setFormData({...formData, kalkisYeri: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Kalkış yerini girin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Varış Yeri
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.varisYeri}
                    onChange={(e) => setFormData({...formData, varisYeri: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Varış yerini girin"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tarih
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.kalkisTarihi}
                    onChange={(e) => setFormData({...formData, kalkisTarihi: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Saat
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.kalkisSaati}
                    onChange={(e) => setFormData({...formData, kalkisSaati: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Yolcu Sayısı
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="20"
                  value={formData.yolcuSayisi}
                  onChange={(e) => setFormData({...formData, yolcuSayisi: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Araç
                  </label>
                  <select
                    value={formData.aracId}
                    onChange={(e) => setFormData({...formData, aracId: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Araç Seçin</option>
                    {araclar.map((arac) => (
                      <option key={arac.id} value={arac.id}>
                        {arac.plaka} - {arac.marka} {arac.model} ({arac.yolcuKapasitesi} kişi)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Şoför
                  </label>
                  <select
                    value={formData.soforId}
                    onChange={(e) => setFormData({...formData, soforId: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Şoför Seçin</option>
                    {soforler.map((sofor) => (
                      <option key={sofor.id} value={sofor.id}>
                        {sofor.ad} {sofor.soyad}
                      </option>
                    ))}
                  </select>
                </div>
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
                                     <option value="BEKLEMEDE">Beklemede</option>
                   <option value="YOLDA">Yolda</option>
                   <option value="TAMAMLANDI">Tamamlandı</option>
                   <option value="IPTAL">İptal</option>
                </select>
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
                  placeholder="Transfer hakkında notlar..."
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
                  {editingTransfer ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 