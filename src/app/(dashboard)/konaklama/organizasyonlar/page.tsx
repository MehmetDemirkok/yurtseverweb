'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

export default function OrganizasyonlarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modal state'leri
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [deletingOrganization, setDeletingOrganization] = useState<Organization | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    if (!isLoading) {
      fetchOrganizations();
    }
  }, [isLoading]);

  const fetchOrganizations = async () => {
    try {
      console.log('Fetching organizations...');
      const response = await fetch('/api/organizations');
      console.log('Organizations response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Organizations data:', data);
        setOrganizations(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json();
        console.error('Organizasyonlar yüklenirken hata:', errorData);
        setOrganizations([]);
      }
    } catch (error) {
      console.error('Organizasyonlar yüklenirken hata:', error);
      setOrganizations([]);
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

  // Düzenleme modal'ını aç
  const handleEditClick = (org: Organization) => {
    setEditingOrganization(org);
    setShowEditModal(true);
  };

  // Silme modal'ını aç
  const handleDeleteClick = (org: Organization) => {
    setDeletingOrganization(org);
    setShowDeleteModal(true);
  };

  // Düzenleme modal'ını kapat
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingOrganization(null);
  };

  // Silme modal'ını kapat
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingOrganization(null);
  };

  // Organizasyon düzenleme
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrganization) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const updateData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        contactPerson: formData.get('contactPerson') as string,
        contactEmail: formData.get('contactEmail') as string,
        contactPhone: formData.get('contactPhone') as string,
        status: formData.get('status') as string,
        baslangicTarihi: formData.get('baslangicTarihi') as string,
        bitisTarihi: formData.get('bitisTarihi') as string,
        lokasyon: formData.get('lokasyon') as string,
        sehir: formData.get('sehir') as string,
        ulke: formData.get('ulke') as string,
      };

      const response = await fetch(`/api/organizations/${editingOrganization.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        await fetchOrganizations();
        closeEditModal();
      } else {
        const error = await response.json();
        alert(`Güncelleme hatası: ${error.error}`);
      }
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      alert('Güncelleme sırasında bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Organizasyon silme
  const handleDeleteConfirm = async () => {
    if (!deletingOrganization) return;

    console.log('Silme işlemi başlatılıyor:', deletingOrganization.id);
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/organizations/${deletingOrganization.id}`, {
        method: 'DELETE',
        credentials: 'include', // Cookie'leri dahil et
      });

      console.log('Silme response status:', response.status);
      console.log('Silme response headers:', response.headers);

      if (response.ok) {
        console.log('Organizasyon başarıyla silindi');
        await fetchOrganizations();
        closeDeleteModal();
      } else {
        const error = await response.json();
        console.error('Silme API hatası:', error);
        alert(`Silme hatası: ${error.error}`);
      }
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme sırasında bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrelenmiş organizasyonlar
  const filteredOrganizations = organizations.filter(org => {
    const statusMatch = filterStatus === 'all' || org.status === filterStatus;
    const searchMatch = !searchTerm || 
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (org.description && org.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (org.lokasyon && org.lokasyon.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (org.sehir && org.sehir.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return statusMatch && searchMatch;
  });

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
        {/* Başlık */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/konaklama')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Organizasyonlar</h1>
                <p className="text-gray-600 mt-1">Konaklama organizasyonları ve kayıtları</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/konaklama/organizasyonlar?action=add')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Yeni Organizasyon
            </button>
          </div>
        </div>

        {/* Filtreler */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Arama</label>
              <input
                type="text"
                placeholder="Organizasyon adı, açıklama, lokasyon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="sm:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Tümü</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Pasif</option>
                <option value="SUSPENDED">Askıya Alınmış</option>
              </select>
            </div>
          </div>
        </div>

        {/* Organizasyonlar Listesi */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((org) => (
            <div key={org.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 truncate">{org.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(org.status)}`}>
                    {getStatusText(org.status)}
                  </span>
                </div>
                
                {org.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{org.description}</p>
                )}
                
                <div className="space-y-2 mb-4">
                  {org.baslangicTarihi && org.bitisTarihi && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(org.baslangicTarihi)} - {formatDate(org.bitisTarihi)}
                    </div>
                  )}
                  
                  {org.lokasyon && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {org.lokasyon}
                    </div>
                  )}
                  
                  {org.sehir && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {org.sehir}
                    </div>
                  )}
                  
                  {org.contactPerson && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {org.contactPerson}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{org._count?.accommodations || 0}</span> konaklama kaydı
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/konaklama/organizasyonlar/${org.id}`)}
                      className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center"
                    >
                      Konaklamaları Gör
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditClick(org)}
                        className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        title="Düzenle"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(org)}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Sil"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Boş durum */}
        {filteredOrganizations.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Organizasyon bulunamadı</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Arama kriterlerinize uygun organizasyon bulunamadı.'
                : 'Henüz hiç organizasyon oluşturulmamış.'
              }
            </p>
            <button
              onClick={() => router.push('/konaklama/organizasyonlar?action=add')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              İlk Organizasyonu Oluştur
            </button>
          </div>
        )}

        {/* Düzenleme Modal */}
        {showEditModal && editingOrganization && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) closeEditModal(); }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 p-8 relative animate-fade-in border border-blue-100">
              <button
                onClick={closeEditModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
                aria-label="Kapat"
              >
                ×
              </button>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Organizasyonu Düzenle</h2>
              </div>
              <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organizasyon Adı <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingOrganization.name}
                    className="input w-full border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                  <select
                    name="status"
                    defaultValue={editingOrganization.status}
                    className="input w-full border border-gray-300 rounded-md"
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Pasif</option>
                    <option value="SUSPENDED">Askıya Alınmış</option>
                  </select>
                </div>
                <div className="form-group md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <textarea
                    name="description"
                    defaultValue={editingOrganization.description || ''}
                    rows={3}
                    className="input w-full border border-gray-300 rounded-md"
                  />
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    name="baslangicTarihi"
                    defaultValue={editingOrganization.baslangicTarihi || ''}
                    className="input w-full border border-gray-300 rounded-md"
                  />
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                  <input
                    type="date"
                    name="bitisTarihi"
                    defaultValue={editingOrganization.bitisTarihi || ''}
                    className="input w-full border border-gray-300 rounded-md"
                  />
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lokasyon</label>
                  <input
                    type="text"
                    name="lokasyon"
                    defaultValue={editingOrganization.lokasyon || ''}
                    className="input w-full border border-gray-300 rounded-md"
                  />
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                  <input
                    type="text"
                    name="sehir"
                    defaultValue={editingOrganization.sehir || ''}
                    className="input w-full border border-gray-300 rounded-md"
                  />
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ülke</label>
                  <input
                    type="text"
                    name="ulke"
                    defaultValue={editingOrganization.ulke || 'Türkiye'}
                    className="input w-full border border-gray-300 rounded-md"
                  />
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">İletişim Kişisi</label>
                  <input
                    type="text"
                    name="contactPerson"
                    defaultValue={editingOrganization.contactPerson || ''}
                    className="input w-full border border-gray-300 rounded-md"
                  />
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                  <input
                    type="email"
                    name="contactEmail"
                    defaultValue={editingOrganization.contactEmail || ''}
                    className="input w-full border border-gray-300 rounded-md"
                  />
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    defaultValue={editingOrganization.contactPhone || ''}
                    className="input w-full border border-gray-300 rounded-md"
                  />
                </div>
                <div className="col-span-2 flex justify-end space-x-2 mt-6">
                  <button type="button" className="btn btn-secondary" onClick={closeEditModal} disabled={isSubmitting}>İptal</button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Kaydediliyor...
                      </>
                    ) : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Silme Modal */}
        {showDeleteModal && deletingOrganization && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) closeDeleteModal(); }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8 relative animate-fade-in border border-red-100">
              <button
                onClick={closeDeleteModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
                aria-label="Kapat"
              >
                ×
              </button>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-red-700">Organizasyonu Sil</h2>
              </div>
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  <strong>{deletingOrganization.name}</strong> organizasyonunu silmek istediğinize emin misiniz?
                </p>
                {deletingOrganization._count?.accommodations > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-blue-800 font-medium">Bilgi</span>
                    </div>
                    <p className="text-blue-700 text-sm mt-1">
                      Bu organizasyona bağlı <strong>{deletingOrganization._count.accommodations}</strong> konaklama kaydı bulunmaktadır. 
                      Organizasyon silinirse bu kayıtlar otomatik olarak münferit konaklama olarak işaretlenecektir.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" className="btn btn-secondary" onClick={closeDeleteModal} disabled={isSubmitting}>İptal</button>
                <button type="button" className="btn btn-error bg-red-600 hover:bg-red-700 text-white font-bold" onClick={handleDeleteConfirm} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Siliniyor...
                    </>
                  ) : 'Evet, Sil'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
