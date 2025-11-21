'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from "@/components/layout/AuthGuard";
import { canViewModule } from '@/lib/permissions';
import {
  Users,
  LogIn,
  LogOut,
  Building,
  Search,
  Plus,
  FileDown,
  FileUp,
  Calendar,
  ChevronRight,
  BedDouble
} from 'lucide-react';

interface User {
  id: number;
  email: string;
  name?: string;
  role: 'ADMIN' | 'MUDUR' | 'OPERATOR' | 'KULLANICI';
  permissions?: string[];
}

interface Organization {
  id: number;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  baslangicTarihi?: string;
  bitisTarihi?: string;
  lokasyon?: string;
  sehir?: string;
  ulke?: string;
  _count?: {
    accommodations: number;
  };
}

interface Accommodation {
  id: number;
  adiSoyadi: string;
  girisTarihi: string;
  cikisTarihi: string;
  odaTipi: string;
  otelAdi?: string;
  isMunferit: boolean;
  organization?: {
    name: string;
  };
}

export default function AccommodationPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [stats, setStats] = useState({
    inHouse: 0,
    arrivals: 0,
    departures: 0,
    activeOrgs: 0
  });
  const [activeTab, setActiveTab] = useState<'arrivals' | 'departures'>('arrivals');
  const [searchTerm, setSearchTerm] = useState('');

  // Kullanıcı bilgilerini yükle
  useEffect(() => {
    fetch('/api/user', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setCurrentUser(data.user);
        setUserPermissions((data.user && data.user.permissions) ? data.user.permissions : []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Kullanıcı bilgisi alınamadı:', err);
        setIsLoading(false);
      });
  }, []);

  // Verileri yükle
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Organizasyonları ve Konaklamaları paralel çek
        const [orgRes, accRes] = await Promise.all([
          fetch('/api/organizations'),
          fetch('/api/accommodation')
        ]);

        const orgData = await orgRes.json();
        const accData = await accRes.json();

        const orgs = Array.isArray(orgData) ? orgData : [];
        const accs = Array.isArray(accData) ? accData : [];

        setOrganizations(orgs);
        setAccommodations(accs);

        // İstatistikleri Hesapla
        const today = new Date().toISOString().split('T')[0];

        const arrivals = accs.filter((a: Accommodation) => a.girisTarihi === today).length;
        const departures = accs.filter((a: Accommodation) => a.cikisTarihi === today).length;
        // In-house: Giriş yapmış (<= bugün) ve henüz çıkmamış (>= bugün)
        const inHouse = accs.filter((a: Accommodation) => a.girisTarihi <= today && a.cikisTarihi >= today).length;
        const activeOrgs = orgs.filter((o: Organization) => o.status === 'ACTIVE').length;

        setStats({
          inHouse,
          arrivals,
          departures,
          activeOrgs
        });

      } catch (error) {
        console.error('Veri yüklenirken hata:', error);
      }
    };

    if (!isLoading) {
      fetchData();
    }
  }, [isLoading]);

  const hasPageAccess = (): boolean => {
    if (currentUser?.role === 'ADMIN') return true;
    return canViewModule(currentUser?.role || '', 'accommodation');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR');
  };

  // Filtrelenmiş listeler
  const today = new Date().toISOString().split('T')[0];

  const todaysMovements = accommodations.filter(acc => {
    const matchesSearch = acc.adiSoyadi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acc.otelAdi || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'arrivals') {
      return acc.girisTarihi === today;
    } else {
      return acc.cikisTarihi === today;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasPageAccess()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Erişim Kısıtlı</h2>
          <button onClick={() => window.history.back()} className="text-blue-600 hover:underline">Geri Dön</button>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Konaklama Operasyon
            </h1>
            <p className="text-gray-500 mt-1">
              Günlük operasyon ve misafir takibi
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/konaklama/munferit?action=add')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Yeni Kayıt
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <BedDouble className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase">Konaklayan</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-gray-900">{stats.inHouse}</h3>
              <span className="text-sm text-gray-500">Misafir</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <LogIn className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase">Bugün Giriş</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-gray-900">{stats.arrivals}</h3>
              <span className="text-sm text-gray-500">Misafir</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <LogOut className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase">Bugün Çıkış</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-gray-900">{stats.departures}</h3>
              <span className="text-sm text-gray-500">Misafir</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Building className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase">Aktif Org.</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-gray-900">{stats.activeOrgs}</h3>
              <span className="text-sm text-gray-500">Organizasyon</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Operations Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Movements */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-lg font-bold text-gray-900">Bugünün Hareketleri</h2>
                  <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setActiveTab('arrivals')}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'arrivals'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      Girişler
                    </button>
                    <button
                      onClick={() => setActiveTab('departures')}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'departures'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      Çıkışlar
                    </button>
                  </div>
                </div>

                {/* Search within movements */}
                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Misafir veya otel ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-6 py-3">Misafir</th>
                      <th className="px-6 py-3">Otel</th>
                      <th className="px-6 py-3">Oda Tipi</th>
                      <th className="px-6 py-3">Durum</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {todaysMovements.length > 0 ? (
                      todaysMovements.map((acc) => (
                        <tr key={acc.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{acc.adiSoyadi}</div>
                            <div className="text-xs text-gray-500">
                              {acc.isMunferit ? 'Münferit' : acc.organization?.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{acc.otelAdi || '-'}</td>
                          <td className="px-6 py-4 text-gray-600">{acc.odaTipi}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${activeTab === 'arrivals'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                              }`}>
                              {activeTab === 'arrivals' ? 'Giriş Yapacak' : 'Çıkış Yapacak'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-gray-400 hover:text-blue-600 transition-colors">
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <Calendar className="w-12 h-12 text-gray-300 mb-3" />
                            <p>Bugün için {activeTab === 'arrivals' ? 'giriş' : 'çıkış'} kaydı bulunamadı.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Hızlı İşlemler</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/konaklama/munferit?action=add')}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-all group"
                >
                  <span className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                    Münferit Ekle
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
                </button>

                <button
                  onClick={() => router.push('/konaklama/organizasyonlar?action=add')}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 text-gray-700 hover:text-purple-700 transition-all group"
                >
                  <span className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-gray-400 group-hover:text-purple-500" />
                    Organizasyon Ekle
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500" />
                </button>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => router.push('/konaklama/munferit?action=import')}
                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors text-sm"
                  >
                    <FileUp className="w-5 h-5 mb-1" />
                    İçe Aktar
                  </button>
                  <button
                    onClick={() => router.push('/konaklama/munferit?action=export')}
                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors text-sm"
                  >
                    <FileDown className="w-5 h-5 mb-1" />
                    Dışa Aktar
                  </button>
                </div>
              </div>
            </div>

            {/* Active Organizations */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Aktif Organizasyonlar</h3>
                <button
                  onClick={() => router.push('/konaklama/organizasyonlar')}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Tümü
                </button>
              </div>

              <div className="space-y-4">
                {organizations
                  .filter(org => org.status === 'ACTIVE')
                  .slice(0, 4)
                  .map(org => (
                    <div
                      key={org.id}
                      onClick={() => router.push(`/konaklama/organizasyonlar/${org.id}`)}
                      className="group cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-100 transition-colors">
                          <Building className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                            {org.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDate(org.baslangicTarihi || '')} - {formatDate(org.bitisTarihi || '')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                {organizations.filter(org => org.status === 'ACTIVE').length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Aktif organizasyon bulunmuyor.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}