'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/layout/AuthGuard';
import { canViewModule } from '@/lib/permissions';

interface Hotel {
  id: number;
  adi: string;
  adres: string;
  sehir: string;
  ulke: string;
  telefon?: string;
  email?: string;
  website?: string;
  yildizSayisi: number;
  puan: number;
  aciklama?: string;
  durum: 'AKTIF' | 'PASIF' | 'TAMAMEN_DOLU' | 'BAKIM';
  createdAt: string;
  updatedAt: string;
}

interface CurrentUser {
  id: number;
  email: string;
  name?: string;
  role: 'ADMIN' | 'MUDUR' | 'OPERATOR' | 'KULLANICI';
}

export default function OtellerPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  
  // Toplu seçim state'leri
  const [selectedHotelIds, setSelectedHotelIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Form data
  const [newHotel, setNewHotel] = useState({
    adi: '',
    adres: '',
    sehir: '',
    ulke: '',
    telefon: '',
    email: '',
    website: '',
    yildizSayisi: 0,
    puan: 0.0,
    aciklama: '',
    durum: 'AKTIF' as 'AKTIF' | 'PASIF' | 'TAMAMEN_DOLU' | 'BAKIM'
  });

  const [editHotel, setEditHotel] = useState({
    id: 0,
    adi: '',
    adres: '',
    sehir: '',
    ulke: '',
    telefon: '',
    email: '',
    website: '',
    yildizSayisi: 0,
    puan: 0.0,
    aciklama: '',
    durum: 'AKTIF' as 'AKTIF' | 'PASIF' | 'TAMAMEN_DOLU' | 'BAKIM'
  });

  const [ratingForm, setRatingForm] = useState({
    yildizSayisi: 0,
    puan: 0.0,
    yorum: ''
  });

  // Arama ve filtreleme
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [starFilter, setStarFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');

  
  // Sıralama state'leri
  const [sortField, setSortField] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    checkCurrentUser();
    fetchHotels();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const res = await fetch('/api/user', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setUserPermissions(data.user.permissions || []);
      }
    } catch (error) {
      console.error('Kullanıcı bilgisi alınamadı:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/konaklama/oteller');
      if (response.ok) {
        const data = await response.json();
        setHotels(Array.isArray(data) ? data : []);
      } else {
        setHotels([]);
      }
    } catch (error) {
      console.error('Oteller yüklenirken hata:', error);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string) => {
    return userPermissions.includes(permission) || currentUser?.role === 'ADMIN';
  };

  const hasPageAccess = (): boolean => {
    if (currentUser?.role === 'ADMIN') {
      return true;
    }
    return canViewModule(currentUser?.role || '', 'accommodation');
  };

  const canAdd = () => {
    return currentUser?.role === 'ADMIN' || currentUser?.role === 'MUDUR' || currentUser?.role === 'OPERATOR';
  };

  const canEdit = () => {
    return currentUser?.role === 'ADMIN' || currentUser?.role === 'MUDUR';
  };

  const canDelete = () => {
    return currentUser?.role === 'ADMIN' || currentUser?.role === 'MUDUR';
  };

  const openAddModal = () => {
    setNewHotel({
      adi: '',
      adres: '',
      sehir: '',
      ulke: '',
      telefon: '',
      email: '',
      website: '',
      yildizSayisi: 0,
      puan: 0.0,
      aciklama: '',
      durum: 'AKTIF'
    });
    setShowAddModal(true);
  };

  const openEditModal = (hotel: Hotel) => {
    setEditHotel({
      id: hotel.id,
      adi: hotel.adi,
      adres: hotel.adres,
      sehir: hotel.sehir,
      ulke: hotel.ulke,
      telefon: hotel.telefon || '',
      email: hotel.email || '',
      website: hotel.website || '',
      yildizSayisi: hotel.yildizSayisi,
      puan: hotel.puan,
      aciklama: hotel.aciklama || '',
      durum: hotel.durum
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setShowDeleteModal(true);
  };

  const openRatingModal = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setRatingForm({
      yildizSayisi: hotel.yildizSayisi,
      puan: hotel.puan,
      yorum: ''
    });
    setShowRatingModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedHotel(null);
  };

  const closeRatingModal = () => {
    setShowRatingModal(false);
    setSelectedHotel(null);
  };

  const handleAddHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/konaklama/oteller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHotel),
      });

      if (response.ok) {
        closeAddModal();
        fetchHotels();
      } else {
        const error = await response.json();
        alert('Otel eklenirken hata: ' + error.message);
      }
    } catch (error) {
      console.error('Otel eklenirken hata:', error);
      alert('Otel eklenirken hata oluştu');
    }
  };

  const handleUpdateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/konaklama/oteller/${editHotel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editHotel),
      });

      if (response.ok) {
        closeEditModal();
        fetchHotels();
      } else {
        const error = await response.json();
        alert('Otel güncellenirken hata: ' + error.message);
      }
    } catch (error) {
      console.error('Otel güncellenirken hata:', error);
      alert('Otel güncellenirken hata oluştu');
    }
  };

  const handleDeleteHotel = async () => {
    if (!selectedHotel) return;

    try {
      const response = await fetch(`/api/konaklama/oteller/${selectedHotel.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        closeDeleteModal();
        fetchHotels();
      } else {
        const error = await response.json();
        alert('Otel silinirken hata: ' + error.message);
      }
    } catch (error) {
      console.error('Otel silinirken hata:', error);
      alert('Otel silinirken hata oluştu');
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotel) return;

    try {
      const response = await fetch(`/api/konaklama/oteller/${selectedHotel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedHotel,
          yildizSayisi: ratingForm.yildizSayisi,
          puan: ratingForm.puan
        }),
      });

      if (response.ok) {
        closeRatingModal();
        fetchHotels();
        alert('Puanlama başarıyla güncellendi!');
      } else {
        const error = await response.json();
        alert('Puanlama güncellenirken hata: ' + error.message);
      }
    } catch (error) {
      console.error('Puanlama güncellenirken hata:', error);
      alert('Puanlama güncellenirken hata oluştu');
    }
  };

  const handleFetchTurkeyHotels = async () => {
    // Yakında aktif edilecek popup'ı göster
    alert('🚧 Bu özellik yakında aktif edilecektir!\n\nAPI entegrasyonları şu anda geliştirme aşamasındadır. Lütfen daha sonra tekrar deneyin.');
  };



  // Toplu seçim fonksiyonları
  const handleSelectHotel = (hotelId: number) => {
    setSelectedHotelIds(prev => {
      if (prev.includes(hotelId)) {
        return prev.filter(id => id !== hotelId);
      } else {
        return [...prev, hotelId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedHotelIds.length === sortedHotels.length) {
      setSelectedHotelIds([]);
    } else {
      setSelectedHotelIds(sortedHotels.map(hotel => hotel.id));
    }
  };

  const handleBulkDeleteRequest = () => {
    if (selectedHotelIds.length === 0) {
      alert('Lütfen silinecek otelleri seçin!');
      return;
    }
    setShowBulkDeleteModal(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedHotelIds.length === 0) return;

    setIsBulkDeleting(true);
    try {
      const response = await fetch('/api/konaklama/oteller/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelIds: selectedHotelIds }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ ${result.count} otel başarıyla silindi!`);
        setSelectedHotelIds([]);
        setShowBulkDeleteModal(false);
        fetchHotels(); // Otelleri yeniden yükle
      } else {
        const error = await response.json();
        alert('❌ Hata: ' + error.message);
      }
    } catch (error) {
      console.error('Toplu silme hatası:', error);
      alert('❌ Toplu silme işlemi başarısız oldu!');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AKTIF': return 'bg-green-100 text-green-800';
      case 'PASIF': return 'bg-gray-100 text-gray-800';
      case 'TAMAMEN_DOLU': return 'bg-red-100 text-red-800';
      case 'BAKIM': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AKTIF': return 'Aktif';
      case 'PASIF': return 'Pasif';
      case 'TAMAMEN_DOLU': return 'Tamamen Dolu';
      case 'BAKIM': return 'Bakım';
      default: return status;
    }
  };

  const renderStars = (stars: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${i < stars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">({stars})</span>
      </div>
    );
  };

  // Benzersiz şehir ve ülke listelerini oluştur
  const uniqueCities = [...new Set(hotels?.map(hotel => hotel.sehir) || [])].sort();
  const uniqueCountries = [...new Set(hotels?.map(hotel => hotel.ulke) || [])].sort();

  const filteredHotels = hotels?.filter(hotel => {
    // Arama terimi kontrolü (otel adı, şehir, ülke, adres, açıklama)
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
                         hotel.adi.toLowerCase().includes(searchLower) ||
                         hotel.sehir.toLowerCase().includes(searchLower) ||
                         hotel.ulke.toLowerCase().includes(searchLower) ||
                         hotel.adres.toLowerCase().includes(searchLower) ||
                         (hotel.aciklama && hotel.aciklama.toLowerCase().includes(searchLower));
    
    // Durum filtresi
    const matchesStatus = statusFilter === 'all' || hotel.durum === statusFilter;
    
    // Yıldız filtresi
    const matchesStars = starFilter === 'all' || hotel.yildizSayisi.toString() === starFilter;
    
    // Şehir filtresi
    const matchesCity = cityFilter === 'all' || hotel.sehir === cityFilter;
    
    // Ülke filtresi
    const matchesCountry = countryFilter === 'all' || hotel.ulke === countryFilter;
    
    // Puan filtresi
    let matchesRating = true;
    if (ratingFilter !== 'all') {
      const rating = parseFloat(ratingFilter);
      switch (ratingFilter) {
        case '9+':
          matchesRating = hotel.puan >= 9;
          break;
        case '8+':
          matchesRating = hotel.puan >= 8;
          break;
        case '7+':
          matchesRating = hotel.puan >= 7;
          break;
        case '6+':
          matchesRating = hotel.puan >= 6;
          break;
        case '5+':
          matchesRating = hotel.puan >= 5;
          break;
        default:
          matchesRating = hotel.puan >= rating;
      }
    }
    
    return matchesSearch && matchesStatus && matchesStars && matchesCity && matchesCountry && matchesRating;
  }) || [];

  // Sıralama fonksiyonu
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sıralanmış oteller
  const sortedHotels = [...filteredHotels].sort((a, b) => {
    let aValue: any = a[sortField as keyof Hotel];
    let bValue: any = b[sortField as keyof Hotel];

    // String değerler için
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Sıralama ikonu bileşeni
  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!hasPageAccess()) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Erişim Kısıtlı</h2>
            <p className="text-gray-600">Bu sayfaya erişim izniniz bulunmamaktadır.</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Otel Yönetimi</h1>
            <p className="text-gray-600">Sistemdeki otelleri yönetin</p>
          </div>
          <div className="flex gap-2">
            {canAdd() && (
              <button
                onClick={openAddModal}
                className="btn btn-primary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Yeni Otel Ekle
              </button>
            )}

            <button
              onClick={handleFetchTurkeyHotels}
              className="btn btn-success flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              API'lerden Otelleri Çek
            </button>
            {canDelete() && selectedHotelIds.length > 0 && (
              <button
                onClick={handleBulkDeleteRequest}
                className="btn btn-error flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Seçili Otelleri Sil ({selectedHotelIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Filtreler */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Filtreler ve Arama</h3>
            <p className="text-sm text-gray-600">Otelleri şehir, ülke, yıldız, puan ve duruma göre filtreleyin</p>
          </div>
          
          {/* Ana Arama */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Genel Arama</label>
            <input
              type="text"
              placeholder="Otel adı, şehir, ülke, adres, açıklama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full text-base"
            />
          </div>

          {/* Filtre Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
            {/* Şehir Filtresi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="input w-full"
              >
                <option value="all">Tüm Şehirler</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Ülke Filtresi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ülke</label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="input w-full"
              >
                <option value="all">Tüm Ülkeler</option>
                {uniqueCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            {/* Durum Filtresi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-full"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="AKTIF">Aktif</option>
                <option value="PASIF">Pasif</option>
                <option value="TAMAMEN_DOLU">Tamamen Dolu</option>
                <option value="BAKIM">Bakım</option>
              </select>
            </div>

            {/* Yıldız Filtresi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yıldız</label>
              <select
                value={starFilter}
                onChange={(e) => setStarFilter(e.target.value)}
                className="input w-full"
              >
                <option value="all">Tüm Yıldızlar</option>
                <option value="5">5 Yıldız</option>
                <option value="4">4 Yıldız</option>
                <option value="3">3 Yıldız</option>
                <option value="2">2 Yıldız</option>
                <option value="1">1 Yıldız</option>
                <option value="0">Yıldızsız</option>
              </select>
            </div>

            {/* Puan Filtresi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Puan</label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="input w-full"
              >
                <option value="all">Tüm Puanlar</option>
                <option value="9+">9+ Puan</option>
                <option value="8+">8+ Puan</option>
                <option value="7+">7+ Puan</option>
                <option value="6+">6+ Puan</option>
                <option value="5+">5+ Puan</option>
              </select>
            </div>

            {/* Filtreleri Temizle */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setStarFilter('all');
                  setCityFilter('all');
                  setCountryFilter('all');
                  setRatingFilter('all');
                  setSortField('id');
                  setSortDirection('desc');
                }}
                className="btn btn-secondary w-full"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Temizle
              </button>
            </div>
          </div>

          {/* Sonuç Bilgisi */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <span className="font-medium">{sortedHotels.length}</span> otel bulundu
              {searchTerm || statusFilter !== 'all' || starFilter !== 'all' || cityFilter !== 'all' || countryFilter !== 'all' || ratingFilter !== 'all' ? (
                <span className="ml-2">(filtrelenmiş)</span>
              ) : null}
            </div>
            <div>
              Toplam: <span className="font-medium">{hotels.length}</span> otel
            </div>
          </div>
        </div>

        {/* Oteller Tablosu */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th className="w-12">
                      <input 
                        type="checkbox" 
                        className="checkbox checkbox-sm" 
                        checked={selectedHotelIds.length === sortedHotels.length && sortedHotels.length > 0} 
                        onChange={handleSelectAll} 
                      />
                    </th>
                    <th 
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleSort('adi')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Otel Adı</span>
                        <SortIcon field="adi" />
                      </div>
                    </th>
                    <th 
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleSort('sehir')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Şehir/Ülke</span>
                        <SortIcon field="sehir" />
                      </div>
                    </th>
                    <th 
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleSort('yildizSayisi')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Yıldız</span>
                        <SortIcon field="yildizSayisi" />
                      </div>
                    </th>
                    <th 
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleSort('puan')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Puan</span>
                        <SortIcon field="puan" />
                      </div>
                    </th>
                    <th 
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleSort('durum')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Durum</span>
                        <SortIcon field="durum" />
                      </div>
                    </th>
                    <th>İletişim</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedHotels.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">
                        {searchTerm || statusFilter !== 'all' || starFilter !== 'all' || cityFilter !== 'all' || countryFilter !== 'all' || ratingFilter !== 'all'
                          ? 'Filtrelere uygun otel bulunamadı' 
                          : 'Henüz otel eklenmemiş'}
                      </td>
                    </tr>
                  ) : (
                    sortedHotels.map((hotel) => (
                      <tr key={hotel.id} className="hover:bg-gray-50">
                        <td className="w-12">
                          <input 
                            type="checkbox" 
                            className="checkbox checkbox-sm" 
                            checked={selectedHotelIds.includes(hotel.id)} 
                            onChange={() => handleSelectHotel(hotel.id)} 
                          />
                        </td>
                        <td>
                          <div>
                            <div className="font-medium text-gray-900">{hotel.adi}</div>
                            <div className="text-sm text-gray-500">{hotel.adres}</div>
                          </div>
                        </td>
                        <td>
                          <div className="text-sm">
                            <div className="font-medium">{hotel.sehir}</div>
                            <div className="text-gray-500">{hotel.ulke}</div>
                          </div>
                        </td>
                        <td>{renderStars(hotel.yildizSayisi)}</td>
                        <td>
                          <div className="flex items-center">
                            <span className="font-medium">{hotel.puan.toFixed(1)}</span>
                            <span className="text-gray-500 ml-1">/10</span>
                          </div>
                        </td>
                        <td>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(hotel.durum)}`}>
                            {getStatusLabel(hotel.durum)}
                          </span>
                        </td>
                        <td>
                          <div className="text-sm">
                            {hotel.telefon && <div className="text-gray-600">{hotel.telefon}</div>}
                            {hotel.email && <div className="text-gray-600">{hotel.email}</div>}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openRatingModal(hotel)}
                              className="btn btn-sm btn-warning"
                              title="Puanla"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            </button>
                            {canEdit() && (
                              <button
                                onClick={() => openEditModal(hotel)}
                                className="btn btn-sm btn-secondary"
                                title="Düzenle"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                            {canDelete() && (
                              <button
                                onClick={() => openDeleteModal(hotel)}
                                className="btn btn-sm btn-error"
                                title="Sil"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Yeni Otel Ekleme Modal */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-content max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Yeni Otel Ekle</h2>
                <button onClick={closeAddModal} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAddHotel} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Otel Adı *</label>
                    <input
                      type="text"
                      required
                      value={newHotel.adi}
                      onChange={(e) => setNewHotel({...newHotel, adi: e.target.value})}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Şehir *</label>
                    <input
                      type="text"
                      required
                      value={newHotel.sehir}
                      onChange={(e) => setNewHotel({...newHotel, sehir: e.target.value})}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ülke *</label>
                    <input
                      type="text"
                      required
                      value={newHotel.ulke}
                      onChange={(e) => setNewHotel({...newHotel, ulke: e.target.value})}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <input
                      type="text"
                      value={newHotel.telefon}
                      onChange={(e) => setNewHotel({...newHotel, telefon: e.target.value})}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                    <input
                      type="email"
                      value={newHotel.email}
                      onChange={(e) => setNewHotel({...newHotel, email: e.target.value})}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={newHotel.website}
                      onChange={(e) => setNewHotel({...newHotel, website: e.target.value})}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                    <select
                      value={newHotel.durum}
                      onChange={(e) => setNewHotel({...newHotel, durum: e.target.value as any})}
                      className="input w-full"
                    >
                      <option value="AKTIF">Aktif</option>
                      <option value="PASIF">Pasif</option>
                      <option value="TAMAMEN_DOLU">Tamamen Dolu</option>
                      <option value="BAKIM">Bakım</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                  <textarea
                    value={newHotel.adres}
                    onChange={(e) => setNewHotel({...newHotel, adres: e.target.value})}
                    className="input w-full"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <textarea
                    value={newHotel.aciklama}
                    onChange={(e) => setNewHotel({...newHotel, aciklama: e.target.value})}
                    className="input w-full"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={closeAddModal} className="btn btn-secondary">
                    İptal
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Otel Ekle
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Otel Düzenleme Modal */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal-content max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Otel Düzenle</h2>
                <button onClick={closeEditModal} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleUpdateHotel} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Otel Adı *</label>
                    <input
                      type="text"
                      required
                      value={editHotel.adi}
                      onChange={(e) => setEditHotel({...editHotel, adi: e.target.value})}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Şehir *</label>
                    <input
                      type="text"
                      required
                      value={editHotel.sehir}
                      onChange={(e) => setEditHotel({...editHotel, sehir: e.target.value})}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ülke *</label>
                    <input
                      type="text"
                      required
                      value={editHotel.ulke}
                      onChange={(e) => setEditHotel({...editHotel, ulke: e.target.value})}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <input
                      type="text"
                      value={editHotel.telefon}
                      onChange={(e) => setEditHotel({...editHotel, telefon: e.target.value})}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                    <input
                      type="email"
                      value={editHotel.email}
                      onChange={(e) => setEditHotel({...editHotel, email: e.target.value})}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={editHotel.website}
                      onChange={(e) => setEditHotel({...editHotel, website: e.target.value})}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Yıldız Sayısı</label>
                    <select
                      value={editHotel.yildizSayisi}
                      onChange={(e) => setEditHotel({...editHotel, yildizSayisi: parseInt(e.target.value)})}
                      className="input w-full"
                    >
                      <option value={0}>Yıldızsız</option>
                      <option value={1}>1 Yıldız</option>
                      <option value={2}>2 Yıldız</option>
                      <option value={3}>3 Yıldız</option>
                      <option value={4}>4 Yıldız</option>
                      <option value={5}>5 Yıldız</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Puan (0-10)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={editHotel.puan}
                      onChange={(e) => setEditHotel({...editHotel, puan: parseFloat(e.target.value)})}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                    <select
                      value={editHotel.durum}
                      onChange={(e) => setEditHotel({...editHotel, durum: e.target.value as any})}
                      className="input w-full"
                    >
                      <option value="AKTIF">Aktif</option>
                      <option value="PASIF">Pasif</option>
                      <option value="TAMAMEN_DOLU">Tamamen Dolu</option>
                      <option value="BAKIM">Bakım</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                  <textarea
                    value={editHotel.adres}
                    onChange={(e) => setEditHotel({...editHotel, adres: e.target.value})}
                    className="input w-full"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <textarea
                    value={editHotel.aciklama}
                    onChange={(e) => setEditHotel({...editHotel, aciklama: e.target.value})}
                    className="input w-full"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={closeEditModal} className="btn btn-secondary">
                    İptal
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Güncelle
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Silme Onay Modal */}
        {showDeleteModal && selectedHotel && (
          <div className="modal-overlay">
            <div className="modal-content max-w-md">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Otel Sil</h3>
                <p className="text-gray-600 mb-6">
                  <strong>{selectedHotel.adi}</strong> otelini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
                <div className="flex justify-center space-x-3">
                  <button onClick={closeDeleteModal} className="btn btn-secondary">
                    İptal
                  </button>
                  <button onClick={handleDeleteHotel} className="btn btn-error">
                    Sil
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toplu Silme Modal */}
        {showBulkDeleteModal && (
          <div className="modal-overlay">
            <div className="modal-content max-w-md">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Toplu Otel Silme</h3>
                <p className="text-gray-600 mb-6">
                  <strong>{selectedHotelIds.length} otel</strong> seçtiniz. Bu otelleri kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
                <div className="flex justify-center space-x-3">
                  <button 
                    onClick={() => setShowBulkDeleteModal(false)} 
                    className="btn btn-secondary"
                    disabled={isBulkDeleting}
                  >
                    İptal
                  </button>
                  <button 
                    onClick={handleBulkDeleteConfirm} 
                    className="btn btn-error"
                    disabled={isBulkDeleting}
                  >
                    {isBulkDeleting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Siliniyor...
                      </div>
                    ) : (
                      'Sil'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Puanlama Modal */}
        {showRatingModal && selectedHotel && (
          <div className="modal-overlay">
            <div className="modal-content max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Otel Puanlama</h2>
                <button onClick={closeRatingModal} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{selectedHotel.adi}</h3>
                <p className="text-gray-600">{selectedHotel.sehir}, {selectedHotel.ulke}</p>
              </div>
              <form onSubmit={handleRatingSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yıldız Sayısı</label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingForm({...ratingForm, yildizSayisi: star})}
                        className={`p-2 rounded-lg transition-colors ${
                          ratingForm.yildizSayisi >= star 
                            ? 'bg-yellow-100 text-yellow-600' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Seçilen: {ratingForm.yildizSayisi} yıldız</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Puan (0-10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={ratingForm.puan}
                    onChange={(e) => setRatingForm({...ratingForm, puan: parseFloat(e.target.value)})}
                    className="input w-full"
                    placeholder="Örn: 8.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yorum (Opsiyonel)</label>
                  <textarea
                    value={ratingForm.yorum}
                    onChange={(e) => setRatingForm({...ratingForm, yorum: e.target.value})}
                    className="input w-full"
                    rows={3}
                    placeholder="Otel hakkında yorumunuzu yazın..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={closeRatingModal} className="btn btn-secondary">
                    İptal
                  </button>
                  <button type="submit" className="btn btn-warning">
                    Puanla
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
