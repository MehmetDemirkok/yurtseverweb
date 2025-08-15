'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Car, 
  Users, 
  MapPin, 
  Calendar, 
  Clock, 
  TrendingUp,
  Plus,
  Eye
} from 'lucide-react';



interface YaklasanTransfer {
  id: string;
  kalkisYeri: string;
  varisYeri: string;
  kalkisSaati: string;
  yolcuSayisi: number;
  aracPlaka: string;
  soforAdi: string;
  durum: 'beklemede' | 'yolda' | 'tamamlandi';
}

interface TransferStats {
  toplamArac: number;
  müsaitArac: number;
  toplamSofor: number;
  bugunTransfer: number;
  buHaftaTransfer: number;
  toplamTransfer: number;
}

export default function TransferDashboard() {

  
  const [yaklasanTransferler, setYaklasanTransferler] = useState<YaklasanTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [stats, setStats] = useState<TransferStats>({
    toplamArac: 0,
    müsaitArac: 0,
    toplamSofor: 0,
    bugunTransfer: 0,
    buHaftaTransfer: 0,
    toplamTransfer: 0
  });

  // İzin kontrolü fonksiyonu
  const hasPermission = (permission: string): boolean => {
    return userPermissions.includes(permission) || userRole === 'ADMIN';
  };

  // Sayfa erişim kontrolü
  const hasPageAccess = (): boolean => {
    // Admin her zaman erişebilir
    if (userRole === 'ADMIN') {
      return true;
    }
    // Diğer roller için transfer permission kontrolü
    return hasPermission('transfer');
  };

  useEffect(() => {
    // Kullanıcı bilgilerini al
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/user', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUserPermissions(data.user.permissions || []);
          setUserRole(data.user.role || '');
        }
      } catch (error) {
        console.error('Kullanıcı bilgileri alınamadı:', error);
      }
    };

    fetchUserData();
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Paralel API çağrıları
      const [araclarRes, soforlerRes, transferlerRes] = await Promise.all([
        fetch('/api/moduller/transfer/araclar'),
        fetch('/api/moduller/transfer/soforler'),
        fetch('/api/moduller/transfer/transferler')
      ]);

      const araclar = araclarRes.ok ? (await araclarRes.json()).araclar || [] : [];
      const soforler = soforlerRes.ok ? (await soforlerRes.json()).soforler || [] : [];
      const transferler = transferlerRes.ok ? (await transferlerRes.json()).transferler || [] : [];

      // Yaklaşan transferleri al (bugün ve yarın)
      const bugun = new Date().toISOString().split('T')[0];
      const yarin = new Date();
      yarin.setDate(yarin.getDate() + 1);
      const yarinStr = yarin.toISOString().split('T')[0];

      const yaklasanTransferler = Array.isArray(transferler) 
        ? transferler
            .filter((t: any) => {
              const transferTarihi = new Date(t.kalkisTarihi).toISOString().split('T')[0];
              return (transferTarihi === bugun || transferTarihi === yarinStr) && 
                     t.durum !== 'TAMAMLANDI' && t.durum !== 'IPTAL';
            })
            .slice(0, 5) // En fazla 5 transfer göster
            .map((t: any) => ({
              id: t.id,
              kalkisYeri: t.kalkisYeri,
              varisYeri: t.varisYeri,
              kalkisSaati: t.kalkisSaati,
              yolcuSayisi: t.yolcuSayisi,
              aracPlaka: t.arac?.plaka || 'Atanmamış',
              soforAdi: t.sofor ? `${t.sofor.ad} ${t.sofor.soyad}` : 'Atanmamış',
              durum: t.durum.toLowerCase()
            }))
        : [];

      // İstatistikleri hesapla
      const buHafta = new Date();
      buHafta.setDate(buHafta.getDate() + 7);

      const bugunTransferler = transferler.filter((t: any) => 
        new Date(t.kalkisTarihi).toISOString().split('T')[0] === bugun
      );

      const buHaftaTransferler = transferler.filter((t: any) => 
        new Date(t.kalkisTarihi) <= buHafta
      );

      const stats = {
        toplamArac: araclar.length,
        müsaitArac: araclar.filter((a: any) => a.durum === 'MUSAIT').length,
        toplamSofor: soforler.length,
        bugunTransfer: bugunTransferler.length,
        buHaftaTransfer: buHaftaTransferler.length,
        toplamTransfer: transferler.length
      };

      setStats(stats);
      setYaklasanTransferler(yaklasanTransferler);
    } catch (error) {
      console.error('Dashboard verisi alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDurumRenk = (durum: string) => {
    switch (durum) {
      case 'beklemede': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'yolda': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'tamamlandi': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Sayfa erişim kontrolü
  if (!hasPageAccess()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Erişim Kısıtlı</h2>
          <p className="text-gray-600 mb-4">Bu sayfaya erişim izniniz bulunmamaktadır.</p>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sayfa Başlığı */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Transfer Yönetimi
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Araç takip ve havalimanı transfer yönetimi
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link
            href="/moduller/transfer/araclar"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Car className="h-4 w-4 mr-2" />
            Araçlar
          </Link>
          <Link
            href="/moduller/transfer/soforler"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Users className="h-4 w-4 mr-2" />
            Şoförler
          </Link>
          <Link
            href="/moduller/transfer/transferler"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Transfer
          </Link>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Toplam Araç
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.toplamArac}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Car className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Müsait Araç
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.müsaitArac}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Toplam Şoför
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.toplamSofor}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Bugün Transfer
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.bugunTransfer}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Bu Hafta Transfer
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.buHaftaTransfer}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPin className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Toplam Transfer
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.toplamTransfer}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Yaklaşan Transferler */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Yaklaşan Transferler
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Kalkış
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Varış
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Saat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Yolcu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Araç
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Şoför
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {yaklasanTransferler.map((transfer) => (
                <tr key={transfer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {transfer.kalkisYeri}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {transfer.varisYeri}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {transfer.kalkisSaati}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {transfer.yolcuSayisi} kişi
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {transfer.aracPlaka}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {transfer.soforAdi}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDurumRenk(transfer.durum)}`}>
                      {transfer.durum === 'beklemede' && 'Beklemede'}
                      {transfer.durum === 'yolda' && 'Yolda'}
                      {transfer.durum === 'tamamlandi' && 'Tamamlandı'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/moduller/transfer/transferler/${transfer.id}`}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {yaklasanTransferler.length === 0 && (
          <div className="text-center py-8">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Yaklaşan transfer bulunamadı
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Henüz planlanmış transfer bulunmuyor.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 