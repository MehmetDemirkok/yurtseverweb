'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Kullanıcı bilgilerini al
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/user', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUserName(data.user.name || data.user.email);
        }
      } catch (error) {
        console.error('Kullanıcı bilgileri alınamadı:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleOptionSelect = (option: 'hotel' | 'vehicle') => {
    if (option === 'hotel') {
      // Mevcut otel sistemine yönlendir
      router.push('/');
    } else {
      // Transfer modülüne yönlendir
      router.push('/moduller/transfer');
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-700 via-purple-700 to-cyan-700 p-6">
      {loading ? (
        <div className="flex flex-col items-center justify-center">
          <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="text-white text-xl font-medium">Yükleniyor...</p>
        </div>
      ) : (
        <>
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg animate-fade-in">Hoş Geldiniz, {userName}</h1>
            <p className="text-2xl text-blue-100 animate-fade-in-delayed">Lütfen devam etmek istediğiniz sistemi seçin</p>
          </div>

          <div className="flex flex-col md:flex-row gap-10 w-full max-w-5xl px-8 animate-scale-in">
            {/* Otel Seçeneği */}
            <div 
              onClick={() => handleOptionSelect('hotel')}
              className="flex-1 bg-white rounded-2xl shadow-2xl p-12 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:bg-blue-50"
            >
              <div className="w-28 h-28 mx-auto mb-8 bg-blue-100 rounded-full flex items-center justify-center shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Otel Yönetimi</h2>
              <p className="text-gray-600 text-center text-xl">Konaklama ve otel yönetim sistemine erişin</p>
            </div>

            {/* Araç Seçeneği */}
            <div 
              onClick={() => handleOptionSelect('vehicle')}
              className="flex-1 bg-white rounded-2xl shadow-2xl p-12 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:bg-green-50"
            >
              <div className="w-28 h-28 mx-auto mb-8 bg-green-100 rounded-full flex items-center justify-center shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Araç Takip</h2>
              <p className="text-gray-600 text-center text-xl">Araç takip ve yönetim sistemine erişin</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}