'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  BedDouble,
  TrendingUp,
  Activity,
  Calendar,
  Bell
} from 'lucide-react';

export default function DashboardPage() {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUserName(data.user.name || data.user.email);
        }
      })
      .catch(err => console.error(err));
  }, []);

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
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Hoş Geldiniz, {userName}</h1>
        <p className="text-blue-100">Yurtsever Yönetim Paneli'ne hoş geldiniz. Günlük operasyonlarınızı buradan takip edebilirsiniz.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Toplam Misafir"
          value="1,240"
          icon={Users}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <StatCard
          title="Aktif Oteller"
          value="18"
          icon={Building2}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
        />
        <StatCard
          title="Doluluk Oranı"
          value="%78"
          icon={BedDouble}
          colorClass="text-green-600"
          bgClass="bg-green-50"
        />
        <StatCard
          title="Aylık Ciro"
          value="₺450K"
          icon={TrendingUp}
          colorClass="text-orange-600"
          bgClass="bg-orange-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Son Aktiviteler
            </h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Tümü</button>
          </div>

          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-gray-600">{i}</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Yeni Rezervasyon Oluşturuldu</h4>
                  <p className="text-sm text-gray-500 mt-1">Ahmet Yılmaz tarafından "Antalya Rixos" oteli için rezervasyon yapıldı.</p>
                  <span className="text-xs text-gray-400 mt-2 block">2 saat önce</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications / Reminders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-600" />
              Hatırlatmalar
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-bold text-orange-700 uppercase">Bugün</span>
              </div>
              <p className="text-sm font-medium text-gray-900">Tedarikçi ödemeleri kontrol edilecek.</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-700 uppercase">Yarın</span>
              </div>
              <p className="text-sm font-medium text-gray-900">Haftalık yönetim toplantısı.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}