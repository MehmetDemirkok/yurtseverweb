'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AccommodationTableSection from '@/app/components/AccommodationTableSection';
import AccommodationFolderTree from '@/app/components/AccommodationFolderTree';
import QuickAddRow from '@/app/components/QuickAddRow';
import AccommodationStatistics from '@/app/components/AccommodationStatistics';
import SalesPriceModal from '@/app/components/SalesPriceModal';
import { transferToSales } from '@/lib/transferToSales';
import {
  BedDouble,
  TrendingUp,
  DollarSign,
  Users,
  ArrowRightCircle,
  BarChart3
} from 'lucide-react';
import { AccommodationRecord } from '@/app/components/AccommodationTableSection';

export default function KonaklamaAlisPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const action = searchParams?.get('action');

  const [stats, setStats] = useState({
    totalRecords: 0,
    totalCost: 0,
    activeGuests: 0,
    suppliers: 0
  });
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([]);
  const [allRecords, setAllRecords] = useState<AccommodationRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AccommodationRecord[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('root');
  const [showFolders, setShowFolders] = useState(true);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showSalesPriceModal, setShowSalesPriceModal] = useState(false);
  const [pendingTransferIds, setPendingTransferIds] = useState<number[]>([]);
  const [transferredRecordIds, setTransferredRecordIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Fetch accommodation purchase statistics
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/accommodation?isMunferit=false');
        if (res.ok) {
          const data = await res.json();
          const accommodations = Array.isArray(data) ? data : (data.accommodations || []);

          // Satışa aktarılan kayıtları kontrol et
          const salesRes = await fetch('/api/accommodation-sales');
          if (salesRes.ok) {
            const salesData = await salesRes.json();
            const sales = salesData.sales || [];
            const transferredIds = new Set(sales.map((sale: any) => sale.accommodationId));
            setTransferredRecordIds(transferredIds);
          }

          setAllRecords(accommodations);
          setFilteredRecords(accommodations);

          // Calculate stats
          const totalCost = accommodations.reduce((sum: number, acc: any) => {
            return sum + (parseFloat(acc.toplamUcret) || 0);
          }, 0);

          const activeGuests = accommodations.filter((acc: any) => {
            const today = new Date();
            const checkIn = new Date(acc.girisTarihi);
            const checkOut = new Date(acc.cikisTarihi);
            return checkIn <= today && checkOut >= today;
          }).length;

          setStats({
            totalRecords: accommodations.length,
            totalCost: totalCost,
            activeGuests: activeGuests,
            suppliers: new Set(accommodations.map((acc: any) => acc.otelAdi).filter(Boolean)).size
          });
        }
      } catch (error) {
        console.error('Stats fetch error:', error);
      }
    };

    fetchStats();
  }, []);

  const handleFolderSelect = (folder: any) => {
    setSelectedFolderId(folder.id);
    if (folder.records) {
      setFilteredRecords(folder.records);
    } else if (folder.id === 'root') {
      setFilteredRecords(allRecords);
    } else {
      // Eğer klasörün kayıtları yoksa, tüm kayıtları göster
      setFilteredRecords(allRecords);
    }
  };

  const handleTransferToSales = async (ids: number[]) => {
    if (ids.length === 0) {
      alert('Lütfen satışa aktarmak için en az bir kayıt seçin');
      return;
    }

    // Seçili kayıtları getir
    const selectedRecords = allRecords.filter(record => ids.includes(record.id));
    
    // Modal'ı göster
    setPendingTransferIds(ids);
    setShowSalesPriceModal(true);
  };

  const handleSalesPriceConfirm = async (prices: Record<number, { satisFiyati: number; toplamSatisFiyati: number }>) => {
    try {
      const result = await transferToSales(pendingTransferIds, prices);
      
      // Başarılı aktarılan kayıtları işaretle
      const newTransferredIds = new Set(transferredRecordIds);
      pendingTransferIds.forEach(id => newTransferredIds.add(id));
      setTransferredRecordIds(newTransferredIds);
      
      alert(result.message || 'Kayıtlar başarıyla satışa aktarıldı!');
      setShowSalesPriceModal(false);
      setPendingTransferIds([]);
      
      // Sayfayı yenile
      window.location.reload();
    } catch (error: any) {
      alert(error.message || 'Satışa aktarma başarısız oldu');
    }
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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Konaklama Alış Kayıtları</h1>
        <p className="text-gray-500 mt-1">Otellerde konakladığınız misafirlerin kayıtları, ücretler ve tedarikçi takibi</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Toplam Kayıt"
          value={stats.totalRecords}
          icon={BedDouble}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <StatCard
          title="Toplam Maliyet"
          value={`₺${stats.totalCost.toLocaleString('tr-TR')}`}
          icon={DollarSign}
          colorClass="text-green-600"
          bgClass="bg-green-50"
        />
        <StatCard
          title="Aktif Misafir"
          value={stats.activeGuests}
          icon={Users}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
        />
        <StatCard
          title="Tedarikçi"
          value={stats.suppliers}
          icon={TrendingUp}
          colorClass="text-orange-600"
          bgClass="bg-orange-50"
        />
      </div>

      {/* İstatistikler Toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowStatistics(!showStatistics)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            showStatistics
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{showStatistics ? 'İstatistikleri Gizle' : 'İstatistikleri Göster'}</span>
        </button>
      </div>

      {/* İstatistikler */}
      {showStatistics && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <AccommodationStatistics records={allRecords} />
        </div>
      )}

      {/* Main Content - Folder Tree + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Folder Tree Sidebar */}
        {showFolders && (
          <div className="lg:col-span-1">
            <AccommodationFolderTree
              records={allRecords}
              onFolderSelect={handleFolderSelect}
              selectedFolderId={selectedFolderId}
              viewMode="combined"
            />
          </div>
        )}

        {/* Main Data Table */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${showFolders ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedFolderId === 'root' ? 'Tüm Kayıtlar' : `Seçili Klasör (${filteredRecords.length} kayıt)`}
              </h2>
            </div>
            <button
              onClick={() => setShowFolders(!showFolders)}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
            >
              {showFolders ? 'Klasörleri Gizle' : 'Klasörleri Göster'}
            </button>
          </div>

          {/* Quick Add Row - Tablonun Üstünde */}
          <QuickAddRow
            onAddRecord={(newRecord) => {
              // Refresh the page to show new record
              window.location.reload();
            }}
          />

          <AccommodationTableSection
            filterType="all"
            organizationId={undefined}
            action={action}
            customBulkActions={[
              {
                label: 'Satışa Aktar',
                onClick: () => handleTransferToSales(selectedRecordIds),
                icon: <ArrowRightCircle className="w-4 h-4" />,
                color: 'green'
              }
            ]}
            onSelectionChange={setSelectedRecordIds}
            filteredRecords={filteredRecords}
            transferredRecordIds={transferredRecordIds}
          />

          {/* Satış Fiyatı Modal */}
          {showSalesPriceModal && (
            <SalesPriceModal
              isOpen={showSalesPriceModal}
              records={allRecords.filter(record => pendingTransferIds.includes(record.id))}
              onClose={() => {
                setShowSalesPriceModal(false);
                setPendingTransferIds([]);
              }}
              onConfirm={handleSalesPriceConfirm}
            />
          )}
        </div>
      </div>
    </div>
  );
}
