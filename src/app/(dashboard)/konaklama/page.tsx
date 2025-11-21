'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AccommodationTableSection from '@/app/components/AccommodationTableSection';
import { transferToSales } from '@/lib/transferToSales';
import {
  BedDouble,
  TrendingUp,
  DollarSign,
  Users,
  ArrowRightCircle
} from 'lucide-react';

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

  useEffect(() => {
    // Fetch accommodation purchase statistics
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/accommodation?isMunferit=false');
        if (res.ok) {
          const data = await res.json();
          const accommodations = data.accommodations || [];

          // Calculate stats
          const totalCost = accommodations.reduce((sum: number, acc: any) => {
            return sum + (parseFloat(acc.ucret) || 0);
          }, 0);

          const activeGuests = accommodations.filter((acc: any) => {
            const today = new Date();
            const checkIn = new Date(acc.giris);
            const checkOut = new Date(acc.cikis);
            return checkIn <= today && checkOut >= today;
          }).length;

          setStats({
            totalRecords: accommodations.length,
            totalCost: totalCost,
            activeGuests: activeGuests,
            suppliers: new Set(accommodations.map((acc: any) => acc.otel)).size
          });
        }
      } catch (error) {
        console.error('Stats fetch error:', error);
      }
    };

    fetchStats();
  }, []);

  const handleTransferToSales = async (ids: number[]) => {
    if (ids.length === 0) {
      alert('Lütfen satışa aktarmak için en az bir kayıt seçin');
      return;
    }

    if (!confirm(`${ids.length} kayıt satışa aktarılacak. Onaylıyor musunuz?`)) {
      return;
    }

    try {
      const result = await transferToSales(ids);
      alert(result.message || 'Kayıtlar başarıyla satışa aktarıldı!');
      // Redirect to sales page
      router.push('/accommodation-sales');
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

      {/* Main Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <AccommodationTableSection
          filterType="all"
          organizationId={undefined}
          action={action}
        />
      </div>
    </div>
  );
}