'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Statistics from './components/Statistics';
import AccommodationFormModal from './components/AccommodationFormModal';
import AuthGuard from "./components/AuthGuard";

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

export default function Home() {
  const [records, setRecords] = useState<AccommodationRecord[]>([]);
  const [isTableCollapsed, setIsTableCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  const [formData, setFormData] = useState<Omit<AccommodationRecord, 'id' | 'toplamUcret' | 'numberOfNights'>>({
    adiSoyadi: '',
    unvani: '',
    ulke: '',
    sehir: '',
    girisTarihi: '',
    cikisTarihi: '',
    odaTipi: 'Single Oda',
    konaklamaTipi: 'BB',
    faturaEdildi: false,
    gecelikUcret: 0,
    organizasyonAdi: '',
    otelAdi: '',
    kurumCari: '',
  });

  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [recordToDeleteId, setRecordToDeleteId] = useState<number | null>(null);

  const [showExportFilterModal, setShowExportFilterModal] = useState<boolean>(false);
  const [availableColumns, setAvailableColumns] = useState<{ key: keyof AccommodationRecord | 'id' | 'numberOfNights' | 'toplamUcret'; label: string }[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  const [showPuantajFilterModal, setShowPuantajFilterModal] = useState<boolean>(false);
  const [puantajFilters, setPuantajFilters] = useState<{
    organizasyonAdi: string;
    baslangicTarihi: string;
    bitisTarihi: string;
  }>({
    organizasyonAdi: '',
    baslangicTarihi: '',
    bitisTarihi: ''
  });
  
  // Filtreleme için öneriler
  const [organizasyonOptions, setOrganizasyonOptions] = useState<string[]>([]);
  const [showOrganizasyonOptions, setShowOrganizasyonOptions] = useState(false);

  const [showAccommodationModal, setShowAccommodationModal] = useState(false);

  // Sıralama state'leri
  const [sortColumn, setSortColumn] = useState<keyof AccommodationRecord | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  type ColumnKey = keyof AccommodationRecord | 'id' | 'numberOfNights' | 'toplamUcret';
  type ColumnDef = { key: ColumnKey; label: string };

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
  const canImport = () => hasRole('USER');
  const canExport = () => hasRole('VIEWER');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { id } = e.target;
    const { value } = e.target;
    // Eğer id "edit-" ile başlıyorsa, öneki kaldır
    if (id.startsWith('edit-')) {
      id = id.replace('edit-', '');
    }
    setFormData((prevData) => ({
      ...prevData,
      [id]: (id === 'gecelikUcret') ? (value === '' ? 0 : parseFloat(value)) : value,
    }));
  };

  // API'den kayıtları çek
  useEffect(() => {
    // Kullanıcı bilgisini al
    fetch('/api/user', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setCurrentUser(data.user);
        setUserPermissions(data.user.permissions || []);
      })
      .catch(err => console.error('Kullanıcı bilgisi alınamadı:', err));

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

  // Kayıt ekleme fonksiyonunu API'ye bağla
  const handleAddRecord = async () => {
    const diffDays = calculateNumberOfNights(formData.girisTarihi, formData.cikisTarihi);
    const calculatedToplamUcret = formData.gecelikUcret * diffDays;
    const newRecord = {
      ...formData,
      toplamUcret: calculatedToplamUcret,
      numberOfNights: diffDays,
    };
    // API'ye gönder
    const res = await fetch('/api/accommodation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord),
    });
    const created = await res.json();
    setRecords(prev => [...prev, created]);
    // Formu temizle
    setFormData({
      adiSoyadi: '',
      unvani: '',
      ulke: '',
      sehir: '',
      girisTarihi: '',
      cikisTarihi: '',
      odaTipi: 'Single Oda',
      konaklamaTipi: 'BB',
      faturaEdildi: false,
      gecelikUcret: 0,
      organizasyonAdi: '',
      otelAdi: '',
      kurumCari: '',
    });
    setShowPuantajFilterModal(false);
  };

  const handleEditClick = (id: number) => {
    setSelectedRecordId(id);
    const recordToEdit = records.find((record) => record.id === id);
    if (recordToEdit) {
      setFormData({
        adiSoyadi: recordToEdit.adiSoyadi,
        unvani: recordToEdit.unvani,
        ulke: recordToEdit.ulke,
        sehir: recordToEdit.sehir,
        girisTarihi: recordToEdit.girisTarihi,
        cikisTarihi: recordToEdit.cikisTarihi,
        odaTipi: recordToEdit.odaTipi,
        konaklamaTipi: recordToEdit.konaklamaTipi,
        faturaEdildi: recordToEdit.faturaEdildi,
        gecelikUcret: recordToEdit.gecelikUcret,
        organizasyonAdi: recordToEdit.organizasyonAdi || '',
        otelAdi: recordToEdit.otelAdi || '',
        kurumCari: recordToEdit.kurumCari || '',
      });
      setShowEditModal(true);
    }
  };

  const handleUpdateRecord = async () => {
    if (selectedRecordId === null) return;
    const diffDays = calculateNumberOfNights(formData.girisTarihi, formData.cikisTarihi);
    const calculatedToplamUcret = formData.gecelikUcret * diffDays;
    const updatedRecord = {
      id: selectedRecordId,
      ...formData,
      toplamUcret: calculatedToplamUcret,
      numberOfNights: diffDays,
    };
    // API'ye PATCH isteği gönder
    const res = await fetch('/api/accommodation', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedRecord),
    });
    if (res.ok) {
      const updated = await res.json();
      setRecords((prevRecords) =>
        prevRecords.map((record) =>
          record.id === selectedRecordId ? updated : record
        )
      );
    } else {
      alert('Kayıt güncellenemedi!');
    }
    setShowEditModal(false);
    setSelectedRecordId(null);
    setFormData({
      adiSoyadi: '',
      unvani: '',
      ulke: '',
      sehir: '',
      girisTarihi: '',
      cikisTarihi: '',
      odaTipi: 'Single Oda',
      konaklamaTipi: 'BB',
      faturaEdildi: false,
      gecelikUcret: 0,
      organizasyonAdi: '',
      otelAdi: '',
      kurumCari: '',
    });
  };

  const handleDeleteClick = (id: number) => {
    setRecordToDeleteId(id);
  };

  const confirmDelete = async () => {
    if (recordToDeleteId === null) return;

    // API'ye DELETE isteği gönder
    const res = await fetch('/api/accommodation', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: recordToDeleteId }),
    });

    if (res.ok) {
      setRecords((prevRecords) => prevRecords.filter((record) => record.id !== recordToDeleteId));
    } else {
      alert('Kayıt silinemedi!');
    }
    setRecordToDeleteId(null);
  };

  const cancelDelete = () => {
    setRecordToDeleteId(null);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedRecordId(null);
    setFormData({
      adiSoyadi: '',
      unvani: '',
      ulke: '',
      sehir: '',
      girisTarihi: '',
      cikisTarihi: '',
      odaTipi: 'Single Oda',
      konaklamaTipi: 'BB',
      faturaEdildi: false,
      gecelikUcret: 0,
      organizasyonAdi: '',
      otelAdi: '',
      kurumCari: '',
    });
  };

  const handlePuantajRaporu = () => {
    // Varsayılan tarih aralığını belirle (tüm kayıtları kapsayacak şekilde)
    if (records.length > 0) {
      // En erken giriş tarihi ve en geç çıkış tarihini bul
      const allDates = records.flatMap(record => [new Date(record.girisTarihi), new Date(record.cikisTarihi)]);
      const minDate = new Date(Math.min(...allDates.map(date => date.getTime())));
      const maxDate = new Date(Math.max(...allDates.map(date => date.getTime())));
      
      // Tarihleri YYYY-MM-DD formatına çevir
      const minDateStr = minDate.toISOString().split('T')[0];
      const maxDateStr = maxDate.toISOString().split('T')[0];
      
      // Filtreleme değerlerini güncelle
      setPuantajFilters(prev => ({
        ...prev,
        baslangicTarihi: minDateStr,
        bitisTarihi: maxDateStr
      }));
    }
    
    // Filtreleme modalını aç
    setShowPuantajFilterModal(true);
  };

  const closePuantajFilterModal = () => {
    setShowPuantajFilterModal(false);
  };

  const handlePuantajFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPuantajFilters(prev => ({ ...prev, [id]: value }));
    if (id === 'organizasyonAdi') {
      setShowOrganizasyonOptions(true);
    }
  };

  const getFilteredOptions = (type: 'organizasyonAdi') => {
    const value = puantajFilters[type].toLowerCase();
    if (!value) return [];
    if (type === 'organizasyonAdi') {
      return organizasyonOptions.filter(option => option.toLowerCase().includes(value));
    }
    return [];
  };

  const handleOptionSelect = (type: 'organizasyonAdi', value: string) => {
    setPuantajFilters(prev => ({ ...prev, [type]: value }));
    setShowOrganizasyonOptions(false);
  };

  const generatePuantajRaporu = () => {
    const { organizasyonAdi, baslangicTarihi, bitisTarihi } = puantajFilters;
    
    // Filtreleme modalını kapat
    setShowPuantajFilterModal(false);

    // Kayıtları filtrele
    let filteredRecords = [...records];
    
    // Metin bazlı filtreler
    if (organizasyonAdi) {
      filteredRecords = filteredRecords.filter(record => 
        record.organizasyonAdi?.toLowerCase().includes(organizasyonAdi.toLowerCase())
      );
    }
    
    // Tarih aralığı filtresi
    if (baslangicTarihi && bitisTarihi) {
      const baslangicDate = new Date(baslangicTarihi);
      const bitisDate = new Date(bitisTarihi);
      
      // Tarih aralığında en az bir gün kesişen kayıtları filtrele
      filteredRecords = filteredRecords.filter(record => {
        const recordBaslangic = new Date(record.girisTarihi);
        const recordBitis = new Date(record.cikisTarihi);
        
        // İki tarih aralığının kesişimi var mı kontrol et
        return (
          (recordBaslangic <= bitisDate && recordBitis >= baslangicDate)
        );
      });
    }

    // Tüm kayıtları tarih aralıklarına göre düzenle
    const sortedRecords = [...filteredRecords].sort((a, b) => {
      // Önce giriş tarihine göre sırala
      const dateA = new Date(a.girisTarihi).getTime();
      const dateB = new Date(b.girisTarihi).getTime();
      return dateA - dateB;
    });

    // Tüm tarihleri bul (benzersiz giriş ve çıkış tarihleri)
    const allDatesSet = new Set<string>();
    sortedRecords.forEach(record => {
      // Giriş ve çıkış tarihleri arasındaki tün günleri ekle
      const startDate = new Date(record.girisTarihi);
      const endDate = new Date(record.cikisTarihi);
      
      // Her gün için döngü
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        allDatesSet.add(currentDate.toISOString().split('T')[0]); // YYYY-MM-DD formatında ekle
        currentDate.setDate(currentDate.getDate() + 1); // Bir sonraki güne geç
      }
    });

    // Tarihleri sırala
    const allDates = Array.from(allDatesSet).sort();

    // Başlık satırını oluştur (İsim, Unvan, Kurum/Cari, Otel ve tüm tarihler)
    const headers = [
      "Adı Soyadı", 
      "Unvanı", 
      "Kurum / Cari", 
      "Organizasyon Adı", 
      "Otel Adı", 
      "Oda Tipi", 
      "Konaklama Tipi", 
      "Fatura Edildi mi?", 
      "Gecelik Ücret", 
      "Toplam Ücret", 
      ...allDates.map(date => {
        // Tarihi daha okunabilir formata çevir (örn: 01.07.2024)
        const [year, month, day] = date.split('-');
        return `${day}.${month}.${year}`;
      })
    ];

    // Her kişi için puantaj verilerini oluştur
    const data = sortedRecords.map(record => {
      const row: (string | number | boolean)[] = [
        record.adiSoyadi,
        record.unvani,
        record.kurumCari || "",
        record.organizasyonAdi || "",
        record.otelAdi || "",
        record.odaTipi,
        record.konaklamaTipi,
        record.faturaEdildi,
        record.gecelikUcret.toLocaleString('tr-TR'),
        record.toplamUcret.toLocaleString('tr-TR')
      ];

      // Her tarih için kişinin o tarihte konaklamada olup olmadığını kontrol et
      allDates.forEach(date => {
        const checkDate = new Date(date);
        const startDate = new Date(record.girisTarihi);
        const endDate = new Date(record.cikisTarihi);
        // Eğer kişi o tarihte konaklamadaysa "X" işareti koy, değilse boş bırak
        // Çıkış günü hariç!
        if (checkDate >= startDate && checkDate < endDate) {
          row.push("X");
        } else {
          row.push("");
        }
      });

      return row;
    });

    // Excel dosyasını oluştur
    const ws_data = [headers, ...data];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    // Sütun genişliklerini ayarla
    const wscols = [
      { wch: 20 }, // Adı Soyadı
      { wch: 15 }, // Unvanı
      { wch: 20 }, // Kurum / Cari
      { wch: 25 }, // Organizasyon Adı
      { wch: 20 }, // Otel Adı
      { wch: 15 }, // Oda Tipi
      { wch: 15 }, // Konaklama Tipi
      { wch: 15 }, // Fatura Edildi mi?
      { wch: 15 }, // Gecelik Ücret
      { wch: 15 }, // Toplam Ücret
      ...allDates.map(() => ({ wch: 10 })) // Tarihler için genişlik
    ];
    ws['!cols'] = wscols;
    
    // Tüm hücreleri biçimlendir
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
    // Başlık satırını biçimlendir (kalın yazı, arka plan rengi)
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[headerCell]) continue;
      if (!ws[headerCell].s) ws[headerCell].s = {};
      
      // Başlık hücresi stili (kalın, ortalanmış, arka plan rengi)
      ws[headerCell].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" }
        }
      };
    }
    
    // Veri hücrelerini biçimlendir
    for (let R = 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cell]) continue;
        if (!ws[cell].s) ws[cell].s = {};
        
        // Tarih sütunları için özel stil (8. sütundan sonrası)
        if (C >= 8) {
          if (ws[cell].v === "X") {
            // Konaklama olan günler için arka plan rengi
            ws[cell].s = {
              fill: { fgColor: { rgb: "C6E0B4" } },
              alignment: { horizontal: "center" },
              border: {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" }
              }
            };
          } else {
            // Boş günler için stil
            ws[cell].s = {
              alignment: { horizontal: "center" },
              border: {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" }
              }
            };
          }
        } else {
          // Normal veri hücreleri için stil
          ws[cell].s = {
            border: {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" }
            },
            alignment: { vertical: "center" }
          };
          
          // Sayısal değerler için sağa hizalama
          if (C === 6 || C === 7) { // Gecelik Ücret ve Toplam Ücret sütunları
            ws[cell].s.alignment = { horizontal: "right", vertical: "center" };
          }
        }
      }
    }
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Puantaj Raporu");
    XLSX.writeFile(wb, "konaklama_puantaj_raporu.xlsx");
  };

  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array', raw: true, cellNF: false });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, { header: 1 });

          if (!json || json.length < 2) {
            alert('Excel dosyası boş veya beklenen formatta değil.');
            return;
          }

          const headers = json[0]; // İlk satır başlıklar

          const newRecords: Omit<AccommodationRecord, 'id'>[] = json.slice(1).map((row: (string | number | null)[]) => {
            // Ensure headers are correctly mapped to row indices if json is array of arrays
            // Assuming headers array contains the exact strings like 'Giriş Tarihi'
            const getColumnValue = (headerName: string): string => {
              const headerIndex = (headers as string[]).indexOf(headerName);
              return headerIndex > -1 ? String(row[headerIndex] || '') : '';
            };

            const girisTarihiRaw = getColumnValue('Giriş Tarihi');
            const cikisTarihiRaw = getColumnValue('Çıkış Tarihi');

            // Convert Excel date serial number to ISO string date
            const excelDateToISO = (excelDateSerial: string): string => {
              if (excelDateSerial.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return excelDateSerial; // Already in YYYY-MM-DD format
              }
              return '';
            };

            const girisTarihi = excelDateToISO(girisTarihiRaw);
            const cikisTarihi = excelDateToISO(cikisTarihiRaw);

            // Gecelik Ücreti işlerken formatlama yap
            // Ensure the value is treated as a string, then remove thousands separators (if any) and replace comma with dot
            const rawGecelikUcret = String(getColumnValue('Gecelik Ücret') || '0').replace(/\./g, '').replace(/,/g, '.');
            const gecelikUcret = parseFloat(rawGecelikUcret);

            const numberOfNights = girisTarihi && cikisTarihi ? calculateNumberOfNights(girisTarihi, cikisTarihi) : 0;
            // Ensure toplamUcret is calculated correctly and is not NaN
            const toplamUcret = isNaN(gecelikUcret * numberOfNights) ? 0 : gecelikUcret * numberOfNights;

            return {
              adiSoyadi: getColumnValue('Adı Soyadı'),
              unvani: getColumnValue('Ünvanı'),
              ulke: getColumnValue('Ülke'),
              sehir: getColumnValue('Şehir'),
              girisTarihi: girisTarihi,
              cikisTarihi: cikisTarihi,
              odaTipi: getColumnValue('Oda Tipi'),
              konaklamaTipi: getColumnValue('Konaklama Tipi') as "BB" | "HB" | "FB" | "UHD",
              faturaEdildi: getColumnValue('Fatura Edildi mi?') === 'Evet',
              gecelikUcret: gecelikUcret,
              toplamUcret: toplamUcret,
              organizasyonAdi: getColumnValue('Organizasyon Adı'),
              otelAdi: getColumnValue('Otel Adı'),
              kurumCari: getColumnValue('Kurum / Cari'),
              numberOfNights: numberOfNights,
            };
          });

          // API'ye gönder
          fetch('/api/accommodation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRecords),
          })
          .then(res => {
            if (!res.ok) {
              // If response is not ok, get the error message from the body
              return res.text().then(text => {
                throw new Error(`Server error: ${res.status} ${res.statusText}. Body: ${text}`);
              });
            }
            // Check content-type to avoid parsing non-json response
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
              return res.json();
            } else {
              return res.text().then(text => {
                throw new Error(`Expected JSON response, but got ${contentType}. Body: ${text}`);
              });
            }
          })
          .then(createdRecords => {
            setRecords(prev => [...prev, ...createdRecords]);
            alert(`Başarıyla ${createdRecords.length} kayıt içe aktarıldı.`);
          })
          .catch(error => {
            console.error("Error importing records:", error);
            alert(`Kayıtları içe aktarırken hata oluştu: ${error.message}`);
          });
        } catch (error) {
          console.error("Excel okuma hatası:", error);
          alert('Excel dosyasını okurken bir hata oluştu.');
        }
      };

      reader.onerror = () => {
        alert('Dosya okuma başarısız oldu.');
      };

      reader.readAsArrayBuffer(file);
    } else {
      alert('Lütfen bir Excel dosyası seçin.');
    }
  };

  const handleExportExcel = () => {
    const allColumns: ColumnDef[] = [
      { key: 'id', label: 'ID' },
      { key: 'kurumCari', label: 'Kurum / Cari' },
      { key: 'organizasyonAdi', label: 'Organizasyon Adı' },
      { key: 'otelAdi', label: 'Otel Adı' },
      { key: 'adiSoyadi', label: 'Adı Soyadı' },
      { key: 'unvani', label: 'Unvanı' },
      { key: 'ulke', label: 'Ülke' },
      { key: 'sehir', label: 'Şehir' },
      { key: 'girisTarihi', label: 'Giriş Tarihi' },
      { key: 'cikisTarihi', label: 'Çıkış Tarihi' },
      { key: 'odaTipi', label: 'Oda Tipi' },
      { key: 'konaklamaTipi', label: 'Konaklama Tipi' },
      { key: 'faturaEdildi', label: 'Fatura Edildi mi?' },
      { key: 'numberOfNights', label: 'Gece Sayısı' },
      { key: 'gecelikUcret', label: 'Gecelik Ücret' },
      { key: 'toplamUcret', label: 'Toplam Ücret' },
    ];
    setAvailableColumns(allColumns);
    setSelectedColumns(allColumns.map(col => col.key as string)); // Başlangıçta tüm sütunlar seçili gelsin
    setShowExportFilterModal(true);
  };

  const closeExportFilterModal = () => {
    setShowExportFilterModal(false);
  };

  const handleColumnToggle = (columnKey: string) => {
    setSelectedColumns(prevSelected =>
      prevSelected.includes(columnKey)
        ? prevSelected.filter(key => key !== columnKey)
        : [...prevSelected, columnKey]
    );
  };

  const handleExportFilteredExcel = () => {
    const headers = availableColumns
      .filter(col => selectedColumns.includes(col.key as string))
      .map(col => col.label);

    const data = records.map(record => {
      const row: (string | number | undefined)[] = [];
      selectedColumns.forEach(key => {
        if (key === 'faturaEdildi') {
          row.push(record.faturaEdildi ? 'Evet' : 'Hayır');
        } else {
          const recordKey = key as keyof AccommodationRecord;
          let value: string | number | boolean | undefined = record[recordKey];
          if (key === 'gecelikUcret' || key === 'toplamUcret') {
            value = (record[recordKey] as number).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          } else if (key === 'id' || key === 'numberOfNights') {
            value = record[recordKey] as number;
          } else if (key === 'girisTarihi' || key === 'cikisTarihi') {
            value = record[recordKey] as string;
          }
          if (typeof value === 'boolean') {
            row.push(value ? 'Evet' : 'Hayır');
          } else {
            row.push(value);
          }
        }
      });
      return row;
    });

    const ws_data = [headers, ...data];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Filtrelenmiş Kayıtlar");
    XLSX.writeFile(wb, "filtrelenmis_konaklama_kayitlari.xlsx");
    closeExportFilterModal();
  };

  const handleDownloadExcelTemplate = () => {
    // İçe aktarma mantığıyla tam uyumlu, düzeltilmiş başlıklar
    const headers = [
      "Kurum / Cari", 
      "Organizasyon Adı", 
      "Otel Adı", 
      "Adı Soyadı", 
      "Ünvanı", // İçe aktarmadaki 'Ünvanı' ile eşleşmesi için düzeltildi
      "Ülke", 
      "Şehir", 
      "Giriş Tarihi", 
      "Çıkış Tarihi", 
      "Oda Tipi", 
      "Konaklama Tipi", 
      "Fatura Edildi mi?", 
      "Gecelik Ücret"
    ];
    
    // Güncel yapıya uygun örnek veriler
    const exampleData = [
      ["ABC Şirketi", "Yıllık Toplantı", "Grand Hotel", "Ahmet Yılmaz", "Genel Müdür", "Türkiye", "İstanbul", "2024-06-15", "2024-06-18", "Double Oda", "BB", "Evet", 2500],
      ["XYZ Holding", "Eğitim Semineri", "Seaside Resort", "Ayşe Kaya", "Eğitim Uzmanı", "Türkiye", "Antalya", "2024-07-10", "2024-07-15", "Single Oda", "HB", "Hayır", 1800]
    ];
    
    const ws_data = [headers, ...exampleData];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    // Sütun genişliklerini ayarla
    const wscols = headers.map(() => ({ wch: 20 }));
    ws['!cols'] = wscols;

    // Başlıklara yol gösterici notlar ekle
    const addComment = (cell: string, text: string) => {
      if (!ws[cell].c) ws[cell].c = [];
      ws[cell].c.push({ a: "Sistem Notu", t: text });
    };
    addComment('H1', 'Tarih formatı YYYY-MM-DD şeklinde olmalıdır. Örnek: 2024-12-31');
    addComment('I1', 'Tarih formatı YYYY-MM-DD şeklinde olmalıdır. Örnek: 2024-12-31');

    // Veri doğrulama için arayüz tanımı
    interface DataValidation {
      type: 'list';
      formula1: string;
    }

    // Belirli sütunlar için veri doğrulama (açılır menü) ekle
    const validations: { [key: string]: DataValidation } = {
      'Oda Tipi': {
        type: 'list',
        formula1: '"Single Oda,Double Oda,Triple Oda,Suit Oda"'
      },
      'Konaklama Tipi': {
        type: 'list',
        formula1: '"BB,HB,FB,UHD"'
      },
      'Fatura Edildi mi?': {
        type: 'list',
        formula1: '"Evet,Hayır"'
      }
    };

    const maxRows = 1000; // İlk 1000 satır için doğrulama uygula
    if (!ws['!dataValidation']) ws['!dataValidation'] = [];

    headers.forEach((header, index) => {
      if (validations[header]) {
        const col = XLSX.utils.encode_col(index);
        ws['!dataValidation'].push({
          sqref: `${col}2:${col}${maxRows}`,
          ...validations[header],
          allowBlank: true,
          showInputMessage: true,
          showErrorMessage: true,
          promptTitle: `${header} Seçimi`,
          prompt: `Lütfen listeden geçerli bir değer seçin.`,
          errorTitle: `Geçersiz Değer`,
          error: `Lütfen ${header} için listeden geçerli bir değer seçin.`,
        });
      }
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Konaklama Şablonu");
    XLSX.writeFile(wb, "konaklama_sablonu_guncel.xlsx");
  };

  // Tabloya tarih yazarken kullanılacak fonksiyon
  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  const handleAccommodationCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, faturaEdildi: e.target.checked }));
  };

  // Sıralama fonksiyonu
  const handleSort = (column: keyof AccommodationRecord) => {
    if (sortColumn === column) {
      // Aynı sütuna tıklandıysa sıralama yönünü değiştir
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc');
      if (sortDirection === 'desc') {
        setSortColumn(null);
      }
    } else {
      // Yeni sütuna tıklandıysa o sütunu artan sırada sırala
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sıralama sıfırlama fonksiyonu
  const clearSort = () => {
    setSortColumn(null);
    setSortDirection(null);
  };

  // Sıralanmış kayıtları hesapla
  const sortedRecords = [...records].sort((a, b) => {
    if (!sortColumn || !sortDirection) {
      // Varsayılan sıralama: id'ye göre artan (eski kayıtlar en üstte)
      return a.id - b.id;
    }
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    // numberOfNights için özel kontrol
    if (sortColumn === 'numberOfNights') {
      const aValueNum = a.numberOfNights || 0;
      const bValueNum = b.numberOfNights || 0;
      if (aValueNum < bValueNum) return sortDirection === 'asc' ? -1 : 1;
      if (aValueNum > bValueNum) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    }

    // Null/undefined değerleri en sona koy
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    // String değerler için
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const aStr = aValue.toLowerCase();
      const bStr = bValue.toLowerCase();
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    }

    // Tarih değerleri için
    if (sortColumn === 'girisTarihi' || sortColumn === 'cikisTarihi') {
      const aDate = new Date(aValue as string).getTime();
      const bDate = new Date(bValue as string).getTime();
      if (aDate < bDate) return sortDirection === 'asc' ? -1 : 1;
      if (aDate > bDate) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    }

    // Boolean değerler için
    if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      const aBool = aValue ? 1 : 0;
      const bBool = bValue ? 1 : 0;
      if (aBool < bBool) return sortDirection === 'asc' ? -1 : 1;
      if (aBool > bBool) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    }

    // Sayısal karşılaştırma
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    }

    return 0;
  });

  // Sıralama ikonu bileşeni
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

  // Yeni state: seçili kayıtlar ve fiyatlar
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([]);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [salePrices, setSalePrices] = useState<{ [userId: number]: number }>({});

  // Checkbox değişimi
  const handleSelectRecord = (id: number) => {
    const record = records.find(r => r.id === id);
    if (record?.faturaEdildi) return; // Satışa aktarıldıysa seçilmesin
    setSelectedRecordIds(prev => {
      const newSelected = prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id];
      setSalePrices(prices => {
        const updated = { ...prices };
        if (!newSelected.includes(id)) delete updated[id];
        return updated;
      });
      return newSelected;
    });
  };
  const handleSelectAll = () => {
    // Sadece satışa aktarılmamış kayıtları seç
    const selectable = sortedRecords.filter(r => !r.faturaEdildi).map(r => r.id);
    if (selectedRecordIds.length === selectable.length) {
      setSelectedRecordIds([]);
      setSalePrices({});
    } else {
      setSelectedRecordIds(selectable);
      setSalePrices(Object.fromEntries(selectable.map(rid => [rid, 0])));
    }
  };

  // Satışa aktar fonksiyonu
  const handleSaleTransfer = () => {
    // Seçili kayıtlar için fiyatları başlat
    setSalePrices(prices => {
      const updated = { ...prices };
      selectedRecordIds.forEach(id => { if (!(id in updated)) updated[id] = 0; });
      return updated;
    });
    setSaleModalOpen(true);
  };
  const handleSalePriceChange = (accommodationId: number, value: number) => {
    if (isNaN(value) || value < 0) {
      setSalePrices(prices => ({ ...prices, [accommodationId]: 0 }));
    } else {
      setSalePrices(prices => ({ ...prices, [accommodationId]: value }));
    }
  };
  const confirmSaleTransfer = async () => {
    if (selectedRecordIds.length === 0) return;
    const selectedRecords = records.filter(r => selectedRecordIds.includes(r.id));
    const orgNames = Array.from(new Set(selectedRecords.map(r => r.organizasyonAdi)));
    if (orgNames.length !== 1 || !orgNames[0]) {
      alert('Satışa aktarılacak kayıtların organizasyon adı aynı olmalı ve boş olmamalı!');
      return;
    }
    // Her konaklama için fiyatı topla, sadece geçerli number olanları gönder
    const sales = selectedRecordIds.map(accommodationId => ({ accommodationId, fiyat: Number(salePrices[accommodationId]) || 0 }));
    if (sales.some(s => !s.fiyat || s.fiyat <= 0 || isNaN(s.fiyat))) {
      alert('Tüm kişiler için geçerli bir fiyat girilmelidir!');
      return;
    }
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sales, organizasyonAdi: orgNames[0] }),
    });
    const result = await res.json();
    if (result.success) {
      alert('Satışa aktarıldı!');
      setSaleModalOpen(false);
      setSelectedRecordIds([]);
      setSalePrices({});
      fetch('/api/accommodation').then(res => res.json()).then(data => setRecords(data));
    } else {
      alert(result.error || 'Satışa aktarma başarısız!');
    }
  };

  return (
    <AuthGuard requiredPermissions={["dashboard"]}>
      {/* Modern Header with Logo */}
      <header className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 shadow-2xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative container mx-auto px-6 py-8">
          <div className="flex items-center justify-center space-x-4 animate-fade-in">
            <div className="flex-shrink-0">
              <img src="/logo.svg" alt="Yurtsever Logo" className="h-16 w-auto drop-shadow-lg" />
            </div>
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                Konaklama Yönetim Sistemi
              </h1>
              <p className="text-blue-100 text-lg font-medium">
                Profesyonel Konaklama Kayıt ve Takip Platformu
              </p>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white opacity-10 rounded-full"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white opacity-10 rounded-full"></div>
        </div>
      </header>
      {/* ... existing code ... */}
      <main className="container mx-auto px-6 py-8">
        {/* Statistics Section */}
        {userPermissions.includes("statistics") && (
          <div className="mb-8 animate-slide-in">
            <Statistics records={records} />
          </div>
        )}

        {/* Action Buttons - Hepsi aynı hizada */}
        <div className="flex flex-wrap justify-center md:justify-end items-center gap-3 mb-8">
          {/* Admin Link - Sadece ADMIN görebilir */}
          {currentUser?.role === 'ADMIN' && (
            <a
              href="/admin"
              className="btn btn-warning text-lg px-6 py-3 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Kullanıcı Yönetimi
            </a>
          )}

          {/* Satışlar Sayfası Butonu */}
          <a
            href="/sales"
            className="btn btn-success text-lg px-6 py-3 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17v-2a4 4 0 014-4h10a4 4 0 014 4v2M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            </svg>
            Satışlar
          </a>

          {canAdd() && (
            <button
              onClick={() => setShowAccommodationModal(true)}
              className="btn btn-primary text-lg px-8 py-3 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Yeni Konaklama Kaydı Oluştur
            </button>
          )}

          <button
            onClick={handlePuantajRaporu}
            className="btn btn-secondary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Puantaj Raporu
          </button>
          
          {canImport() && (
            <>
              <input
                type="file"
                id="excelImportInput"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleImportExcel}
                className="hidden"
              />
              <button
                onClick={() => document.getElementById('excelImportInput')?.click()}
                className="btn btn-secondary"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Excel&apos;den İçe Aktar
              </button>
            </>
          )}
          
          {canExport() && (
            <>
              <button
                onClick={handleExportExcel}
                className="btn btn-success"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" transform="rotate(180 12 12)" />
                </svg>
                Excel&apos;e Aktar
              </button>
              <button
                onClick={handleDownloadExcelTemplate}
                className="btn btn-warning"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Excel Şablonu İndir
              </button>
            </>
          )}
        </div>

        {/* Modal */}
        <AccommodationFormModal
          isOpen={showAccommodationModal}
          onClose={() => setShowAccommodationModal(false)}
          formData={formData}
          onChange={handleInputChange}
          onCheckboxChange={handleAccommodationCheckbox}
          onSubmit={() => {
            handleAddRecord();
            setShowAccommodationModal(false);
          }}
        />

        {/* Table Section */}
        <div className="card">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Konaklama Kayıtları
              </h3>
              {sortColumn && sortDirection && (
                <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                  </svg>
                  <span>
                    {sortColumn === 'id' && 'ID'}
                    {sortColumn === 'adiSoyadi' && 'Adı Soyadı'}
                    {sortColumn === 'unvani' && 'Unvanı'}
                    {sortColumn === 'ulke' && 'Ülke'}
                    {sortColumn === 'sehir' && 'Şehir'}
                    {sortColumn === 'girisTarihi' && 'Giriş Tarihi'}
                    {sortColumn === 'cikisTarihi' && 'Çıkış Tarihi'}
                    {sortColumn === 'odaTipi' && 'Oda Tipi'}
                    {sortColumn === 'konaklamaTipi' && 'Konaklama Tipi'}
                    {sortColumn === 'faturaEdildi' && 'Fatura Durumu'}
                    {sortColumn === 'numberOfNights' && 'Gece Sayısı'}
                    {sortColumn === 'gecelikUcret' && 'Gecelik Ücret'}
                    {sortColumn === 'toplamUcret' && 'Toplam Ücret'}
                    {sortColumn === 'organizasyonAdi' && 'Organizasyon'}
                    {sortColumn === 'otelAdi' && 'Otel'}
                    {sortColumn === 'kurumCari' && 'Kurum/Cari'}
                  </span>
                  <span className="font-medium">
                    {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                  </span>
                  <button
                    onClick={clearSort}
                    className="ml-2 p-1 text-blue-600 hover:text-blue-800 transition-colors rounded-full hover:bg-blue-100"
                    title="Sıralamayı Sıfırla"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsTableCollapsed(!isTableCollapsed)}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-200"
              title={isTableCollapsed ? "Genişlet" : "Küçült"}
            >
              {isTableCollapsed ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              )}
            </button>
          </div>
          {!isTableCollapsed && (
            <div className="overflow-x-auto">
              <table className="table w-full text-xs">
                <thead>
                  <tr>
                    <th>
                      <input type="checkbox" checked={selectedRecordIds.length === sortedRecords.length && sortedRecords.length > 0} onChange={handleSelectAll} />
                    </th>
                    <th 
                      className="cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('id')}
                    >
                      <div className="flex items-center justify-between">
                        <span>ID</span>
                        <SortIcon column="id" />
                      </div>
                    </th>
                    <th 
                      className="hidden md:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('kurumCari')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Kurum / Cari</span>
                        <SortIcon column="kurumCari" />
                      </div>
                    </th>
                    <th 
                      className="hidden lg:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('organizasyonAdi')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Organizasyon</span>
                        <SortIcon column="organizasyonAdi" />
                      </div>
                    </th>
                    <th 
                      className="hidden lg:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('otelAdi')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Otel</span>
                        <SortIcon column="otelAdi" />
                      </div>
                    </th>
                    <th 
                      className="cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('adiSoyadi')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Adı Soyadı</span>
                        <SortIcon column="adiSoyadi" />
                      </div>
                    </th>
                    <th 
                      className="hidden md:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('unvani')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Unvanı</span>
                        <SortIcon column="unvani" />
                      </div>
                    </th>
                    <th 
                      className="hidden md:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('ulke')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Ülke</span>
                        <SortIcon column="ulke" />
                      </div>
                    </th>
                    <th 
                      className="cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('sehir')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Şehir</span>
                        <SortIcon column="sehir" />
                      </div>
                    </th>
                    <th 
                      className="cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('girisTarihi')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Giriş</span>
                        <SortIcon column="girisTarihi" />
                      </div>
                    </th>
                    <th 
                      className="cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('cikisTarihi')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Çıkış</span>
                        <SortIcon column="cikisTarihi" />
                      </div>
                    </th>
                    <th 
                      className="cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('odaTipi')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Oda</span>
                        <SortIcon column="odaTipi" />
                      </div>
                    </th>
                    <th 
                      className="cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('konaklamaTipi')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Konaklama</span>
                        <SortIcon column="konaklamaTipi" />
                      </div>
                    </th>
                    <th className="hidden md:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('faturaEdildi')}>
                      <div className="flex items-center justify-between">
                        <span>Satış Durumu</span>
                        <SortIcon column="faturaEdildi" />
                      </div>
                    </th>
                    <th 
                      className="cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('numberOfNights')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Gece</span>
                        <SortIcon column="numberOfNights" />
                      </div>
                    </th>
                    <th 
                      className="hidden md:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('gecelikUcret')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Gecelik Ücret</span>
                        <SortIcon column="gecelikUcret" />
                      </div>
                    </th>
                    <th 
                      className="hidden md:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleSort('toplamUcret')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Toplam Ücret</span>
                        <SortIcon column="toplamUcret" />
                      </div>
                    </th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td>
                        <input type="checkbox" checked={selectedRecordIds.includes(record.id)} onChange={() => handleSelectRecord(record.id)} disabled={record.faturaEdildi} />
                      </td>
                      <td className="font-medium text-blue-600">{record.id}</td>
                      <td className="truncate max-w-[80px] hidden md:table-cell">{record.kurumCari || '-'}</td>
                      <td className="truncate max-w-[80px] hidden lg:table-cell">{record.organizasyonAdi || '-'}</td>
                      <td className="truncate max-w-[80px] hidden lg:table-cell">{record.otelAdi || '-'}</td>
                      <td className="truncate max-w-[90px]">{record.adiSoyadi}</td>
                      <td className="truncate max-w-[80px] hidden md:table-cell">{record.unvani}</td>
                      <td className="truncate max-w-[60px] hidden md:table-cell">{record.ulke}</td>
                      <td className="truncate max-w-[60px]">{record.sehir}</td>
                      <td>{formatDate(record.girisTarihi)}</td>
                      <td>{formatDate(record.cikisTarihi)}</td>
                      <td>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium mr-1">
                          {record.odaTipi}
                        </span>
                      </td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${record.konaklamaTipi === 'BB' ? 'bg-yellow-100 text-yellow-800' : record.konaklamaTipi === 'HB' ? 'bg-green-100 text-green-800' : record.konaklamaTipi === 'FB' ? 'bg-purple-100 text-purple-800' : 'bg-pink-100 text-pink-800'}`}>{record.konaklamaTipi}</span>
                      </td>
                      <td className="hidden md:table-cell">
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
                      <td className="text-center">{record.numberOfNights || 0}</td>
                      <td className="font-medium hidden md:table-cell">{record.gecelikUcret.toLocaleString('tr-TR')} ₺</td>
                      <td className="font-bold text-green-600 hidden md:table-cell">{record.toplamUcret.toLocaleString('tr-TR')} ₺</td>
                      <td>
                        <div className="flex space-x-2">
                          {canEdit() && (
                            <button
                              onClick={() => handleEditClick(record.id)}
                              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                              title="Düzenle"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          {canDelete() && (
                            <button
                              onClick={() => handleDeleteClick(record.id)}
                              className="p-1 text-red-600 hover:text-red-800 transition-colors"
                              title="Sil"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          )}
        </div>

        {/* Satışa Aktar butonu */}
        {selectedRecordIds.length > 0 && (
          <div className="fixed bottom-8 right-8 z-50">
            <button className="btn btn-primary px-6 py-3 text-lg shadow-lg" onClick={handleSaleTransfer}>
              Seçili Kişileri Satışa Aktar
            </button>
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="space-y-2">
                  <label htmlFor="edit-kurumCari" className="block text-sm font-semibold text-gray-700">
                    Kurum / Cari
                  </label>
                  <input
                    type="text"
                    id="edit-kurumCari"
                    className="input"
                    value={formData.kurumCari}
                    onChange={handleInputChange}
                    placeholder="Kurum adını girin"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-organizasyonAdi" className="block text-sm font-semibold text-gray-700">
                    Organizasyon Adı
                  </label>
                  <input
                    type="text"
                    id="edit-organizasyonAdi"
                    className="input"
                    value={formData.organizasyonAdi}
                    onChange={handleInputChange}
                    placeholder="Organizasyon adını girin"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-otelAdi" className="block text-sm font-semibold text-gray-700">
                    Otel Adı
                  </label>
                  <input
                    type="text"
                    id="edit-otelAdi"
                    className="input"
                    value={formData.otelAdi}
                    onChange={handleInputChange}
                    placeholder="Otel adını girin"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-adiSoyadi" className="block text-sm font-semibold text-gray-700">
                    Adı Soyadı
                  </label>
                  <input
                    type="text"
                    id="edit-adiSoyadi"
                    className="input"
                    value={formData.adiSoyadi}
                    onChange={handleInputChange}
                    placeholder="Kişi adını girin"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-unvani" className="block text-sm font-semibold text-gray-700">
                    Unvanı
                  </label>
                  <input
                    type="text"
                    id="edit-unvani"
                    className="input"
                    value={formData.unvani}
                    onChange={handleInputChange}
                    placeholder="Unvanını girin"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-ulke" className="block text-sm font-semibold text-gray-700">
                    Ülke
                  </label>
                  <input
                    type="text"
                    id="edit-ulke"
                    className="input"
                    value={formData.ulke}
                    onChange={handleInputChange}
                    placeholder="Ülke adını girin"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-sehir" className="block text-sm font-semibold text-gray-700">
                    Şehir
                  </label>
                  <input
                    type="text"
                    id="edit-sehir"
                    className="input"
                    value={formData.sehir}
                    onChange={handleInputChange}
                    placeholder="Şehir adını girin"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-girisTarihi" className="block text-sm font-semibold text-gray-700">
                    Giriş Tarihi
                  </label>
                  <input
                    type="date"
                    id="edit-girisTarihi"
                    className="input"
                    value={formData.girisTarihi}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-cikisTarihi" className="block text-sm font-semibold text-gray-700">
                    Çıkış Tarihi
                  </label>
                  <input
                    type="date"
                    id="edit-cikisTarihi"
                    className="input"
                    value={formData.cikisTarihi}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-odaTipi" className="block text-sm font-semibold text-gray-700">
                    Oda Tipi
                  </label>
                  <select
                    id="edit-odaTipi"
                    className="input"
                    value={formData.odaTipi}
                    onChange={handleInputChange}
                  >
                    <option value="Single Oda">Single Oda</option>
                    <option value="Double Oda">Double Oda</option>
                    <option value="Triple Oda">Triple Oda</option>
                    <option value="Suit Oda">Suit Oda</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-konaklamaTipi" className="block text-sm font-semibold text-gray-700">Konaklama Tipi</label>
                  <select
                    id="edit-konaklamaTipi"
                    className="input"
                    value={formData.konaklamaTipi}
                    onChange={handleInputChange}
                  >
                    <option value="BB">BB</option>
                    <option value="HB">HB</option>
                    <option value="FB">FB</option>
                    <option value="UHD">UHD</option>
                  </select>
                </div>
                <div className="space-y-2 flex items-center mt-2">
                  <input
                    id="edit-faturaEdildi"
                    type="checkbox"
                    checked={formData.faturaEdildi}
                    onChange={e => setFormData(prev => ({ ...prev, faturaEdildi: e.target.checked }))}
                    className="mr-2 w-5 h-5 accent-blue-600"
                  />
                  <label htmlFor="edit-faturaEdildi" className="text-sm font-semibold text-gray-700">Fatura Edildi mi?</label>
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-gecelikUcret" className="block text-sm font-semibold text-gray-700">
                    Gecelik Ücret (₺)
                  </label>
                  <input 
                    type="number" 
                    id="edit-gecelikUcret" 
                    className="input" 
                    value={formData.gecelikUcret || ''} 
                    onChange={handleInputChange} 
                    step="1"
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeEditModal}
                  className="btn btn-secondary"
                >
                  İptal
                </button>
                <button
                  onClick={handleUpdateRecord}
                  className="btn btn-primary"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Kaydı Güncelle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {recordToDeleteId !== null && (
          <div className="modal-overlay">
            <div className="modal-content max-w-md">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Kaydı Sil</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Bu kaydı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={cancelDelete}
                    className="btn btn-secondary"
                  >
                    İptal
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="btn btn-error"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Evet, Sil
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Filter Modal */}
        {showExportFilterModal && (
          <div className="modal-overlay">
            <div className="modal-content max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" transform="rotate(180 12 12)" />
                  </svg>
                  Excel&apos;e Aktar - Sütun Seçimi
                </h2>
                <button
                  onClick={closeExportFilterModal}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                {availableColumns.map(column => (
                  <div key={column.key} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      id={`col-${column.key}`}
                      checked={selectedColumns.includes(column.key as string)}
                      onChange={() => handleColumnToggle(column.key as string)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`col-${column.key}`} className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                      {column.label}
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeExportFilterModal}
                  className="btn btn-secondary"
                >
                  İptal
                </button>
                <button
                  onClick={handleExportFilteredExcel}
                  className="btn btn-success"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" transform="rotate(180 12 12)" />
                  </svg>
                  Aktar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Puantaj Filter Modal */}
        {showPuantajFilterModal && (
          <div className="modal-overlay">
            <div className="modal-content max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Puantaj Raporu Filtreleme
                </h2>
                <button
                  onClick={closePuantajFilterModal}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6 mb-6">
                {/* Tarih Aralığı Filtreleme */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Tarih Aralığı
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="baslangicTarihi" className="block text-sm font-semibold text-gray-700">
                        Başlangıç Tarihi
                      </label>
                      <input
                        type="date"
                        id="baslangicTarihi"
                        className="input"
                        value={puantajFilters.baslangicTarihi}
                        onChange={handlePuantajFilterChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="bitisTarihi" className="block text-sm font-semibold text-gray-700">
                        Bitiş Tarihi
                      </label>
                      <input
                        type="date"
                        id="bitisTarihi"
                        className="input"
                        value={puantajFilters.bitisTarihi}
                        onChange={handlePuantajFilterChange}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Filtreler */}
                <div className="space-y-4">
                  {/* Organizasyon Adı Filtreleme */}
                  <div className="space-y-2 relative">
                    <label htmlFor="organizasyonAdi" className="block text-sm font-semibold text-gray-700">
                      Organizasyon Adı
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="organizasyonAdi"
                        className="input pr-10"
                        value={puantajFilters.organizasyonAdi}
                        onChange={handlePuantajFilterChange}
                        onFocus={() => setShowOrganizasyonOptions(true)}
                        onBlur={() => setTimeout(() => setShowOrganizasyonOptions(false), 200)}
                        placeholder="Organizasyon adına göre filtrele"
                        autoComplete="off"
                      />
                      {showOrganizasyonOptions && getFilteredOptions('organizasyonAdi').length > 0 && (
                        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          {getFilteredOptions('organizasyonAdi').map((option, index) => (
                            <li
                              key={index}
                              onMouseDown={() => handleOptionSelect('organizasyonAdi', option)}
                              className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-white hover:bg-gray-600"
                            >
                              {option}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setPuantajFilters({
                      organizasyonAdi: '',
                      baslangicTarihi: puantajFilters.baslangicTarihi,
                      bitisTarihi: puantajFilters.bitisTarihi
                    });
                  }}
                  className="btn btn-secondary"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Filtreleri Temizle
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={closePuantajFilterModal}
                    className="btn btn-secondary"
                  >
                    İptal
                  </button>
                  <button
                    onClick={generatePuantajRaporu}
                    className="btn btn-primary"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Raporu Oluştur
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
