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
  faturaEdildi: boolean;
  gecelikUcret: number;
  toplamUcret: number;
  organizasyonAdi?: string;
  otelAdi?: string;
  kurumCari?: string;
  numberOfNights?: number;
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
}

export default function AccommodationTableSection({ handlePuantajRaporu }: AccommodationTableSectionProps) {
  // --- State ve fonksiyonlar ---
  const [records, setRecords] = useState<AccommodationRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<AccommodationRecord>>({});
  const [editingRecord, setEditingRecord] = useState<Partial<AccommodationRecord>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExportFilterModal, setShowExportFilterModal] = useState<boolean>(false);
  const [availableColumnsda, setAvailableColumns] = useState<{ key: keyof AccommodationRecord | 'id' | 'numberOfNights' | 'toplamUcret'; label: string }[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<keyof AccommodationRecord | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([]);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [salePrices, setSalePrices] = useState<{ [userId: number]: number }>({});
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  
  // Eksik state tanımlamaları
  const [organizasyonOptions, setOrganizasyonOptions] = useState<string[]>([]);
  const [showOrganizasyonOptions, setShowOrganizasyonOptions] = useState(false);
  const [filterOrg, setFilterOrg] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterTitle, setFilterTitle] = useState('');

  // Satışa aktar popup'ı için toplu fiyat state'i
  const [useBulkPrice, setUseBulkPrice] = useState(false);
  const [bulkPrice, setBulkPrice] = useState<number | ''>('');

  // Seçili kayıtların kurum, organizasyon ve otel adı aynı mı?
  const allSame = (() => {
    if (selectedRecordIds.length < 2) return false;
    const selected = records.filter(r => selectedRecordIds.includes(r.id));
    const kurum = selected[0]?.kurumCari;
    const org = selected[0]?.organizasyonAdi;
    const otel = selected[0]?.otelAdi;
    return selected.every(r => r.kurumCari === kurum && r.organizasyonAdi === org && r.otelAdi === otel);
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

  // --- State ekle ---
  const [kurumOptions, setKurumOptions] = useState<string[]>([]);
  const [showKurumOptions, setShowKurumOptions] = useState(false);

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
      fetch('/api/accommodation')
        .then(res => res.json())
        .then(data => setRecords(data));
    };
    fetchRecords();

    fetchOrganizasyonOptions();
    fetchKurumOptions();

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
    const recordToEdit = records.find((record) => record.id === id);
    if (recordToEdit) {
      setEditingRecord(recordToEdit);
      setShowEditModal(true);
    }
  };

  const handleDeleteClick = (id: number) => {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    
    fetch(`/api/accommodation/${id}`, {
      method: 'DELETE',
    })
      .then(res => {
        if (res.ok) {
          setRecords(prev => prev.filter(record => record.id !== id));
        } else {
          alert('Kayıt silinemedi!');
        }
      })
      .catch(error => {
        console.error('Delete error:', error);
        alert('Kayıt silinemedi!');
      });
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingRecord({});
  };
  
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setEditingRecord(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setEditingRecord(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Toplam ücret hesaplama
    if (name === 'girisTarihi' || name === 'cikisTarihi' || name === 'gecelikUcret') {
      const girisTarihi = name === 'girisTarihi' ? value : editingRecord.girisTarihi;
      const cikisTarihi = name === 'cikisTarihi' ? value : editingRecord.cikisTarihi;
      const gecelikUcret = name === 'gecelikUcret' ? parseFloat(value) || 0 : editingRecord.gecelikUcret || 0;
      
      if (girisTarihi && cikisTarihi) {
        const nights = calculateNumberOfNights(girisTarihi as string, cikisTarihi as string);
        const toplamUcret = nights * gecelikUcret;
        
        setEditingRecord(prev => ({
          ...prev,
          numberOfNights: nights,
          toplamUcret: toplamUcret
        }));
      }
    }
  };
  
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingRecord.adiSoyadi || !editingRecord.girisTarihi || !editingRecord.cikisTarihi || !editingRecord.odaTipi || !editingRecord.konaklamaTipi) {
      alert('Lütfen zorunlu alanları doldurunuz.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/accommodation/${editingRecord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingRecord),
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
        alert(`Hata: ${errorData.message || 'Bir hata oluştu'}`);
      }
    } catch (error) {
      console.error('Kayıt güncellenirken hata oluştu:', error);
      alert('Kayıt güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setNewRecord({
      adiSoyadi: '',
      unvani: '',
      ulke: '',
      sehir: '',
      girisTarihi: '',
      cikisTarihi: '',
      odaTipi: '',
      konaklamaTipi: 'BB',
      gecelikUcret: 0,
      toplamUcret: 0,
      organizasyonAdi: '',
      otelAdi: '',
      kurumCari: ''
    });
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewRecord({});
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setNewRecord(prev => ({
      ...prev,
      [name]: value === '' ? null : (type === 'number' ? parseFloat(value) || 0 : value)
    }));

    // Toplam ücret hesaplama
    if (name === 'girisTarihi' || name === 'cikisTarihi' || name === 'gecelikUcret') {
      const girisTarihi = name === 'girisTarihi' ? value : newRecord.girisTarihi;
      const cikisTarihi = name === 'cikisTarihi' ? value : newRecord.cikisTarihi;
      const gecelikUcret = name === 'gecelikUcret' ? parseFloat(value) || 0 : newRecord.gecelikUcret || 0;

      if (girisTarihi && cikisTarihi) {
        const nights = calculateNumberOfNights(girisTarihi, cikisTarihi);
        const toplamUcret = nights * gecelikUcret;

        setNewRecord(prev => ({
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
    if (!newRecord.konaklamaTipi) {
      newRecord.konaklamaTipi = 'BB';
    }

    if (!newRecord.adiSoyadi || !newRecord.girisTarihi || !newRecord.cikisTarihi || !newRecord.odaTipi || !newRecord.konaklamaTipi) {
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
        body: JSON.stringify(newRecord),
      });

      if (response.ok) {
        // Başarılı kayıt sonrası listeyi güncelle
        const data = await response.json();
        setRecords(prev => [...prev, data]);
        await fetchOrganizasyonOptions(); // Yeni organizasyonları güncelle
        await fetchKurumOptions(); // Yeni kurum/cari'leri güncelle
        closeAddModal();
      } else {
        const errorData = await response.json();
        alert(`Hata: ${errorData.message || 'Bir hata oluştu'}`);
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
    const orgMatch = filterOrg ? record.organizasyonAdi?.toLowerCase().includes(filterOrg.toLowerCase()) : true;
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

  const handleSaleTransfer = () => {
    if (selectedRecordIds.length === 0) return;
    
    // Seçili kayıtlar için varsayılan fiyatları konaklama kayıtlarından al
    const defaultPrices: { [key: number]: number } = {};
    selectedRecordIds.forEach(id => {
      const record = records.find(r => r.id === id);
      // Varsayılan olarak toplam ücret kullan, eğer yoksa gecelik ücret kullan, ikisi de yoksa 0 olarak ayarla
      defaultPrices[id] = record?.toplamUcret || record?.gecelikUcret || 0;
    });
    
    setSalePrices(defaultPrices);
    setSaleModalOpen(true);
    
    // Kullanıcıya bilgi mesajı göster
    if (selectedRecordIds.length > 0) {
      alert('Satış fiyatları varsayılan olarak konaklama kayıtlarındaki toplam ücret değerleriyle doldurulmuştur. Gerekirse değiştirebilirsiniz.');
    }
  };

  const handleSalePriceChange = (accommodationId: number, value: number) => {
    setSalePrices(prev => ({
      ...prev,
      [accommodationId]: value
    }));
  };

  const confirmSaleTransfer = async () => {
    // Tüm seçili kayıtlar için geçerli fiyat kontrolü
    const hasInvalidPrice = selectedRecordIds.some(id => !salePrices[id] || salePrices[id] <= 0);
    if (hasInvalidPrice) {
      alert('Tüm kişiler için geçerli bir fiyat girilmelidir!');
      return;
    }

    try {
      // Her seçili kayıt için satış kaydı oluştur
      const salePromises = selectedRecordIds.map(async (accommodationId) => {
        const record = records.find(r => r.id === accommodationId);
        if (!record) return;

        // API'nin beklediği formatta veri hazırla
        const organizasyonAdi = record.organizasyonAdi || '';
        const kurumCari = record.kurumCari || '';
        
        const res = await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sales: [{
              accommodationId: accommodationId,
              fiyat: salePrices[accommodationId]
            }],
            organizasyonAdi: organizasyonAdi,
            kurumCari: kurumCari
          }),
        });

        if (res.ok) {
          // Konaklama kaydını güncelle - fatura edildi olarak işaretle
          await fetch('/api/accommodation', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: accommodationId,
              faturaEdildi: true
            }),
          });
        }

        return res.ok;
      });

      const results = await Promise.all(salePromises);
      const allSuccessful = results.every(result => result === true);

      if (allSuccessful) {
        // Kayıtları yeniden yükle
        const res = await fetch('/api/accommodation');
        const updatedRecords = await res.json();
        setRecords(updatedRecords);
        
        setSelectedRecordIds([]);
        setSaleModalOpen(false);
        setSalePrices({});
        alert('Seçili kişiler başarıyla satışa aktarıldı!');
      } else {
        alert('Bazı kayıtlar satışa aktarılamadı!');
      }
    } catch (error) {
      console.error('Sale transfer error:', error);
      alert('Satışa aktarma işlemi başarısız!');
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
          const organizasyonAdi = getColumnValue('Organizasyon Adı') || getColumnValue('OrganizasyonAdi') || row[9]?.toString() || '';
          const otelAdi = getColumnValue('Otel Adı') || getColumnValue('OtelAdi') || row[10]?.toString() || '';
          const kurumCari = getColumnValue('Kurum / Cari') || getColumnValue('Kurum Cari') || getColumnValue('KurumCari') || row[11]?.toString() || '';

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
            organizasyonAdi,
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
      { key: 'organizasyonAdi', label: 'Organizasyon Adı' },
      { key: 'otelAdi', label: 'Otel Adı' },
      { key: 'kurumCari', label: 'Kurum / Cari' },
    ]);
    setSelectedColumns([
      'id', 'adiSoyadi', 'unvani', 'ulke', 'sehir', 'girisTarihi', 'cikisTarihi',
      'odaTipi', 'konaklamaTipi', 'faturaEdildi', 'numberOfNights', 'gecelikUcret',
      'toplamUcret', 'organizasyonAdi', 'otelAdi', 'kurumCari'
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
        } else if (column === 'organizasyonAdi') {
          filteredRecord['Organizasyon Adı'] = record.organizasyonAdi || '';
        } else if (column === 'otelAdi') {
          filteredRecord['Otel Adı'] = record.otelAdi || '';
        } else if (column === 'kurumCari') {
          filteredRecord['Kurum / Cari'] = record.kurumCari || '';
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

  // fetchOrganizasyonOptions fonksiyonunu component fonksiyonunun içine taşı
  const fetchOrganizasyonOptions = async () => {
    const res = await fetch('/api/organizations');
    if (res.ok) {
      const data = await res.json();
      setOrganizasyonOptions(data);
    }
  };

  // fetchKurumOptions fonksiyonunu component fonksiyonunun içine taşı
  const fetchKurumOptions = async () => {
    try {
      const res = await fetch('/api/accommodation');
      if (res.ok) {
        const data = await res.json();
        const kurumSet = new Set<string>();
        (data || []).forEach((rec: any) => {
          if (rec.kurumCari) kurumSet.add(rec.kurumCari);
        });
        setKurumOptions(Array.from(kurumSet));
      }
    } catch {}
  };

  return (
    <div className="w-full mx-auto mt-8">
        {/* Filtreleme ve arama alanları */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
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
                onFocus={() => setShowOrganizasyonOptions(true)}
                onBlur={() => setTimeout(() => setShowOrganizasyonOptions(false), 200)}
              />
            </div>
            {showOrganizasyonOptions && organizasyonOptions.length > 0 && (
              <div className="absolute z-10 bg-white border rounded shadow mt-1 max-h-40 overflow-y-auto w-full">
                {organizasyonOptions.filter(opt => opt.toLowerCase().includes(filterOrg.toLowerCase())).map(opt => (
                  <div
                    key={opt}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer truncate text-sm"
                    onMouseDown={() => { setFilterOrg(opt); setShowOrganizasyonOptions(false); }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
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

      {/* Butonlar - Tablo üstü */}
      <div className="flex flex-wrap justify-center md:justify-end items-center gap-3 mb-8">
        <BulkActionsMenu
          selectedCount={selectedRecordIds.length}
          onBulkDelete={handleBulkDeleteRequest}
          onBulkExport={handleExportExcel}
          customActions={[
            {
              label: 'Satışa Aktar',
              onClick: () => setSaleModalOpen(true),
              icon: (
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              )
            }
          ]}
        />
        <button onClick={handleDownloadExcelTemplate} className="btn btn-primary">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Excel Şablonu İndir
          </button>
        </div>

      <button onClick={handlePuantajRaporu} className="btn btn-warning">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Puantaj Raporu
      </button>

      <button onClick={() => setShowAddModal(true)} className="btn btn-success">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Yeni Kayıt
      </button>
      {/* Tablo */}
      <div className="table-container overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="table table-responsive text-xs w-full border-collapse">
          <thead>
            <tr className="text-[10px] bg-gray-50">
              <th className="w-8 py-2">
                <input type="checkbox" className="checkbox checkbox-xs" checked={selectedRecordIds.length === sortedRecords.length && sortedRecords.length > 0} onChange={handleSelectAll} />
              </th>
              <th className="w-10 py-2 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('id')}>
                <div className="flex items-center justify-between">
                  <span>ID</span>
                  <SortIcon column="id" />
                </div>
              </th>
              <th className="w-20 py-2 hidden lg:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('kurumCari')}>
                <div className="flex items-center justify-between">
                  <span>Kurum Adı</span>
                  <SortIcon column="kurumCari" />
                </div>
              </th>
              <th className="w-20 py-2 hidden md:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('organizasyonAdi')}>
                <div className="flex items-center justify-between">
                  <span>Organizasyon</span>
                  <SortIcon column="organizasyonAdi" />
                </div>
              </th>
              <th className="w-20 py-2 hidden lg:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('otelAdi')}>
                <div className="flex items-center justify-between">
                  <span>Otel Adı</span>
                  <SortIcon column="otelAdi" />
                </div>
              </th>
              <th className="w-24 py-2 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('adiSoyadi')}>
                <div className="flex items-center justify-between">
                  <span>Adı Soyadı</span>
                  <SortIcon column="adiSoyadi" />
                </div>
              </th>
              <th className="w-16 py-2 hidden md:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('unvani')}>
                <div className="flex items-center justify-between">
                  <span>Unvan</span>
                  <SortIcon column="unvani" />
                </div>
              </th>
              <th className="w-16 py-2 hidden lg:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('ulke')}>
                <div className="flex items-center justify-between">
                  <span>Ülke</span>
                  <SortIcon column="ulke" />
                </div>
              </th>
              <th className="w-16 py-2 hidden lg:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('sehir')}>
                <div className="flex items-center justify-between">
                  <span>Şehir</span>
                  <SortIcon column="sehir" />
                </div>
              </th>
              <th className="w-16 py-2 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('girisTarihi')}>
                <div className="flex items-center justify-between">
                  <span>Giriş Tarihi</span>
                  <SortIcon column="girisTarihi" />
                </div>
              </th>
              <th className="w-16 py-2 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('cikisTarihi')}>
                <div className="flex items-center justify-between">
                  <span>Çıkış Tarihi</span>
                  <SortIcon column="cikisTarihi" />
                </div>
              </th>
              <th className="w-14 py-2 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('odaTipi')}>
                <div className="flex items-center justify-between">
                  <span>Oda Tipi</span>
                  <SortIcon column="odaTipi" />
                </div>
              </th>
              <th className="w-20 py-2 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('konaklamaTipi')}>
                <div className="flex items-center justify-between">
                  <span>Konaklama</span>
                  <SortIcon column="konaklamaTipi" />
                </div>
              </th>
              <th className="w-12 py-2 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('numberOfNights')}>
                <div className="flex items-center justify-between">
                  <span>Gece Sayısı</span>
                  <SortIcon column="numberOfNights" />
                </div>
              </th>
              <th className="w-16 py-2 hidden md:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('gecelikUcret')}>
                <div className="flex items-center justify-between">
                  <span>Gecelik Ücret</span>
                  <SortIcon column="gecelikUcret" />
                </div>
              </th>
              <th className="w-20 py-2 hidden sm:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('toplamUcret')}>
                <div className="flex items-center justify-between">
                  <span>Toplam Ücret</span>
                  <SortIcon column="toplamUcret" />
                </div>
              </th>
              <th className="w-20 py-2 hidden md:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('faturaEdildi')}>
                <div className="flex items-center justify-between">
                  <span>Satış Durumu</span>
                  <SortIcon column="faturaEdildi" />
                </div>
              </th>
              <th className="w-14 py-2">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 text-[11px]">
                <td className="py-1.5">
                  <input type="checkbox" className="checkbox checkbox-xs" checked={selectedRecordIds.includes(record.id)} onChange={() => handleSelectRecord(record.id)} disabled={record.faturaEdildi} />
                </td>
                <td className="font-medium text-blue-600 whitespace-nowrap py-1.5">{record.id}</td>
                <td className="truncate hidden lg:table-cell py-1.5">{record.kurumCari || '-'}</td>
                <td className="truncate hidden md:table-cell py-1.5">{record.organizasyonAdi || '-'}</td>
                <td className="truncate hidden lg:table-cell py-1.5">{record.otelAdi || '-'}</td>
                <td className="truncate py-1.5">
                  <div className="flex flex-col">
                    <span className="font-medium leading-tight">{record.adiSoyadi}</span>
                  </div>
                </td>
                <td className="truncate hidden md:table-cell py-1.5">
                  <span className="text-[9px] leading-tight">{record.unvani || '-'}</span>
                </td>
                <td className="truncate hidden lg:table-cell py-1.5">{record.ulke || '-'}</td>
                <td className="truncate hidden lg:table-cell py-1.5">{record.sehir || '-'}</td>
                <td className="whitespace-nowrap py-1.5 text-[10px]">{formatDate(record.girisTarihi)}</td>
                <td className="whitespace-nowrap py-1.5 text-[10px]">{formatDate(record.cikisTarihi)}</td>
                <td className="text-center py-1.5">
                  <span className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-[9px] font-medium inline-block">
                    {record.odaTipi}
                  </span>
                </td>
                <td className="text-center py-1.5">
                  <span className={`px-1 py-0.5 rounded text-[9px] font-bold inline-block ${record.konaklamaTipi === 'BB' ? 'bg-yellow-100 text-yellow-800' : record.konaklamaTipi === 'HB' ? 'bg-green-100 text-green-800' : record.konaklamaTipi === 'FB' ? 'bg-purple-100 text-purple-800' : 'bg-pink-100 text-pink-800'}`}>{record.konaklamaTipi}</span>
                </td>
                <td className="text-center whitespace-nowrap py-1.5">{record.numberOfNights || 0}</td>
                <td className="font-medium text-gray-600 hidden md:table-cell whitespace-nowrap text-right py-1.5">{record.gecelikUcret?.toLocaleString('tr-TR')} ₺</td>
                <td className="font-bold text-green-600 hidden sm:table-cell whitespace-nowrap text-right py-1.5">{record.toplamUcret.toLocaleString('tr-TR')} ₺</td>
                <td className="hidden md:table-cell text-center py-1.5">
                  {record.faturaEdildi ? (
                    <span className="inline-block px-1 py-0.5 rounded bg-green-50 text-green-700 text-[9px] font-semibold border border-green-200">
                      Satışta
                    </span>
                  ) : (
                    <span className="inline-block px-1 py-0.5 rounded bg-gray-100 text-gray-600 text-[9px] font-semibold border border-gray-200">
                      Bekliyor
                    </span>
                  )}
                </td>
                <td className="py-1.5">
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

      {/* Satış fiyatı modalı */}
      {saleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setSaleModalOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8 relative animate-fade-in border border-blue-100">
            <button
              onClick={() => setSaleModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              aria-label="Kapat"
            >
              ×
            </button>
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Seçili Kişiler İçin Satış Fiyatı</h2>
            </div>
            {/* Toplu fiyat seçeneği */}
            {allSame && (
              <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 flex flex-col md:flex-row md:items-center gap-3">
                <div className="font-semibold text-gray-800 flex-1">Tüm seçili kişiler için toplu fiyat eklemek ister misiniz?</div>
                <div className="flex gap-2">
                  <button
                    className={`px-4 py-2 rounded-lg font-bold border transition-colors ${useBulkPrice ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'}`}
                    onClick={() => setUseBulkPrice(true)}
                  >Evet</button>
                  <button
                    className={`px-4 py-2 rounded-lg font-bold border transition-colors ${!useBulkPrice ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'}`}
                    onClick={() => setUseBulkPrice(false)}
                  >Hayır</button>
                </div>
              </div>
            )}
            {/* Toplu fiyat inputu */}
            {allSame && useBulkPrice && (
              <div className="mb-6 flex items-center gap-3">
                <label className="font-semibold text-gray-700">Toplu Fiyat (₺/gecelik):</label>
                <input
                  type="number"
                  className="input w-32 text-base border border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                  value={bulkPrice}
                  onChange={e => setBulkPrice(Number(e.target.value))}
                  placeholder="Fiyat"
                  min={0}
                />
                <span className="text-gray-500 font-bold">₺</span>
              </div>
            )}
            {/* Kişi bazlı fiyat inputları */}
            {(!allSame || !useBulkPrice) && (
              <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                {selectedRecordIds.map(accommodationId => {
                  const rec = records.find(r => r.id === accommodationId);
                  const isInvalid = !salePrices[accommodationId] || salePrices[accommodationId] <= 0;
                  return (
                    <div key={accommodationId} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 truncate">{rec?.adiSoyadi || accommodationId}</div>
                        <div className="text-xs text-gray-500 flex flex-wrap gap-2 mt-1">
                          <span className="inline-flex items-center gap-1"><svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" /></svg> {rec?.odaTipi}</span>
                          <span className="inline-flex items-center gap-1"><svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10" /></svg> {rec?.numberOfNights || 0} gece</span>
                          <span className="inline-flex items-center gap-1"><svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg> {rec?.gecelikUcret?.toLocaleString('tr-TR')} ₺ gecelik</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 md:mt-0">
                        <input
                          type="number"
                          className={`input w-28 text-base border ${isInvalid ? 'border-red-400 bg-red-50' : 'border-gray-300'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
                          value={salePrices[accommodationId] || ''}
                          onChange={e => handleSalePriceChange(accommodationId, Number(e.target.value))}
                          placeholder="Fiyat"
                          min={0}
                        />
                        <span className="text-gray-500 font-bold">₺</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Hata mesajı */}
            {((allSame && useBulkPrice && (!bulkPrice || bulkPrice <= 0)) || (!allSame || !useBulkPrice) && selectedRecordIds.some(accommodationId => !salePrices[accommodationId] || salePrices[accommodationId] <= 0)) && (
              <div className="text-red-600 text-sm mb-2 font-semibold flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" /></svg>
                Tüm kişiler için geçerli bir fiyat girilmelidir!
              </div>
            )}
            <div className="flex justify-end space-x-2 mt-6">
              <button className="btn btn-secondary" onClick={() => setSaleModalOpen(false)}>İptal</button>
              <button className="btn btn-success" onClick={() => {
                if (allSame && useBulkPrice) {
                  // Tüm kayıtlara toplu fiyatı uygula
                  const newPrices: Record<number, number> = {};
                  selectedRecordIds.forEach(id => { newPrices[id] = Number(bulkPrice); });
                  setSalePrices(newPrices);
                  confirmSaleTransfer();
                } else {
                  confirmSaleTransfer();
                }
              }}
                disabled={
                  (allSame && useBulkPrice && (!bulkPrice || bulkPrice <= 0)) ||
                  ((!allSame || !useBulkPrice) && selectedRecordIds.some(accommodationId => !salePrices[accommodationId] || salePrices[accommodationId] <= 0))
                }
              >
                Satışa Aktar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
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
                  name="organizasyonAdi"
                  value={editingRecord.organizasyonAdi || ''}
                  onChange={handleEditInputChange}
                  className="input w-full border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Seçiniz</option>
                  {organizasyonOptions.map((org, idx) => (
                    <option key={idx} value={org}>{org}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Otel Adı</label>
                <input 
                  type="text" 
                  name="otelAdi"
                  value={editingRecord.otelAdi || ''}
                  onChange={handleEditInputChange}
                  className="input w-full border border-gray-300 rounded-md" 
                  placeholder="Otel Adı" 
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Kurum/Cari</label>
                <select
                  name="kurumCari"
                  value={editingRecord.kurumCari || ''}
                  onChange={handleEditInputChange}
                  className="input w-full border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Seçiniz</option>
                  {kurumOptions.map((kurum, idx) => (
                    <option key={idx} value={kurum}>{kurum}</option>
                  ))}
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
                  value={newRecord.adiSoyadi || ''}
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
                  value={newRecord.unvani || ''}
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
                  value={newRecord.ulke || ''}
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
                  value={newRecord.sehir || ''}
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
                  value={newRecord.girisTarihi || ''}
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
                  value={newRecord.cikisTarihi || ''}
                  onChange={handleInputChange}
                  className="input w-full border border-gray-300 rounded-md" 
                  required
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Oda Tipi <span className="text-red-500">*</span></label>
                <select 
                  name="odaTipi"
                  value={newRecord.odaTipi || ''}
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
                  value={newRecord.konaklamaTipi || 'BB'}
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
                <div className="relative">
                  <input
                    type="text"
                    name="organizasyonAdi"
                    value={newRecord.organizasyonAdi || ''}
                    onChange={e => {
                      handleInputChange(e);
                      setShowOrganizasyonOptions(true);
                    }}
                    onFocus={() => setShowOrganizasyonOptions(true)}
                    onBlur={() => setTimeout(() => setShowOrganizasyonOptions(false), 150)}
                    className="input w-full border border-gray-300 rounded-md"
                    autoComplete="off"
                    placeholder="Organizasyon adı yazın"
                  />
                  {showOrganizasyonOptions && (newRecord.organizasyonAdi || '').length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded shadow max-h-40 overflow-y-auto mt-1">
                      {organizasyonOptions.filter(org =>
                        org.toLowerCase().includes((newRecord.organizasyonAdi || '').toLowerCase())
                      ).length > 0 ? (
                        organizasyonOptions.filter(org =>
                          org.toLowerCase().includes((newRecord.organizasyonAdi || '').toLowerCase())
                        ).map((org, idx) => (
                          <li
                            key={idx}
                            className="px-3 py-2 cursor-pointer hover:bg-blue-100"
                            onMouseDown={() => {
                              setNewRecord(prev => ({ ...prev, organizasyonAdi: org }));
                              setShowOrganizasyonOptions(false);
                            }}
                          >
                            {org}
                          </li>
                        ))
                      ) : (
                        <li className="px-3 py-2 text-gray-400">Eşleşen organizasyon yok</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Otel Adı</label>
                <input 
                  type="text" 
                  name="otelAdi"
                  value={newRecord.otelAdi || ''}
                  onChange={handleInputChange}
                  className="input w-full border border-gray-300 rounded-md" 
                  placeholder="Otel Adı" 
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Kurum/Cari</label>
                <div className="relative">
                  <input
                    type="text"
                    name="kurumCari"
                    value={newRecord.kurumCari || ''}
                    onChange={e => {
                      handleInputChange(e);
                      setShowKurumOptions(true);
                    }}
                    onFocus={() => setShowKurumOptions(true)}
                    onBlur={() => setTimeout(() => setShowKurumOptions(false), 150)}
                    className="input w-full border border-gray-300 rounded-md"
                    autoComplete="off"
                    placeholder="Kurum/Cari adı yazın"
                  />
                  {showKurumOptions && (newRecord.kurumCari || '').length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded shadow max-h-40 overflow-y-auto mt-1">
                      {kurumOptions.filter((kurum: string) =>
                        kurum.toLowerCase().includes((newRecord.kurumCari || '').toLowerCase())
                      ).length > 0 ? (
                        kurumOptions.filter((kurum: string) =>
                          kurum.toLowerCase().includes((newRecord.kurumCari || '').toLowerCase())
                        ).map((kurum: string, idx: number) => (
                          <li
                            key={idx}
                            className="px-3 py-2 cursor-pointer hover:bg-blue-100 text-black"
                            onMouseDown={() => {
                              setNewRecord(prev => ({ ...prev, kurumCari: kurum }));
                              setShowKurumOptions(false);
                            }}
                          >
                            {kurum}
                          </li>
                        ))
                      ) : (
                        <li className="px-3 py-2 text-gray-400">Eşleşen kurum yok</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Gecelik Ücret (₺)</label>
                <input 
                  type="number" 
                  name="gecelikUcret"
                  value={newRecord.gecelikUcret || ''}
                  onChange={handleInputChange}
                  className="input w-full border border-gray-300 rounded-md" 
                  placeholder="0" 
                  min="0" 
                />
              </div>
              {newRecord.girisTarihi && newRecord.cikisTarihi && newRecord.gecelikUcret ? (
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Toplam Ücret (₺)</label>
                  <div className="input w-full border border-gray-300 rounded-md bg-gray-50 py-2 px-3 flex items-center">
                    <span className="font-bold text-green-600">{newRecord.toplamUcret?.toLocaleString('tr-TR')} ₺</span>
                    <span className="text-xs text-gray-500 ml-2">({newRecord.numberOfNights || 0} gece)</span>
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
              {availableColumnsda.map(col => (
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