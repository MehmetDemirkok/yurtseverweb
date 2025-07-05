"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "../components/AuthGuard";
import * as XLSX from 'xlsx';
import PageHeader from "../components/PageHeader";

interface Sale {
  id: number;
  user?: { id: number; name?: string; email: string };
  userId?: number;
  organizasyonAdi: string;
  fiyat: number;
  createdAt: string;
  status: string;
  accommodation?: {
    adiSoyadi: string;
    unvani: string;
    girisTarihi: string;
    cikisTarihi: string;
    numberOfNights?: number;
    organizasyonAdi?: string;
    odaTipi?: string;
    toplamUcret?: number;
    gecelikUcret?: number;
  };
}

export default function SalesPage() {
  return (
    <AuthGuard requiredPermissions={["sales"]}>
      <SalesPageContent />
    </AuthGuard>
  );
}

function SalesPageContent() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filterOrg, setFilterOrg] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [editPrice, setEditPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailSale, setDetailSale] = useState<Sale | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showExportFilterModal, setShowExportFilterModal] = useState(false);
  const availableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'organizasyonAdi', label: 'Organizasyon' },
    { key: 'adiSoyadi', label: 'Adı Soyadı' },
    { key: 'unvani', label: 'Unvanı' },
    { key: 'girisTarihi', label: 'Giriş Tarihi' },
    { key: 'cikisTarihi', label: 'Çıkış Tarihi' },
    { key: 'odaTipi', label: 'Oda Tipi' },
    { key: 'numberOfNights', label: 'Gece' },
    { key: 'fiyat', label: 'Satış Fiyatı' },
    { key: 'toplamSatis', label: 'Toplam Satış' },
    { key: 'status', label: 'Durum' },
    { key: 'createdAt', label: 'Kayıt Tarihi' },
  ];
  const [selectedColumns, setSelectedColumns] = useState(availableColumns.map(col => col.key));

  useEffect(() => {
    setLoading(true);
    fetch("/api/sales")
      .then((res) => res.json())
      .then((data) => {
        setSales(data);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setError("Satışlar yüklenemedi.");
        setLoading(false);
      });
  }, []);

  // Filtrelenmiş satışlar
  const filteredSales = sales.filter((sale) => {
    const orgMatch = filterOrg ? sale.organizasyonAdi.toLowerCase().includes(filterOrg.toLowerCase()) : true;
    const userMatch = filterUser ? (sale.user?.name?.toLowerCase().includes(filterUser.toLowerCase()) || sale.user?.email.toLowerCase().includes(filterUser.toLowerCase())) : true;
    return orgMatch && userMatch;
  });

  // İstatistikler
  const totalSales = filteredSales.reduce((sum, s) => sum + (s.fiyat * (s.accommodation?.numberOfNights ?? 1)), 0);
  const avgPerPerson = filteredSales.length > 0 ? totalSales / filteredSales.length : 0;
  const orgStats = Array.from(new Set(filteredSales.map(s => s.organizasyonAdi))).map(org => ({
    org,
    total: filteredSales
      .filter(s => s.organizasyonAdi === org)
      .reduce((sum, s) => sum + (s.fiyat * (s.accommodation?.numberOfNights ?? 1)), 0),
    count: filteredSales.filter(s => s.organizasyonAdi === org).length
  }));

  // Durum renkleri
  const statusColor = (status: string) => {
    switch (status) {
      case "AKTARILDI": return "bg-blue-100 text-blue-700";
      case "FATURALANDI": return "bg-green-100 text-green-700";
      case "IPTAL": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // Tarih formatı
  const formatDate = (date?: string) => {
    if (!date) return '-';
    const d = new Date(date);
    const gun = String(d.getDate()).padStart(2, '0');
    const ay = String(d.getMonth() + 1).padStart(2, '0');
    const yil = d.getFullYear();
    return `${gun}.${ay}.${yil}`;
  };

  const handleEditModalOpen = (sale: Sale) => {
    setSelectedSale(sale);
    setEditPrice(sale.fiyat);
    setEditStatus(sale.status);
    setEditModalOpen(true);
  };
  const handleEditModalSave = async () => {
    if (!selectedSale) return;
    await fetch(`/api/sales`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedSale.id, fiyat: editPrice, status: editStatus }),
    });
    setSales(sales => sales.map(s => s.id === selectedSale.id ? { ...s, fiyat: editPrice, status: editStatus } : s));
    setEditModalOpen(false);
    setSelectedSale(null);
  };
  const handleDeleteModalOpen = (sale: Sale) => {
    setSelectedSale(sale);
    setDeleteModalOpen(true);
  };
  const [returnToAccommodation, setReturnToAccommodation] = useState(true);

  const handleDeleteSale = async () => {
    if (!selectedSale) return;
    await fetch(`/api/sales`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedSale.id, returnToAccommodation }),
    });
    setSales(sales => sales.filter(s => s.id !== selectedSale.id));
    setDeleteModalOpen(false);
    setSelectedSale(null);
    setReturnToAccommodation(true); // Reset to default for next time
  };

  // Excel'e Aktar butonu
  const handleExportExcel = () => {
    setSelectedColumns(availableColumns.map(col => col.key));
    setShowExportFilterModal(true);
  };
  const closeExportFilterModal = () => setShowExportFilterModal(false);
  const handleColumnToggle = (columnKey: string) => {
    setSelectedColumns(prev => prev.includes(columnKey)
      ? prev.filter(key => key !== columnKey)
      : [...prev, columnKey]);
  };
  const handleExportFilteredExcel = () => {
    const headers = availableColumns.filter(col => selectedColumns.includes(col.key)).map(col => col.label);
    const data = filteredSales.map(sale => {
      const row: (string | number)[] = [];
      selectedColumns.forEach((key: string) => {
        if (key === 'adiSoyadi') row.push(sale.accommodation?.adiSoyadi || '-');
        else if (key === 'unvani') row.push(sale.accommodation?.unvani || '-');
        else if (key === 'girisTarihi') row.push(sale.accommodation?.girisTarihi || '-');
        else if (key === 'cikisTarihi') row.push(sale.accommodation?.cikisTarihi || '-');
        else if (key === 'odaTipi') row.push(sale.accommodation?.odaTipi || '-');
        else if (key === 'numberOfNights') row.push(sale.accommodation?.numberOfNights ?? '-');
        else if (key === 'toplamSatis') row.push((sale.fiyat * (sale.accommodation?.numberOfNights ?? 0)).toLocaleString('tr-TR'));
        else if (key === 'fiyat') row.push(sale.fiyat.toLocaleString('tr-TR'));
        else if (key === 'status') row.push(sale.status);
        else if (key === 'createdAt') row.push(formatDate(sale.createdAt));
        else if (key === 'organizasyonAdi') row.push(sale.organizasyonAdi);
        else if (key === 'id') row.push(sale.id);
        else row.push('-');
      });
      return row;
    });
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Satışlar');
    XLSX.writeFile(wb, 'satislar.xlsx');
    setShowExportFilterModal(false);
  };
  // Excel Şablonu İndir
  const handleDownloadExcelTemplate = () => {
    const headers = [
      'Organizasyon', 'Adı Soyadı', 'Unvanı', 'Giriş Tarihi', 'Çıkış Tarihi', 'Oda Tipi', 'Gece', 'Satış Fiyatı', 'Durum'
    ];
    const exampleData = [
      ['Yıllık Toplantı', 'Ahmet Yılmaz', 'Genel Müdür', '2024-07-01', '2024-07-05', 'Double Oda', 4, 2500, 'AKTARILDI'],
      ['Eğitim Semineri', 'Ayşe Kaya', 'Eğitim Uzmanı', '2024-07-10', '2024-07-15', 'Single Oda', 5, 1800, 'FATURALANDI']
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Satış Şablonu');
    XLSX.writeFile(wb, 'satis_sablonu.xlsx');
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
          const headers = json[0];
          // Satış için uygun alanlar: ID, Adı Soyadı, Unvanı, Oda Tipi, Gece, Satış Fiyatı (₺/Gece), Alış Fiyatı (₺/Gece), Durum, Organizasyon, Giriş Tarihi, Çıkış Tarihi
          const newSales = json.slice(1).map((row: (string | number | null)[], idx: number) => {
            const getColumnValue = (headerName: string): string => {
              const headerIndex = (headers as string[]).indexOf(headerName);
              return headerIndex > -1 ? String(row[headerIndex] || '') : '';
            };
            const nights = Number(getColumnValue('Gece')) || 0;
            const fiyat = Number(getColumnValue('Satış Fiyatı (₺/Gece)')) || 0;
            return {
              id: Date.now() + idx,
              createdAt: new Date().toISOString(),
              fiyat,
              status: getColumnValue('Durum') || 'AKTARILDI',
              organizasyonAdi: getColumnValue('Organizasyon'),
              accommodation: {
                adiSoyadi: getColumnValue('Adı Soyadı'),
                unvani: getColumnValue('Unvanı'),
                odaTipi: getColumnValue('Oda Tipi'),
                numberOfNights: nights,
                gecelikUcret: Number(getColumnValue('Alış Fiyatı (₺/Gece)')) || 0,
                girisTarihi: getColumnValue('Giriş Tarihi'),
                cikisTarihi: getColumnValue('Çıkış Tarihi'),
                organizasyonAdi: getColumnValue('Organizasyon'),
              }
            };
          });
          // API'ye gönder (örnek: /api/sales, gerçek uygulamada accommodationId eşlemesi gerekir)
          // Burada sadece frontend state'e ekliyoruz
          setSales(prev => [...prev, ...newSales]);
          alert(`Başarıyla ${newSales.length} satış kaydı içe aktarıldı (demo). Gerçek uygulamada backend ile entegre edilmelidir!`);
        } catch (e) {
          console.error(e);
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

  // Puantaj Raporu fonksiyonu (konaklama sayfasındaki gibi)
  const handlePuantajRaporu = () => {
    if (filteredSales.length === 0) {
      alert('Rapor için kayıt yok!');
      return;
    }
    // Tüm satışlar için en erken giriş ve en geç çıkış tarihlerini bul
    const allDates = filteredSales.flatMap(sale => {
      const giris = sale.accommodation?.girisTarihi;
      const cikis = sale.accommodation?.cikisTarihi;
      if (!giris || !cikis) return [];
      return [new Date(giris), new Date(cikis)];
    });
    if (allDates.length === 0) {
      alert('Tarih bilgisi eksik!');
      return;
    }
    // Tüm günleri diziye ekle (giriş ve çıkış arası)
    const allDaysSet = new Set<string>();
    filteredSales.forEach(sale => {
      const giris = sale.accommodation?.girisTarihi;
      const cikis = sale.accommodation?.cikisTarihi;
      if (!giris || !cikis) return;
      const start = new Date(giris);
      const end = new Date(cikis);
      const current = new Date(start);
      while (current < end) { // çıkış günü hariç!
        allDaysSet.add(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    });
    const allDays = Array.from(allDaysSet).sort();
    // Başlıklar
    const headers = [
      'ID', 'Adı Soyadı', 'Unvanı', 'Oda Tipi', 'Organizasyon', 'Giriş Tarihi', 'Çıkış Tarihi', 'Gece', 'Satış Fiyatı (₺/Gece)', 'Toplam Satış (₺)', ...allDays.map(date => {
        const [y, m, d] = date.split('-');
        return `${d}.${m}.${y}`;
      })
    ];
    // Satışlar için satırları oluştur
    const data = filteredSales.map(sale => {
      const nights = sale.accommodation?.numberOfNights ?? 0;
      const satisGecelik = sale.fiyat;
      const toplamSatis = satisGecelik * nights;
      const giris = sale.accommodation?.girisTarihi;
      const cikis = sale.accommodation?.cikisTarihi;
      const start = giris ? new Date(giris) : null;
      const end = cikis ? new Date(cikis) : null;
      const row: (string | number)[] = [
        sale.id,
        sale.accommodation?.adiSoyadi || '-',
        sale.accommodation?.unvani || '-',
        sale.accommodation?.odaTipi || '-',
        sale.accommodation?.organizasyonAdi || sale.organizasyonAdi,
        giris ? formatDate(giris) : '-',
        cikis ? formatDate(cikis) : '-',
        nights,
        satisGecelik,
        toplamSatis
      ];
      // Gün gün işaretleme
      allDays.forEach(dateStr => {
        if (start && end) {
          const check = new Date(dateStr);
          if (check >= start && check < end) {
            row.push('X');
          } else {
            row.push('');
          }
        } else {
          row.push('');
        }
      });
      return row;
    });
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Satış Puantaj Raporu');
    XLSX.writeFile(wb, 'satis_puantaj_raporu.xlsx');
  };

  const handleBulkDelete = async () => {
    try {
      await fetch('/api/sales', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, returnToAccommodation }),
      });
      setSales(sales => sales.filter(s => !selectedIds.includes(s.id)));
      setSelectedIds([]);
      setShowBulkDeleteModal(false);
      setReturnToAccommodation(true); // Reset to default for next time
    } catch (e) {
      console.error(e);
      alert('Toplu silme başarısız oldu!');
    }
  };

  return (
    <div className="w-full mx-auto px-4 py-8 animate-fade-in">
      <PageHeader
        title="Satışlar"
        description="Tüm satış işlemlerini ve raporlarını görüntüleyin"
        icon={<svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17v-2a4 4 0 014-4h10a4 4 0 014 4v2M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /></svg>}
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 flex items-center gap-2 drop-shadow">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17v-2a4 4 0 014-4h10a4 4 0 014 4v2M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /></svg>
            Satışlar
          </h1>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition w-full sm:w-auto"
            onClick={() => router.push("/")}
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 flex items-center gap-4 bg-gradient-to-r from-blue-100 to-blue-50 border border-blue-200">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-200">
            <svg className="w-7 h-7 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
          </div>
          <div>
            <div className="text-gray-500">Toplam Satış</div>
            <div className="text-2xl font-bold text-blue-700">{totalSales.toLocaleString('tr-TR')} ₺</div>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4 bg-gradient-to-r from-green-100 to-green-50 border border-green-200">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-200">
            <svg className="w-7 h-7 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <div>
            <div className="text-gray-500">Kişi Başı Ortalama</div>
            <div className="text-2xl font-bold text-green-700">{avgPerPerson.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4 bg-gradient-to-r from-purple-100 to-purple-50 border border-purple-200">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-200">
            <svg className="w-7 h-7 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <div className="text-gray-500">Satış Sayısı</div>
            <div className="text-2xl font-bold text-purple-700">{filteredSales.length}</div>
          </div>
        </div>
      </div>
      {/* Organizasyon Bazında Kartlar */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2 text-blue-900">Organizasyon Bazında</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orgStats.length === 0 && <div className="text-gray-400 italic">Kayıt yok.</div>}
          {orgStats.map(stat => (
            <div key={stat.org} className="bg-white p-4 rounded shadow flex justify-between items-center border-l-4 border-blue-400">
              <div>
                <div className="font-bold text-blue-800">{stat.org}</div>
                <div className="text-gray-500 text-sm">{stat.count} satış</div>
              </div>
              <div className="text-lg font-bold">{stat.total.toLocaleString('tr-TR')} ₺</div>
            </div>
          ))}
        </div>
      </div>
      {/* Arama Inputları - Tablo üstü */}
      <div className="flex flex-wrap justify-start items-center gap-3 mb-4 bg-white/80 p-3 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mr-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="font-medium text-gray-700">Filtrele:</span>
        </div>
        <input
          type="text"
          className="input w-full sm:w-auto sm:min-w-[180px]"
          placeholder="Organizasyon ara..."
          value={filterOrg}
          onChange={e => setFilterOrg(e.target.value)}
        />
        <input
          type="text"
          className="input w-full sm:w-auto sm:min-w-[180px]"
          placeholder="Kişi veya email ara..."
          value={filterUser}
          onChange={e => setFilterUser(e.target.value)}
        />
      </div>
      
      {/* Butonlar - Tablo üstü */}
      <div className="flex flex-wrap justify-center md:justify-end items-center gap-3 mb-8">
        {selectedIds.length > 0 && (
          <>
            <button className="btn btn-danger bg-red-600 hover:bg-red-700 text-white" onClick={() => setShowBulkDeleteModal(true)}>Toplu Sil</button>
          </>
        )}
        <input type="file" id="excelImportInputSales" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleImportExcel} className="hidden" />
        <button onClick={() => document.getElementById('excelImportInputSales')?.click()} className="btn btn-secondary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Excel&#39;den İçe Aktar
        </button>
        <button onClick={handleExportExcel} className="btn btn-success">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" transform="rotate(180 12 12)" />
          </svg>
          Excel&#39;e Aktar
        </button>
        <button onClick={handleDownloadExcelTemplate} className="btn btn-warning">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Excel Şablonu İndir
        </button>
        <button onClick={handlePuantajRaporu} className="btn btn-secondary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Puantaj Raporu
        </button>
      </div>
      {/* Tablo ve Yükleniyor/Boş Mesajı */}
      <div className="w-full rounded-lg shadow bg-white overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-blue-600 animate-pulse">Yükleniyor...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : filteredSales.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Kayıt bulunamadı.</div>
        ) : (
          <table className="table w-full table-fixed text-xs">
            <thead className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-900">
              <tr>
                <th className="p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 w-10">
                  <input
                    type="checkbox"
                    checked={filteredSales.length > 0 && selectedIds.length === filteredSales.length}
                    onChange={e => {
                      if (e.target.checked) setSelectedIds(filteredSales.map(s => s.id));
                      else setSelectedIds([]);
                    }}
                  />
                </th>
                <th className="p-2 font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 w-12">ID</th>
                <th className="p-2 font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 w-28">Adı Soyadı</th>
                <th className="p-2 font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 hidden md:table-cell w-24">Unvanı</th>
                <th className="p-2 font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 w-28">Organizasyon</th>
                <th className="p-2 font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 hidden sm:table-cell w-24">Giriş Tarihi</th>
                <th className="p-2 font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 hidden sm:table-cell w-24">Çıkış Tarihi</th>
                <th className="p-2 font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 w-14">Gece</th>
                <th className="p-2 font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 hidden md:table-cell w-24">Oda Tipi</th>
                <th className="p-2 font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 hidden lg:table-cell w-20">Alış Fiyatı</th>
                <th className="p-2 font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 hidden lg:table-cell w-20">Toplam Alış</th>
                <th className="p-2 font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 w-20">Satış Fiyatı</th>
                <th className="p-2 font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 w-20">Toplam Satış</th>
                <th className="p-2 font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 w-20">Durum</th>
                <th className="p-2 font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 w-28">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale, idx) => {
                const nights = sale.accommodation?.numberOfNights ?? 0;
                const alisGecelik = sale.accommodation?.gecelikUcret ?? 0;
                const toplamAlis = alisGecelik * nights;
                const satisGecelik = sale.fiyat;
                const toplamSatis = satisGecelik * nights;
                return (
                  <tr key={sale.id} className={`border-b ${idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'} hover:bg-blue-50 dark:hover:bg-gray-700 transition cursor-pointer`} style={{height: '44px'}}>
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(sale.id)}
                        onChange={e => {
                          if (e.target.checked) setSelectedIds(ids => [...ids, sale.id]);
                          else setSelectedIds(ids => ids.filter(id => id !== sale.id));
                        }}
                      />
                    </td>
                    <td className="p-2 text-gray-700 dark:text-gray-200 font-semibold text-left whitespace-nowrap">{sale.id}</td>
                    <td className="p-2 text-gray-900 dark:text-gray-100 font-bold text-left truncate">{sale.accommodation?.adiSoyadi || '-'}</td>
                    <td className="p-2 text-gray-700 dark:text-gray-300 hidden md:table-cell text-left truncate">{sale.accommodation?.unvani || '-'}</td>
                    <td className="p-2 text-blue-700 dark:text-blue-300 font-semibold text-left truncate">{sale.accommodation?.organizasyonAdi || sale.organizasyonAdi}</td>
                    <td className="p-2 text-gray-600 dark:text-gray-400 hidden sm:table-cell text-center whitespace-nowrap">{formatDate(sale.accommodation?.girisTarihi)}</td>
                    <td className="p-2 text-gray-600 dark:text-gray-400 hidden sm:table-cell text-center whitespace-nowrap">{formatDate(sale.accommodation?.cikisTarihi)}</td>
                    <td className="p-2 text-purple-700 dark:text-purple-300 font-bold text-center whitespace-nowrap">{nights || '-'}</td>
                    <td className="p-2 text-gray-700 dark:text-gray-300 hidden md:table-cell text-left truncate">{sale.accommodation?.odaTipi || '-'}</td>
                    <td className="p-2 text-blue-700 dark:text-blue-300 hidden lg:table-cell text-right whitespace-nowrap">{alisGecelik ? alisGecelik.toLocaleString('tr-TR') : '-'}</td>
                    <td className="p-2 text-blue-800 dark:text-blue-200 font-bold hidden lg:table-cell text-right whitespace-nowrap">{toplamAlis ? toplamAlis.toLocaleString('tr-TR') : '-'}</td>
                    <td className="p-2 text-green-700 dark:text-green-300 text-right whitespace-nowrap">{satisGecelik ? satisGecelik.toLocaleString('tr-TR') : '-'}</td>
                    <td className="p-2 text-green-800 dark:text-green-200 font-bold text-right whitespace-nowrap">{toplamSatis ? toplamSatis.toLocaleString('tr-TR') : '-'}</td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColor(sale.status)}`}>{sale.status}</span>
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex flex-wrap justify-center gap-1">
                        <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); handleEditModalOpen(sale); }}>Düzenle</button>
                        <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); handleDeleteModalOpen(sale); }}>Sil</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {/* Detay Modalı */}
      {detailSale && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg p-8 shadow-xl w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setDetailSale(null)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-xl font-bold mb-4 text-blue-800 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17v-2a4 4 0 014-4h10a4 4 0 014 4v2" /></svg>
              Satış Detayı
            </h2>
            <div className="space-y-2">
              <div><span className="font-semibold">Adı Soyadı:</span> {detailSale.accommodation?.adiSoyadi || '-'}</div>
              <div><span className="font-semibold">Unvanı:</span> {detailSale.accommodation?.unvani || '-'}</div>
              <div><span className="font-semibold">Organizasyon:</span> {detailSale.accommodation?.organizasyonAdi || detailSale.organizasyonAdi}</div>
              <div><span className="font-semibold">Giriş Tarihi:</span> {formatDate(detailSale.accommodation?.girisTarihi)}</div>
              <div><span className="font-semibold">Çıkış Tarihi:</span> {formatDate(detailSale.accommodation?.cikisTarihi)}</div>
              <div><span className="font-semibold">Gece:</span> {detailSale.accommodation?.numberOfNights ?? '-'}</div>
              <div><span className="font-semibold">Fiyat:</span> {detailSale.fiyat.toLocaleString('tr-TR')} ₺</div>
              <div><span className="font-semibold">Tarih:</span> {formatDate(detailSale.createdAt)}</div>
              <div><span className="font-semibold">Durum:</span> <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColor(detailSale.status)}`}>{detailSale.status}</span></div>
              <div><span className="font-semibold">Satış ID:</span> {detailSale.id}</div>
            </div>
          </div>
        </div>
      )}
      {/* Düzenleme Modalı */}
      {editModalOpen && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setEditModalOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 relative animate-fade-in border border-blue-100">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              aria-label="Kapat"
            >×</button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Satış Kaydını Düzenle</h2>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-100 font-semibold mb-1">Satış Fiyatı (₺/Gece)</label>
              <input type="number" className="input w-full" value={editPrice} min={0} onChange={e => setEditPrice(Number(e.target.value))} />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-100 font-semibold mb-1">Toplam Satış Fiyatı</label>
              <input type="text" className="input w-full bg-gray-100" value={((editPrice || 0) * (selectedSale.accommodation?.numberOfNights || 0)).toLocaleString('tr-TR')} disabled />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-100 font-semibold mb-1">Durum</label>
              <select className="input w-full" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                <option value="AKTARILDI">Aktarıldı</option>
                <option value="FATURALANDI">Faturalandı</option>
                <option value="IPTAL">İptal</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn btn-secondary" onClick={() => setEditModalOpen(false)}>İptal</button>
              <button className="btn btn-success" onClick={handleEditModalSave}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
      {/* Silme Modalı */}
      {deleteModalOpen && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setDeleteModalOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 relative animate-fade-in border border-red-100">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              aria-label="Kapat"
            >×</button>
            <h2 className="text-2xl font-bold text-red-700 mb-6">Satış Kaydını Sil</h2>
            <p className="mb-4 text-gray-700">Bu satış kaydını silmek istediğinize emin misiniz?<br/><span className="font-semibold">{selectedSale.accommodation?.adiSoyadi}</span> ({selectedSale.fiyat.toLocaleString('tr-TR')} ₺)</p>
            
            <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="returnToAccommodation"
                  checked={returnToAccommodation}
                  onChange={(e) => setReturnToAccommodation(e.target.checked)}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="returnToAccommodation" className="ml-2 text-blue-800 font-medium">
                  Konaklama kayıtlarına geri döndür
                </label>
              </div>
              <p className="text-sm text-blue-700 ml-7">
                Bu seçenek işaretlendiğinde, silinen satış kaydı otomatik olarak konaklama kayıtları tablosuna geri eklenecektir.
              </p>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn btn-secondary" onClick={() => setDeleteModalOpen(false)}>Vazgeç</button>
              <button className="btn btn-danger" onClick={handleDeleteSale}>Evet, Sil</button>
              {returnToAccommodation && (
                <button className="btn btn-primary" onClick={handleDeleteSale}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Konaklama Kaydına Aktar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Toplu Silme Modalı */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setShowBulkDeleteModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 relative animate-fade-in border border-red-100">
            <button
              onClick={() => setShowBulkDeleteModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              aria-label="Kapat"
            >×</button>
            <h2 className="text-2xl font-bold text-red-700 mb-6">Toplu Silme Onayı</h2>
            <p className="mb-4 text-gray-700">Seçili <span className="font-bold">{selectedIds.length}</span> kaydı silmek istediğinize emin misiniz?</p>
            
            <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="returnToAccommodationBulk"
                  checked={returnToAccommodation}
                  onChange={(e) => setReturnToAccommodation(e.target.checked)}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="returnToAccommodationBulk" className="ml-2 text-blue-800 font-medium">
                  Konaklama kayıtlarına geri döndür
                </label>
              </div>
              <p className="text-sm text-blue-700 ml-7">
                Bu seçenek işaretlendiğinde, silinen satış kayıtları otomatik olarak konaklama kayıtları tablosuna geri eklenecektir.
              </p>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn btn-secondary" onClick={() => setShowBulkDeleteModal(false)}>Vazgeç</button>
              <button className="btn btn-danger bg-red-600 hover:bg-red-700 text-white font-bold" onClick={handleBulkDelete}>Evet, Sil</button>
              {returnToAccommodation && (
                <button className="btn btn-primary" onClick={handleBulkDelete}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Konaklama Kaydına Aktar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {showExportFilterModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" transform="rotate(180 12 12)" />
                </svg>
                Excel&#39;e Aktar - Sütun Seçimi
              </h2>
              <button onClick={closeExportFilterModal} className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
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
                    checked={selectedColumns.includes(column.key)}
                    onChange={() => handleColumnToggle(column.key)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`col-${column.key}`} className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                    {column.label}
                  </label>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={closeExportFilterModal} className="btn btn-secondary">İptal</button>
              <button onClick={handleExportFilteredExcel} className="btn btn-success">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" transform="rotate(180 12 12)" />
                </svg>
                Aktar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}