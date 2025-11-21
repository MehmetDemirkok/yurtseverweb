"use client";

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { AccommodationRecord } from './AccommodationTableSection';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Hotel, Moon } from 'lucide-react';

interface AccommodationStatisticsProps {
  records: AccommodationRecord[];
}

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];

export default function AccommodationStatistics({ records }: AccommodationStatisticsProps) {
  const stats = useMemo(() => {
    if (records.length === 0) {
      return {
        monthlyData: [],
        hotelData: [],
        roomTypeData: [],
        accommodationTypeData: [],
        averageNightPrice: 0,
        totalRevenue: 0,
        averageNights: 0,
        trend: 0,
      };
    }

    // Aylık dağılım
    const monthlyMap = new Map<string, { count: number; revenue: number }>();
    records.forEach((record) => {
      const date = new Date(record.girisTarihi);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { count: 0, revenue: 0 });
      }
      const monthData = monthlyMap.get(monthKey)!;
      monthData.count += 1;
      monthData.revenue += record.toplamUcret || 0;
    });

    const monthlyData = Array.from(monthlyMap.entries())
      .map(([key, data]) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
          name: date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
          count: data.count,
          revenue: data.revenue,
          sortKey: key,
        };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .slice(-12); // Son 12 ay

    // Otel bazlı dağılım
    const hotelMap = new Map<string, { count: number; revenue: number }>();
    records.forEach((record) => {
      const hotelName = record.otelAdi || 'Belirtilmemiş';
      if (!hotelMap.has(hotelName)) {
        hotelMap.set(hotelName, { count: 0, revenue: 0 });
      }
      const hotelData = hotelMap.get(hotelName)!;
      hotelData.count += 1;
      hotelData.revenue += record.toplamUcret || 0;
    });

    const hotelData = Array.from(hotelMap.entries())
      .map(([name, data]) => ({
        name: name.length > 20 ? name.substring(0, 20) + '...' : name,
        fullName: name,
        count: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // En çok kullanılan 10 otel

    // Oda tipi dağılımı
    const roomTypeMap = new Map<string, number>();
    records.forEach((record) => {
      const roomType = record.odaTipi || 'Belirtilmemiş';
      roomTypeMap.set(roomType, (roomTypeMap.get(roomType) || 0) + 1);
    });

    const roomTypeData = Array.from(roomTypeMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    // Konaklama tipi dağılımı
    const accommodationTypeMap = new Map<string, number>();
    records.forEach((record) => {
      const accType = record.konaklamaTipi || 'Belirtilmemiş';
      accommodationTypeMap.set(accType, (accommodationTypeMap.get(accType) || 0) + 1);
    });

    const accommodationTypeData = Array.from(accommodationTypeMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    // Ortalama gece fiyatı
    const totalNights = records.reduce((sum, r) => sum + (r.numberOfNights || 0), 0);
    const totalRevenue = records.reduce((sum, r) => sum + (r.toplamUcret || 0), 0);
    const averageNightPrice = totalNights > 0 ? totalRevenue / totalNights : 0;
    const averageNights = records.length > 0 ? totalNights / records.length : 0;

    // Trend (son 2 ay karşılaştırması)
    const sortedMonthly = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-2);
    const trend =
      sortedMonthly.length === 2
        ? ((sortedMonthly[1][1].revenue - sortedMonthly[0][1].revenue) / sortedMonthly[0][1].revenue) * 100
        : 0;

    return {
      monthlyData,
      hotelData,
      roomTypeData,
      accommodationTypeData,
      averageNightPrice,
      totalRevenue,
      averageNights,
      trend,
    };
  }, [records]);

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Görüntülenecek veri yok</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Özet İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700">Ort. Gece Fiyatı</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            ₺{stats.averageNightPrice.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-xs font-semibold text-green-700">Toplam Ciro</span>
          </div>
          <div className="text-2xl font-bold text-green-900">
            ₺{stats.totalRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <Moon className="w-5 h-5 text-purple-600" />
            <span className="text-xs font-semibold text-purple-700">Ort. Gece</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {stats.averageNights.toFixed(1)} gece
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            {stats.trend >= 0 ? (
              <TrendingUp className="w-5 h-5 text-orange-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-orange-600" />
            )}
            <span className="text-xs font-semibold text-orange-700">Aylık Trend</span>
          </div>
          <div className={`text-2xl font-bold ${stats.trend >= 0 ? 'text-orange-900' : 'text-red-600'}`}>
            {stats.trend >= 0 ? '+' : ''}
            {stats.trend.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aylık Trend Grafiği */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Aylık Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                formatter={(value: number) => [`₺${value.toLocaleString('tr-TR')}`, 'Ciro']}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Ciro"
                dot={{ fill: '#3B82F6', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#10B981"
                strokeWidth={2}
                name="Kayıt Sayısı"
                dot={{ fill: '#10B981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Otel Bazlı Dağılım */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Hotel className="w-5 h-5 text-green-600" />
            Otel Bazlı Dağılım
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.hotelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" fontSize={12} />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#6b7280"
                fontSize={11}
                width={120}
              />
              <Tooltip
                formatter={(value: number) => [value, 'Kayıt']}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="count" fill="#10B981" name="Kayıt Sayısı" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Oda Tipi Dağılımı */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Oda Tipi Dağılımı</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.roomTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.roomTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Konaklama Tipi Dağılımı */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Konaklama Tipi Dağılımı</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.accommodationTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                formatter={(value: number) => [value, 'Kayıt']}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="value" fill="#8B5CF6" name="Kayıt Sayısı" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

