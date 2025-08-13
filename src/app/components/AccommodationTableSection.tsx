"use client";

import { useState, useEffect } from "react";
import * as XLSX from 'xlsx';
import BulkActionsMenu from "./BulkActionsMenu";

export interface AccommodationRecord {
  id: number;
  adiSoyadi: string;
  unvani: string;
  ulke: string;
  sehir: string;
  girisTarihi: string;
  cikisTarihi: string;
  odaTipi: string;
  konaklamaTipi: "BB" | "HB" | "FB" | "UHD";
  gecelikUcret: number;
  toplamUcret: number;
  organizasyonAdi?: string;
  organizationId?: number;
  organization?: {
    id: number;
    name: string;
    status: string;
  };
  otelAdi?: string;
  kurumCari?: string;
  numberOfNights?: number;
  isMunferit?: boolean;
}

interface User {
  id: number;
  email: string;
  name?: string;
  role: 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER';
  permissions?: string[];
}

interface AccommodationTableSectionProps {
  handlePuantajRaporu?: () => void;
  filterType?: 'all' | 'munferit' | 'organization';
  organizationId?: number;
}

export default function AccommodationTableSection({ handlePuantajRaporu, filterType = 'all', organizationId }: AccommodationTableSectionProps) {
  const [records, setRecords] = useState<AccommodationRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AccommodationRecord | null>(null);
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([]);
  const [sortColumn, setSortColumn] = useState<keyof AccommodationRecord | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('desc');
  const [showExportFilterModal, setShowExportFilterModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [availableColumns, setAvailableColumns] = useState<Array<{key: string, label: string}>>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [exportColumns, setExportColumns] = useState<Record<string, boolean>>({
    adiSoyadi: true,
    unvani: true,
    ulke: true,
    sehir: true,
    girisTarihi: true,
    cikisTarihi: true,
    odaTipi: true,
    konaklamaTipi: true,
    gecelikUcret: true,
    toplamUcret: true,
    organizasyonAdi: true,
    otelAdi: true,
    kurumCari: true,
    numberOfNights: true,
  });

  // Form state'leri
  const [formData, setFormData] = useState({
    adiSoyadi: '',
    unvani: '',
    ulke: 'Türkiye',
    sehir: '',
    girisTarihi: '',
    cikisTarihi: '',
    odaTipi: 'Single Oda',
    konaklamaTipi: 'BB' as const,
    gecelikUcret: 0,
    toplamUcret: 0,
    organizationId: '',
    otelAdi: '',
    kurumCari: '',
    numberOfNights: 0,
    isMunferit: false,
  });

  // Filtre state'leri
  const [filterOrg, setFilterOrg] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterTitle, setFilterTitle] = useState('');
  
  // Organizasyon state'leri
  const [organizations, setOrganizations] = useState<Array<{id: number, name: string, status: string}>>([]);
  const [hotels, setHotels] = useState<Array<{id: number, adi: string, sehir: string, ulke: string}>>([]);
  const [cariler, setCariler] = useState<Array<{id: string, ad: string, soyad?: string, sirket?: string, tip: string, durum: string}>>([]);

  // Seçili kayıtların kurum ve otel adı aynı mı?
  const allSame = (() => {
    if (selectedRecordIds.length < 2 || !records || !Array.isArray(records)) return false;
    const selected = records.filter(r => selectedRecordIds.includes(r.id));
    const kurum = selected[0]?.kurumCari;
    const otel = selected[0]?.otelAdi;
    return selected.every(r => r.kurumCari === kurum && r.otelAdi === otel);
  })();

  // Role tabanlı yetki kontrolü fonksiyonları
  const hasRole = (requiredRole: string): boolean => {
    if (!currentUser) return false;
    const roleHierarchy: Record<string, number> = { 'ADMIN': 4, 'MANAGER': 3, 'USER': 2, 'VIEWER': 1 };
    const userRole = currentUser.role as string;
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  };

  const canAdd = () => hasRole('USER');
  const canEdit = () => hasRole('USER');
  const canDelete = () => hasRole('MANAGER');



  // useEffect ve API çağrıları
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/user', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch (error) {
        //
      }
    }
    fetchUser();

    const fetchRecords = () => {
      let url = '/api/accommodation';
      
      // Filtreleme parametreleri ekle
      const params = new URLSearchParams();
      if (filterType === 'munferit') {
        params.append('isMunferit', 'true');
      } else if (filterType === 'organization' && organizationId) {
        params.append('organizationId', organizationId.toString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      fetch(url)
        .then(res => res.json())
        .then(data => {
          setRecords(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(error => {
          console.error('Records fetch error:', error);
          setRecords([]);
          setLoading(false);
        });
    };
    fetchRecords();

    // Organizasyonları çek
    fetch('/api/organizations')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOrganizations(data);
        } else {
          console.error('Organizations API returned non-array data:', data);
          setOrganizations([]);
        }
      })
      .catch(err => {
        console.error('Organizasyonlar yüklenirken hata:', err);
        setOrganizations([]);
      });

    fetchHotels();
    fetchCariler();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchRecords();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Doğru gün sayısı hesaplama fonksiyonu (çıkış günü hariç)
  function calculateNumberOfNights(girisTarihi: string, cikisTarihi: string): number {
    const start = new Date(girisTarihi);
    const end = new Date(cikisTarihi);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  const handleEditClick = (id: number) => {
    if (!records || !Array.isArray(records)) return;
    const recordToEdit = records.find((record) => record.id === id);
    if (recordToEdit) {
      setEditingRecord(recordToEdit);
      setShowEditModal(true);
    }
  };

  const handleDeleteClick = async (id: number) => {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    
    try {
      const response = await fetch(`/api/accommodation/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setRecords(prev => prev.filter(record => record.id !== id));
      } else {
        const errorData = await response.json();
        alert(`Kayıt silinemedi: ${errorData.error || 'Bir hata oluştu'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Kayıt silinemedi!');
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingRecord(null);
  };
  
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // id alanını değiştirmeye izin verme
    if (name === 'id') return;
    
    if (type === 'number') {
      setEditingRecord(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [name]: parseFloat(value) || 0
        };
      });
    } else {
      setEditingRecord(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [name]: value
        };
      });
    }
    
    // Toplam ücret hesaplama
    if (name === 'girisTarihi' || name === 'cikisTarihi' || name === 'gecelikUcret') {
      setEditingRecord(prev => {
        if (!prev) return prev;
        const girisTarihi = name === 'girisTarihi' ? value : prev.girisTarihi;
        const cikisTarihi = name === 'cikisTarihi' ? value : prev.cikisTarihi;
        const gecelikUcret = name === 'gecelikUcret' ? parseFloat(value) || 0 : prev.gecelikUcret || 0;
        
        if (girisTarihi && cikisTarihi) {
          const nights = calculateNumberOfNights(girisTarihi, cikisTarihi);
          const toplamUcret = nights * gecelikUcret;
          
          return {
            ...prev,
            numberOfNights: nights,
            toplamUcret: toplamUcret
          };
        }
        return prev;
      });
    }
  };
  
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingRecord || !editingRecord.adiSoyadi || !editingRecord.girisTarihi || !editingRecord.cikisTarihi || !editingRecord.odaTipi || !editingRecord.konaklamaTipi) {
      alert('Lütfen zorunlu alanları doldurunuz.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // ID'yi ayrı tut
      const recordId = editingRecord.id;
      
      // Sadece güncellenebilir alanları gönder - id ve diğer sistem alanlarını çıkar
      const { 
        id, 
        organization, 
        companyId, 
        createdAt, 
        updatedAt,
        organizationId,
        isMunferit,
        ...updateData 
      } = editingRecord;
      
      const response = await fetch(`/api/accommodation/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (response.ok) {
        // Başarılı güncelleme sonrası listeyi güncelle
        const updatedRecord = await response.json();
        setRecords(prev => prev.map(record => 
          record.id === updatedRecord.id ? updatedRecord : record
        ));
        closeEditModal();
      } else {
        const errorData = await response.json();
        alert(`Hata: ${errorData.error || errorData.message || 'Bir hata oluştu'}`);
      }
    } catch (error) {
      console.error('Kayıt güncellenirken hata oluştu:', error);
      alert('Kayıt güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setFormData({
      adiSoyadi: '',
      unvani: '',
      ulke: 'Türkiye',
      sehir: '',
      girisTarihi: '',
      cikisTarihi: '',
      odaTipi: 'Single Oda',
      konaklamaTipi: 'BB',
      faturaEdildi: false,
      gecelikUcret: 0,
      toplamUcret: 0,
      otelAdi: '',
      kurumCari: '',
      numberOfNights: 0,
    });
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setFormData({
      adiSoyadi: '',
      unvani: '',
      ulke: 'Türkiye',
      sehir: '',
      girisTarihi: '',
      cikisTarihi: '',
      odaTipi: 'Single Oda',
      konaklamaTipi: 'BB',
      faturaEdildi: false,
      gecelikUcret: 0,
      toplamUcret: 0,
      otelAdi: '',
      kurumCari: '',
      numberOfNights: 0,
    });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : (type === 'number' ? parseFloat(value) || 0 : value)
    }));

    // Toplam ücret hesaplama
    if (name === 'girisTarihi' || name === 'cikisTarihi' || name === 'gecelikUcret') {
      const girisTarihi = name === 'girisTarihi' ? value : formData.girisTarihi;
      const cikisTarihi = name === 'cikisTarihi' ? value : formData.cikisTarihi;
      const gecelikUcret = name === 'gecelikUcret' ? parseFloat(value) || 0 : formData.gecelikUcret || 0;

      if (girisTarihi && cikisTarihi) {
        const nights = calculateNumberOfNights(girisTarihi, cikisTarihi);
        const toplamUcret = nights * gecelikUcret;

        setFormData(prev => ({
          ...prev,
          numberOfNights: nights,
          toplamUcret: toplamUcret
        }));
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Konaklama tipi boşsa otomatik olarak 'BB' yap
    if (!formData.konaklamaTipi) {
      formData.konaklamaTipi = 'BB';
    }

    if (!formData.adiSoyadi || !formData.girisTarihi || !formData.cikisTarihi || !formData.odaTipi || !formData.konaklamaTipi) {
      alert('Lütfen zorunlu alanları doldurunuz.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/accommodation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Başarılı kayıt sonrası listeyi güncelle
        const data = await response.json();
        setRecords(prev => [...prev, data]);

        closeAddModal();
      } else {
        const errorData = await response.json();
        alert(`Hata: ${errorData.error || errorData.message || 'Bir hata oluştu'}`);
      }
    } catch (error) {
      console.error('Kayıt eklenirken hata oluştu:', error);
      alert('Kayıt eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR');
  }

  const handleSort = (column: keyof AccommodationRecord) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  const clearSort = () => {
    setSortColumn(null);
    setSortDirection(null);
  };

  // Filtrelenmiş kayıtlar
  const filteredRecords = records.filter((record) => {
    const orgMatch = filterOrg ? record.organization?.name?.toLowerCase().includes(filterOrg.toLowerCase()) : true;
    const nameMatch = filterName ? record.adiSoyadi?.toLowerCase().includes(filterName.toLowerCase()) : true;
    const titleMatch = filterTitle ? record.unvani?.toLowerCase().includes(filterTitle.toLowerCase()) : true;
    return orgMatch && nameMatch && titleMatch;
  });

  // Sıralanmış kayıtlar
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;
    
    let aValue: any = a[sortColumn];
    let bValue: any = b[sortColumn];
    
    // Özel sıralama kuralları
    if (sortColumn === 'id') {
      aValue = a.id;
      bValue = b.id;
    } else if (sortColumn === 'numberOfNights') {
      aValue = a.numberOfNights || 0;
      bValue = b.numberOfNights || 0;
    } else if (sortColumn === 'toplamUcret') {
      aValue = a.toplamUcret;
      bValue = b.toplamUcret;
    } else if (sortColumn === 'girisTarihi' || sortColumn === 'cikisTarihi') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ column }: { column: keyof AccommodationRecord }) => {
    if (sortColumn !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    if (sortDirection === 'asc') {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }
    
    return (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Toplu silme işlemini başlatan fonksiyon (popup açar)
  const handleBulkDeleteRequest = () => {
    setShowBulkDeleteModal(true);
    setPendingBulkDelete(false);
  };

  // Toplu silme işlemini onaylayan fonksiyon (gerçek silme)
  const handleBulkDeleteConfirm = async () => {
    setPendingBulkDelete(true);
    // Burada gerçek silme işlemi yapılır
    // ... mevcut handleBulkDelete kodunu buraya taşı ...
    try {
      for (const id of selectedRecordIds) {
        await fetch(`/api/accommodation/${id}`, { method: 'DELETE' });
      }
      setRecords(prev => prev.filter(record => !selectedRecordIds.includes(record.id)));
      setSelectedRecordIds([]);
      setShowBulkDeleteModal(false);
    } catch (error) {
      alert('Toplu silme sırasında hata oluştu!');
    } finally {
      setPendingBulkDelete(false);
    }
  };

  const handleSelectRecord = (id: number) => {
    setSelectedRecordIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(recordId => recordId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedRecordIds.length === sortedRecords.length) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(sortedRecords.map(record => record.id));
    }
  };



  // Excel import/export fonksiyonları
  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          alert('Excel dosyası en az bir başlık satırı ve bir veri satırı içermelidir!');
          return;
        }

        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];

        const getColumnValue = (headerName: string): string => {
          const index = headers.findIndex(h => h?.toString().toLowerCase().includes(headerName.toLowerCase()));
          return index >= 0 ? (rows[0]?.[index]?.toString() || '') : '';
        };

        const excelDateToISO = (excelDateSerial: string): string => {
          if (!excelDateSerial) return '';
          try {
            // Excel tarih serisi numarasını JavaScript tarihine çevir
            const excelDate = parseFloat(excelDateSerial);
            if (isNaN(excelDate)) return excelDateSerial;
            
            // Excel'in başlangıç tarihi (1900-01-01) ile JavaScript'in başlangıç tarihi (1970-01-01) arasındaki fark
            const excelEpoch = new Date(1900, 0, 1);
            const jsEpoch = new Date(1970, 0, 1);
            const epochDiff = jsEpoch.getTime() - excelEpoch.getTime();
            
            // Excel tarihini JavaScript tarihine çevir
            const jsDate = new Date(excelDate * 24 * 60 * 60 * 1000 + epochDiff);
            
            // YYYY-MM-DD formatına çevir
            return jsDate.toISOString().split('T')[0];
          } catch (error) {
            return excelDateSerial;
          }
        };

        const newRecords = rows.map((row, index) => {
          const adiSoyadi = getColumnValue('Adı Soyadı') || getColumnValue('Ad Soyad') || getColumnValue('AdıSoyadı') || row[0]?.toString() || '';
          const unvani = getColumnValue('Unvanı') || getColumnValue('Unvan') || row[1]?.toString() || '';
          const ulke = getColumnValue('Ülke') || getColumnValue('Ulke') || row[2]?.toString() || '';
          const sehir = getColumnValue('Şehir') || getColumnValue('Sehir') || getColumnValue('Şehir') || row[3]?.toString() || '';
          const girisTarihi = excelDateToISO(getColumnValue('Giriş Tarihi') || getColumnValue('Giris Tarihi') || getColumnValue('GirişTarihi') || row[4]?.toString() || '');
          const cikisTarihi = excelDateToISO(getColumnValue('Çıkış Tarihi') || getColumnValue('Cikis Tarihi') || getColumnValue('ÇıkışTarihi') || row[5]?.toString() || '');
          const odaTipi = getColumnValue('Oda Tipi') || getColumnValue('OdaTipi') || row[6]?.toString() || 'Single Oda';
          const konaklamaTipi = (getColumnValue('Konaklama Tipi') || getColumnValue('KonaklamaTipi') || row[7]?.toString() || 'BB') as "BB" | "HB" | "FB" | "UHD";
          const gecelikUcret = parseFloat(getColumnValue('Gecelik Ücret') || getColumnValue('GecelikUcret') || row[8]?.toString() || '0') || 0;
  
          const otelAdi = getColumnValue('Otel Adı') || getColumnValue('OtelAdi') || row[10]?.toString() || '';
          const kurumCari = getColumnValue('Cari') || getColumnValue('Kurum / Cari') || getColumnValue('Kurum Cari') || getColumnValue('KurumCari') || row[11]?.toString() || '';

          if (!adiSoyadi || !girisTarihi || !cikisTarihi) {
            console.warn(`Satır ${index + 2}: Gerekli alanlar eksik (Ad Soyad, Giriş Tarihi, Çıkış Tarihi)`);
            return null;
          }

          const numberOfNights = calculateNumberOfNights(girisTarihi, cikisTarihi);
          const toplamUcret = gecelikUcret * numberOfNights;

          return {
            adiSoyadi,
            unvani,
            ulke,
            sehir,
            girisTarihi,
            cikisTarihi,
            odaTipi,
            konaklamaTipi,
            faturaEdildi: false,
            gecelikUcret,
            toplamUcret,
            numberOfNights,
  
            otelAdi,
            kurumCari,
          };
        }).filter(record => record !== null);

        if (newRecords.length === 0) {
          alert('Geçerli kayıt bulunamadı! Lütfen Excel dosyasını kontrol edin.');
          return;
        }

        // API'ye toplu kayıt gönder
        const res = await fetch('/api/accommodation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records: newRecords }),
        });

        if (res.ok) {
          const createdRecords = await res.json();
          setRecords(prev => [...prev, ...createdRecords]);
          alert(`${newRecords.length} kayıt başarıyla içe aktarıldı!`);
        } else {
          alert('Kayıtlar içe aktarılamadı!');
        }
      } catch (error) {
        console.error('Excel import error:', error);
        alert('Excel dosyası okunamadı!');
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  const handleExportExcel = () => {
    setAvailableColumns([
      { key: 'id', label: 'ID' },
      { key: 'adiSoyadi', label: 'Adı Soyadı' },
      { key: 'unvani', label: 'Unvanı' },
      { key: 'ulke', label: 'Ülke' },
      { key: 'sehir', label: 'Şehir' },
      { key: 'girisTarihi', label: 'Giriş Tarihi' },
      { key: 'cikisTarihi', label: 'Çıkış Tarihi' },
      { key: 'odaTipi', label: 'Oda Tipi' },
      { key: 'konaklamaTipi', label: 'Konaklama Tipi' },
      { key: 'faturaEdildi', label: 'Fatura Edildi' },
      { key: 'numberOfNights', label: 'Gece Sayısı' },
      { key: 'gecelikUcret', label: 'Gecelik Ücret' },
      { key: 'toplamUcret', label: 'Toplam Ücret' },
      
      { key: 'otelAdi', label: 'Otel Adı' },
      { key: 'kurumCari', label: 'Cari' },
    ]);
    setSelectedColumns([
      'id', 'adiSoyadi', 'unvani', 'ulke', 'sehir', 'girisTarihi', 'cikisTarihi',
      'odaTipi', 'konaklamaTipi', 'faturaEdildi', 'numberOfNights', 'gecelikUcret',
              'toplamUcret', 'otelAdi', 'kurumCari'
    ]);
    setShowExportFilterModal(true);
  };

  const closeExportFilterModal = () => {
    setShowExportFilterModal(false);
  };

  const handleColumnToggle = (columnKey: string) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnKey)) {
        return prev.filter(col => col !== columnKey);
      } else {
        return [...prev, columnKey];
      }
    });
  };

  const handleExportFilteredExcel = () => {
    if (selectedColumns.length === 0) {
      alert('En az bir sütun seçilmelidir!');
      return;
    }

    // Seçili sütunlara göre veriyi filtrele
    const exportData = sortedRecords.map(record => {
      const filteredRecord: any = {};
      selectedColumns.forEach(column => {
        if (column === 'id') {
          filteredRecord['ID'] = record.id;
        } else if (column === 'adiSoyadi') {
          filteredRecord['Adı Soyadı'] = record.adiSoyadi;
        } else if (column === 'unvani') {
          filteredRecord['Unvanı'] = record.unvani;
        } else if (column === 'ulke') {
          filteredRecord['Ülke'] = record.ulke;
        } else if (column === 'sehir') {
          filteredRecord['Şehir'] = record.sehir;
        } else if (column === 'girisTarihi') {
          filteredRecord['Giriş Tarihi'] = formatDate(record.girisTarihi);
        } else if (column === 'cikisTarihi') {
          filteredRecord['Çıkış Tarihi'] = formatDate(record.cikisTarihi);
        } else if (column === 'odaTipi') {
          filteredRecord['Oda Tipi'] = record.odaTipi;
        } else if (column === 'konaklamaTipi') {
          filteredRecord['Konaklama Tipi'] = record.konaklamaTipi;
        } else if (column === 'faturaEdildi') {
          filteredRecord['Fatura Edildi'] = record.faturaEdildi ? 'Evet' : 'Hayır';
        } else if (column === 'numberOfNights') {
          filteredRecord['Gece Sayısı'] = record.numberOfNights || 0;
        } else if (column === 'gecelikUcret') {
          filteredRecord['Gecelik Ücret'] = record.gecelikUcret;
        } else if (column === 'toplamUcret') {
          filteredRecord['Toplam Ücret'] = record.toplamUcret;
        
        } else if (column === 'otelAdi') {
          filteredRecord['Otel Adı'] = record.otelAdi || '';
              } else if (column === 'kurumCari') {
        filteredRecord['Cari'] = record.kurumCari || '';
        }
      });
      return filteredRecord;
    });

    // Excel dosyası oluştur
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Konaklama Kayıtları');

    // Dosyayı indir
    const fileName = `konaklama_kayitlari_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    setShowExportFilterModal(false);
  };

  const handleDownloadExcelTemplate = () => {
    // Örnek veri ile template oluştur
    const templateData = [
      {
        'Adı Soyadı': 'Örnek Kişi',
        'Unvanı': 'Örnek Unvan',
        'Ülke': 'Türkiye',
        'Şehir': 'İstanbul',
        'Giriş Tarihi': '2024-07-01',
        'Çıkış Tarihi': '2024-07-03',
        'Oda Tipi': 'Single Oda',
        'Konaklama Tipi': 'BB',
        'Gecelik Ücret': 500,
        'Organizasyon Adı': 'Örnek Organizasyon',
        'Otel Adı': 'Örnek Otel',
        'Kurum / Cari': 'Örnek Kurum'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Sütun genişliklerini ayarla
    const columnWidths = [
      { wch: 20 }, // Adı Soyadı
      { wch: 15 }, // Unvanı
      { wch: 12 }, // Ülke
      { wch: 12 }, // Şehir
      { wch: 12 }, // Giriş Tarihi
      { wch: 12 }, // Çıkış Tarihi
      { wch: 15 }, // Oda Tipi
      { wch: 15 }, // Konaklama Tipi
      { wch: 15 }, // Gecelik Ücret
      { wch: 20 }, // Organizasyon Adı
      { wch: 20 }, // Otel Adı
      { wch: 20 }, // Kurum / Cari
    ];
    worksheet['!cols'] = columnWidths;

    // Açıklama ekle
    const addComment = (cell: string, text: string) => {
      if (!worksheet[cell]) return;
      worksheet[cell].c = [{
        a: 'Sistem',
        t: text
      }];
    };

    // Veri doğrulama kuralları için interface
    interface DataValidation {
      type: 'list';
      formula1: string;
    }

    // Veri doğrulama kuralları ekle
    const addDataValidation = (cell: string, validation: DataValidation) => {
      if (!worksheet[cell]) return;
      if (!worksheet['!dataValidations']) {
        worksheet['!dataValidations'] = [];
      }
      worksheet['!dataValidations'].push({
        sqref: cell,
        type: validation.type,
        formula1: validation.formula1
      });
    };

    // Açıklamalar ekle
    addComment('A1', 'Zorunlu alan: Kişinin tam adı ve soyadı');
    addComment('B1', 'Kişinin unvanı veya pozisyonu');
    addComment('C1', 'Kişinin ülkesi');
    addComment('D1', 'Kişinin şehri');
    addComment('E1', 'Zorunlu alan: Giriş tarihi (YYYY-MM-DD formatında)');
    addComment('F1', 'Zorunlu alan: Çıkış tarihi (YYYY-MM-DD formatında)');
    addComment('G1', 'Oda tipi (Single Oda, Double Oda, vb.)');
    addComment('H1', 'Konaklama tipi (BB, HB, FB, UHD)');
    addComment('I1', 'Gecelik ücret (sayısal değer)');
    addComment('J1', 'Organizasyon adı (opsiyonel)');
    addComment('K1', 'Otel adı (opsiyonel)');
    addComment('L1', 'Kurum/Cari bilgisi (opsiyonel)');

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    // Dosyayı indir
    XLSX.writeFile(workbook, 'konaklama_kayit_template.xlsx');
  };





  // fetchHotels fonksiyonunu component fonksiyonunun içine taşı
  const fetchHotels = async () => {
    try {
      const res = await fetch('/api/konaklama/oteller');
      if (res.ok) {
        const data = await res.json();
        setHotels(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Oteller yüklenirken hata:', error);
      setHotels([]);
    }
  };

  // fetchCariler fonksiyonunu component fonksiyonunun içine taşı
  const fetchCariler = async () => {
    try {
      const res = await fetch('/api/cariler');
      if (res.ok) {
        const data = await res.json();
        setCariler(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Cariler yüklenirken hata:', error);
      setCariler([]);
    }
  };

  return (
    <div className="w-full mx-auto mt-4 sm:mt-8">
      {/* Butonlar - En üstte */}
      <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 sm:gap-3 mb-4">
        <BulkActionsMenu
          selectedCount={selectedRecordIds.length}
          onBulkDelete={handleBulkDeleteRequest}
          onBulkExport={handleExportExcel}
        />
        <button onClick={handleDownloadExcelTemplate} className="btn btn-primary text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="hidden sm:inline">Excel Şablonu İndir</span>
          <span className="sm:hidden">Şablon</span>
        </button>
        <button onClick={handlePuantajRaporu} className="btn btn-warning text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="hidden sm:inline">Puantaj Raporu</span>
          <span className="sm:hidden">Puantaj</span>
        </button>
        <button onClick={() => setShowAddModal(true)} className="btn btn-success text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="hidden sm:inline">Yeni Kayıt</span>
          <span className="sm:hidden">Ekle</span>
        </button>
      </div>

      {/* Arama inputları - Tablonun hemen üstünde */}
      <div className="flex flex-wrap gap-2 sm:gap-3 items-center mb-3">
        <div className="relative w-full sm:w-auto">
          <div className="flex items-center bg-white border rounded-lg overflow-hidden shadow-sm">
            <div className="p-2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="py-2 pr-3 w-full sm:w-40 md:w-48 border-0 focus:ring-0 text-sm"
              placeholder="Ad soyad ara..."
              value={filterName}
              onChange={e => setFilterName(e.target.value)}
            />
          </div>
        </div>
        
        <div className="relative w-full sm:w-auto">
          <div className="flex items-center bg-white border rounded-lg overflow-hidden shadow-sm">
            <div className="p-2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <input
              type="text"
              className="py-2 pr-3 w-full sm:w-40 border-0 focus:ring-0 text-sm"
              placeholder="Organizasyon ara..."
              value={filterOrg}
              onChange={e => setFilterOrg(e.target.value)}
            />
          </div>
        </div>
        
        <div className="relative w-full sm:w-auto">
          <div className="flex items-center bg-white border rounded-lg overflow-hidden shadow-sm">
            <div className="p-2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input
              type="text"
              className="py-2 pr-3 w-full sm:w-32 border-0 focus:ring-0 text-sm"
              placeholder="Unvan ara..."
              value={filterTitle}
              onChange={e => setFilterTitle(e.target.value)}
            />
          </div>
        </div>
        
        <label className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm cursor-pointer">
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
          Excel'den İçe Aktar
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel} />
        </label>
      </div>
      {/* Tablo */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md max-w-full">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="text-[10px] bg-gray-50">
              <th className="w-8 py-1 sm:py-2">
                <input 
                  type="checkbox" 
                  className="checkbox checkbox-xs" 
                  checked={selectedRecordIds.length === sortedRecords.length && sortedRecords.length > 0} 
                  onChange={handleSelectAll} 
                />
              </th>
              <th className="w-8 py-1 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('id')}>
                <div className="flex items-center justify-between">
                  <span>ID</span>
                  <SortIcon column="id" />
                </div>
              </th>
              <th className="w-16 py-1 hidden xl:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('kurumCari')}>
                <div className="flex items-center justify-between">
                  <span>Cari</span>
                  <SortIcon column="kurumCari" />
                </div>
              </th>

              <th className="w-16 py-1 hidden lg:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('otelAdi')}>
                <div className="flex items-center justify-between">
                  <span>Otel</span>
                  <SortIcon column="otelAdi" />
                </div>
              </th>
              <th className="w-20 py-1 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('adiSoyadi')}>
                <div className="flex items-center justify-between">
                  <span>Ad Soyad</span>
                  <SortIcon column="adiSoyadi" />
                </div>
              </th>
              <th className="w-12 py-1 hidden md:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('unvani')}>
                <div className="flex items-center justify-between">
                  <span>Unvan</span>
                  <SortIcon column="unvani" />
                </div>
              </th>
              <th className="w-12 py-1 hidden xl:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('ulke')}>
                <div className="flex items-center justify-between">
                  <span>Ülke</span>
                  <SortIcon column="ulke" />
                </div>
              </th>
              <th className="w-12 py-1 hidden xl:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('sehir')}>
                <div className="flex items-center justify-between">
                  <span>Şehir</span>
                  <SortIcon column="sehir" />
                </div>
              </th>
              <th className="w-14 py-1 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('girisTarihi')}>
                <div className="flex items-center justify-between">
                  <span>Giriş</span>
                  <SortIcon column="girisTarihi" />
                </div>
              </th>
              <th className="w-14 py-1 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('cikisTarihi')}>
                <div className="flex items-center justify-between">
                  <span>Çıkış</span>
                  <SortIcon column="cikisTarihi" />
                </div>
              </th>
              <th className="w-12 py-1 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('odaTipi')}>
                <div className="flex items-center justify-between">
                  <span>Oda</span>
                  <SortIcon column="odaTipi" />
                </div>
              </th>
              <th className="w-16 py-1 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('konaklamaTipi')}>
                <div className="flex items-center justify-between">
                  <span>Konaklama</span>
                  <SortIcon column="konaklamaTipi" />
                </div>
              </th>
              <th className="w-10 py-1 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('numberOfNights')}>
                <div className="flex items-center justify-between">
                  <span>Gece</span>
                  <SortIcon column="numberOfNights" />
                </div>
              </th>
              <th className="w-14 py-1 hidden lg:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('gecelikUcret')}>
                <div className="flex items-center justify-between">
                  <span>Gecelik</span>
                  <SortIcon column="gecelikUcret" />
                </div>
              </th>
              <th className="w-16 py-1 hidden md:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('toplamUcret')}>
                <div className="flex items-center justify-between">
                  <span>Toplam</span>
                  <SortIcon column="toplamUcret" />
                </div>
              </th>
              <th className="w-12 py-1">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 text-[10px]">
                <td className="py-1">
                  <input type="checkbox" className="checkbox checkbox-xs" checked={selectedRecordIds.includes(record.id)} onChange={() => handleSelectRecord(record.id)} />
                </td>
                <td className="font-medium text-blue-600 whitespace-nowrap py-1">{record.id}</td>
                <td className="truncate hidden xl:table-cell py-1">{record.kurumCari || '-'}</td>
                <td className="truncate hidden lg:table-cell py-1">{record.otelAdi || '-'}</td>
                <td className="truncate py-1">
                  <span className="font-medium">{record.adiSoyadi}</span>
                </td>
                <td className="truncate hidden md:table-cell py-1">{record.unvani || '-'}</td>
                <td className="truncate hidden xl:table-cell py-1">{record.ulke || '-'}</td>
                <td className="truncate hidden xl:table-cell py-1">{record.sehir || '-'}</td>
                <td className="whitespace-nowrap py-1">{formatDate(record.girisTarihi)}</td>
                <td className="whitespace-nowrap py-1">{formatDate(record.cikisTarihi)}</td>
                <td className="text-center py-1">
                  <span className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-[8px] font-medium">
                    {record.odaTipi}
                  </span>
                </td>
                <td className="text-center py-1">
                  <span className={`px-1 py-0.5 rounded text-[8px] font-bold ${record.konaklamaTipi === 'BB' ? 'bg-yellow-100 text-yellow-800' : record.konaklamaTipi === 'HB' ? 'bg-green-100 text-green-800' : record.konaklamaTipi === 'FB' ? 'bg-purple-100 text-purple-800' : 'bg-pink-100 text-pink-800'}`}>{record.konaklamaTipi}</span>
                </td>
                <td className="text-center whitespace-nowrap py-1">{record.numberOfNights || 0}</td>
                <td className="font-medium text-gray-600 hidden lg:table-cell whitespace-nowrap text-right py-1">{record.gecelikUcret?.toLocaleString('tr-TR')} ₺</td>
                <td className="font-bold text-green-600 hidden md:table-cell whitespace-nowrap text-right py-1">{record.toplamUcret.toLocaleString('tr-TR')} ₺</td>

                <td className="py-1">
                  <div className="flex justify-center gap-1">
                    {canEdit() && (
                      <button
                        onClick={() => handleEditClick(record.id)}
                        className="p-0.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        title="Düzenle"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    {canDelete() && (
                      <button
                        onClick={() => handleDeleteClick(record.id)}
                        className="p-0.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                        title="Sil"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>



      {/* Edit Modal */}
      {showEditModal && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) closeEditModal(); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 p-8 relative animate-fade-in border border-blue-100">
            <button
              onClick={closeEditModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              aria-label="Kapat"
            >
              ×
            </button>
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Konaklama Kaydını Düzenle</h2>
            </div>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="adiSoyadi"
                  value={editingRecord.adiSoyadi || ''}
                  onChange={handleEditInputChange}
                  className="input w-full border border-gray-300 rounded-md" 
                  placeholder="Ad Soyad" 
                  required
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ünvan</label>
                <input 
                  type="text" 
                  name="unvani"
                  value={editingRecord.unvani || ''}
                  onChange={handleEditInputChange}
                  className="input w-full border border-gray-300 rounded-md" 
                  placeholder="Ünvan" 
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ülke</label>
                <input 
                  type="text" 
                  name="ulke"
                  value={editingRecord.ulke || ''}
                  onChange={handleEditInputChange}
                  className="input w-full border border-gray-300 rounded-md" 
                  placeholder="Ülke" 
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                <input 
                  type="text" 
                  name="sehir"
                  value={editingRecord.sehir || ''}
                  onChange={handleEditInputChange}
                  className="input w-full border border-gray-300 rounded-md" 
                  placeholder="Şehir" 
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Giriş Tarihi <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  name="girisTarihi"
                  value={editingRecord.girisTarihi || ''}
                  onChange={handleEditInputChange}
                  className="input w-full border border-gray-300 rounded-md" 
                  required
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Çıkış Tarihi <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  name="cikisTarihi"
                  value={editingRecord.cikisTarihi || ''}
                  onChange={handleEditInputChange}
                  className="input w-full border border-gray-300 rounded-md" 
                  required
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Oda Tipi <span className="text-red-500">*</span></label>
                <select 
                  name="odaTipi"
                  value={editingRecord.odaTipi || ''}
                  onChange={handleEditInputChange}
                  className="input w-full border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Seçiniz</option>
                  <option value="Tek Kişilik">Tek Kişilik</option>
                  <option value="Çift Kişilik">Çift Kişilik</option>
                  <option value="Suit">Suit</option>
                </select>
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Konaklama Tipi <span className="text-red-500">*</span></label>
                <select 
                  name="konaklamaTipi"
                  value={editingRecord.konaklamaTipi || 'BB'}
                  onChange={handleEditInputChange}
                  className="input w-full border border-gray-300 rounded-md"
                  required
                >
                  <option value="BB">BB (Kahvaltı Dahil)</option>
                  <option value="HB">HB (Yarım Pansiyon)</option>
                  <option value="FB">FB (Tam Pansiyon)</option>
                  <option value="UHD">UHD (Ultra Her Şey Dahil)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Organizasyon</label>
                <select
                  name="organizationId"
                  value={editingRecord.organizationId?.toString() || ''}
                  onChange={handleEditInputChange}
                  className="input w-full border border-gray-300 rounded-md"
                >
                  <option value="">Münferit Konaklama</option>
                  {organizations
                    .filter(org => org.status === 'ACTIVE')
                    .map((org) => (
                      <option key={org.id} value={org.id.toString()}>
                        {org.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Otel</label>
                <select
                  name="otelAdi"
                  value={editingRecord.otelAdi || ''}
                  onChange={handleEditInputChange}
                  className="input w-full border border-gray-300 rounded-md"
                >
                  <option value="">Otel Seçiniz</option>
                  {hotels
                    .filter(hotel => hotel.durum === 'AKTIF')
                    .map((hotel) => (
                      <option key={hotel.id} value={hotel.adi}>
                        {hotel.adi} - {hotel.sehir}
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cari</label>
                <select
                  name="kurumCari"
                  value={editingRecord.kurumCari || ''}
                  onChange={handleEditInputChange}
                  className="input w-full border border-gray-300 rounded-md"
                >
                  <option value="">Cari Seçiniz</option>
                  {cariler
                    .filter(cari => cari.durum === 'AKTIF')
                    .map((cari) => {
                      const displayName = cari.sirket || `${cari.ad} ${cari.soyad || ''}`.trim();
                      return (
                        <option key={cari.id} value={displayName}>
                          {displayName} - {cari.tip}
                        </option>
                      );
                    })}
                </select>
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Gecelik Ücret</label>
                <input 
                  type="number" 
                  name="gecelikUcret"
                  value={editingRecord.gecelikUcret || 0}
                  onChange={handleEditInputChange}
                  className="input w-full border border-gray-300 rounded-md" 
                  placeholder="Gecelik Ücret" 
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Toplam Ücret</label>
                <input 
                  type="number" 
                  name="toplamUcret"
                  value={editingRecord.toplamUcret || 0}
                  className="input w-full border border-gray-300 rounded-md bg-gray-50" 
                  placeholder="Toplam Ücret" 
                  disabled
                />
              </div>
              <div className="col-span-2 flex justify-end space-x-2 mt-6">
                <button type="button" className="btn btn-secondary" onClick={closeEditModal}>İptal</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Kaydediliyor...
                    </>
                  ) : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) closeAddModal(); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 p-8 relative animate-fade-in border border-blue-100">
            <button
              onClick={closeAddModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              aria-label="Kapat"
            >
              ×
            </button>
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Yeni Konaklama Kaydı</h2>
            </div>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="adiSoyadi"
                  value={formData.adiSoyadi || ''}
                  onChange={handleInputChange}
                  className="input w-full border border-gray-300 rounded-md" 
                  placeholder="Ad Soyad" 
                  required
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ünvan</label>
                <input 
                  type="text" 
                  name="unvani"
                  value={formData.unvani || ''}
                  onChange={handleInputChange}
                  className="input w-full border border-gray-300 rounded-md" 
                  placeholder="Ünvan" 
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ülke</label>
                <input 
                  type="text" 
                  name="ulke"
                  value={formData.ulke || ''}
                  onChange={handleInputChange}
                  className="input w-full border border-gray-300 rounded-md" 
                  placeholder="Ülke" 
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                <input 
                  type="text" 
                  name="sehir"
                  value={formData.sehir || ''}
                  onChange={handleInputChange}
                  className="input w-full border border-gray-300 rounded-md" 
                  placeholder="Şehir" 
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Giriş Tarihi <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  name="girisTarihi"
                  value={formData.girisTarihi || ''}
                  onChange={handleInputChange}
                  className="input w-full border border-gray-300 rounded-md" 
                  required
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Çıkış Tarihi <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  name="cikisTarihi"
                  value={formData.cikisTarihi || ''}
                  onChange={handleInputChange}
                  className="input w-full border border-gray-300 rounded-md" 
                  required
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Oda Tipi <span className="text-red-500">*</span></label>
                <select 
                  name="odaTipi"
                  value={formData.odaTipi || ''}
                  onChange={handleInputChange}
                  className="input w-full border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Seçiniz</option>
                  <option value="Tek Kişilik">Tek Kişilik</option>
                  <option value="Çift Kişilik">Çift Kişilik</option>
                  <option value="Suit">Suit</option>
                </select>
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Konaklama Tipi <span className="text-red-500">*</span></label>
                <select 
                  name="konaklamaTipi"
                  value={formData.konaklamaTipi || 'BB'}
                  onChange={handleInputChange}
                  className="input w-full border border-gray-300 rounded-md"
                  required
                >
                  <option value="BB">BB (Kahvaltı Dahil)</option>
                  <option value="HB">HB (Yarım Pansiyon)</option>
                  <option value="FB">FB (Tam Pansiyon)</option>
                  <option value="UHD">UHD (Ultra Her Şey Dahil)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Organizasyon</label>
                <select
                  name="organizationId"
                  value={formData.organizationId || ''}
                  onChange={handleInputChange}
                  className="input w-full border border-gray-300 rounded-md"
                >
                  <option value="">Münferit Konaklama</option>
                  {organizations
                    .filter(org => org.status === 'ACTIVE')
                    .map((org) => (
                      <option key={org.id} value={org.id.toString()}>
                        {org.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Otel</label>
                <select
                  name="otelAdi"
                  value={formData.otelAdi || ''}
                  onChange={handleInputChange}
                  className="input w-full border border-gray-300 rounded-md"
                >
                  <option value="">Otel Seçiniz</option>
                  {hotels
                    .filter(hotel => hotel.durum === 'AKTIF')
                    .map((hotel) => (
                      <option key={hotel.id} value={hotel.adi}>
                        {hotel.adi} - {hotel.sehir}
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cari</label>
                <select
                  name="kurumCari"
                  value={formData.kurumCari || ''}
                  onChange={handleInputChange}
                  className="input w-full border border-gray-300 rounded-md"
                >
                  <option value="">Cari Seçiniz</option>
                  {cariler
                    .filter(cari => cari.durum === 'AKTIF')
                    .map((cari) => {
                      const displayName = cari.sirket || `${cari.ad} ${cari.soyad || ''}`.trim();
                      return (
                        <option key={cari.id} value={displayName}>
                          {displayName} - {cari.tip}
                        </option>
                      );
                    })}
                </select>
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Gecelik Ücret (₺)</label>
                <input 
                  type="number" 
                  name="gecelikUcret"
                  value={formData.gecelikUcret || ''}
                  onChange={handleInputChange}
                  className="input w-full border border-gray-300 rounded-md" 
                  placeholder="0" 
                  min="0" 
                />
              </div>
              {formData.girisTarihi && formData.cikisTarihi && formData.gecelikUcret ? (
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Toplam Ücret (₺)</label>
                  <div className="input w-full border border-gray-300 rounded-md bg-gray-50 py-2 px-3 flex items-center">
                    <span className="font-bold text-green-600">{formData.toplamUcret?.toLocaleString('tr-TR')} ₺</span>
                    <span className="text-xs text-gray-500 ml-2">({formData.numberOfNights || 0} gece)</span>
                  </div>
                </div>
              ) : null}
            </form>
            <div className="flex justify-end space-x-2 mt-6">
              <button className="btn btn-secondary" onClick={closeAddModal} disabled={isSubmitting}>İptal</button>
              <button 
                className="btn btn-primary" 
                onClick={handleSubmit} 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Kaydediliyor...
                  </>
                ) : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Puantaj ve Excel modalları (gerekirse buraya eklenir) */}
      {showExportFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setShowExportFilterModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8 relative animate-fade-in border border-green-100">
            <button
              onClick={closeExportFilterModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              aria-label="Kapat"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Excel'e Aktarılacak Sütunlar</h2>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {availableColumns.map(col => (
                <label key={col.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(col.key as string)}
                    onChange={() => handleColumnToggle(col.key as string)}
                  />
                  {col.label}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn btn-secondary" onClick={closeExportFilterModal}>İptal</button>
              <button className="btn btn-success" onClick={handleExportFilteredExcel}>Excel'e Aktar</button>
            </div>
          </div>
        </div>
      )}
      {/* Toplu Silme Onay Modalı */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setShowBulkDeleteModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8 relative animate-fade-in border border-red-100">
            <button
              onClick={() => setShowBulkDeleteModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              aria-label="Kapat"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-red-700 mb-6">Toplu Silme Onayı</h2>
            <p className="mb-8 text-gray-700 text-lg">Seçili <span className="font-bold text-black">{selectedRecordIds.length}</span> kaydı silmek istediğinize emin misiniz?</p>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn btn-secondary" onClick={() => setShowBulkDeleteModal(false)} disabled={pendingBulkDelete}>Vazgeç</button>
              <button className="btn btn-error bg-red-600 hover:bg-red-700 text-white font-bold" onClick={handleBulkDeleteConfirm} disabled={pendingBulkDelete}>
                {pendingBulkDelete ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}