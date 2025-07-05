"use client";

import { useState, useEffect } from "react";
import * as XLSX from 'xlsx';

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

export default function AccommodationTableSection() {
  // --- State ve fonksiyonlar ---
  const [records, setRecords] = useState<AccommodationRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExportFilterModal, setShowExportFilterModal] = useState<boolean>(false);
  const [availableColumns, setAvailableColumns] = useState<{ key: keyof AccommodationRecord | 'id' | 'numberOfNights' | 'toplamUcret'; label: string }[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<keyof AccommodationRecord | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([]);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [salePrices, setSalePrices] = useState<{ [userId: number]: number }>({});
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  // Eksik state tanımlamaları
  const [organizasyonOptions, setOrganizasyonOptions] = useState<string[]>([]);
  const [showOrganizasyonOptions, setShowOrganizasyonOptions] = useState(false);
  const [filterOrg, setFilterOrg] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterTitle, setFilterTitle] = useState('');

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
      fetch('/api/accommodation')
        .then(res => res.json())
        .then(data => setRecords(data));
    };
    fetchRecords();

    fetch('/api/organizations')
      .then(res => res.json())
      .then(data => setOrganizasyonOptions(data));

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
      setShowEditModal(true);
    }
  };

  const handleDeleteClick = (id: number) => {
    // ... existing code ...
  };

  const closeEditModal = () => {
    setShowEditModal(false);
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

  const handleBulkDelete = async () => {
    if (selectedRecordIds.length === 0) return;

    try {
      const res = await fetch('/api/accommodation/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedRecordIds }),
      });

      if (res.ok) {
        setRecords(prev => prev.filter(record => !selectedRecordIds.includes(record.id)));
        setSelectedRecordIds([]);
        setShowBulkDeleteModal(false);
      } else {
        alert('Kayıtlar silinemedi!');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Kayıtlar silinemedi!');
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
    
    // Seçili kayıtlar için varsayılan fiyatları ayarla
    const defaultPrices: { [key: number]: number } = {};
    selectedRecordIds.forEach(id => {
      const record = records.find(r => r.id === id);
      if (record) {
        defaultPrices[id] = record.toplamUcret;
      }
    });
    
    setSalePrices(defaultPrices);
    setSaleModalOpen(true);
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

        const saleData = {
          accommodationId: accommodationId,
          salePrice: salePrices[accommodationId],
          saleDate: new Date().toISOString(),
          customerName: record.adiSoyadi,
          customerTitle: record.unvani,
          organizationName: record.organizasyonAdi,
          hotelName: record.otelAdi,
          roomType: record.odaTipi,
          accommodationType: record.konaklamaTipi,
          numberOfNights: record.numberOfNights,
          checkInDate: record.girisTarihi,
          checkOutDate: record.cikisTarihi,
          originalPrice: record.toplamUcret,
          country: record.ulke,
          city: record.sehir,
          institutionAccount: record.kurumCari
        };

        const res = await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saleData),
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

  return (
    <div className="w-full mx-auto mt-8">
      {/* Filtreleme ve arama alanları */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Organizasyon</label>
          <input
            type="text"
            className="input w-full"
            placeholder="Organizasyon ara..."
            value={filterOrg}
            onChange={e => setFilterOrg(e.target.value)}
            onFocus={() => setShowOrganizasyonOptions(true)}
            onBlur={() => setTimeout(() => setShowOrganizasyonOptions(false), 200)}
          />
          {showOrganizasyonOptions && organizasyonOptions.length > 0 && (
            <div className="absolute z-10 bg-white border rounded shadow mt-1 max-h-40 overflow-y-auto w-full">
              {organizasyonOptions.filter(opt => opt.toLowerCase().includes(filterOrg.toLowerCase())).map(opt => (
                <div
                  key={opt}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onMouseDown={() => { setFilterOrg(opt); setShowOrganizasyonOptions(false); }}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
          <input
            type="text"
            className="input w-full"
            placeholder="Ad soyad ara..."
            value={filterName}
            onChange={e => setFilterName(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Unvan</label>
          <input
            type="text"
            className="input w-full"
            placeholder="Unvan ara..."
            value={filterTitle}
            onChange={e => setFilterTitle(e.target.value)}
          />
        </div>
        {canAdd() && (
          <button className="btn btn-primary h-12 mt-6 md:mt-0">
            + Yeni Kayıt
          </button>
        )}
      </div>
      {/* Üstteki işlemler: Puantaj, Excel içe/dışa aktar, şablon indir */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          className="flex items-center gap-2 px-8 py-4 rounded-xl border border-gray-200 bg-white text-lg font-semibold text-gray-800 hover:bg-gray-50 transition-all shadow-sm"
        >
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h4m0 0V7a4 4 0 00-4-4H7a4 4 0 00-4 4v10a4 4 0 004 4" /></svg>
          Puantaj Raporu
        </button>
        <label className="flex items-center gap-2 px-8 py-4 rounded-xl border border-gray-200 bg-white text-lg font-semibold text-gray-800 hover:bg-gray-50 transition-all shadow-sm cursor-pointer">
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
          Excel'den İçe Aktar
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel} />
        </label>
        <button
          className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-green-400 to-teal-500 text-lg font-semibold text-white shadow-md hover:from-green-500 hover:to-teal-600 transition-all"
          onClick={handleExportExcel}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16V4H4zm4 8h8m-4-4v8" /></svg>
          Excel'e Aktar
        </button>
        <button
          className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-orange-400 to-yellow-500 text-lg font-semibold text-white shadow-md hover:from-orange-500 hover:to-yellow-600 transition-all"
          onClick={handleDownloadExcelTemplate}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
          Excel Şablonu İndir
        </button>
      </div>
      {/* Tablo */}
      <div className="table-container overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="table table-responsive text-xs">
          <thead>
            <tr>
              <th className="w-10">
                <input type="checkbox" checked={selectedRecordIds.length === sortedRecords.length && sortedRecords.length > 0} onChange={handleSelectAll} />
              </th>
              <th className="w-12 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('id')}>
                <div className="flex items-center justify-between">
                  <span>ID</span>
                  <SortIcon column="id" />
                </div>
              </th>
              <th className="w-28 hidden md:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('kurumCari')}>
                <div className="flex items-center justify-between">
                  <span>Kurum / Cari</span>
                  <SortIcon column="kurumCari" />
                </div>
              </th>
              <th className="w-28 hidden lg:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('organizasyonAdi')}>
                <div className="flex items-center justify-between">
                  <span>Organizasyon</span>
                  <SortIcon column="organizasyonAdi" />
                </div>
              </th>
              <th className="w-28 hidden lg:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('otelAdi')}>
                <div className="flex items-center justify-between">
                  <span>Otel</span>
                  <SortIcon column="otelAdi" />
                </div>
              </th>
              <th className="w-28 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('adiSoyadi')}>
                <div className="flex items-center justify-between">
                  <span>Adı Soyadı</span>
                  <SortIcon column="adiSoyadi" />
                </div>
              </th>
              <th className="w-24 hidden md:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('unvani')}>
                <div className="flex items-center justify-between">
                  <span>Unvanı</span>
                  <SortIcon column="unvani" />
                </div>
              </th>
              <th className="w-20 hidden md:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('ulke')}>
                <div className="flex items-center justify-between">
                  <span>Ülke</span>
                  <SortIcon column="ulke" />
                </div>
              </th>
              <th className="w-20 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('sehir')}>
                <div className="flex items-center justify-between">
                  <span>Şehir</span>
                  <SortIcon column="sehir" />
                </div>
              </th>
              <th className="w-20 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('girisTarihi')}>
                <div className="flex items-center justify-between">
                  <span>Giriş</span>
                  <SortIcon column="girisTarihi" />
                </div>
              </th>
              <th className="w-20 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('cikisTarihi')}>
                <div className="flex items-center justify-between">
                  <span>Çıkış</span>
                  <SortIcon column="cikisTarihi" />
                </div>
              </th>
              <th className="w-16 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('odaTipi')}>
                <div className="flex items-center justify-between">
                  <span>Oda</span>
                  <SortIcon column="odaTipi" />
                </div>
              </th>
              <th className="w-24 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('konaklamaTipi')}>
                <div className="flex items-center justify-between">
                  <span>Konaklama</span>
                  <SortIcon column="konaklamaTipi" />
                </div>
              </th>
              <th className="w-28 hidden md:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('faturaEdildi')}>
                <div className="flex items-center justify-between">
                  <span>Satış Durumu</span>
                  <SortIcon column="faturaEdildi" />
                </div>
              </th>
              <th className="w-14 cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('numberOfNights')}>
                <div className="flex items-center justify-between">
                  <span>Gece</span>
                  <SortIcon column="numberOfNights" />
                </div>
              </th>
              <th className="w-24 hidden md:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('gecelikUcret')}>
                <div className="flex items-center justify-between">
                  <span>Gecelik Ücret</span>
                  <SortIcon column="gecelikUcret" />
                </div>
              </th>
              <th className="w-24 hidden md:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('toplamUcret')}>
                <div className="flex items-center justify-between">
                  <span>Toplam Ücret</span>
                  <SortIcon column="toplamUcret" />
                </div>
              </th>
              <th className="w-16">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                <td>
                  <input type="checkbox" checked={selectedRecordIds.includes(record.id)} onChange={() => handleSelectRecord(record.id)} disabled={record.faturaEdildi} />
                </td>
                <td className="font-medium text-blue-600 whitespace-nowrap">{record.id}</td>
                <td className="truncate hidden md:table-cell">{record.kurumCari || '-'}</td>
                <td className="truncate hidden lg:table-cell">{record.organizasyonAdi || '-'}</td>
                <td className="truncate hidden lg:table-cell">{record.otelAdi || '-'}</td>
                <td className="truncate">{record.adiSoyadi}</td>
                <td className="truncate hidden md:table-cell">{record.unvani}</td>
                <td className="truncate hidden md:table-cell">{record.ulke}</td>
                <td className="truncate">{record.sehir}</td>
                <td className="whitespace-nowrap">{formatDate(record.girisTarihi)}</td>
                <td className="whitespace-nowrap">{formatDate(record.cikisTarihi)}</td>
                <td className="text-center">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium inline-block">
                    {record.odaTipi}
                  </span>
                </td>
                <td className="text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold inline-block ${record.konaklamaTipi === 'BB' ? 'bg-yellow-100 text-yellow-800' : record.konaklamaTipi === 'HB' ? 'bg-green-100 text-green-800' : record.konaklamaTipi === 'FB' ? 'bg-purple-100 text-purple-800' : 'bg-pink-100 text-pink-800'}`}>{record.konaklamaTipi}</span>
                </td>
                <td className="hidden md:table-cell text-center">
                  {record.faturaEdildi ? (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[11px] font-semibold border border-green-200">
                      Satışa Aktarıldı
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-semibold border border-gray-200">
                      Henüz Satışa Aktarılmadı
                    </span>
                  )}
                </td>
                <td className="text-center whitespace-nowrap">{record.numberOfNights || 0}</td>
                <td className="font-medium hidden md:table-cell whitespace-nowrap text-right">{record.gecelikUcret.toLocaleString('tr-TR')} ₺</td>
                <td className="font-bold text-green-600 hidden md:table-cell whitespace-nowrap text-right">{record.toplamUcret.toLocaleString('tr-TR')} ₺</td>
                <td>
                  <div className="flex flex-wrap justify-center gap-1">
                    {canEdit() && (
                      <button
                        onClick={() => handleEditClick(record.id)}
                        className="btn btn-sm btn-primary p-1"
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
                        className="btn btn-sm btn-error p-1"
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

      {/* Satışa Aktar ve Toplu Silme butonları */}
      {selectedRecordIds.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50 flex gap-2">
          <button 
            className="btn btn-error px-6 py-3 text-lg shadow-lg" 
            onClick={() => setShowBulkDeleteModal(true)}
          >
            Seçili Kayıtları Sil
          </button>
          <button 
            className="btn btn-primary px-6 py-3 text-lg shadow-lg" 
            onClick={handleSaleTransfer}
          >
            Seçili Kişileri Satışa Aktar
          </button>
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
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Seçili Kayıtları Sil</h2>
            </div>
            <div className="mb-6">
              <p className="text-gray-600">
                <span className="font-bold text-red-600">{selectedRecordIds.length}</span> adet kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button className="btn btn-secondary" onClick={() => setShowBulkDeleteModal(false)}>İptal</button>
              <button className="btn btn-error" onClick={handleBulkDelete}>Kayıtları Sil</button>
            </div>
          </div>
        </div>
      )}
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
            {selectedRecordIds.some(accommodationId => !salePrices[accommodationId] || salePrices[accommodationId] <= 0) && (
              <div className="text-red-600 text-sm mb-2 font-semibold flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" /></svg>
                Tüm kişiler için geçerli bir fiyat girilmelidir!
              </div>
            )}
            <div className="flex justify-end space-x-2 mt-6">
              <button className="btn btn-secondary" onClick={() => setSaleModalOpen(false)}>İptal</button>
              <button className="btn btn-success" onClick={confirmSaleTransfer}>Satışa Aktar</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Kaydı Düzenle
              </h2>
              <button
                onClick={closeEditModal}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* ... (düzenleme formu ve işlemleri buraya eklenmeli) ... */}
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
    </div>
  );
} 