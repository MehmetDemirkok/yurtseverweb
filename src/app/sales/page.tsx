"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "../components/AuthGuard";
import * as XLSX from 'xlsx';
import PageHeader from "../components/PageHeader";
import BulkActionsMenu from "../components/BulkActionsMenu";

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
    kurumCari?: string;
  };
  kurumCari?: string;
}

export default function SalesPage() {
  return (
    <AuthGuard>
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
    { key: 'kurumCari', label: 'Kurum' },
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
    
    try {
      const response = await fetch(`/api/sales`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedSale.id, fiyat: editPrice, status: editStatus }),
    });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Güncelleme başarısız');
      }
      
      const updatedSale = await response.json();
      setSales(sales => sales.map(s => s.id === selectedSale.id ? updatedSale : s));
    setEditModalOpen(false);
    setSelectedSale(null);
      
      // Durum değişikliği bilgilendirmesi
      if (selectedSale.status !== editStatus) {
        if (editStatus === 'FATURALANDI') {
          alert('✅ Satış durumu "Faturalandı" olarak güncellendi ve finans kaydına otomatik olarak eklendi.');
        } else {
          alert(`✅ Satış durumu "${editStatus}" olarak güncellendi.`);
        }
      } else {
        alert('✅ Satış bilgileri başarıyla güncellendi.');
      }
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      alert(`❌ Güncelleme başarısız: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
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
    if (selectedColumns.length === 0) {
      alert('En az bir sütun seçmelisiniz!');
      return;
    }
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
        else if (key === 'kurumCari') row.push(sale.accommodation?.kurumCari || sale.kurumCari || '-');
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
        <BulkActionsMenu
          selectedCount={selectedIds.length}
          onBulkDelete={() => setShowBulkDeleteModal(true)}
          onBulkExport={handleExportExcel}
          onBulkStatusChange={async (status) => {
            if (selectedIds.length === 0) return;
            try {
              const res = await fetch('/api/sales', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds, status }),
              });
              if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Toplu durum güncellenemedi');
              }
              // Başarıyla güncellendiğinde local state'i güncelle
              setSales(sales => sales.map(s => selectedIds.includes(s.id) ? { ...s, status } : s));
              alert('Seçili kayıtların durumu başarıyla güncellendi.');
            } catch (err) {
              alert('Toplu durum güncelleme hatası: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
            }
          }}
          availableStatuses={[
            { value: 'AKTARILDI', label: 'Aktarıldı' },
            { value: 'FATURALANDI', label: 'Faturalandı' },
            { value: 'IPTAL', label: 'İptal' }
          ]}
          customActions={[]}
        />
      </div>
      {/* Satış Tablosu */}
      <div className="table-container overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="table table-responsive text-xs w-full border-collapse">
          <thead>
            <tr className="text-[10px] bg-gray-50">
              <th className="w-8 py-2">
                  <input
                    type="checkbox"
                  className="checkbox checkbox-xs"
                    checked={filteredSales.length > 0 && selectedIds.length === filteredSales.length}
                    onChange={e => {
                      if (e.target.checked) setSelectedIds(filteredSales.map(s => s.id));
                      else setSelectedIds([]);
                    }}
                  />
                </th>
              {selectedColumns.includes('id') && <th className="w-10 py-2">ID</th>}
              {selectedColumns.includes('kurumCari') && <th className="w-20 py-2">Kurum</th>}
              {selectedColumns.includes('organizasyonAdi') && <th className="w-20 py-2">Organizasyon</th>}
              {selectedColumns.includes('adiSoyadi') && <th className="w-24 py-2">Adı Soyadı</th>}
              {selectedColumns.includes('unvani') && <th className="w-16 py-2 hidden md:table-cell">Unvanı</th>}
              {selectedColumns.includes('girisTarihi') && <th className="w-16 py-2">Giriş Tarihi</th>}
              {selectedColumns.includes('cikisTarihi') && <th className="w-16 py-2">Çıkış Tarihi</th>}
              {selectedColumns.includes('odaTipi') && <th className="w-14 py-2">Oda Tipi</th>}
              {selectedColumns.includes('numberOfNights') && <th className="w-12 py-2">Gece</th>}
              {selectedColumns.includes('fiyat') && <th className="w-16 py-2 hidden md:table-cell">Satış Fiyatı</th>}
              {selectedColumns.includes('toplamSatis') && <th className="w-20 py-2 hidden sm:table-cell">Toplam Satış</th>}
              {selectedColumns.includes('status') && <th className="w-20 py-2">Durum</th>}
              {selectedColumns.includes('createdAt') && <th className="w-16 py-2 hidden lg:table-cell">Kayıt Tarihi</th>}
              <th className="w-14 py-2">İşlem</th>
              </tr>
            </thead>
            <tbody>
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={selectedColumns.length + 2} className="p-4 text-center text-gray-500">Kayıt yok.</td>
              </tr>
            ) : (
              filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 text-[11px]">
                  <td className="py-1.5">
                      <input
                        type="checkbox"
                      className="checkbox checkbox-xs"
                        checked={selectedIds.includes(sale.id)}
                        onChange={e => {
                          if (e.target.checked) setSelectedIds(ids => [...ids, sale.id]);
                          else setSelectedIds(ids => ids.filter(id => id !== sale.id));
                        }}
                      />
                    </td>
                  {selectedColumns.includes('id') && <td className="font-medium text-blue-600 whitespace-nowrap py-1.5">{sale.id}</td>}
                  {selectedColumns.includes('kurumCari') && (
                    <td className="truncate py-1.5">{sale.accommodation?.kurumCari || sale.kurumCari || '-'}</td>
                  )}
                  {selectedColumns.includes('organizasyonAdi') && <td className="truncate py-1.5">{sale.organizasyonAdi}</td>}
                  {selectedColumns.includes('adiSoyadi') && (
                    <td className="truncate py-1.5">
                      <div className="flex flex-col">
                        <span className="font-medium leading-tight">{sale.accommodation?.adiSoyadi || '-'}</span>
                      </div>
                    </td>
                  )}
                  {selectedColumns.includes('unvani') && (
                    <td className="truncate hidden md:table-cell py-1.5">
                      <span className="text-[9px] leading-tight">{sale.accommodation?.unvani || '-'}</span>
                    </td>
                  )}
                  {selectedColumns.includes('girisTarihi') && <td className="whitespace-nowrap py-1.5 text-[10px]">{formatDate(sale.accommodation?.girisTarihi)}</td>}
                  {selectedColumns.includes('cikisTarihi') && <td className="whitespace-nowrap py-1.5 text-[10px]">{formatDate(sale.accommodation?.cikisTarihi)}</td>}
                  {selectedColumns.includes('odaTipi') && (
                    <td className="text-center py-1.5">
                      <span className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-[9px] font-medium inline-block">
                        {sale.accommodation?.odaTipi || '-'}
                      </span>
                    </td>
                  )}
                  {selectedColumns.includes('numberOfNights') && <td className="text-center whitespace-nowrap py-1.5">{sale.accommodation?.numberOfNights ?? '-'}</td>}
                  {selectedColumns.includes('fiyat') && <td className="font-medium text-gray-600 hidden md:table-cell whitespace-nowrap text-right py-1.5">{sale.fiyat.toLocaleString('tr-TR')} ₺</td>}
                  {selectedColumns.includes('toplamSatis') && <td className="font-bold text-green-600 hidden sm:table-cell whitespace-nowrap text-right py-1.5">{(sale.fiyat * (sale.accommodation?.numberOfNights ?? 0)).toLocaleString('tr-TR')} ₺</td>}
                  {selectedColumns.includes('status') && (
                    <td className="text-center py-1.5">
                      <span className={`px-1 py-0.5 rounded text-[9px] font-bold inline-block ${statusColor(sale.status)}`}>{sale.status}</span>
                    </td>
                  )}
                  {selectedColumns.includes('createdAt') && <td className="whitespace-nowrap py-1.5 text-[10px] hidden lg:table-cell">{formatDate(sale.createdAt)}</td>}
                  <td className="py-1.5">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={e => { e.stopPropagation(); handleEditModalOpen(sale); }}
                        className="p-0.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        title="Düzenle"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteModalOpen(sale); }}
                        className="p-0.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                        title="Sil"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      </div>
                    </td>
                  </tr>
              ))
            )}
            </tbody>
          </table>
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