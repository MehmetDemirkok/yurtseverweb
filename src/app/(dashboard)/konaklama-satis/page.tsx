'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SalesFolderTree from '@/app/components/SalesFolderTree';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  AlertCircle,
  Edit,
  Trash2,
  FileInput,
  FileOutput,
  Plus,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AccommodationSale {
  id: number;
  accommodationId: number;
  adiSoyadi: string;
  unvani: string;
  ulke: string;
  sehir: string;
  girisTarihi: string;
  cikisTarihi: string;
  odaTipi: string;
  konaklamaTipi: string;
  otelAdi?: string;
  alisFiyati: number;
  toplamAlisFiyati: number;
  satisFiyati: number;
  toplamSatisFiyati: number;
  kar: number;
  karOrani: number;
  musteriAdi?: string;
  musteriCariKodu?: string;
  faturaDurumu: 'BEKLIYOR' | 'KESILDI' | 'IPTAL';
  odemeDurumu: 'ODENMEDI' | 'KISMI_ODENDI' | 'ODENDI';
  notlar?: string;
  odenenTutar: number;
  kalanTutar: number;
  createdAt: string;
}

export default function AccommodationSalesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [sales, setSales] = useState<AccommodationSale[]>([]);
  const [filteredSales, setFilteredSales] = useState<AccommodationSale[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('root');
  const [showFolders, setShowFolders] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSale, setEditingSale] = useState<AccommodationSale | null>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalProfit: 0,
    avgProfitMargin: 0
  });

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const res = await fetch('/api/accommodation-sales');
      if (res.ok) {
        const data = await res.json();
        const salesData = data.sales || [];
        setSales(salesData);
        setFilteredSales(salesData);
        calculateStats(salesData);
      }
    } catch (error) {
      console.error('Satış verileri yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (salesData: AccommodationSale[]) => {
    const totalRevenue = salesData.reduce((sum, sale) => sum + sale.toplamSatisFiyati, 0);
    const totalProfit = salesData.reduce((sum, sale) => sum + sale.kar, 0);
    const avgProfitMargin = salesData.length > 0
      ? salesData.reduce((sum, sale) => sum + sale.karOrani, 0) / salesData.length
      : 0;

    setStats({
      totalSales: salesData.length,
      totalRevenue,
      totalProfit,
      avgProfitMargin
    });
  };

  const handleFolderSelect = (folder: any) => {
    setSelectedFolderId(folder.id);
    if (folder.records) {
      setFilteredSales(folder.records);
      calculateStats(folder.records);
    } else if (folder.id === 'root') {
      setFilteredSales(sales);
      calculateStats(sales);
    } else {
      setFilteredSales(sales);
      calculateStats(sales);
    }
  };

  const handleEdit = (sale: AccommodationSale) => {
    setEditingSale(sale);
    setShowEditModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu satış kaydını silmek istediğinizden emin misiniz?')) return;

    try {
      const res = await fetch(`/api/accommodation-sales/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchSales();
        alert('Satış kaydı silindi');
      }
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme işlemi başarısız');
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredSales.map(sale => ({
      'Misafir': sale.adiSoyadi,
      'Ünvan': sale.unvani,
      'Otel': sale.otelAdi || '-',
      'Giriş': sale.girisTarihi,
      'Çıkış': sale.cikisTarihi,
      'Alış Fiyatı': `₺${sale.toplamAlisFiyati.toFixed(2)}`,
      'Satış Fiyatı': `₺${sale.toplamSatisFiyati.toFixed(2)}`,
      'Kar': `₺${sale.kar.toFixed(2)}`,
      'Kar Oranı': `%${sale.karOrani.toFixed(2)}`,
      'Müşteri': sale.musteriAdi || '-',
      'Fatura': sale.faturaDurumu,
      'Ödeme': sale.odemeDurumu,
      'Ödenen': `₺${sale.odenenTutar.toFixed(2)}`,
      'Kalan': `₺${sale.kalanTutar.toFixed(2)}`
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Satışlar');
    XLSX.writeFile(wb, `Konaklama_Satislar_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Konaklama Satış Listesi', 14, 22);

    const tableData = filteredSales.map(sale => [
      sale.adiSoyadi,
      sale.otelAdi || '-',
      `₺${sale.toplamAlisFiyati.toFixed(0)}`,
      `₺${sale.toplamSatisFiyati.toFixed(0)}`,
      `₺${sale.kar.toFixed(0)}`,
      `%${sale.karOrani.toFixed(1)}`,
      sale.odemeDurumu
    ]);

    autoTable(doc, {
      head: [['Misafir', 'Otel', 'Alış', 'Satış', 'Kar', 'Kar %', 'Ödeme']],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 }
    });

    doc.save(`Konaklama_Satislar_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${bgClass}`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</span>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
      </div>
    </div>
  );

  const getPaymentStatusBadge = (status: string) => {
    const badges = {
      ODENMEDI: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Ödenmedi' },
      KISMI_ODENDI: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Kısmi Ödendi' },
      ODENDI: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Ödendi' }
    };
    const badge = badges[status as keyof typeof badges] || badges.ODENMEDI;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Konaklama Satış Kayıtları</h1>
          <p className="text-gray-500 mt-1">Satış takibi, fatura ve ödeme yönetimi</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileOutput className="w-4 h-4" />
            Excel Export
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <FileOutput className="w-4 h-4" />
            PDF Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Toplam Satış"
          value={stats.totalSales}
          icon={TrendingUp}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <StatCard
          title="Toplam Ciro"
          value={`₺${stats.totalRevenue.toLocaleString('tr-TR')}`}
          icon={DollarSign}
          colorClass="text-green-600"
          bgClass="bg-green-50"
        />
        <StatCard
          title="Toplam Kar"
          value={`₺${stats.totalProfit.toLocaleString('tr-TR')}`}
          icon={PieChart}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
        />
        <StatCard
          title="Ort. Kar Oranı"
          value={`%${stats.avgProfitMargin.toFixed(1)}`}
          icon={TrendingUp}
          colorClass="text-orange-600"
          bgClass="bg-orange-50"
        />
      </div>

      {/* Main Content - Folder Tree + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Folder Tree Sidebar */}
        {showFolders && (
          <div className="lg:col-span-1">
            <SalesFolderTree
              records={sales}
              onFolderSelect={handleFolderSelect}
              selectedFolderId={selectedFolderId}
              viewMode="combined"
            />
          </div>
        )}

        {/* Sales Table */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${showFolders ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedFolderId === 'root' ? 'Tüm Satışlar' : `Seçili Klasör (${filteredSales.length} kayıt)`}
              </h2>
            </div>
            <button
              onClick={() => setShowFolders(!showFolders)}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
            >
              {showFolders ? 'Klasörleri Gizle' : 'Klasörleri Göster'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Misafir</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Otel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alış</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Satış</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ödeme</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="text-gray-500">Henüz satış kaydı yok</p>
                      <p className="text-sm text-gray-400 mt-1">Konaklama Alış sayfasından kayıt aktarabilirsiniz</p>
                    </div>
                  </td>
                </tr>
                ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{sale.adiSoyadi}</div>
                        <div className="text-sm text-gray-500">{sale.unvani}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.otelAdi || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.girisTarihi} - {sale.cikisTarihi}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₺{sale.toplamAlisFiyati.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ₺{sale.toplamSatisFiyati.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-purple-600">
                        ₺{sale.kar.toLocaleString('tr-TR')}
                      </div>
                      <div className="text-xs text-gray-500">%{sale.karOrani.toFixed(1)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.musteriAdi || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentStatusBadge(sale.odemeDurumu)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(sale)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sale.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
