'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

interface AccommodationRecord {
  id: number;
  adiSoyadi: string;
  unvani: string;
  ulke: string;
  sehir: string;
  girisTarihi: string;
  cikisTarihi: string;
  odaTipi: string;
  gecelikUcret: number;
  toplamUcret: number;
  organizasyonAdi?: string;
  otelAdi?: string;
  kurumCari?: string;
  numberOfNights?: number;
}

export default function Home() {
  const [records, setRecords] = useState<AccommodationRecord[]>([
    {
      id: 1,
      adiSoyadi: "Zeynep Kaya",
      unvani: "Yazılım Geliştirici",
      ulke: "Türkiye",
      sehir: "İstanbul",
      girisTarihi: "2024-07-01",
      cikisTarihi: "2024-07-08",
      odaTipi: "Double Oda",
      gecelikUcret: 1800,
      toplamUcret: 12600,
      organizasyonAdi: "Tekno Ltd.",
      otelAdi: "Bosphorus View",
      kurumCari: "Cari K",
      numberOfNights: 7,
    },
    {
      id: 2,
      adiSoyadi: "Can Yılmaz",
      unvani: "Pazarlama Uzmanı",
      ulke: "Türkiye",
      sehir: "Ankara",
      girisTarihi: "2024-07-10",
      cikisTarihi: "2024-07-13",
      odaTipi: "Single Oda",
      gecelikUcret: 1500,
      toplamUcret: 4500,
      organizasyonAdi: "Dijital A.Ş.",
      otelAdi: "Ankara Park",
      kurumCari: "Kurum L",
      numberOfNights: 3,
    },
    {
      id: 3,
      adiSoyadi: "Elif Demir",
      unvani: "Grafik Tasarımcı",
      ulke: "Türkiye",
      sehir: "İzmir",
      girisTarihi: "2024-07-15",
      cikisTarihi: "2024-07-19",
      odaTipi: "Triple Oda",
      gecelikUcret: 2200,
      toplamUcret: 8800,
      organizasyonAdi: "Sanat Stüdyosu",
      otelAdi: "Ege Pansiyon",
      kurumCari: "Cari M",
      numberOfNights: 4,
    },
    {
      id: 4,
      adiSoyadi: "Burak Kara",
      unvani: "Finans Analisti",
      ulke: "Almanya",
      sehir: "Münih",
      girisTarihi: "2024-08-01",
      cikisTarihi: "2024-08-05",
      odaTipi: "Suit Oda",
      gecelikUcret: 3500,
      toplamUcret: 14000,
      organizasyonAdi: "Global Finans",
      otelAdi: "Alpen Lodge",
      kurumCari: "Kurum N",
      numberOfNights: 4,
    },
    {
      id: 5,
      adiSoyadi: "Melis Öztürk",
      unvani: "Proje Müdürü",
      ulke: "Fransa",
      sehir: "Nice",
      girisTarihi: "2024-08-10",
      cikisTarihi: "2024-08-14",
      odaTipi: "Double Oda",
      gecelikUcret: 2800,
      toplamUcret: 11200,
      organizasyonAdi: "Yükseliş A.Ş.",
      otelAdi: "Riviera Otel",
      kurumCari: "Cari O",
      numberOfNights: 4,
    },
    {
      id: 6,
      adiSoyadi: "Serkan Polat",
      unvani: "İnsan Kaynakları Uzmanı",
      ulke: "İngiltere",
      sehir: "Manchester",
      girisTarihi: "2024-09-01",
      cikisTarihi: "2024-09-03",
      odaTipi: "Single Oda",
      gecelikUcret: 1700,
      toplamUcret: 3400,
      organizasyonAdi: "İK Çözümleri",
      otelAdi: "City Stay",
      kurumCari: "Kurum P",
      numberOfNights: 2,
    },
    {
      id: 7,
      adiSoyadi: "Deniz Aksoy",
      unvani: "Operasyon Yöneticisi",
      ulke: "İtalya",
      sehir: "Floransa",
      girisTarihi: "2024-09-15",
      cikisTarihi: "2024-09-18",
      odaTipi: "Triple Oda",
      gecelikUcret: 2500,
      toplamUcret: 7500,
      organizasyonAdi: "Lojistik Global",
      otelAdi: "Arno River Hotel",
      kurumCari: "Cari R",
      numberOfNights: 3,
    },
    {
      id: 8,
      adiSoyadi: "Cem Duran",
      unvani: "Yönetici Asistanı",
      ulke: "İspanya",
      sehir: "Barselona",
      girisTarihi: "2024-10-01",
      cikisTarihi: "2024-10-06",
      odaTipi: "Double Oda",
      gecelikUcret: 2000,
      toplamUcret: 10000,
      organizasyonAdi: "Ticaret Grubu",
      otelAdi: "Gaudi Palace",
      kurumCari: "Kurum S",
      numberOfNights: 5,
    },
    {
      id: 9,
      adiSoyadi: "Aslı Güneş",
      unvani: "Müşteri Temsilcisi",
      ulke: "Hollanda",
      sehir: "Rotterdam",
      girisTarihi: "2024-10-10",
      cikisTarihi: "2024-10-12",
      odaTipi: "Single Oda",
      gecelikUcret: 1600,
      toplamUcret: 3200,
      organizasyonAdi: "Hizmet Ltd.",
      otelAdi: "Delta Hotel",
      kurumCari: "Cari T",
      numberOfNights: 2,
    },
    {
      id: 10,
      adiSoyadi: "Emre Yıldız",
      unvani: "Araştırma Geliştirme",
      ulke: "Belçika",
      sehir: "Anvers",
      girisTarihi: "2024-11-01",
      cikisTarihi: "2024-11-04",
      odaTipi: "Suit Oda",
      gecelikUcret: 3000,
      toplamUcret: 9000,
      organizasyonAdi: "Yenilik A.Ş.",
      otelAdi: "Schelde Hotel",
      kurumCari: "Kurum U",
      numberOfNights: 3,
    },
    {
      id: 11,
      adiSoyadi: "Fatma Çelik",
      unvani: "Muhasebeci",
      ulke: "Türkiye",
      sehir: "Bursa",
      girisTarihi: "2024-11-10",
      cikisTarihi: "2024-11-13",
      odaTipi: "Double Oda",
      gecelikUcret: 1900,
      toplamUcret: 5700,
      organizasyonAdi: "Finans Çözümleri",
      otelAdi: "Green Park",
      kurumCari: "Cari V",
      numberOfNights: 3,
    },
    {
      id: 12,
      adiSoyadi: "Okan Şahin",
      unvani: "Satış Direktörü",
      ulke: "Türkiye",
      sehir: "Antalya",
      girisTarihi: "2024-12-01",
      cikisTarihi: "2024-12-07",
      odaTipi: "Suit Oda",
      gecelikUcret: 4000,
      toplamUcret: 24000,
      organizasyonAdi: "Gelişim Pazarlama",
      otelAdi: "Beach Resort",
      kurumCari: "Kurum W",
      numberOfNights: 6,
    },
    {
      id: 13,
      adiSoyadi: "Gizem Yücel",
      unvani: "Eğitim Uzmanı",
      ulke: "Kanada",
      sehir: "Toronto",
      girisTarihi: "2024-12-15",
      cikisTarihi: "2024-12-19",
      odaTipi: "Single Oda",
      gecelikUcret: 2000,
      toplamUcret: 8000,
      organizasyonAdi: "Eğitim Akademisi",
      otelAdi: "Maple Leaf Hotel",
      kurumCari: "Cari X",
      numberOfNights: 4,
    },
    {
      id: 14,
      adiSoyadi: "Deniz Arslan",
      unvani: "Halkla İlişkiler",
      ulke: "Amerika",
      sehir: "New York",
      girisTarihi: "2025-01-05",
      cikisTarihi: "2025-01-10",
      odaTipi: "Double Oda",
      gecelikUcret: 2700,
      toplamUcret: 13500,
      organizasyonAdi: "İletişim Grubu",
      otelAdi: "Times Square Hotel",
      kurumCari: "Kurum Y",
      numberOfNights: 5,
    },
    {
      id: 15,
      adiSoyadi: "Barış Tekin",
      unvani: "Mimar",
      ulke: "Birleşik Arap Emirlikleri",
      sehir: "Dubai",
      girisTarihi: "2025-01-20",
      cikisTarihi: "2025-01-24",
      odaTipi: "Suit Oda",
      gecelikUcret: 5000,
      toplamUcret: 20000,
      organizasyonAdi: "Tasarım Mimarlık",
      otelAdi: "Burj View Hotel",
      kurumCari: "Cari Z",
      numberOfNights: 4,
    },
    {
      id: 16,
      adiSoyadi: "Ceren Yüksel",
      unvani: "Doktor",
      ulke: "Türkiye",
      sehir: "Gaziantep",
      girisTarihi: "2025-02-01",
      cikisTarihi: "2025-02-03",
      odaTipi: "Single Oda",
      gecelikUcret: 1400,
      toplamUcret: 2800,
      organizasyonAdi: "Sağlık Grubu",
      otelAdi: "Anadolu Hastanesi Konukevi",
      kurumCari: "Kurum AA",
      numberOfNights: 2,
    },
    {
      id: 17,
      adiSoyadi: "Hakan Kurt",
      unvani: "Öğretmen",
      ulke: "Türkiye",
      sehir: "Trabzon",
      girisTarihi: "2025-02-10",
      cikisTarihi: "2025-02-15",
      odaTipi: "Triple Oda",
      gecelikUcret: 1600,
      toplamUcret: 8000,
      organizasyonAdi: "Eğitim Vakfı",
      otelAdi: "Karadeniz Otel",
      kurumCari: "Cari BB",
      numberOfNights: 5,
    },
    {
      id: 18,
      adiSoyadi: "Pınar Avcı",
      unvani: "Diş Hekimi",
      ulke: "Türkiye",
      sehir: "Adana",
      girisTarihi: "2025-03-01",
      cikisTarihi: "2025-03-04",
      odaTipi: "Double Oda",
      gecelikUcret: 2100,
      toplamUcret: 6300,
      organizasyonAdi: "Diş Klinikleri",
      otelAdi: "Çukurova Otel",
      kurumCari: "Kurum CC",
      numberOfNights: 3,
    },
    {
      id: 19,
      adiSoyadi: "Tayfun Eroğlu",
      unvani: "Eczacı",
      ulke: "Türkiye",
      sehir: "Kayseri",
      girisTarihi: "2025-03-10",
      cikisTarihi: "2025-03-12",
      odaTipi: "Single Oda",
      gecelikUcret: 1300,
      toplamUcret: 2600,
      organizasyonAdi: "Eczacılık Odası",
      otelAdi: "Erciyes Otel",
      kurumCari: "Cari DD",
      numberOfNights: 2,
    },
    {
      id: 20,
      adiSoyadi: "Aycan Şimşek",
      unvani: "Veteriner",
      ulke: "Türkiye",
      sehir: "Konya",
      girisTarihi: "2025-03-18",
      cikisTarihi: "2025-03-22",
      odaTipi: "Triple Oda",
      gecelikUcret: 1750,
      toplamUcret: 7000,
      organizasyonAdi: "Hayvan Sağlığı",
      otelAdi: "Mevlana Otel",
      kurumCari: "Kurum EE",
      numberOfNights: 4,
    },
  ]);

  const [formData, setFormData] = useState<Omit<AccommodationRecord, 'id' | 'toplamUcret' | 'numberOfNights'>>({
    adiSoyadi: '',
    unvani: '',
    ulke: '',
    sehir: '',
    girisTarihi: '',
    cikisTarihi: '',
    odaTipi: 'Single Oda',
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

  type ColumnKey = keyof AccommodationRecord | 'id' | 'numberOfNights' | 'toplamUcret';
  type ColumnDef = { key: ColumnKey; label: string };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: (id === 'gecelikUcret') ? (value === '' ? 0 : parseFloat(value)) : value,
    }));
  };

  const handleAddRecord = () => {
    const newId = records.length > 0 ? Math.max(...records.map(record => record.id)) + 1 : 1;
    const girisDate = new Date(formData.girisTarihi);
    const cikisDate = new Date(formData.cikisTarihi);
    const diffTime = Math.abs(cikisDate.getTime() - girisDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const calculatedToplamUcret = formData.gecelikUcret * (diffDays > 0 ? diffDays : 1);

    const newRecord: AccommodationRecord = {
      id: newId,
      ...formData,
      toplamUcret: calculatedToplamUcret,
      numberOfNights: diffDays > 0 ? diffDays : 0,
    };
    setRecords((prevRecords) => [...prevRecords, newRecord]);
    // Clear form after adding
    setFormData({
      adiSoyadi: '',
      unvani: '',
      ulke: '',
      sehir: '',
      girisTarihi: '',
      cikisTarihi: '',
      odaTipi: 'Single Oda',
      gecelikUcret: 0,
      organizasyonAdi: '',
      otelAdi: '',
      kurumCari: '',
    });
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
        gecelikUcret: recordToEdit.gecelikUcret,
        organizasyonAdi: recordToEdit.organizasyonAdi || '',
        otelAdi: recordToEdit.otelAdi || '',
        kurumCari: recordToEdit.kurumCari || '',
      });
      setShowEditModal(true);
    }
  };

  const handleUpdateRecord = () => {
    if (selectedRecordId === null) return;

    const girisDate = new Date(formData.girisTarihi);
    const cikisDate = new Date(formData.cikisTarihi);
    const diffTime = Math.abs(cikisDate.getTime() - girisDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const calculatedToplamUcret = formData.gecelikUcret * (diffDays > 0 ? diffDays : 1);

    setRecords((prevRecords) =>
      prevRecords.map((record) =>
        record.id === selectedRecordId
          ? {
              ...record,
              ...formData,
              toplamUcret: calculatedToplamUcret,
              numberOfNights: diffDays > 0 ? diffDays : 0,
            }
          : record
      )
    );
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
      gecelikUcret: 0,
      organizasyonAdi: '',
      otelAdi: '',
      kurumCari: '',
    });
  };

  const handleDeleteClick = (id: number) => {
    setRecordToDeleteId(id);
  };

  const confirmDelete = () => {
    if (recordToDeleteId === null) return;
    setRecords((prevRecords) => prevRecords.filter((record) => record.id !== recordToDeleteId));
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
      gecelikUcret: 0,
      organizasyonAdi: '',
      otelAdi: '',
      kurumCari: '',
    });
  };

  const calculateNumberOfNights = (girisTarihi: string, cikisTarihi: string): number => {
    const start = new Date(girisTarihi);
    const end = new Date(cikisTarihi);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handlePuantajRaporu = () => {
    alert('Puantaj Raporu oluşturulacak.');
  };

  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array', raw: true, cellNF: false });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

          if (!json || json.length < 2) {
            alert('Excel dosyası boş veya beklenen formatta değil.');
            return;
          }

          const headers = json[0]; // İlk satır başlıklar
          let currentMaxId = records.length > 0 ? Math.max(...records.map(r => r.id)) : 0; // Mevcut en yüksek ID'yi al

          const newRecords: AccommodationRecord[] = json.slice(1).map((row: any) => {
            // Ensure headers are correctly mapped to row indices if json is array of arrays
            // Assuming headers array contains the exact strings like 'Giriş Tarihi'
            const getColumnValue = (headerName: string) => {
              const headerIndex = headers.indexOf(headerName);
              return headerIndex > -1 ? row[headerIndex] : undefined;
            };

            const girisTarihiRaw = getColumnValue('Giriş Tarihi');
            const cikisTarihiRaw = getColumnValue('Çıkış Tarihi');

            // Convert Excel date serial number to ISO string date
            const excelDateToISO = (excelDateSerial: number | string): string => {
              if (typeof excelDateSerial === 'number') {
                return new Date(Math.round((excelDateSerial - 25569) * 86400 * 1000)).toISOString().split('T')[0];
              } else if (typeof excelDateSerial === 'string' && excelDateSerial.match(/^\d{4}-\d{2}-\d{2}$/)) {
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
              id: ++currentMaxId,
              adiSoyadi: getColumnValue('Adı Soyadı') || '',
              unvani: getColumnValue('Ünvanı') || '',
              ulke: getColumnValue('Ülke') || '',
              sehir: getColumnValue('Şehir') || '',
              girisTarihi: girisTarihi,
              cikisTarihi: cikisTarihi,
              odaTipi: getColumnValue('Oda Tipi') || '',
              gecelikUcret: gecelikUcret,
              toplamUcret: toplamUcret,
              organizasyonAdi: getColumnValue('Organizasyon Adı') || '',
              otelAdi: getColumnValue('Otel Adı') || '',
              kurumCari: getColumnValue('Kurum / Cari') || '',
              numberOfNights: numberOfNights,
            };
          });

          setRecords(prevRecords => [...prevRecords, ...newRecords]);
          alert(`Başarıyla ${newRecords.length} kayıt içe aktarıldı.`);
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
        const recordKey = key as keyof AccommodationRecord;
        let value: string | number | undefined = record[recordKey];

        if (key === 'gecelikUcret' || key === 'toplamUcret') {
          value = (record[recordKey] as number).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else if (key === 'id' || key === 'numberOfNights') {
          value = record[recordKey] as number;
        } else if (key === 'girisTarihi' || key === 'cikisTarihi') {
          value = record[recordKey] as string;
        }
        row.push(value);
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
    const headers = ["Kurum / Cari", "Organizasyon Adı", "Otel Adı", "Adı Soyadı", "Unvanı", "Ülke", "Şehir", "Giriş Tarihi", "Çıkış Tarihi", "Oda Tipi", "Gecelik Ücret"];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Şablon");
    XLSX.writeFile(wb, "konaklama_sablonu.xlsx");
  };

  return (
    <main className="min-h-screen w-full bg-gray-100">
      <div className="container-fluid px-4 py-6 mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-800">Konaklama Kayıt Sistemi</h1>

        {/* Form Section */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Konaklama Kaydı</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <div>
              <label htmlFor="kurumCari" className="block text-xs font-semibold text-gray-700 mb-1">Kurum / Cari</label>
              <input
                type="text"
                id="kurumCari"
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                value={formData.kurumCari}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="organizasyonAdi" className="block text-xs font-semibold text-gray-700 mb-1">Organizasyon Adı</label>
              <input
                type="text"
                id="organizasyonAdi"
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                value={formData.organizasyonAdi}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="otelAdi" className="block text-xs font-semibold text-gray-700 mb-1">Otel Adı</label>
              <input
                type="text"
                id="otelAdi"
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                value={formData.otelAdi}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="adiSoyadi" className="block text-xs font-semibold text-gray-700 mb-1">Adı Soyadı</label>
              <input
                type="text"
                id="adiSoyadi"
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                value={formData.adiSoyadi}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="unvani" className="block text-xs font-semibold text-gray-700 mb-1">Unvanı</label>
              <input
                type="text"
                id="unvani"
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                value={formData.unvani}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="ulke" className="block text-xs font-semibold text-gray-700 mb-1">Ülke</label>
              <input
                type="text"
                id="ulke"
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                value={formData.ulke}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="sehir" className="block text-xs font-semibold text-gray-700 mb-1">Şehir</label>
              <input
                type="text"
                id="sehir"
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                value={formData.sehir}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="girisTarihi" className="block text-xs font-semibold text-gray-700 mb-1">Giriş Tarihi</label>
              <input
                type="date"
                id="girisTarihi"
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                value={formData.girisTarihi}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="cikisTarihi" className="block text-xs font-semibold text-gray-700 mb-1">Çıkış Tarihi</label>
              <input
                type="date"
                id="cikisTarihi"
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                value={formData.cikisTarihi}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="odaTipi" className="block text-xs font-semibold text-gray-700 mb-1">Oda Tipi</label>
              <select
                id="odaTipi"
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                value={formData.odaTipi}
                onChange={handleInputChange}
              >
                <option value="Single Oda">Single Oda</option>
                <option value="Double Oda">Double Oda</option>
                <option value="Suit Oda">Suit Oda</option>
                <option value="King Oda">King Oda</option>
                <option value="Queen Oda">Queen Oda</option>
                <option value="Studio Oda">Studio Oda</option>
                <option value="Deluxe Oda">Deluxe Oda</option>
                <option value="Family Oda">Family Oda</option>
                <option value="Connected Oda">Connected Oda</option>
                <option value="Accessible Oda">Accessible Oda</option>
              </select>
            </div>
            <div>
              <label htmlFor="gecelikUcret" className="block text-xs font-semibold text-gray-700 mb-1">Gecelik Ücret</label>
              <input 
                type="number" 
                id="gecelikUcret" 
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500" 
                value={formData.gecelikUcret} 
                onChange={handleInputChange} 
                step="1"
                min="0"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <button
              onClick={handleAddRecord}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-md shadow-md transition duration-150 ease-in-out"
            >
              Kaydı Ekle
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-end gap-2 mb-4">
          <button
            onClick={handlePuantajRaporu}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md shadow-md transition duration-150 ease-in-out flex items-center justify-center text-xs"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Puantaj Raporu
          </button>
          <input
            type="file"
            id="excelImportInput"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleImportExcel}
            className="hidden"
          />
          <button
            onClick={() => document.getElementById('excelImportInput')?.click()}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md shadow-md transition duration-150 ease-in-out flex items-center justify-center text-xs"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Excel'den İçe Aktar
          </button>
          <button
            onClick={handleExportExcel}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md shadow-md transition duration-150 ease-in-out flex items-center justify-center text-xs"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" transform="rotate(180 12 12)" /></svg>
            Excel'e Aktar
          </button>
          <button
            onClick={handleDownloadExcelTemplate}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md shadow-md transition duration-150 ease-in-out flex items-center justify-center text-xs"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            Excel Şablonu İndir
          </button>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="w-full">
            <table className="w-full table-auto text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">KURUM / CARİ</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">ORG. ADI</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">OTEL ADI</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">ADI SOYADI</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">ÜNVANI</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">ÜLKE</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">ŞEHİR</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">GİRİŞ</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">ÇIKIŞ</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">ODA</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">GECE</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">GECELİK ÜCRET</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">TOPLAM ÜCRET</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">İŞLEMLER</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-[11px] text-gray-900">{record.id}</td>
                    <td className="px-3 py-2 text-[11px] text-gray-900">{record.kurumCari}</td>
                    <td className="px-3 py-2 text-[11px] text-gray-900">{record.organizasyonAdi}</td>
                    <td className="px-3 py-2 text-[11px] text-gray-900">{record.otelAdi}</td>
                    <td className="px-3 py-2 text-[11px] text-gray-900">{record.adiSoyadi}</td>
                    <td className="px-3 py-2 text-[11px] text-gray-900">{record.unvani}</td>
                    <td className="px-3 py-2 text-[11px] text-gray-900">{record.ulke}</td>
                    <td className="px-3 py-2 text-[11px] text-gray-900">{record.sehir}</td>
                    <td className="px-3 py-2 text-[11px] text-gray-900">{record.girisTarihi}</td>
                    <td className="px-3 py-2 text-[11px] text-gray-900">{record.cikisTarihi}</td>
                    <td className="px-3 py-2 text-[11px] text-gray-900">{record.odaTipi}</td>
                    <td className="px-3 py-2 text-[11px] text-gray-900">{record.numberOfNights}</td>
                    <td className="px-3 py-2 text-[11px] text-gray-900">{record.gecelikUcret.toLocaleString('tr-TR')} ₺</td>
                    <td className="px-3 py-2 text-[11px] text-gray-900">{record.toplamUcret.toLocaleString('tr-TR')} ₺</td>
                    <td className="px-3 py-2 text-[11px] text-gray-900">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditClick(record.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-2 rounded text-[10px] shadow-sm transition duration-150 ease-in-out"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDeleteClick(record.id)}
                          className="bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-2 rounded text-[10px] shadow-sm transition duration-150 ease-in-out"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl border border-gray-700 relative">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Kaydı Düzenle</h2>
            <button
              onClick={closeEditModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 transition duration-150 ease-in-out"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="flex flex-col">
                <label htmlFor="kurumCari" className="mb-1 text-sm font-medium text-gray-300">Kurum / Cari</label>
                <input
                  type="text"
                  id="kurumCari"
                  className="border border-gray-600 bg-gray-700 text-white p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.kurumCari}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="organizasyonAdi" className="mb-1 text-sm font-medium text-gray-300">Organizasyon Adı</label>
                <input
                  type="text"
                  id="organizasyonAdi"
                  className="border border-gray-600 bg-gray-700 text-white p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.organizasyonAdi}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="otelAdi" className="mb-1 text-sm font-medium text-gray-300">Otel Adı</label>
                <input
                  type="text"
                  id="otelAdi"
                  className="border border-gray-600 bg-gray-700 text-white p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.otelAdi}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="adiSoyadi" className="mb-1 text-sm font-medium text-gray-300">Adı Soyadı</label>
                <input
                  type="text"
                  id="adiSoyadi"
                  className="border border-gray-600 bg-gray-700 text-white p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.adiSoyadi}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="unvani" className="mb-1 text-sm font-medium text-gray-300">Unvanı</label>
                <input
                  type="text"
                  id="unvani"
                  className="border border-gray-600 bg-gray-700 text-white p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.unvani}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="ulke" className="mb-1 text-sm font-medium text-gray-300">Ülke</label>
                <input
                  type="text"
                  id="ulke"
                  className="border border-gray-600 bg-gray-700 text-white p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.ulke}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="sehir" className="mb-1 text-sm font-medium text-gray-300">Şehir</label>
                <input
                  type="text"
                  id="sehir"
                  className="border border-gray-600 bg-gray-700 text-white p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.sehir}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="girisTarihi" className="mb-1 text-sm font-medium text-gray-300">Giriş Tarihi</label>
                <input
                  type="date"
                  id="girisTarihi"
                  className="border border-gray-600 bg-gray-700 text-white p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.girisTarihi}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="cikisTarihi" className="mb-1 text-sm font-medium text-gray-300">Çıkış Tarihi</label>
                <input
                  type="date"
                  id="cikisTarihi"
                  className="border border-gray-600 bg-gray-700 text-white p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.cikisTarihi}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="odaTipi" className="mb-1 text-sm font-medium text-gray-300">Oda Tipi</label>
                <select
                  id="odaTipi"
                  className="border border-gray-600 bg-gray-700 text-white p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.odaTipi}
                  onChange={handleInputChange}
                >
                  <option value="Single Oda">Single Oda</option>
                  <option value="Double Oda">Double Oda</option>
                  <option value="Suit Oda">Suit Oda</option>
                  <option value="King Oda">King Oda</option>
                  <option value="Queen Oda">Queen Oda</option>
                  <option value="Studio Oda">Studio Oda</option>
                  <option value="Deluxe Oda">Deluxe Oda</option>
                  <option value="Family Oda">Family Oda</option>
                  <option value="Connected Oda">Connected Oda</option>
                  <option value="Accessible Oda">Accessible Oda</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label htmlFor="gecelikUcret" className="mb-1 text-sm font-medium text-gray-300">Gecelik Ücret</label>
                <input 
                  type="number" 
                  id="gecelikUcret" 
                  className="border border-gray-600 bg-gray-700 text-white p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500" 
                  value={formData.gecelikUcret} 
                  onChange={handleInputChange} 
                  step="1"
                  min="0"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleUpdateRecord}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-md shadow-md transition duration-150 ease-in-out"
              >
                Kaydı Güncelle
              </button>
              <button
                onClick={closeEditModal}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2.5 px-6 rounded-md shadow-md transition duration-150 ease-in-out"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {recordToDeleteId !== null && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm border border-gray-700 relative">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Kaydı Sil Onayı</h2>
            <p className="text-gray-300 mb-6 text-center">Bu kaydı silmek istediğinizden emin misiniz?</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-md shadow-md transition duration-150 ease-in-out"
              >
                Evet, Sil
              </button>
              <button
                onClick={cancelDelete}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2.5 px-6 rounded-md shadow-md transition duration-150 ease-in-out"
              >
                Hayır, İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Filter Modal */}
      {showExportFilterModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-lg border border-gray-700 relative">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Excel'e Aktar - Sütun Seçimi</h2>
            <button
              onClick={closeExportFilterModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 transition duration-150 ease-in-out"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
              {availableColumns.map(column => (
                <div key={column.key} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`col-${column.key}`}
                    checked={selectedColumns.includes(column.key as string)}
                    onChange={() => handleColumnToggle(column.key as string)}
                    className="form-checkbox h-5 w-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`col-${column.key}`} className="ml-2 text-gray-300 text-sm cursor-pointer">{column.label}</label>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleExportFilteredExcel}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-md shadow-md transition duration-150 ease-in-out"
              >
                Aktar
              </button>
              <button
                onClick={closeExportFilterModal}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2.5 px-6 rounded-md shadow-md transition duration-150 ease-in-out"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
