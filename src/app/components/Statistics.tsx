import { useTheme, useMediaQuery } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import type { AccommodationRecord } from '../page';
import { useState } from 'react';

interface StatisticsProps {
  records: AccommodationRecord[];
}

interface ChartDataPoint {
  name: string;
  value: number;
  revenue?: number;
}

const COLORS = ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5A2B'];

export default function Statistics({ records }: StatisticsProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showRevenue, setShowRevenue] = useState(false);

  // Toplam istatistikler
  const totalRecords = records.length;
  const totalRevenue = records.reduce((sum, record) => sum + record.toplamUcret, 0);
  const averageNights = records.reduce((sum, record) => sum + (record.numberOfNights || 0), 0) / totalRecords;

  // Oda tiplerine göre dağılım
  const roomTypeData = records.reduce((acc: { [key: string]: number }, record) => {
    acc[record.odaTipi] = (acc[record.odaTipi] || 0) + 1;
    return acc;
  }, {});

  const roomTypeChartData = Object.entries(roomTypeData)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  // Aylık dağılım
  const monthlyData = records.reduce((acc: { [key: string]: number }, record) => {
    const month = new Date(record.girisTarihi).toLocaleString('tr-TR', { month: 'long' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const monthlyChartData = Object.entries(monthlyData)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => {
      const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
      return months.indexOf(a.name) - months.indexOf(b.name);
    });

  // Kurumlara göre dağılım
  const organizationData = records.reduce((acc: { [key: string]: { count: number; revenue: number } }, record) => {
    const orgName = record.organizasyonAdi || 'Belirtilmemiş';
    if (!acc[orgName]) {
      acc[orgName] = { count: 0, revenue: 0 };
    }
    acc[orgName].count += 1;
    acc[orgName].revenue += record.toplamUcret;
    return acc;
  }, {});

  const organizationChartData = Object.entries(organizationData)
    .map(([name, data]) => ({
      name,
      value: data.count,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-blue-600 font-medium">{`Konaklama Sayısı: ${data.value}`}</p>
          {data.revenue && (
            <p className="text-green-600 font-medium">{`Toplam Gelir: ${data.revenue.toLocaleString('tr-TR')} ₺`}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Ana İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Konaklama</p>
              <p className="text-3xl font-bold text-blue-600">{totalRecords}</p>
            </div>
          </div>
        </div>

        <div className="card p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 flex items-center gap-2">
                Toplam Gelir
                <button
                  type="button"
                  aria-label={showRevenue ? 'Gizle' : 'Göster'}
                  className="ml-1 focus:outline-none"
                  onClick={() => setShowRevenue(v => !v)}
                >
                  {showRevenue ? (
                    // Eye-off SVG
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575m2.122-2.122A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 2.21-.715 4.25-1.925 5.925M15 12a3 3 0 11-6 0 3 3 0 016 0zM3 3l18 18" /></svg>
                  ) : (
                    // Eye SVG
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </p>
              <p className="text-3xl font-bold text-green-600">{showRevenue ? `${totalRevenue.toLocaleString('tr-TR')} ₺` : '****** ₺'}</p>
            </div>
          </div>
        </div>

        <div className="card p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Ortalama Süre</p>
              <p className="text-3xl font-bold text-purple-600">{averageNights.toFixed(1)} Gün</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grafik Kartları */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Oda Tiplerine Göre Dağılım */}
        <div className="card p-6 animate-slide-in">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Oda Tiplerine Göre Dağılım</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roomTypeChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={isMobile ? 80 : 100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => 
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {roomTypeChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Aylık Konaklama Dağılımı */}
        <div className="card p-6 animate-slide-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-cyan-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Aylık Konaklama Dağılımı</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  fill="url(#gradientBar)"
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="gradientBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#1D4ED8" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Organizasyonlara Göre Dağılım */}
      <div className="card p-6 animate-scale-in">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Organizasyonlara Göre Dağılım</h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={organizationChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                fontSize={14}
                angle={-20}
                textAnchor="end"
                height={100}
                interval={0}
                tick={{ fontSize: 14 }}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                fill="url(#gradientBar2)"
                radius={[4, 4, 0, 0]}
              />
              <defs>
                <linearGradient id="gradientBar2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 