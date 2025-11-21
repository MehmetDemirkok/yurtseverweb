'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import UserHeader from '@/app/components/UserHeader';
import { canViewModule, getAllModules, getModuleDisplayName } from '@/lib/permissions';

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Kullanıcı bilgilerini al
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Güncel kullanıcı bilgilerini al
        const res = await fetch('/api/user', { 
          credentials: 'include',
          cache: 'no-store' // Cache'i devre dışı bırak
        });
        if (res.ok) {
          const data = await res.json();
          setUserName(data.user.name || data.user.email);
          setUserRole(data.user.role || '');
        }
      } catch (error) {
        console.error('Kullanıcı bilgileri alınamadı:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []); // Sadece component mount olduğunda çalışır

  // Kullanıcının belirli bir modüle erişim izni olup olmadığını kontrol eden fonksiyon
  const hasModuleAccess = (module: string) => {
    // Admin her zaman tüm modüllere erişebilir
    if (userRole === 'ADMIN') {
      return true;
    }
    
    // Kullanıcı Yönetimi modülü için özel kontrol
    if (module === 'admin') {
      return userRole === 'MUDUR' || userRole === 'ADMIN';
    }
    
    const hasAccess = canViewModule(userRole, module as any);
    return hasAccess;
  };

  // Admin için özel yetkiler
  const isAdmin = userRole === 'ADMIN';



  // Modül kartları için veri
  const moduleCards = [
    {
      key: 'hotels',
      title: 'Otel Yönetimi',
      description: 'Konaklama ve otel yönetim sistemine erişin',
      icon: '🏨',
      color: 'blue',
      path: '/konaklama'
    },
    {
      key: 'vehicles',
      title: 'Araç Takip',
      description: 'Araç takip ve yönetim sistemine erişin',
      icon: '🚗',
      color: 'green',
      path: '/moduller/transfer/araclar'
    },
    {
      key: 'transfer_sales',
      title: 'Transfer Satışları',
      description: 'Transfer satış işlemlerini yönetin',
      icon: '📊',
      color: 'orange',
      path: '/transfer-sales'
    },
    {
      key: 'accommodation_sales',
      title: 'Konaklama Satışları',
      description: 'Konaklama satış işlemlerini yönetin',
      icon: '💰',
      color: 'purple',
      path: '/accommodation-sales'
    },
    {
      key: 'admin',
      title: 'Kullanıcı Yönetimi',
      description: 'Kullanıcı hesaplarını yönetin',
      icon: '👥',
      color: 'blue',
      path: '/admin'
    },
    {
      key: 'customers',
      title: 'Cariler',
      description: 'Müşteri ve cari hesapları yönetin',
      icon: '👥',
      color: 'teal',
      path: '/cariler'
    },
    {
      key: 'suppliers',
      title: 'Tedarikçiler',
      description: 'Tedarikçi hesaplarını yönetin',
      icon: '🏭',
      color: 'amber',
      path: '/tedarikciler'
    }
  ];

  // Admin kartları artık ana modül kartlarına dahil edildi
  const adminCards: any[] = [];

  // Erişilebilir modülleri filtrele
  const accessibleModules = moduleCards.filter(card => hasModuleAccess(card.key));
  const accessibleAdminCards = isAdmin ? adminCards : [];

  // Toplam erişilebilir modül sayısı
  const totalAccessibleModules = accessibleModules.length + accessibleAdminCards.length;



  return (
    <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-700 via-purple-700 to-cyan-700 p-4 sm:p-6">
      {loading ? (
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-white border-t-transparent rounded-full animate-spin mb-4 sm:mb-6"></div>
          <p className="text-white text-lg sm:text-xl font-medium">Yükleniyor...</p>
        </div>
      ) : (
        <>
          {/* Sağ üst köşe - Kullanıcı bilgileri ve çıkış yap butonu */}
          <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-10">
            <UserHeader />
          </div>

          <div className="text-center mb-8 lg:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 lg:mb-6 drop-shadow-lg animate-fade-in">
              Hoş Geldiniz, {userName}
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-blue-100 animate-fade-in-delayed">
              Lütfen devam etmek istediğiniz sistemi seçin
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 w-full max-w-7xl px-4 sm:px-6 lg:px-8 animate-scale-in">
            {/* Hiç izin verilmeyen kullanıcılar için mesaj */}
            {totalAccessibleModules === 0 && (
              <div className="col-span-full bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl p-6 sm:p-8 lg:p-12 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-4 sm:mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Erişim Kısıtlı</h2>
                <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                  Henüz size herhangi bir modül için izin verilmemiş. Lütfen sistem yöneticinizle iletişime geçin.
                </p>
                <Link 
                  href="/login"
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base inline-block"
                >
                  Çıkış Yap
                </Link>
              </div>
            )}

            {/* Erişilebilir modül kartları */}
            {accessibleModules.map((card) => (
              <Link
                key={card.key}
                href={card.path}
                className={`bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl p-4 sm:p-6 lg:p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:bg-${card.color}-50 min-h-[200px] sm:min-h-[220px] lg:min-h-[240px] flex flex-col justify-center`}
              >
                <div className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-${card.color}-100 rounded-full flex items-center justify-center shadow-inner text-2xl sm:text-3xl lg:text-4xl`}>
                  {card.icon}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-center text-gray-800 mb-2">
                  {card.title}
                </h2>
                <p className="text-gray-600 text-center text-xs sm:text-sm">
                  {card.description}
                </p>
              </Link>
            ))}

            {/* Admin kartları */}
            {accessibleAdminCards.map((card) => (
              <Link
                key={card.key}
                href={card.path}
                className={`bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl p-4 sm:p-6 lg:p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:bg-${card.color}-50 min-h-[200px] sm:min-h-[220px] lg:min-h-[240px] flex flex-col justify-center`}
              >
                <div className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-${card.color}-100 rounded-full flex items-center justify-center shadow-inner text-2xl sm:text-3xl lg:text-4xl`}>
                  {card.icon}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-center text-gray-800 mb-2">
                  {card.title}
                </h2>
                <p className="text-gray-800 text-center text-xs sm:text-sm">
                  {card.description}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}