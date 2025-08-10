'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import UserHeader from '@/components/layout/UserHeader';

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Kullanıcı bilgilerini al ve izinleri yenile
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Önce izinleri yenile
        await fetch('/api/users/refresh-permissions', {
          method: 'POST',
          credentials: 'include'
        });
        
        // Sonra güncel kullanıcı bilgilerini al
        const res = await fetch('/api/user', { 
          credentials: 'include',
          cache: 'no-store' // Cache'i devre dışı bırak
        });
        if (res.ok) {
          const data = await res.json();
          setUserName(data.user.name || data.user.email);
          setUserPermissions(data.user.permissions || []);
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

  // Kullanıcının belirli bir izne sahip olup olmadığını kontrol eden fonksiyon
  const hasPermission = (permission: string) => {
    // Tüm roller için checkbox ile verilen izinleri kontrol et
    return userPermissions.includes(permission) || false;
  };

  const handleOptionSelect = (option: 'hotel' | 'vehicle' | 'transfer-sales' | 'accommodation-sales' | 'user-management' | 'system-logs' | 'cariler' | 'tedarikciler') => {
    if (option === 'hotel') {
      // Konaklama sayfasına yönlendir
      router.push('/konaklama');
    } else if (option === 'vehicle') {
      // Transfer modülüne yönlendir
      router.push('/moduller/transfer');
    } else if (option === 'transfer-sales') {
      // Transfer satışları - yapım aşamasında
      alert('Transfer Satışları modülü yapım aşamasındadır. Yakında kullanıma açılacaktır.');
    } else if (option === 'accommodation-sales') {
      // Konaklama satışları - yapım aşamasında
      alert('Konaklama Satışları modülü yapım aşamasındadır. Yakında kullanıma açılacaktır.');
    } else if (option === 'user-management') {
      // Kullanıcı yönetimi sayfasına yönlendir
      router.push('/admin');
    } else if (option === 'system-logs') {
      // Sistem logları sayfasına yönlendir
      router.push('/admin/logs');
    } else if (option === 'cariler') {
      // Cariler sayfasına yönlendir
      router.push('/cariler');
    } else if (option === 'tedarikciler') {
      // Tedarikçiler sayfasına yönlendir
      router.push('/tedarikciler');
    }
  };



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
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 lg:mb-6 drop-shadow-lg animate-fade-in">Hoş Geldiniz, {userName}</h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-blue-100 animate-fade-in-delayed">Lütfen devam etmek istediğiniz sistemi seçin</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4 sm:gap-6 w-full max-w-7xl px-4 sm:px-6 lg:px-8 animate-scale-in">
            {/* Hiç izin verilmeyen kullanıcılar için mesaj */}
            {!hasPermission('home') && !hasPermission('transfer') && !hasPermission('transfer-sales') && !hasPermission('accommodation') && !hasPermission('user-management') && !hasPermission('logs') && !hasPermission('cariler') && !hasPermission('tedarikciler') && (
              <div className="col-span-full bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl p-6 sm:p-8 lg:p-12 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-4 sm:mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Erişim Kısıtlı</h2>
                <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Henüz size herhangi bir modül için izin verilmemiş. Lütfen sistem yöneticinizle iletişime geçin.</p>
                <button 
                  onClick={() => router.push('/login')}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  Çıkış Yap
                </button>
              </div>
            )}
            {/* Otel Seçeneği */}
            {hasPermission('home') && (
              <div 
                onClick={() => handleOptionSelect('hotel')}
                className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl p-4 sm:p-6 lg:p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:bg-blue-50 min-h-[200px] sm:min-h-[220px] lg:min-h-[240px] flex flex-col justify-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-blue-100 rounded-full flex items-center justify-center shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-center text-gray-800 mb-2">Otel Yönetimi</h2>
                <p className="text-gray-600 text-center text-xs sm:text-sm">Konaklama ve otel yönetim sistemine erişin</p>
              </div>
            )}

            {/* Araç Seçeneği */}
            {hasPermission('transfer') && (
              <div 
                onClick={() => handleOptionSelect('vehicle')}
                className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl p-4 sm:p-6 lg:p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:bg-green-50 min-h-[200px] sm:min-h-[220px] lg:min-h-[240px] flex flex-col justify-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-green-100 rounded-full flex items-center justify-center shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-center text-gray-800 mb-2">Araç Takip</h2>
                <p className="text-gray-600 text-center text-xs sm:text-sm">Araç takip ve yönetim sistemine erişin</p>
              </div>
            )}

            {/* Transfer Satışları Seçeneği */}
            {hasPermission('transfer-sales') && (
              <div 
                onClick={() => handleOptionSelect('transfer-sales')}
                className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl p-4 sm:p-6 lg:p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:bg-orange-50 min-h-[200px] sm:min-h-[220px] lg:min-h-[240px] flex flex-col justify-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-orange-100 rounded-full flex items-center justify-center shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-center text-gray-800 mb-2">Transfer Satışları</h2>
                <p className="text-gray-600 text-center text-xs sm:text-sm">Transfer satış işlemlerini yönetin</p>
              </div>
            )}

            {/* Konaklama Satışları Seçeneği */}
            {hasPermission('accommodation') && (
              <div 
                onClick={() => handleOptionSelect('accommodation-sales')}
                className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl p-4 sm:p-6 lg:p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:bg-purple-50 min-h-[200px] sm:min-h-[220px] lg:min-h-[240px] flex flex-col justify-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-purple-100 rounded-full flex items-center justify-center shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-center text-gray-800 mb-2">Konaklama Satışları</h2>
                <p className="text-gray-600 text-center text-xs sm:text-sm">Konaklama satış işlemlerini yönetin</p>
              </div>
            )}

            {/* Kullanıcı Yönetimi Seçeneği */}
            {hasPermission('user-management') && (
              <div 
                onClick={() => handleOptionSelect('user-management')}
                className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl p-4 sm:p-6 lg:p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:bg-indigo-50 min-h-[200px] sm:min-h-[220px] lg:min-h-[240px] flex flex-col justify-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-indigo-100 rounded-full flex items-center justify-center shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-center text-gray-800 mb-2">Kullanıcı Yönetimi</h2>
                <p className="text-gray-600 text-center text-xs sm:text-sm">Kullanıcı hesaplarını yönetin</p>
              </div>
            )}

            {/* Sistem Logları Seçeneği */}
            {hasPermission('logs') && (
              <div 
                onClick={() => handleOptionSelect('system-logs')}
                className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl p-4 sm:p-6 lg:p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:bg-red-50 min-h-[200px] sm:min-h-[220px] lg:min-h-[240px] flex flex-col justify-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-red-100 rounded-full flex items-center justify-center shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-center text-gray-800 mb-2">Sistem Logları</h2>
                <p className="text-gray-600 text-center text-xs sm:text-sm">Sistem aktivitelerini takip edin</p>
              </div>
            )}

            {/* Cariler Seçeneği */}
            {hasPermission('cariler') && (
              <div 
                onClick={() => handleOptionSelect('cariler')}
                className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl p-4 sm:p-6 lg:p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:bg-teal-50 min-h-[200px] sm:min-h-[220px] lg:min-h-[240px] flex flex-col justify-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-teal-100 rounded-full flex items-center justify-center shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-center text-gray-800 mb-2">Cariler</h2>
                <p className="text-gray-600 text-center text-xs sm:text-sm">Müşteri ve cari hesapları yönetin</p>
              </div>
            )}

            {/* Tedarikçiler Seçeneği */}
            {hasPermission('tedarikciler') && (
              <div 
                onClick={() => handleOptionSelect('tedarikciler')}
                className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl p-4 sm:p-6 lg:p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:bg-amber-50 min-h-[200px] sm:min-h-[220px] lg:min-h-[240px] flex flex-col justify-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-amber-100 rounded-full flex items-center justify-center shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-center text-gray-800 mb-2">Tedarikçiler</h2>
                <p className="text-gray-600 text-center text-xs sm:text-sm">Tedarikçi hesaplarını yönetin</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}