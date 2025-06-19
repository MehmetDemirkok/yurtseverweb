'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import Statistics from './components/Statistics';

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

  const [showPuantajFilterModal, setShowPuantajFilterModal] = useState<boolean>(false);
  const [puantajFilters, setPuantajFilters] = useState<{
    kurumCari: string;
    organizasyonAdi: string;
    unvani: string;
    baslangicTarihi: string;
    bitisTarihi: string;
  }>({
    kurumCari: '',
    organizasyonAdi: '',
    unvani: '',
    baslangicTarihi: '',
    bitisTarihi: ''
  });
  
  // Filtreleme için öneriler
  const [kurumCariOptions, setKurumCariOptions] = useState<string[]>([]);
  const [organizasyonOptions, setOrganizasyonOptions] = useState<string[]>([]);
  const [unvanOptions, setUnvanOptions] = useState<string[]>([]);

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
    // Benzersiz kurum/cari, organizasyon adı ve ünvan seçeneklerini oluştur
    const uniqueKurumCari = Array.from(new Set(records.map(record => record.kurumCari).filter(Boolean) as string[]));
    const uniqueOrganizasyon = Array.from(new Set(records.map(record => record.organizasyonAdi).filter(Boolean) as string[]));
    const uniqueUnvan = Array.from(new Set(records.map(record => record.unvani)));
    
    setKurumCariOptions(uniqueKurumCari);
    setOrganizasyonOptions(uniqueOrganizasyon);
    setUnvanOptions(uniqueUnvan);
    
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
    setPuantajFilters(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  const getFilteredOptions = (type: 'kurumCari' | 'organizasyonAdi' | 'unvani') => {
    const searchValue = puantajFilters[type].toLowerCase();
    let options: string[] = [];
    
    switch(type) {
      case 'kurumCari':
        options = kurumCariOptions;
        break;
      case 'organizasyonAdi':
        options = organizasyonOptions;
        break;
      case 'unvani':
        options = unvanOptions;
        break;
    }
    
    if (!searchValue) return options;
    return options.filter(option => option.toLowerCase().includes(searchValue));
  };
  
  const handleOptionSelect = (type: 'kurumCari' | 'organizasyonAdi' | 'unvani', value: string) => {
    setPuantajFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const generatePuantajRaporu = () => {
    // Filtreleme modalını kapat
    setShowPuantajFilterModal(false);

    // Kayıtları filtrele
    let filteredRecords = [...records];
    
    // Metin bazlı filtreler
    if (puantajFilters.kurumCari) {
      filteredRecords = filteredRecords.filter(record => 
        record.kurumCari?.toLowerCase().includes(puantajFilters.kurumCari.toLowerCase())
      );
    }
    
    if (puantajFilters.organizasyonAdi) {
      filteredRecords = filteredRecords.filter(record => 
        record.organizasyonAdi?.toLowerCase().includes(puantajFilters.organizasyonAdi.toLowerCase())
      );
    }
    
    if (puantajFilters.unvani) {
      filteredRecords = filteredRecords.filter(record => 
        record.unvani.toLowerCase().includes(puantajFilters.unvani.toLowerCase())
      );
    }
    
    // Tarih aralığı filtresi
    if (puantajFilters.baslangicTarihi && puantajFilters.bitisTarihi) {
      const baslangicDate = new Date(puantajFilters.baslangicTarihi);
      const bitisDate = new Date(puantajFilters.bitisTarihi);
      
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
        record.gecelikUcret.toLocaleString('tr-TR'),
        record.toplamUcret.toLocaleString('tr-TR')
      ];

      // Her tarih için kişinin o tarihte konaklamada olup olmadığını kontrol et
      allDates.forEach(date => {
        const checkDate = new Date(date);
        const startDate = new Date(record.girisTarihi);
        const endDate = new Date(record.cikisTarihi);
        
        // Eğer kişi o tarihte konaklamadaysa "X" işareti koy, değilse boş bırak
        if (checkDate >= startDate && checkDate <= endDate) {
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

      reader.onload = (e) => {
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
          let currentMaxId = records.length > 0 ? Math.max(...records.map(r => r.id)) : 0; // Mevcut en yüksek ID'yi al

          const newRecords: AccommodationRecord[] = json.slice(1).map((row: (string | number | null)[]) => {
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
              id: ++currentMaxId,
              adiSoyadi: getColumnValue('Adı Soyadı'),
              unvani: getColumnValue('Ünvanı'),
              ulke: getColumnValue('Ülke'),
              sehir: getColumnValue('Şehir'),
              girisTarihi: girisTarihi,
              cikisTarihi: cikisTarihi,
              odaTipi: getColumnValue('Oda Tipi'),
              gecelikUcret: gecelikUcret,
              toplamUcret: toplamUcret,
              organizasyonAdi: getColumnValue('Organizasyon Adı'),
              otelAdi: getColumnValue('Otel Adı'),
              kurumCari: getColumnValue('Kurum / Cari'),
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
    
    // Örnek veriler ekleniyor
    const exampleData = [
      ["ABC Şirketi", "Yıllık Toplantı", "Grand Hotel", "Ahmet Yılmaz", "Genel Müdür", "Türkiye", "İstanbul", "2024-06-15", "2024-06-18", "Double Oda", "2500"],
      ["XYZ Holding", "Eğitim Semineri", "Seaside Resort", "Ayşe Kaya", "Eğitim Uzmanı", "Türkiye", "Antalya", "2024-07-10", "2024-07-15", "Single Oda", "1800"]
    ];
    
    const ws_data = [headers, ...exampleData];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    // Sütun genişliklerini ayarla
    const wscols = headers.map(() => ({ wch: 20 })); // Her sütun için 20 karakter genişlik
    ws['!cols'] = wscols;
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Şablon");
    XLSX.writeFile(wb, "konaklama_sablonu.xlsx");
  };

  // Tabloya tarih yazarken kullanılacak fonksiyon
  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
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

      <main className="container mx-auto px-6 py-8">
        {/* Statistics Section */}
        <div className="mb-8 animate-slide-in">
          <Statistics records={records} />
        </div>

        {/* Form Section */}
        <div className="card p-8 mb-8 animate-scale-in">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Yeni Konaklama Kaydı</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label htmlFor="kurumCari" className="block text-sm font-semibold text-gray-700">
                Kurum / Cari
              </label>
              <input
                type="text"
                id="kurumCari"
                className="input"
                value={formData.kurumCari}
                onChange={handleInputChange}
                placeholder="Kurum adını girin"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="organizasyonAdi" className="block text-sm font-semibold text-gray-700">
                Organizasyon Adı
              </label>
              <input
                type="text"
                id="organizasyonAdi"
                className="input"
                value={formData.organizasyonAdi}
                onChange={handleInputChange}
                placeholder="Organizasyon adını girin"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="otelAdi" className="block text-sm font-semibold text-gray-700">
                Otel Adı
              </label>
              <input
                type="text"
                id="otelAdi"
                className="input"
                value={formData.otelAdi}
                onChange={handleInputChange}
                placeholder="Otel adını girin"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="adiSoyadi" className="block text-sm font-semibold text-gray-700">
                Adı Soyadı
              </label>
              <input
                type="text"
                id="adiSoyadi"
                className="input"
                value={formData.adiSoyadi}
                onChange={handleInputChange}
                placeholder="Kişi adını girin"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="unvani" className="block text-sm font-semibold text-gray-700">
                Unvanı
              </label>
              <input
                type="text"
                id="unvani"
                className="input"
                value={formData.unvani}
                onChange={handleInputChange}
                placeholder="Unvanını girin"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="ulke" className="block text-sm font-semibold text-gray-700">
                Ülke
              </label>
              <input
                type="text"
                id="ulke"
                className="input"
                value={formData.ulke}
                onChange={handleInputChange}
                placeholder="Ülke adını girin"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="sehir" className="block text-sm font-semibold text-gray-700">
                Şehir
              </label>
              <input
                type="text"
                id="sehir"
                className="input"
                value={formData.sehir}
                onChange={handleInputChange}
                placeholder="Şehir adını girin"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="girisTarihi" className="block text-sm font-semibold text-gray-700">
                Giriş Tarihi
              </label>
              <input
                type="date"
                id="girisTarihi"
                className="input"
                value={formData.girisTarihi}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="cikisTarihi" className="block text-sm font-semibold text-gray-700">
                Çıkış Tarihi
              </label>
              <input
                type="date"
                id="cikisTarihi"
                className="input"
                value={formData.cikisTarihi}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="odaTipi" className="block text-sm font-semibold text-gray-700">
                Oda Tipi
              </label>
              <select
                id="odaTipi"
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
              <label htmlFor="gecelikUcret" className="block text-sm font-semibold text-gray-700">
                Gecelik Ücret (₺)
              </label>
              <input 
                type="number" 
                id="gecelikUcret" 
                className="input" 
                value={formData.gecelikUcret} 
                onChange={handleInputChange} 
                step="1"
                min="0"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={handleAddRecord}
              className="btn btn-primary text-lg px-8 py-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Kaydı Ekle
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-end gap-3 mb-6">
          <button
            onClick={handlePuantajRaporu}
            className="btn btn-secondary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
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
            className="btn btn-secondary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Excel&apos;den İçe Aktar
          </button>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            Excel Şablonu İndir
          </button>
        </div>

        {/* Table Section */}
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Konaklama Kayıtları
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Kurum / Cari</th>
                  <th>Organizasyon</th>
                  <th>Otel</th>
                  <th>Adı Soyadı</th>
                  <th>Unvanı</th>
                  <th>Ülke</th>
                  <th>Şehir</th>
                  <th>Giriş</th>
                  <th>Çıkış</th>
                  <th>Oda</th>
                  <th>Gece</th>
                  <th>Gecelik Ücret</th>
                  <th>Toplam Ücret</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="font-medium text-blue-600">{record.id}</td>
                    <td>{record.kurumCari || '-'}</td>
                    <td>{record.organizasyonAdi || '-'}</td>
                    <td>{record.otelAdi || '-'}</td>
                    <td className="font-semibold">{record.adiSoyadi}</td>
                    <td>{record.unvani}</td>
                    <td>{record.ulke}</td>
                    <td>{record.sehir}</td>
                    <td>{formatDate(record.girisTarihi)}</td>
                    <td>{formatDate(record.cikisTarihi)}</td>
                    <td>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {record.odaTipi}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        {record.numberOfNights || 0}
                      </span>
                    </td>
                    <td className="font-medium">{record.gecelikUcret.toLocaleString('tr-TR')} ₺</td>
                    <td className="font-bold text-green-600">{record.toplamUcret.toLocaleString('tr-TR')} ₺</td>
                    <td>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditClick(record.id)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Düzenle"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(record.id)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          title="Sil"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
                  <label htmlFor="edit-gecelikUcret" className="block text-sm font-semibold text-gray-700">
                    Gecelik Ücret (₺)
                  </label>
                  <input 
                    type="number" 
                    id="edit-gecelikUcret" 
                    className="input" 
                    value={formData.gecelikUcret} 
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
                  {/* Kurum/Cari Filtreleme */}
                  <div className="space-y-2 relative">
                    <label htmlFor="puantaj-kurumCari" className="block text-sm font-semibold text-gray-700">
                      Kurum / Cari
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="puantaj-kurumCari"
                        className="input pr-10"
                        value={puantajFilters.kurumCari}
                        onChange={handlePuantajFilterChange}
                        placeholder="Kurum/Cari adına göre filtrele"
                        autoComplete="off"
                      />
                      {puantajFilters.kurumCari && (
                        <button 
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => handleOptionSelect('kurumCari', '')}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {puantajFilters.kurumCari && getFilteredOptions('kurumCari').length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                        {getFilteredOptions('kurumCari').map((option, index) => (
                          <div 
                            key={index} 
                            className="p-3 hover:bg-gray-50 cursor-pointer text-gray-700 text-sm border-b border-gray-100 last:border-b-0"
                            onClick={() => handleOptionSelect('kurumCari', option)}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Organizasyon Adı Filtreleme */}
                  <div className="space-y-2 relative">
                    <label htmlFor="puantaj-organizasyonAdi" className="block text-sm font-semibold text-gray-700">
                      Organizasyon Adı
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="puantaj-organizasyonAdi"
                        className="input pr-10"
                        value={puantajFilters.organizasyonAdi}
                        onChange={handlePuantajFilterChange}
                        placeholder="Organizasyon adına göre filtrele"
                        autoComplete="off"
                      />
                      {puantajFilters.organizasyonAdi && (
                        <button 
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => handleOptionSelect('organizasyonAdi', '')}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {puantajFilters.organizasyonAdi && getFilteredOptions('organizasyonAdi').length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                        {getFilteredOptions('organizasyonAdi').map((option, index) => (
                          <div 
                            key={index} 
                            className="p-3 hover:bg-gray-50 cursor-pointer text-gray-700 text-sm border-b border-gray-100 last:border-b-0"
                            onClick={() => handleOptionSelect('organizasyonAdi', option)}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Ünvan Filtreleme */}
                  <div className="space-y-2 relative">
                    <label htmlFor="puantaj-unvani" className="block text-sm font-semibold text-gray-700">
                      Ünvan
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="puantaj-unvani"
                        className="input pr-10"
                        value={puantajFilters.unvani}
                        onChange={handlePuantajFilterChange}
                        placeholder="Ünvana göre filtrele"
                        autoComplete="off"
                      />
                      {puantajFilters.unvani && (
                        <button 
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => handleOptionSelect('unvani', '')}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {puantajFilters.unvani && getFilteredOptions('unvani').length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                        {getFilteredOptions('unvani').map((option, index) => (
                          <div 
                            key={index} 
                            className="p-3 hover:bg-gray-50 cursor-pointer text-gray-700 text-sm border-b border-gray-100 last:border-b-0"
                            onClick={() => handleOptionSelect('unvani', option)}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setPuantajFilters({
                      kurumCari: '',
                      organizasyonAdi: '',
                      unvani: '',
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
    </div>
  );
}
