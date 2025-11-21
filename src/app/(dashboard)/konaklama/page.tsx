'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from "@/components/layout/AuthGuard";
import { canViewModule } from '@/lib/permissions';

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



export default function AccommodationPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  
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

  // Organizasyonları yükle
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Organizasyonları çek
        const orgRes = await fetch('/api/organizations');
        const orgData = await orgRes.json();
        setOrganizations(Array.isArray(orgData) ? orgData : []);
      } catch (error) {
        console.error('Veri yüklenirken hata:', error);
      }
    };

    if (!isLoading) {
      fetchData();
    }
  }, [isLoading]);

  // İzin kontrolü fonksiyonları
  const hasPermission = (permission: string): boolean => {
    return userPermissions.includes(permission) || currentUser?.role === 'ADMIN';
  };

  const hasPageAccess = (): boolean => {
    if (currentUser?.role === 'ADMIN') {
      return true;
    }
    return canViewModule(currentUser?.role || '', 'accommodation');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'SUSPENDED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Loading durumu
  if (isLoading) {
    return (
      <AuthGuard>
        <main className="w-full px-2 sm:px-4 py-4 sm:py-8 max-w-full overflow-hidden">
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 text-center max-w-sm sm:max-w-md mx-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Yükleniyor...</h2>
              <p className="text-sm sm:text-base text-gray-600">Kullanıcı bilgileri kontrol ediliyor.</p>
            </div>
          </div>
        </main>
      </AuthGuard>
    );
  }

  // Sayfa erişim kontrolü
  if (!isLoading && !hasPageAccess()) {
    return (
      <AuthGuard>
        <main className="w-full px-2 sm:px-4 py-4 sm:py-8 max-w-full overflow-hidden">
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 text-center max-w-sm sm:max-w-md mx-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Erişim Kısıtlı</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Bu sayfaya erişim izniniz bulunmamaktadır.</p>
              <button 
                onClick={() => window.history.back()}
                className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                Geri Dön
              </button>
            </div>
          </div>
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="w-full mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Başlık ve İstatistikler */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Konaklama Yönetimi</h1>
        </div>

        {/* Ana Kategoriler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Münferit Konaklamalar */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-green-500 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h2 className="text-xl font-bold">Münferit Konaklamalar</h2>
                </div>

              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Organizasyona bağlı olmayan, bireysel konaklama kayıtları.
              </p>
              <button
                onClick={() => router.push('/konaklama/munferit')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Münferit Konaklamaları Görüntüle
              </button>
            </div>
          </div>

          {/* Organizasyonlar */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-purple-500 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h2 className="text-xl font-bold">Organizasyonlar</h2>
                </div>
                <span className="bg-purple-600 px-3 py-1 rounded-full text-sm font-medium">
                  {organizations.length} organizasyon
                </span>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Organizasyonlara bağlı konaklama kayıtları.
              </p>
              <button
                onClick={() => router.push('/konaklama/organizasyonlar')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Organizasyonları Görüntüle
              </button>
            </div>
          </div>
        </div>

        {/* Aktif Organizasyonlar Listesi */}
        {organizations.filter(org => org.status === 'ACTIVE').length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Aktif Organizasyonlar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {organizations
                .filter(org => org.status === 'ACTIVE')
                .slice(0, 6) // İlk 6 organizasyonu göster
                .map((org) => (
                  <div key={org.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-800 truncate">{org.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(org.status)}`}>
                        {org.status === 'ACTIVE' ? 'Aktif' : org.status}
                      </span>
                    </div>
                    
                    {org.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{org.description}</p>
                    )}
                    
                    <div className="text-xs text-gray-500 mb-3">
                      {org.baslangicTarihi && org.bitisTarihi && (
                        <div className="mb-1">
                          <span className="font-medium">Tarih:</span> {formatDate(org.baslangicTarihi)} - {formatDate(org.bitisTarihi)}
                        </div>
                      )}
                      {org.lokasyon && (
                        <div className="mb-1">
                          <span className="font-medium">Lokasyon:</span> {org.lokasyon}
                        </div>
                      )}
                      {org.sehir && (
                        <div>
                          <span className="font-medium">Şehir:</span> {org.sehir}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {org._count?.accommodations || 0} konaklama kaydı
                      </span>
                      <button
                        onClick={() => router.push(`/konaklama/organizasyonlar/${org.id}`)}
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                      >
                        Detayları Gör →
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            
            {organizations.filter(org => org.status === 'ACTIVE').length > 6 && (
              <div className="text-center mt-4">
                <button
                  onClick={() => router.push('/konaklama/organizasyonlar')}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Tüm organizasyonları görüntüle →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Hızlı İşlemler */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Hızlı İşlemler</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/konaklama/munferit?action=add')}
              className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Münferit Kayıt Ekle
            </button>
            
            <button
              onClick={() => router.push('/konaklama/organizasyonlar?action=add')}
              className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Organizasyon Kaydı Ekle
            </button>
            
            <button
              onClick={() => router.push('/konaklama/munferit?action=import')}
              className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Excel İçe Aktar
            </button>
            
            <button
              onClick={() => router.push('/konaklama/munferit?action=export')}
              className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel Dışa Aktar
            </button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}