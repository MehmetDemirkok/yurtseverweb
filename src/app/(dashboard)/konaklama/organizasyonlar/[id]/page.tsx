'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AccommodationTableSection from "@/app/components/AccommodationTableSection";
import AuthGuard from "@/components/layout/AuthGuard";

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
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  baslangicTarihi?: string;
  bitisTarihi?: string;
  lokasyon?: string;
  sehir?: string;
  ulke?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
  _count?: {
    accommodations: number;
  };
}

export default function OrganizasyonDetayPage() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.id as string;
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);
  
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

  // Organizasyon bilgilerini yükle
  useEffect(() => {
    if (organizationId && !isLoading) {
      fetchOrganization();
    }
  }, [organizationId, isLoading]);

  const fetchOrganization = async () => {
    try {
      setLoadingOrg(true);
      console.log('Fetching organization with ID:', organizationId);
      
      const response = await fetch(`/api/organizations/${organizationId}`);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Organization data:', data);
        setOrganization(data);
      } else {
        const errorData = await response.json();
        console.error('Organizasyon bulunamadı:', errorData);
        
        // Eğer organizasyon bulunamadıysa organizasyonlar listesine yönlendir
        if (response.status === 404) {
          alert('Organizasyon bulunamadı veya silinmiş olabilir.');
        } else {
          alert('Organizasyon yüklenirken bir hata oluştu.');
        }
        router.push('/konaklama/organizasyonlar');
      }
    } catch (error) {
      console.error('Organizasyon yüklenirken hata:', error);
      alert('Organizasyon yüklenirken bir hata oluştu.');
      router.push('/konaklama/organizasyonlar');
    } finally {
      setLoadingOrg(false);
    }
  };

  // İzin kontrolü fonksiyonları
  const hasPermission = (permission: string): boolean => {
    return userPermissions.includes(permission) || currentUser?.role === 'ADMIN';
  };

  const hasPageAccess = (): boolean => {
    if (currentUser?.role === 'ADMIN') {
      return true;
    }
    return hasPermission('accommodation');
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Aktif';
      case 'INACTIVE': return 'Pasif';
      case 'SUSPENDED': return 'Askıya Alınmış';
      default: return status;
    }
  };

  // Puantaj raporu fonksiyonu
  const handlePuantajRaporu = () => {
    // Bu organizasyon için puantaj raporu
    router.push(`/konaklama/organizasyonlar/${organizationId}?action=puantaj`);
  };

  // Loading durumu
  if (isLoading || loadingOrg) {
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
              <p className="text-sm sm:text-base text-gray-600">
                {isLoading ? 'Kullanıcı bilgileri kontrol ediliyor.' : 'Organizasyon bilgileri yükleniyor.'}
              </p>
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

  // Organizasyon bulunamadı
  if (!organization) {
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
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Organizasyon Bulunamadı</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Aradığınız organizasyon bulunamadı veya silinmiş olabilir.</p>
              <button 
                onClick={() => router.push('/konaklama/organizasyonlar')}
                className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                Organizasyonlara Dön
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
        {/* Başlık */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/konaklama/organizasyonlar')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{organization.name}</h1>
                <p className="text-gray-600 mt-1">Organizasyon konaklama kayıtları</p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/konaklama/organizasyonlar/${organizationId}?action=add`)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Yeni Kayıt Ekle
            </button>
          </div>
        </div>

        {/* Organizasyon Bilgileri */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Organizasyon Bilgileri</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Durum:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(organization.status)}`}>
                    {getStatusText(organization.status)}
                  </span>
                </div>
                {organization.description && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Açıklama:</span>
                    <p className="text-sm text-gray-800 mt-1">{organization.description}</p>
                  </div>
                )}
                {organization.baslangicTarihi && organization.bitisTarihi && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Tarih Aralığı:</span>
                    <p className="text-sm text-gray-800 mt-1">
                      {formatDate(organization.baslangicTarihi)} - {formatDate(organization.bitisTarihi)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Lokasyon Bilgileri</h3>
              <div className="space-y-3">
                {organization.lokasyon && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Lokasyon:</span>
                    <p className="text-sm text-gray-800 mt-1">{organization.lokasyon}</p>
                  </div>
                )}
                {organization.sehir && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Şehir:</span>
                    <p className="text-sm text-gray-800 mt-1">{organization.sehir}</p>
                  </div>
                )}
                {organization.ulke && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Ülke:</span>
                    <p className="text-sm text-gray-800 mt-1">{organization.ulke}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">İletişim Bilgileri</h3>
              <div className="space-y-3">
                {organization.contactPerson && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">İletişim Kişisi:</span>
                    <p className="text-sm text-gray-800 mt-1">{organization.contactPerson}</p>
                  </div>
                )}
                {organization.contactEmail && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">E-posta:</span>
                    <p className="text-sm text-gray-800 mt-1">{organization.contactEmail}</p>
                  </div>
                )}
                {organization.contactPhone && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Telefon:</span>
                    <p className="text-sm text-gray-800 mt-1">{organization.contactPhone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Kayıt</p>
                <p className="text-2xl font-bold text-gray-900">{organization._count?.accommodations || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Durum</p>
                <p className="text-2xl font-bold text-gray-900">{getStatusText(organization.status)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Oluşturulma</p>
                <p className="text-2xl font-bold text-gray-900">{formatDate(organization.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Organizasyon konaklamaları tablosu */}
        <AccommodationTableSection 
          handlePuantajRaporu={handlePuantajRaporu}
          filterType="organization"
          organizationId={parseInt(organizationId)}
        />
      </div>
    </AuthGuard>
  );
}
