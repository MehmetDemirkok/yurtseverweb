'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, DollarSign, Clock, Construction } from 'lucide-react';
import Link from 'next/link';

export default function AccommodationSalesPage() {
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    // Kullanıcı bilgilerini al
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/user', { 
          credentials: 'include',
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          setUserName(data.user.name || data.user.email);
        }
      } catch (error) {
        console.error('Kullanıcı bilgileri alınamadı:', error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-purple-700 to-cyan-700 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Geri Dön Butonu */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-white hover:text-blue-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Dashboard'a Dön
          </Link>
        </div>

        {/* Ana Kart */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* İkon */}
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
            <DollarSign className="h-12 w-12 text-purple-600" />
          </div>

          {/* Başlık */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Konaklama Satışları
          </h1>

          {/* Açıklama */}
          <p className="text-lg text-gray-600 mb-8">
            Konaklama satış işlemlerini yönetin
          </p>

          {/* Hazırlık Mesajı */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center mb-4">
              <Construction className="h-8 w-8 text-yellow-600 mr-3" />
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">
              🚧 Hazırlık Aşamasında
            </h2>
            <p className="text-yellow-700">
              Bu modül şu anda geliştirme aşamasındadır. 
              <br />
              Çok yakında hizmetinizde olacak!
            </p>
          </div>

          {/* Özellikler */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">🏨 Oda Satışları</h3>
              <p className="text-sm text-gray-600">Otel oda satış yönetimi</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">💰 Gelir Analizi</h3>
              <p className="text-sm text-gray-600">Konaklama gelir takibi</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">📊 Doluluk Oranları</h3>
              <p className="text-sm text-gray-600">Otel doluluk analizleri</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">🎯 Rezervasyon Takibi</h3>
              <p className="text-sm text-gray-600">Rezervasyon yönetimi</p>
            </div>
          </div>

          {/* Geri Dön Butonu */}
          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Dashboard'a Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
