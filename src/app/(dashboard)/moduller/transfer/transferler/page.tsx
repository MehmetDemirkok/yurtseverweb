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
import TimeInput from '@/components/ui/TimeInput';

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
  cariId: string | null;
  cari: {
    id: string;
    ad: string;
    soyad: string | null;
    sirket: string | null;
  } | null;
  tedarikciId: string | null;
  tedarikci: {
    id: string;
    sirketAdi: string;
    yetkiliKisi: string | null;
  } | null;
  tedarikciyeYaptirilacak: boolean;
  manuelAracMarka: string | null;
  manuelAracModel: string | null;
  manuelAracTip: string | null;
  manuelAracPlaka: string | null;
  manuelSoforAdi: string | null;
  yolcular?: Yolcu[];
  createdAt: string;
}

interface Cari {
  id: string;
  ad: string;
  soyad: string | null;
  sirket: string | null;
  email: string | null;
  telefon: string | null;
}

interface Tedarikci {
  id: string;
  sirketAdi: string;
  yetkiliKisi: string | null;
  email: string | null;
  telefon: string | null;
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
  const [cariler, setCariler] = useState<Cari[]>([]);
  const [tedarikciler, setTedarikciler] = useState<Tedarikci[]>([]);
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
    // Diğer roller için transfer permission kontrolü
    return hasPermission('transfer');
  };

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
    tahsisli: false,
    cariId: '',
    tedarikciId: '',
    tedarikciyeYaptirilacak: false,
    manuelAracMarka: '',
    manuelAracModel: '',
    manuelAracTip: '',
    manuelAracPlaka: '',
    manuelSoforAdi: ''
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
    fetchTransferler();
    fetchAraclar();
    fetchSoforler();
    fetchCariler();
    fetchTedarikciler();
  }, []);

  const fetchTransferler = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/moduller/transfer/transferler');
      if (response.ok) {
        const data = await response.json();
        // API { transferler } döndürüyor
        setTransferler(Array.isArray(data) ? data : (data.transferler || []));
      } else {
        console.error('Transferler alınamadı');
        setTransferler([]);
      }
    } catch (error) {
      console.error('Transferler alınamadı:', error);
      setTransferler([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAraclar = async () => {
    try {
      const response = await fetch('/api/moduller/transfer/araclar');
      if (response.ok) {
        const data = await response.json();
        setAraclar(data.araclar || []);
      } else {
        setAraclar([]);
      }
    } catch (error) {
      console.error('Araçlar alınamadı:', error);
      setAraclar([]);
    }
  };

  const fetchSoforler = async () => {
    try {
      const response = await fetch('/api/moduller/transfer/soforler');
      if (response.ok) {
        const data = await response.json();
        // API { soforler } döndürüyor
        setSoforler(data.soforler || (Array.isArray(data) ? data : []));
      } else {
        setSoforler([]);
      }
    } catch (error) {
      console.error('Şoförler alınamadı:', error);
      setSoforler([]);
    }
  };

  const fetchCariler = async () => {
    try {
      const response = await fetch('/api/cariler');
      if (response.ok) {
        const data = await response.json();
        setCariler(Array.isArray(data) ? data : []);
      } else {
        setCariler([]);
      }
    } catch (error) {
      console.error('Cariler alınamadı:', error);
      setCariler([]);
    }
  };

  const fetchTedarikciler = async () => {
    try {
      const response = await fetch('/api/tedarikciler');
      if (response.ok) {
        const data = await response.json();
        setTedarikciler(Array.isArray(data.tedarikciler) ? data.tedarikciler : []);
      } else {
        setTedarikciler([]);
      }
    } catch (error) {
      console.error('Tedarikçiler alınamadı:', error);
      setTedarikciler([]);
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

  const notifyUetds = async (id: string) => {
    try {
      const res = await fetch('/api/moduller/transfer/uetds/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transferId: id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || data.message || 'U-ETDS bildirimi başarısız');
        return;
      }
      alert(`U-ETDS bildirimi başarılı${data.seferReferansNo ? ` • Ref: ${data.seferReferansNo}` : ''}`);
      fetchTransferler();
    } catch (e: any) {
      alert(e?.message || 'U-ETDS bildirimi sırasında hata oluştu');
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
      tahsisli: false,
      cariId: '',
      tedarikciId: '',
      tedarikciyeYaptirilacak: false,
      manuelAracMarka: '',
      manuelAracModel: '',
      manuelAracTip: '',
      manuelAracPlaka: '',
      manuelSoforAdi: ''
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
      tahsisli: transfer.tahsisli,
      cariId: transfer.cariId || '',
      tedarikciId: transfer.tedarikciId || '',
      tedarikciyeYaptirilacak: transfer.tedarikciyeYaptirilacak,
      manuelAracMarka: transfer.manuelAracMarka || '',
      manuelAracModel: transfer.manuelAracModel || '',
      manuelAracTip: transfer.manuelAracTip || '',
      manuelAracPlaka: transfer.manuelAracPlaka || '',
      manuelSoforAdi: transfer.manuelSoforAdi || ''
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
    // Dışa aktarılacak veriyi hazırla (yolcu detayları dahil)
    const exportData: any[] = [];
    filteredTransferler.forEach((transfer) => {
      const baseRow = {
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
        'Tahsisli': transfer.tahsisli ? 'Evet' : 'Hayır',
        'Notlar': transfer.notlar || '-',
        'Oluşturulma Tarihi': new Date(transfer.createdAt).toLocaleDateString('tr-TR')
      };

      if (transfer.yolcular && transfer.yolcular.length > 0) {
        const formattedPrice = transfer.fiyat ? transfer.fiyat.toLocaleString('tr-TR') : '-';
        transfer.yolcular.forEach((y, idx) => {
          exportData.push({
            ...baseRow,
            'Fiyat (TL)': idx === 0 ? formattedPrice : '0',
            'Yolcu Adı': y.ad || '',
            'Yolcu Soyadı': y.soyad || '',
            'Yolcu Telefon': y.telefon || '',
            'Uçuş Saati': y.ucusSaati || '',
            'TK Kodu': y.ucusTkKodu || ''
          });
        });
      } else {
        // Yolcu yoksa boş yolcu alanları ile tek satır ekle
        exportData.push({
          ...baseRow,
          'Fiyat (TL)': transfer.fiyat ? transfer.fiyat.toLocaleString('tr-TR') : '-',
          'Yolcu Adı': '',
          'Yolcu Soyadı': '',
          'Yolcu Telefon': '',
          'Uçuş Saati': '',
          'TK Kodu': ''
        });
      }
    });
    
    // Excel çalışma kitabı oluştur
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transferler');
    
    // Excel dosyasını indir
    const today = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
    XLSX.writeFile(workbook, `Transferler_${today}.xlsx`);
  };

  const filteredTransferler = transferler?.filter(transfer => {
    const matchesSearch = transfer.kalkisYeri.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.varisYeri.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transfer.sofor && `${transfer.sofor.ad} ${transfer.sofor.soyad}`.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterDurum === 'tümü' || transfer.durum === filterDurum;
    const matchesDate = !filterTarih || transfer.kalkisTarihi === filterTarih;
    const matchesTahsisli = filterTahsisli === 'tümü' || 
                           (filterTahsisli === 'tahsisli' && transfer.tahsisli) || 
                           (filterTahsisli === 'normal' && !transfer.tahsisli);
    return matchesSearch && matchesFilter && matchesDate && matchesTahsisli;
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
            Transfer Yönetimi
          </h1>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            Transfer oluşturma, düzenleme ve takip işlemleri
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="mt-3 sm:mt-0 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-purple-500"
        >
          <Plus className="h-3 w-3 mr-1" />
          Yeni Transfer
        </button>
      </div>

      {/* Filtreler - Kompakt */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ara
            </label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="text"
                placeholder="Kalkış, varış..."
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
              <option value="BEKLEMEDE">Beklemede</option>
              <option value="YOLDA">Yolda</option>
              <option value="TAMAMLANDI">Tamamlandı</option>
              <option value="IPTAL">İptal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tahsis
            </label>
            <select
              value={filterTahsisli}
              onChange={(e) => setFilterTahsisli(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="tümü">Tümü</option>
              <option value="tahsisli">Tahsisli</option>
              <option value="normal">Normal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tarih
            </label>
            <input
              type="date"
              value={filterTarih}
              onChange={(e) => setFilterTarih(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div className="sm:col-span-2">
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

      {/* Transferler Tablosu - Responsive ve Kompakt */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {/* Desktop Tablosu */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rota
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tarih/Saat
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Yolcu
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Cari
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Araç/Şoför
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fiyat
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransferler.map((transfer) => (
                <tr key={transfer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs font-medium text-gray-900 dark:text-white">
                      {transfer.kalkisYeri}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      → {transfer.varisYeri}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                    <div>{new Date(transfer.kalkisTarihi).toLocaleDateString('tr-TR')}</div>
                    <div className="font-medium">{transfer.kalkisSaati}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {transfer.yolcuSayisi}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                    {transfer.cari ? (
                      <div className="truncate max-w-24">
                        {transfer.cari.sirket ? transfer.cari.sirket : `${transfer.cari.ad} ${transfer.cari.soyad || ''}`}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                    {transfer.tedarikciyeYaptirilacak ? (
                      <div>
                        <div className="truncate max-w-20">{transfer.manuelAracPlaka || '-'}</div>
                        <div className="text-xs text-gray-400">{transfer.manuelSoforAdi || '-'}</div>
                      </div>
                    ) : transfer.arac && transfer.sofor ? (
                      <div>
                        <div className="truncate max-w-20">{transfer.arac.plaka}</div>
                        <div className="text-xs text-gray-400">{transfer.sofor.ad}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDurumRenk(transfer.durum)}`}>
                      {transfer.durum === 'BEKLEMEDE' && 'Beklemede'}
                      {transfer.durum === 'YOLDA' && 'Yolda'}
                      {transfer.durum === 'TAMAMLANDI' && 'Tamamlandı'}
                      {transfer.durum === 'IPTAL' && 'İptal'}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                    <div>{transfer.fiyat ? `${transfer.fiyat.toLocaleString('tr-TR')} ₺` : '-'}</div>
                    {transfer.tahsisli && (
                      <div className="mt-1">
                        <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                          Tahsisli
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => openEditModal(transfer)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => notifyUetds(transfer.id)}
                        className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 p-1"
                        title="U-ETDS'e Bildir"
                      >
                        U-ETDS
                      </button>
                      <button
                        onClick={() => deleteTransfer(transfer.id)}
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
            {filteredTransferler.map((transfer) => (
              <div key={transfer.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Rota */}
                    <div className="flex items-center mb-2">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {transfer.kalkisYeri}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          → {transfer.varisYeri}
                        </div>
                      </div>
                    </div>

                    {/* Tarih ve Saat */}
                    <div className="flex items-center mb-2">
                      <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500 dark:text-gray-400 mr-3">
                        {new Date(transfer.kalkisTarihi).toLocaleDateString('tr-TR')}
                      </span>
                      <Clock className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {transfer.kalkisSaati}
                      </span>
                    </div>

                    {/* Yolcu ve Cari */}
                    <div className="flex items-center mb-2">
                      <Users className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500 dark:text-gray-400 mr-3">
                        {transfer.yolcuSayisi} kişi
                      </span>
                      {transfer.cari && (
                        <>
                          <User className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {transfer.cari.sirket ? transfer.cari.sirket : `${transfer.cari.ad} ${transfer.cari.soyad || ''}`}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Araç/Şoför */}
                    <div className="flex items-center mb-2">
                      <Car className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {transfer.tedarikciyeYaptirilacak 
                          ? (transfer.manuelAracPlaka || 'Plaka belirtilmemiş')
                          : (transfer.arac ? transfer.arac.plaka : 'Atanmamış')
                        }
                      </span>
                    </div>

                    {/* Alt Bilgiler */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDurumRenk(transfer.durum)}`}>
                          {transfer.durum === 'BEKLEMEDE' && 'Beklemede'}
                          {transfer.durum === 'YOLDA' && 'Yolda'}
                          {transfer.durum === 'TAMAMLANDI' && 'Tamamlandı'}
                          {transfer.durum === 'IPTAL' && 'İptal'}
                        </span>
                        {transfer.tahsisli && (
                          <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                            Tahsisli
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-medium text-gray-900 dark:text-white">
                          {transfer.fiyat ? `${transfer.fiyat.toLocaleString('tr-TR')} ₺` : '-'}
                        </span>
                        <button
                          onClick={() => openEditModal(transfer)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => notifyUetds(transfer.id)}
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 p-1"
                          title="U-ETDS'e Bildir"
                        >
                          U-ETDS
                        </button>
                        <button
                          onClick={() => deleteTransfer(transfer.id)}
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
                  <TimeInput
                    value={formData.kalkisSaati}
                    onChange={(val) => {
                      setFormData({ ...formData, kalkisSaati: val });
                      if (!val) {
                        setFormErrors({ ...formErrors, kalkisSaati: 'Saat alanı zorunludur' });
                      } else {
                        setFormErrors({ ...formErrors, kalkisSaati: '' });
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
              
              {/* Cari Seçimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cari
                </label>
                <select
                  value={formData.cariId}
                  onChange={(e) => setFormData({...formData, cariId: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Cari Seçin</option>
                  {cariler.map((cari) => (
                    <option key={cari.id} value={cari.id}>
                      {cari.sirket ? cari.sirket : `${cari.ad} ${cari.soyad || ''}`}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Tedarikçiye Yaptırılacak Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="tedarikciyeYaptirilacak"
                  checked={formData.tedarikciyeYaptirilacak}
                  onChange={(e) => setFormData({...formData, tedarikciyeYaptirilacak: e.target.checked})}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="tedarikciyeYaptirilacak" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Tedarikçiye Yaptırılacak
                </label>
              </div>
              
              {/* Tedarikçi Seçimi - Sadece checkbox aktifse görünür */}
              {formData.tedarikciyeYaptirilacak && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tedarikçi
                  </label>
                  <select
                    value={formData.tedarikciId}
                    onChange={(e) => setFormData({...formData, tedarikciId: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Tedarikçi Seçin</option>
                    {tedarikciler.map((tedarikci) => (
                      <option key={tedarikci.id} value={tedarikci.id}>
                        {tedarikci.sirketAdi}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Manuel Araç ve Şoför Bilgileri - Sadece tedarikçiye yaptırılacaksa görünür */}
              {formData.tedarikciyeYaptirilacak && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Araç Marka
                    </label>
                    <input
                      type="text"
                      value={formData.manuelAracMarka}
                      onChange={(e) => setFormData({...formData, manuelAracMarka: e.target.value})}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Araç markası"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Araç Model
                    </label>
                    <input
                      type="text"
                      value={formData.manuelAracModel}
                      onChange={(e) => setFormData({...formData, manuelAracModel: e.target.value})}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Araç modeli"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Araç Tipi
                    </label>
                    <input
                      type="text"
                      value={formData.manuelAracTip}
                      onChange={(e) => setFormData({...formData, manuelAracTip: e.target.value})}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Araç tipi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Araç Plaka
                    </label>
                    <input
                      type="text"
                      value={formData.manuelAracPlaka}
                      onChange={(e) => setFormData({...formData, manuelAracPlaka: e.target.value})}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Araç plakası"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Şoför Adı
                    </label>
                    <input
                      type="text"
                      value={formData.manuelSoforAdi}
                      onChange={(e) => setFormData({...formData, manuelSoforAdi: e.target.value})}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Şoför adı"
                    />
                  </div>
                </div>
              )}
              
              {/* Araç ve Şoför Seçimi - Sadece tedarikçiye yaptırılmayacaksa görünür */}
              {!formData.tedarikciyeYaptirilacak && (
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
              )}

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
                            <TimeInput
                              value={yolcu.ucusSaati}
                              onChange={(val) => updateYolcu(index, 'ucusSaati', val)}
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