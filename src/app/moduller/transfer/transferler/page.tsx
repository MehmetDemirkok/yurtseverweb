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
  Filter,
  FileDown,
  User,
  Phone,
  Plane,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Yolcu {
  id?: string;
  ad: string;
  soyad: string;
  telefon: string;
  ucusSaati: string;
  ucusTkKodu: string;
}

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
  fiyat: number | null;
  tahsisli: boolean;
  yolcular?: Yolcu[];
  createdAt: string;
}

export default function TransferlerPage() {
  const [transferler, setTransferler] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDurum, setFilterDurum] = useState<string>('tümü');
  const [filterTarih, setFilterTarih] = useState<string>('');
  const [filterTahsisli, setFilterTahsisli] = useState<string>('tümü');
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
    durum: 'BEKLEMEDE' as 'BEKLEMEDE' | 'YOLDA' | 'TAMAMLANDI' | 'IPTAL',
    notlar: '',
    fiyat: null as number | null,
    tahsisli: false
  });
  
  // Yolcu bilgileri state
  const [yolcular, setYolcular] = useState<Yolcu[]>([]);
  
  // Form validation state
  const [formErrors, setFormErrors] = useState({
    kalkisYeri: '',
    varisYeri: '',
    kalkisTarihi: '',
    kalkisSaati: '',
    yolcuSayisi: ''
  });
  
  // Tarih validasyonu - bugünden önceki tarihleri kabul etme
  const validateTarih = (tarih: string) => {
    if (!tarih) return false;
    
    const secilenTarih = new Date(tarih);
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0); // Bugünün başlangıcı
    
    return secilenTarih >= bugun;
  };

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
    
    // Form validasyonu
    let hasError = false;
    const newErrors = { ...formErrors };
    
    // Kalkış yeri validasyonu
    if (!formData.kalkisYeri.trim()) {
      newErrors.kalkisYeri = 'Kalkış yeri alanı zorunludur';
      hasError = true;
    } else {
      newErrors.kalkisYeri = '';
    }
    
    // Varış yeri validasyonu
    if (!formData.varisYeri.trim()) {
      newErrors.varisYeri = 'Varış yeri alanı zorunludur';
      hasError = true;
    } else {
      newErrors.varisYeri = '';
    }
    
    // Tarih validasyonu
    if (!formData.kalkisTarihi) {
      newErrors.kalkisTarihi = 'Tarih alanı zorunludur';
      hasError = true;
    } else if (!validateTarih(formData.kalkisTarihi)) {
      newErrors.kalkisTarihi = 'Geçmiş tarihli transfer oluşturulamaz';
      hasError = true;
    } else {
      newErrors.kalkisTarihi = '';
    }
    
    // Saat validasyonu
    if (!formData.kalkisSaati) {
      newErrors.kalkisSaati = 'Saat alanı zorunludur';
      hasError = true;
    } else {
      newErrors.kalkisSaati = '';
    }
    
    // Yolcu sayısı validasyonu
    if (isNaN(formData.yolcuSayisi) || formData.yolcuSayisi < 1) {
      newErrors.yolcuSayisi = 'Geçerli bir yolcu sayısı giriniz (en az 1)';
      hasError = true;
    } else {
      newErrors.yolcuSayisi = '';
    }
    
    setFormErrors(newErrors);
    
    if (hasError) {
      alert('Lütfen form alanlarını kontrol ediniz');
      return;
    }
    
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
    } catch (error: any) {
      console.error('Transfer kaydedilemedi:', error);
      alert(error.message || 'Transfer kaydedilemedi');
    }
  };

  const createTransfer = async (data: typeof formData) => {
    const transferData = {
      ...data,
      yolcular: yolcular
    };
    
    const response = await fetch('/api/moduller/transfer/transferler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transferData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Transfer oluşturulamadı');
    }

    return response.json();
  };

  const updateTransfer = async (id: string, data: typeof formData) => {
    const transferData = {
      ...data,
      yolcular: yolcular
    };
    
    const response = await fetch(`/api/moduller/transfer/transferler/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transferData),
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
      notlar: '',
      fiyat: null,
      tahsisli: false
    });
    
    setFormErrors({
      kalkisYeri: '',
      varisYeri: '',
      kalkisTarihi: '',
      kalkisSaati: '',
      yolcuSayisi: ''
    });
    
    setYolcular([]);
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
      notlar: transfer.notlar,
      fiyat: transfer.fiyat,
      tahsisli: transfer.tahsisli
    });
    setYolcular(transfer.yolcular || []);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingTransfer(null);
    resetForm();
    // Varsayılan olarak 1 yolcu ekle
    setYolcular([{
      ad: '',
      soyad: '',
      telefon: '',
      ucusSaati: '',
      ucusTkKodu: ''
    }]);
    setShowModal(true);
  };

  // Yolcu yönetimi fonksiyonları
  const addYolcu = () => {
    const newYolcu: Yolcu = {
      ad: '',
      soyad: '',
      telefon: '',
      ucusSaati: '',
      ucusTkKodu: ''
    };
    setYolcular([...yolcular, newYolcu]);
  };

  const removeYolcu = (index: number) => {
    const updatedYolcular = yolcular.filter((_, i) => i !== index);
    setYolcular(updatedYolcular);
  };

  const updateYolcu = (index: number, field: keyof Yolcu, value: string) => {
    const updatedYolcular = [...yolcular];
    // Eğer index'te yolcu yoksa yeni bir yolcu oluştur
    if (!updatedYolcular[index]) {
      updatedYolcular[index] = { ad: '', soyad: '', telefon: '', ucusSaati: '', ucusTkKodu: '' };
    }
    updatedYolcular[index] = { ...updatedYolcular[index], [field]: value };
    setYolcular(updatedYolcular);
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
  
  // Excel'e aktarma fonksiyonu
  const exportToExcel = () => {
    // Dışa aktarılacak veriyi hazırla
    const exportData = filteredTransferler.map(transfer => ({
      'Kalkış Yeri': transfer.kalkisYeri,
      'Varış Yeri': transfer.varisYeri,
      'Tarih': new Date(transfer.kalkisTarihi).toLocaleDateString('tr-TR'),
      'Saat': transfer.kalkisSaati,
      'Yolcu Sayısı': transfer.yolcuSayisi,
      'Araç Plakası': transfer.arac ? transfer.arac.plaka : 'Atanmamış',
      'Şoför': transfer.sofor ? `${transfer.sofor.ad} ${transfer.sofor.soyad}` : 'Atanmamış',
      'Durum': transfer.durum === 'BEKLEMEDE' ? 'Beklemede' : 
               transfer.durum === 'YOLDA' ? 'Yolda' : 
               transfer.durum === 'TAMAMLANDI' ? 'Tamamlandı' : 'İptal',
      'Fiyat (TL)': transfer.fiyat ? transfer.fiyat.toLocaleString('tr-TR') : '-',
      'Tahsisli': transfer.tahsisli ? 'Evet' : 'Hayır',
      'Notlar': transfer.notlar || '-',
      'Oluşturulma Tarihi': new Date(transfer.createdAt).toLocaleDateString('tr-TR')
    }));
    
    // Excel çalışma kitabı oluştur
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transferler');
    
    // Excel dosyasını indir
    const today = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
    XLSX.writeFile(workbook, `Transferler_${today}.xlsx`);
  };

  const filteredTransferler = transferler.filter(transfer => {
    const matchesSearch = transfer.kalkisYeri.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.varisYeri.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transfer.sofor && `${transfer.sofor.ad} ${transfer.sofor.soyad}`.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterDurum === 'tümü' || transfer.durum === filterDurum;
    const matchesDate = !filterTarih || transfer.kalkisTarihi === filterTarih;
    const matchesTahsisli = filterTahsisli === 'tümü' || 
                           (filterTahsisli === 'tahsisli' && transfer.tahsisli) || 
                           (filterTahsisli === 'normal' && !transfer.tahsisli);
    return matchesSearch && matchesFilter && matchesDate && matchesTahsisli;
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              Tahsis Durumu
            </label>
            <select
              value={filterTahsisli}
              onChange={(e) => setFilterTahsisli(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="tümü">Tümü</option>
              <option value="tahsisli">Tahsisli Araçlar</option>
              <option value="normal">Normal Transferler</option>
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
                  Fiyat/Tahsis
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div>
                      {transfer.fiyat ? `${transfer.fiyat.toLocaleString('tr-TR')} TL` : '-'}
                    </div>
                    {transfer.tahsisli && (
                      <div className="mt-1">
                        <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                          Tahsisli
                        </span>
                      </div>
                    )}
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
                    value={formData.kalkisYeri}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({...formData, kalkisYeri: value});
                      if (!value.trim()) {
                        setFormErrors({...formErrors, kalkisYeri: 'Kalkış yeri alanı zorunludur'});
                      } else {
                        setFormErrors({...formErrors, kalkisYeri: ''});
                      }
                    }}
                    className={`w-full border ${formErrors.kalkisYeri ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${formErrors.kalkisYeri ? 'focus:ring-red-500' : 'focus:ring-purple-500'}`}
                    placeholder="Kalkış yerini girin"
                  />
                  {formErrors.kalkisYeri && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.kalkisYeri}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Varış Yeri
                  </label>
                  <input
                    type="text"
                    value={formData.varisYeri}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({...formData, varisYeri: value});
                      if (!value.trim()) {
                        setFormErrors({...formErrors, varisYeri: 'Varış yeri alanı zorunludur'});
                      } else {
                        setFormErrors({...formErrors, varisYeri: ''});
                      }
                    }}
                    className={`w-full border ${formErrors.varisYeri ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${formErrors.varisYeri ? 'focus:ring-red-500' : 'focus:ring-purple-500'}`}
                    placeholder="Varış yerini girin"
                  />
                  {formErrors.varisYeri && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.varisYeri}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tarih
                  </label>
                  <input
                    type="date"
                    value={formData.kalkisTarihi}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({...formData, kalkisTarihi: value});
                      if (!value) {
                        setFormErrors({...formErrors, kalkisTarihi: 'Tarih alanı zorunludur'});
                      } else if (!validateTarih(value)) {
                        setFormErrors({...formErrors, kalkisTarihi: 'Geçmiş tarihli transfer oluşturulamaz'});
                      } else {
                        setFormErrors({...formErrors, kalkisTarihi: ''});
                      }
                    }}
                    className={`w-full border ${formErrors.kalkisTarihi ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${formErrors.kalkisTarihi ? 'focus:ring-red-500' : 'focus:ring-purple-500'}`}
                  />
                  {formErrors.kalkisTarihi && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.kalkisTarihi}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Saat
                  </label>
                  <input
                    type="time"
                    value={formData.kalkisSaati}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({...formData, kalkisSaati: value});
                      if (!value) {
                        setFormErrors({...formErrors, kalkisSaati: 'Saat alanı zorunludur'});
                      } else {
                        setFormErrors({...formErrors, kalkisSaati: ''});
                      }
                    }}
                    className={`w-full border ${formErrors.kalkisSaati ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${formErrors.kalkisSaati ? 'focus:ring-red-500' : 'focus:ring-purple-500'}`}
                  />
                  {formErrors.kalkisSaati && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.kalkisSaati}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Yolcu Sayısı Yönetimi
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.yolcuSayisi}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = parseInt(value);
                        setFormData({...formData, yolcuSayisi: numValue || 0});
                        
                        // Yolcu sayısına göre yolcu listesini ayarla
                        if (numValue > 0) {
                          const currentYolcuCount = yolcular.length;
                          if (numValue > currentYolcuCount) {
                            // Yeni yolcu ekle
                            const newYolcular = [...yolcular];
                            for (let i = currentYolcuCount; i < numValue; i++) {
                              newYolcular.push({
                                ad: '',
                                soyad: '',
                                telefon: '',
                                ucusSaati: '',
                                ucusTkKodu: ''
                              });
                            }
                            setYolcular(newYolcular);
                          } else if (numValue < currentYolcuCount) {
                            // Fazla yolcuları çıkar
                            setYolcular(yolcular.slice(0, numValue));
                          }
                        }
                        
                        if (!value || numValue < 1) {
                          setFormErrors({...formErrors, yolcuSayisi: 'Yolcu sayısı en az 1 olmalıdır'});
                        } else {
                          setFormErrors({...formErrors, yolcuSayisi: ''});
                        }
                      }}
                      className={`w-full border ${formErrors.yolcuSayisi ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${formErrors.yolcuSayisi ? 'focus:ring-red-500' : 'focus:ring-purple-500'}`}
                      placeholder="Yolcu sayısı"
                    />
                    {formErrors.yolcuSayisi && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.yolcuSayisi}</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newCount = formData.yolcuSayisi + 1;
                        if (newCount <= 20) {
                          setFormData({...formData, yolcuSayisi: newCount});
                          setYolcular([...yolcular, {
                            ad: '',
                            soyad: '',
                            telefon: '',
                            ucusSaati: '',
                            ucusTkKodu: ''
                          }]);
                        }
                      }}
                      className="flex items-center justify-center w-10 h-10 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={formData.yolcuSayisi >= 20}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newCount = formData.yolcuSayisi - 1;
                        if (newCount >= 1) {
                          setFormData({...formData, yolcuSayisi: newCount});
                          setYolcular(yolcular.slice(0, newCount));
                        }
                      }}
                      className="flex items-center justify-center w-10 h-10 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={formData.yolcuSayisi <= 1}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Toplam {formData.yolcuSayisi} yolcu • Aşağıda her yolcu için bilgi girişi yapabilirsiniz
                </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fiyat (TL)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.fiyat !== null ? formData.fiyat : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({...formData, fiyat: value ? parseFloat(value) : null});
                    }}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Fiyat girin"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="tahsisli"
                    checked={formData.tahsisli}
                    onChange={(e) => setFormData({...formData, tahsisli: e.target.checked})}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="tahsisli" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Gün Boyu Tahsisli
                  </label>
                </div>
              </div>
              {/* Yolcu Bilgileri Bölümü */}
              {formData.yolcuSayisi > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Yolcu Bilgileri ({formData.yolcuSayisi} Yolcu)
                    </h3>
                  </div>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Array.from({ length: formData.yolcuSayisi }, (_, index) => {
                      const yolcu = yolcular[index] || { ad: '', soyad: '', telefon: '', ucusSaati: '', ucusTkKodu: '' };
                      return (
                      <div key={index} className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                              yolcu.ad && yolcu.soyad 
                                ? 'bg-green-600 text-white' 
                                : 'bg-purple-600 text-white'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                                {index + 1}. Yolcu Bilgileri
                              </h4>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {yolcu.ad && yolcu.soyad ? (
                                  <span className="text-green-600 dark:text-green-400">
                                    ✓ {yolcu.ad} {yolcu.soyad}
                                  </span>
                                ) : (
                                  <span>Bilgiler bekleniyor...</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {formData.yolcuSayisi > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newCount = formData.yolcuSayisi - 1;
                                setFormData({...formData, yolcuSayisi: newCount});
                                const newYolcular = [...yolcular];
                                newYolcular.splice(index, 1);
                                setYolcular(newYolcular);
                              }}
                              className="flex items-center space-x-1 px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900 rounded-md transition-colors"
                            >
                              <X className="h-4 w-4" />
                              <span className="text-xs">Kaldır</span>
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Ad
                            </label>
                            <input
                              type="text"
                              value={yolcu.ad}
                              onChange={(e) => updateYolcu(index, 'ad', e.target.value)}
                              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                              placeholder={`${index + 1}. yolcunun adı`}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Soyad
                            </label>
                            <input
                              type="text"
                              value={yolcu.soyad}
                              onChange={(e) => updateYolcu(index, 'soyad', e.target.value)}
                              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                              placeholder={`${index + 1}. yolcunun soyadı`}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              Telefon
                            </label>
                            <input
                              type="tel"
                              value={yolcu.telefon}
                              onChange={(e) => updateYolcu(index, 'telefon', e.target.value)}
                              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                              placeholder="05XX XXX XX XX"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Uçuş Saati
                            </label>
                            <input
                              type="time"
                              value={yolcu.ucusSaati}
                              onChange={(e) => updateYolcu(index, 'ucusSaati', e.target.value)}
                              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center">
                              <Plane className="h-3 w-3 mr-1" />
                              Türk Hava Yolları Uçuş Kodu
                            </label>
                            <input
                              type="text"
                              value={yolcu.ucusTkKodu}
                              onChange={(e) => updateYolcu(index, 'ucusTkKodu', e.target.value)}
                              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                              placeholder="Örn: TK1234, PC1125"
                            />
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                  
                  {/* Hızlı Yolcu Ekleme Butonu */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <button
                      type="button"
                      onClick={() => {
                        const newCount = formData.yolcuSayisi + 1;
                        if (newCount <= 20) {
                          setFormData({...formData, yolcuSayisi: newCount});
                          setYolcular([...yolcular, {
                            ad: '',
                            soyad: '',
                            telefon: '',
                            ucusSaati: '',
                            ucusTkKodu: ''
                          }]);
                        }
                      }}
                      disabled={formData.yolcuSayisi >= 20}
                      className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      <span className="font-medium">
                        {formData.yolcuSayisi >= 20 ? 'Maksimum Yolcu Sayısına Ulaşıldı' : 'Hızlıca Yeni Yolcu Ekle'}
                      </span>
                    </button>
                    
                    <div className="mt-2 text-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Mevcut: {formData.yolcuSayisi} yolcu • Maksimum: 20 yolcu
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
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