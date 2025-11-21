"use client";

import { useState, useEffect, useMemo } from "react";
import * as XLSX from 'xlsx';
import BulkActionsMenu from "./BulkActionsMenu";
import AccommodationFormModal from "./AccommodationFormModal";
import AdvancedFilters, { FilterState } from "./AdvancedFilters";
import Pagination from "./Pagination";
import PaymentModal from "@/components/payment/PaymentModal";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface AccommodationRecord {
  id: number;
  adiSoyadi: string;
  unvani: string;
  ulke: string;
  sehir: string;
  girisTarihi: string;
  cikisTarihi: string;
  odaTipi: string;
  konaklamaTipi: "BB" | "HB" | "FB" | "UHD";
  gecelikUcret: number;
  toplamUcret: number;
  organizasyonAdi?: string;
  organizationId?: number;
  organization?: {
    id: number;
    name: string;
    status: string;
  };
  otelAdi?: string;
  kurumCari?: string;
  numberOfNights?: number;
  isMunferit?: boolean;
  companyId?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface User {
  id: number;
  email: string;
  name?: string;
  role: 'ADMIN' | 'SIRKET_YONETICISI';
  permissions?: string[];
}

interface AccommodationTableSectionProps {
  handlePuantajRaporu?: () => void;
  filterType?: 'all' | 'munferit' | 'organization';
  organizationId?: number;
  action?: string | null; // 'add', 'import', 'export'
  customBulkActions?: Array<{ label: string; onClick: () => void; icon?: React.ReactNode; color?: string }>;
  onSelectionChange?: (selectedIds: number[]) => void;
  filteredRecords?: AccommodationRecord[]; // Klasörden gelen filtrelenmiş kayıtlar
  transferredRecordIds?: Set<number>; // Satışa aktarılan kayıt ID'leri
}

export default function AccommodationTableSection({
  handlePuantajRaporu,
  filterType = 'all',
  organizationId,
  action,
  customBulkActions = [],
  onSelectionChange,
  filteredRecords,
  transferredRecordIds = new Set()
}: AccommodationTableSectionProps) {
  const [records, setRecords] = useState<AccommodationRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AccommodationRecord | null>(null);
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([]);
  const [sortColumn, setSortColumn] = useState<keyof AccommodationRecord | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('desc');
  const [showExportFilterModal, setShowExportFilterModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [availableColumns, setAvailableColumns] = useState<Array<{ key: string, label: string }>>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    accommodationCount: number;
    accommodationSaleCount: number;
    message: string;
  } | null>(null);

  // Form state'leri
  const [formData, setFormData] = useState({
    adiSoyadi: '',
    unvani: '',
    girisTarihi: '',
    cikisTarihi: '',
    odaTipi: 'Single Oda',
    konaklamaTipi: 'BB' as const,
    gecelikUcret: 0,
    toplamUcret: 0,
    otelAdi: '',
    kurumCari: '',
    numberOfNights: 0,
  });

  // Filtre state'leri
  const [filterOrg, setFilterOrg] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterTitle, setFilterTitle] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<FilterState | null>(null);

  // Sayfalama state'leri
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Organizasyon state'leri
  const [organizations, setOrganizations] = useState<Array<{ id: number, name: string, status: string }>>([]);
  const [hotels, setHotels] = useState<Array<{ id: number, adi: string, sehir: string, ulke: string, durum: string }>>([]);
  const [cariler, setCariler] = useState<Array<{ id: string, ad: string, soyad?: string, sirket?: string, tip: string, durum: string }>>([]);

  // Role tabanlı yetki kontrolü fonksiyonları
  const hasRole = (requiredRole: string): boolean => {
    if (!currentUser) return false;
    const roleHierarchy: Record<string, number> = { 'ADMIN': 4, 'MUDUR': 3, 'OPERATOR': 2, 'KULLANICI': 1 };
    const userRole = currentUser.role as string;
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  };

  const canAdd = () => hasRole('KULLANICI');
  const canEdit = () => hasRole('KULLANICI');
  const canDelete = () => hasRole('MUDUR');

  // useEffect ve API çağrıları
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/user', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch (error) {
        //
      }
    }
    fetchUser();
  }, []);

  // Handle actions from props
  useEffect(() => {
    if (action === 'add') {
      openAddModal();
    } else if (action === 'import') {
      setShowImportModal(true);
    } else if (action === 'export') {
      handleExportExcel(); // Opens the export modal
    }
  }, [action]);

  // currentUser değiştiğinde kayıtları çek
  useEffect(() => {
    // Eğer filteredRecords prop'u varsa, onu kullan (klasörden gelen)
    if (filteredRecords !== undefined) {
      setRecords(filteredRecords);
      setLoading(false);
      return;
    }

    // Normal fetch işlemi
    if (!currentUser) return;

    const fetchRecords = () => {
      let url = '/api/accommodation';

      // Filtreleme parametreleri ekle
      const params = new URLSearchParams();
      if (filterType === 'munferit') {
        params.append('isMunferit', 'true');
      } else if (filterType === 'organization' && organizationId) {
        params.append('organizationId', organizationId.toString());
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      fetch(url)
        .then(res => res.json())
        .then(data => {
          setRecords(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(error => {
          console.error('Records fetch error:', error);
          setRecords([]);
          setLoading(false);
        });
    };
    fetchRecords();

    // Organizasyonları çek
    fetch('/api/organizations')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOrganizations(data);
        } else {
          setOrganizations([]);
        }
      })
      .catch(err => {
        console.error('Organizasyonlar yüklenirken hata:', err);
        setOrganizations([]);
      });

    // Otelleri çek
    const fetchHotels = async () => {
      try {
        const res = await fetch('/api/konaklama/oteller');
        if (res.ok) {
          const data = await res.json();
          setHotels(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Oteller yüklenirken hata:', error);
      }
    };
    fetchHotels();

    // Carileri çek
    const fetchCariler = async () => {
      try {
        const res = await fetch('/api/cariler');
        if (res.ok) {
          const data = await res.json();
          setCariler(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Cariler yüklenirken hata:', error);
      }
    };
    fetchCariler();

    // filteredRecords değiştiğinde kayıtları güncelle
  }, [currentUser, action, filterType, organizationId, filteredRecords]);

  useEffect(() => {
    if (!currentUser) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && filteredRecords === undefined) {
        // Sadece filteredRecords yoksa refresh yap
        const fetchRecords = () => {
          let url = '/api/accommodation';
          const params = new URLSearchParams();
          if (filterType === 'munferit') {
            params.append('isMunferit', 'true');
          } else if (filterType === 'organization' && organizationId) {
            params.append('organizationId', organizationId.toString());
          }
          if (params.toString()) {
            url += `?${params.toString()}`;
          }
          fetch(url)
            .then(res => res.json())
            .then(data => {
              setRecords(Array.isArray(data) ? data : []);
            })
            .catch(error => {
              console.error('Records fetch error:', error);
            });
        };
        fetchRecords();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser, action, filterType, organizationId]);

  // Seçim değiştiğinde parent'ı bilgilendir
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedRecordIds);
    }
  }, [selectedRecordIds, onSelectionChange]);

  // Doğru gün sayısı hesaplama fonksiyonu (çıkış günü hariç)
  function calculateNumberOfNights(girisTarihi: string, cikisTarihi: string): number {
    const start = new Date(girisTarihi);
    const end = new Date(cikisTarihi);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  const handleEditClick = (id: number) => {
    if (!records || !Array.isArray(records)) return;
    const recordToEdit = records.find((record) => record.id === id);
    if (recordToEdit) {
      setEditingRecord(recordToEdit);
      setShowEditModal(true);
    }
  };

  const handleDeleteClick = async (id: number) => {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;

    try {
      const response = await fetch(`/api/accommodation/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRecords(prev => prev.filter(record => record.id !== id));
      } else {
        const errorData = await response.json();
        alert(`Kayıt silinemedi: ${errorData.error || 'Bir hata oluştu'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Kayıt silinemedi!');
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingRecord(null);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    // id alanını değiştirmeye izin verme
    if (name === 'id') return;

    if (type === 'number') {
      setEditingRecord(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [name]: parseFloat(value) || 0
        };
      });
    } else {
      setEditingRecord(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [name]: name === 'organizationId' ? (value ? parseInt(value) : null) : value
        };
      });
    }

    // Toplam ücret hesaplama
    if (name === 'girisTarihi' || name === 'cikisTarihi' || name === 'gecelikUcret') {
      setEditingRecord(prev => {
        if (!prev) return prev;
        const girisTarihi = name === 'girisTarihi' ? value : prev.girisTarihi;
        const cikisTarihi = name === 'cikisTarihi' ? value : prev.cikisTarihi;
        const gecelikUcret = name === 'gecelikUcret' ? parseFloat(value) || 0 : prev.gecelikUcret || 0;

        if (girisTarihi && cikisTarihi) {
          const nights = calculateNumberOfNights(girisTarihi, cikisTarihi);
          const toplamUcret = nights * gecelikUcret;

          return {
            ...prev,
            numberOfNights: nights,
            toplamUcret: toplamUcret
          };
        }
        return prev;
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingRecord || !editingRecord.adiSoyadi || !editingRecord.girisTarihi || !editingRecord.cikisTarihi || !editingRecord.odaTipi || !editingRecord.konaklamaTipi) {
      alert('Lütfen zorunlu alanları doldurunuz.');
      return;
    }

    setIsSubmitting(true);

    try {
      // ID'yi ayrı tut
      const recordId = editingRecord.id;

      // Sadece güncellenebilir alanları gönder - id ve diğer sistem alanlarını çıkar
      const {
        id,
        organization,
        companyId,
        createdAt,
        updatedAt,
        isMunferit,
        ...updateData
      } = editingRecord;

      const response = await fetch(`/api/accommodation/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        // Başarılı güncelleme sonrası listeyi güncelle
        const updatedRecord = await response.json();
        setRecords(prev => prev.map(record =>
          record.id === updatedRecord.id ? updatedRecord : record
        ));
        closeEditModal();
      } else {
        const errorData = await response.json();
        alert(`Hata: ${errorData.error || errorData.message || 'Bir hata oluştu'}`);
      }
    } catch (error) {
      console.error('Kayıt güncellenirken hata oluştu:', error);
      alert('Kayıt güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setFormData({
      adiSoyadi: '',
      unvani: '',
      girisTarihi: '',
      cikisTarihi: '',
      odaTipi: 'Single Oda',
      konaklamaTipi: 'BB',
      gecelikUcret: 0,
      toplamUcret: 0,
      otelAdi: '',
      numberOfNights: 0,
    });
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setFormData({
      adiSoyadi: '',
      unvani: '',
      girisTarihi: '',
      cikisTarihi: '',
      odaTipi: 'Single Oda',
      konaklamaTipi: 'BB',
      gecelikUcret: 0,
      toplamUcret: 0,
      otelAdi: '',
      kurumCari: '',
      numberOfNights: 0,
    });
  };

  // Toplam ücret hesaplama için useEffect
  useEffect(() => {
    if (formData.girisTarihi && formData.cikisTarihi) {
      const nights = calculateNumberOfNights(formData.girisTarihi, formData.cikisTarihi);
      const gecelikUcret = formData.gecelikUcret || 0;
      const toplamUcret = nights > 0 && gecelikUcret > 0 ? nights * gecelikUcret : 0;
      
      setFormData(prev => {
        // Sadece değerler değiştiyse güncelle
        if (prev.numberOfNights !== nights || prev.toplamUcret !== toplamUcret) {
          return {
            ...prev,
            numberOfNights: nights,
            toplamUcret: toplamUcret
          };
        }
        return prev;
      });
    } else {
      setFormData(prev => {
        if (prev.numberOfNights !== 0 || prev.toplamUcret !== 0) {
          return {
            ...prev,
            numberOfNights: 0,
            toplamUcret: 0
          };
        }
        return prev;
      });
    }
  }, [formData.girisTarihi, formData.cikisTarihi, formData.gecelikUcret]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value) || 0) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Konaklama tipi boşsa otomatik olarak 'BB' yap
    if (!formData.konaklamaTipi) {
      formData.konaklamaTipi = 'BB';
    }

    // Toplam ücreti tekrar hesapla (güvenlik için)
    if (formData.girisTarihi && formData.cikisTarihi && formData.gecelikUcret > 0) {
      const nights = calculateNumberOfNights(formData.girisTarihi, formData.cikisTarihi);
      formData.numberOfNights = nights;
      formData.toplamUcret = nights * formData.gecelikUcret;
    }

    if (!formData.adiSoyadi || !formData.girisTarihi || !formData.cikisTarihi || !formData.odaTipi || !formData.konaklamaTipi) {
      alert('Lütfen zorunlu alanları doldurunuz.');
      return;
    }

    if (!formData.gecelikUcret || formData.gecelikUcret <= 0) {
      alert('Gecelik ücret 0\'dan büyük olmalıdır!');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/accommodation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          ulke: 'Türkiye',
          sehir: '',
          isMunferit: false,
        }),
      });

      if (response.ok) {
        // Başarılı kayıt sonrası listeyi güncelle
        const data = await response.json();
        setRecords(prev => [...prev, data]);

        closeAddModal();
        // Sayfayı yenile
        window.location.reload();
      } else {
        const errorData = await response.json();
        
        // Ödeme gerekli hatası
        if (response.status === 402 && errorData.error === 'PAYMENT_REQUIRED') {
          setPaymentData({
            accommodationCount: errorData.accommodationCount || 0,
            accommodationSaleCount: errorData.accommodationSaleCount || 0,
            message: errorData.message || 'Ücretsiz plan limitine ulaştınız.',
          });
          setShowPaymentModal(true);
          closeAddModal();
        } else {
          alert(`Hata: ${errorData.error || errorData.message || 'Bir hata oluştu'}`);
        }
      }
    } catch (error) {
      console.error('Kayıt eklenirken hata oluştu:', error);
      alert('Kayıt eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR');
  }

  const handleSort = (column: keyof AccommodationRecord) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const clearSort = () => {
    setSortColumn(null);
    setSortDirection(null);
  };

  // Gelişmiş filtreleme mantığı
  const advancedFilteredRecords = useMemo(() => {
    return records.filter((record) => {
      // Temel filtreler
      const orgMatch = filterOrg ? record.organization?.name?.toLowerCase().includes(filterOrg.toLowerCase()) : true;
      const nameMatch = filterName ? record.adiSoyadi?.toLowerCase().includes(filterName.toLowerCase()) : true;
      const titleMatch = filterTitle ? record.unvani?.toLowerCase().includes(filterTitle.toLowerCase()) : true;

      if (!orgMatch || !nameMatch || !titleMatch) return false;

      // Gelişmiş filtreler
      if (advancedFilters) {
        // Tarih aralığı
        if (advancedFilters.dateRange.startDate) {
          const checkIn = new Date(record.girisTarihi);
          const startDate = new Date(advancedFilters.dateRange.startDate);
          if (checkIn < startDate) return false;
        }
        if (advancedFilters.dateRange.endDate) {
          const checkOut = new Date(record.cikisTarihi);
          const endDate = new Date(advancedFilters.dateRange.endDate);
          if (checkOut > endDate) return false;
        }

        // Fiyat aralığı
        if (advancedFilters.priceRange.minPrice && record.toplamUcret < advancedFilters.priceRange.minPrice) {
          return false;
        }
        if (advancedFilters.priceRange.maxPrice && record.toplamUcret > advancedFilters.priceRange.maxPrice) {
          return false;
        }

        // Otel seçimi
        if (advancedFilters.selectedHotels.length > 0) {
          // Otel adı ile eşleştirme (Accommodation modelinde otelAdi string olarak saklanıyor)
          const selectedHotelNames = hotels
            .filter(h => advancedFilters.selectedHotels.includes(h.id))
            .map(h => h.adi.toLowerCase());
          
          const recordHotelName = (record.otelAdi || '').toLowerCase();
          if (!selectedHotelNames.includes(recordHotelName)) {
            return false;
          }
        }

        // Oda tipi
        if (advancedFilters.roomType && record.odaTipi !== advancedFilters.roomType) {
          return false;
        }

        // Konaklama tipi
        if (advancedFilters.accommodationType && record.konaklamaTipi !== advancedFilters.accommodationType) {
          return false;
        }

        // Gece sayısı
        if (advancedFilters.nightsRange.minNights && (record.numberOfNights || 0) < advancedFilters.nightsRange.minNights) {
          return false;
        }
        if (advancedFilters.nightsRange.maxNights && (record.numberOfNights || 0) > advancedFilters.nightsRange.maxNights) {
          return false;
        }

        // Durum
        if (advancedFilters.status !== 'all') {
          const today = new Date();
          const checkIn = new Date(record.girisTarihi);
          const checkOut = new Date(record.cikisTarihi);
          
          if (advancedFilters.status === 'active') {
            if (!(checkIn <= today && checkOut >= today)) return false;
          } else if (advancedFilters.status === 'past') {
            if (checkOut >= today) return false;
          } else if (advancedFilters.status === 'upcoming') {
            if (checkIn <= today) return false;
          }
        }
      }

      return true;
    });
  }, [records, filterOrg, filterName, filterTitle, advancedFilters, hotels]);

  // Filtrelenmiş kayıtlar (prop ile çakışmaması için displayRecords kullanıyoruz)
  const displayRecords = advancedFilteredRecords;

  // Sayfalama hesaplamaları
  const totalPages = Math.ceil(displayRecords.length / itemsPerPage);
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return displayRecords.slice(startIndex, endIndex);
  }, [displayRecords, currentPage, itemsPerPage]);

  // Sayfa değiştiğinde scroll to top
  useEffect(() => {
    setCurrentPage(1);
  }, [filterOrg, filterName, filterTitle, advancedFilters]);

  // Sıralanmış kayıtlar (sayfalama öncesi)
  const sortedRecords = [...displayRecords].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;

    let aValue: any = a[sortColumn];
    let bValue: any = b[sortColumn];

    // Özel sıralama kuralları
    if (sortColumn === 'id') {
      aValue = a.id;
      bValue = b.id;
    } else if (sortColumn === 'numberOfNights') {
      aValue = a.numberOfNights || 0;
      bValue = b.numberOfNights || 0;
    } else if (sortColumn === 'toplamUcret') {
      aValue = a.toplamUcret;
      bValue = b.toplamUcret;
    } else if (sortColumn === 'girisTarihi' || sortColumn === 'cikisTarihi') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ column }: { column: keyof AccommodationRecord }) => {
    if (sortColumn !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    if (sortDirection === 'asc') {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Toplu silme işlemini başlatan fonksiyon (popup açar)
  const handleBulkDeleteRequest = () => {
    setShowBulkDeleteModal(true);
    setPendingBulkDelete(false);
  };

  // Toplu silme işlemini onaylayan fonksiyon (gerçek silme)
  const handleBulkDeleteConfirm = async () => {
    setPendingBulkDelete(true);
    try {
      for (const id of selectedRecordIds) {
        await fetch(`/api/accommodation/${id}`, { method: 'DELETE' });
      }
      setRecords(prev => prev.filter(record => !selectedRecordIds.includes(record.id)));
      setSelectedRecordIds([]);
      setShowBulkDeleteModal(false);
    } catch (error) {
      alert('Toplu silme sırasında hata oluştu!');
    } finally {
      setPendingBulkDelete(false);
    }
  };

  const handleSelectRecord = (id: number) => {
    setSelectedRecordIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(recordId => recordId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedRecordIds.length === paginatedRecords.length) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(paginatedRecords.map(record => record.id));
    }
  };

  // Excel import/export fonksiyonları
  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          alert('Excel dosyası en az bir başlık satırı ve bir veri satırı içermelidir!');
          return;
        }

        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];

        // Header indexlerini bul
        const getHeaderIndex = (headerName: string): number => {
          return headers.findIndex(h => h?.toString().toLowerCase().includes(headerName.toLowerCase()));
        };

        const headerIndices = {
          adiSoyadi: getHeaderIndex('Adı Soyadı') >= 0 ? getHeaderIndex('Adı Soyadı') : 
                     (getHeaderIndex('Ad Soyad') >= 0 ? getHeaderIndex('Ad Soyad') : 
                     (getHeaderIndex('AdıSoyadı') >= 0 ? getHeaderIndex('AdıSoyadı') : 0)),
          unvani: getHeaderIndex('Unvanı') >= 0 ? getHeaderIndex('Unvanı') : 
                  (getHeaderIndex('Unvan') >= 0 ? getHeaderIndex('Unvan') : 1),
          ulke: getHeaderIndex('Ülke') >= 0 ? getHeaderIndex('Ülke') : 
                (getHeaderIndex('Ulke') >= 0 ? getHeaderIndex('Ulke') : 2),
          sehir: getHeaderIndex('Şehir') >= 0 ? getHeaderIndex('Şehir') : 
                 (getHeaderIndex('Sehir') >= 0 ? getHeaderIndex('Sehir') : 3),
          girisTarihi: getHeaderIndex('Giriş Tarihi') >= 0 ? getHeaderIndex('Giriş Tarihi') : 
                       (getHeaderIndex('Giris Tarihi') >= 0 ? getHeaderIndex('Giris Tarihi') : 
                       (getHeaderIndex('GirişTarihi') >= 0 ? getHeaderIndex('GirişTarihi') : 4)),
          cikisTarihi: getHeaderIndex('Çıkış Tarihi') >= 0 ? getHeaderIndex('Çıkış Tarihi') : 
                       (getHeaderIndex('Cikis Tarihi') >= 0 ? getHeaderIndex('Cikis Tarihi') : 
                       (getHeaderIndex('ÇıkışTarihi') >= 0 ? getHeaderIndex('ÇıkışTarihi') : 5)),
          odaTipi: getHeaderIndex('Oda Tipi') >= 0 ? getHeaderIndex('Oda Tipi') : 
                   (getHeaderIndex('OdaTipi') >= 0 ? getHeaderIndex('OdaTipi') : 6),
          konaklamaTipi: getHeaderIndex('Konaklama Tipi') >= 0 ? getHeaderIndex('Konaklama Tipi') : 
                        (getHeaderIndex('KonaklamaTipi') >= 0 ? getHeaderIndex('KonaklamaTipi') : 7),
          gecelikUcret: getHeaderIndex('Gecelik Ücret') >= 0 ? getHeaderIndex('Gecelik Ücret') : 
                        (getHeaderIndex('GecelikUcret') >= 0 ? getHeaderIndex('GecelikUcret') : 8),
          otelAdi: getHeaderIndex('Otel Adı') >= 0 ? getHeaderIndex('Otel Adı') : 
                   (getHeaderIndex('OtelAdi') >= 0 ? getHeaderIndex('OtelAdi') : 10),
          kurumCari: getHeaderIndex('Cari') >= 0 ? getHeaderIndex('Cari') : 
                     (getHeaderIndex('Kurum / Cari') >= 0 ? getHeaderIndex('Kurum / Cari') : 
                     (getHeaderIndex('Kurum Cari') >= 0 ? getHeaderIndex('Kurum Cari') : 
                     (getHeaderIndex('KurumCari') >= 0 ? getHeaderIndex('KurumCari') : 11)))
        };

        const excelDateToISO = (value: any): string => {
          if (!value) return '';
          
          // Eğer zaten ISO formatında ise (YYYY-MM-DD)
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return value;
          }
          
          // Eğer tarih string formatında ise (DD/MM/YYYY veya DD.MM.YYYY)
          if (typeof value === 'string') {
            const dateStr = value.trim();
            // DD/MM/YYYY veya DD.MM.YYYY formatını kontrol et
            const dateMatch = dateStr.match(/(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})/);
            if (dateMatch) {
              const [, day, month, year] = dateMatch;
              return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
            
            // Tarih objesi olarak parse et
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate.getTime())) {
              return parsedDate.toISOString().split('T')[0];
            }
          }
          
          // Excel tarih serisi numarasını JavaScript tarihine çevir
          try {
            const excelDate = typeof value === 'number' ? value : parseFloat(value);
            if (isNaN(excelDate)) return '';
            
            // Excel'in başlangıç tarihi (1900-01-01) ile JavaScript'in başlangıç tarihi (1970-01-01) arasındaki fark
            const excelEpoch = new Date(1899, 11, 30); // Excel 1900-01-01 = 1, ama JavaScript'te 1899-12-30
            const jsDate = new Date(excelEpoch.getTime() + (excelDate - 1) * 24 * 60 * 60 * 1000);
            
            // YYYY-MM-DD formatına çevir
            return jsDate.toISOString().split('T')[0];
          } catch (error) {
            return '';
          }
        };

        const newRecords = rows.map((row, rowIndex) => {
          const getValue = (index: number, defaultValue: string = '') => {
            return row[index]?.toString().trim() || defaultValue;
          };

          const adiSoyadi = getValue(headerIndices.adiSoyadi);
          const unvani = getValue(headerIndices.unvani);
          const ulke = getValue(headerIndices.ulke, 'Türkiye');
          const sehir = getValue(headerIndices.sehir);
          const girisTarihi = excelDateToISO(row[headerIndices.girisTarihi]);
          const cikisTarihi = excelDateToISO(row[headerIndices.cikisTarihi]);
          const odaTipi = getValue(headerIndices.odaTipi, 'Single Oda');
          const konaklamaTipi = (getValue(headerIndices.konaklamaTipi, 'BB') as "BB" | "HB" | "FB" | "UHD");
          const gecelikUcret = parseFloat(getValue(headerIndices.gecelikUcret, '0')) || 0;
          const otelAdi = getValue(headerIndices.otelAdi);
          const kurumCari = getValue(headerIndices.kurumCari);

          if (!adiSoyadi || !girisTarihi || !cikisTarihi) {
            console.warn(`Satır ${rowIndex + 2} atlandı: Eksik zorunlu alanlar`, { adiSoyadi, girisTarihi, cikisTarihi });
            return null;
          }

          const numberOfNights = calculateNumberOfNights(girisTarihi, cikisTarihi);
          const toplamUcret = gecelikUcret * numberOfNights;

          return {
            adiSoyadi,
            unvani,
            ulke,
            sehir,
            girisTarihi,
            cikisTarihi,
            odaTipi,
            konaklamaTipi,
            gecelikUcret,
            toplamUcret,
            numberOfNights,
            otelAdi,
            kurumCari,
            isMunferit: filterType === 'munferit',
            organizationId: filterType === 'organization' ? organizationId : null
          };
        }).filter(record => record !== null);

        if (newRecords.length === 0) {
          alert('Geçerli kayıt bulunamadı! Lütfen Excel dosyasını kontrol edin.');
          return;
        }

        // API'ye toplu kayıt gönder
        const res = await fetch('/api/accommodation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records: newRecords }),
        });

        if (res.ok) {
          const createdRecords = await res.json();
          setRecords(prev => [...prev, ...createdRecords]);
          alert(`${newRecords.length} kayıt başarıyla içe aktarıldı!`);
          setShowImportModal(false);
          // Sayfayı yenile
          window.location.reload();
        } else {
          const errorData = await res.json().catch(() => ({ error: 'Bilinmeyen hata' }));
          
          // Ödeme gerekli hatası
          if (res.status === 402 && errorData.error === 'PAYMENT_REQUIRED') {
            setPaymentData({
              accommodationCount: errorData.accommodationCount || 0,
              accommodationSaleCount: errorData.accommodationSaleCount || 0,
              message: errorData.message || 'Ücretsiz plan limitine ulaştınız.',
            });
            setShowPaymentModal(true);
            setShowImportModal(false);
          } else {
            alert(`Kayıtlar içe aktarılamadı: ${errorData.error || 'Bilinmeyen hata'}`);
          }
        }
      } catch (error: any) {
        console.error('Excel import error:', error);
        alert(`Excel dosyası okunamadı: ${error.message || 'Bilinmeyen hata'}`);
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  const handleExportExcel = () => {
    setAvailableColumns([
      { key: 'id', label: 'ID' },
      { key: 'adiSoyadi', label: 'Adı Soyadı' },
      { key: 'unvani', label: 'Unvanı' },
      { key: 'ulke', label: 'Ülke' },
      { key: 'sehir', label: 'Şehir' },
      { key: 'girisTarihi', label: 'Giriş Tarihi' },
      { key: 'cikisTarihi', label: 'Çıkış Tarihi' },
      { key: 'odaTipi', label: 'Oda Tipi' },
      { key: 'konaklamaTipi', label: 'Konaklama Tipi' },
      { key: 'numberOfNights', label: 'Gece Sayısı' },
      { key: 'gecelikUcret', label: 'Gecelik Ücret' },
      { key: 'toplamUcret', label: 'Toplam Ücret' },
      { key: 'otelAdi', label: 'Otel Adı' },
      { key: 'kurumCari', label: 'Cari' },
    ]);
    setSelectedColumns([
      'id', 'adiSoyadi', 'unvani', 'ulke', 'sehir', 'girisTarihi', 'cikisTarihi',
      'odaTipi', 'konaklamaTipi', 'numberOfNights', 'gecelikUcret',
      'toplamUcret', 'otelAdi', 'kurumCari'
    ]);
    setShowExportFilterModal(true);
  };

  const closeExportFilterModal = () => {
    setShowExportFilterModal(false);
  };

  const handleColumnToggle = (columnKey: string) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnKey)) {
        return prev.filter(col => col !== columnKey);
      } else {
        return [...prev, columnKey];
      }
    });
  };

  const handleExportFilteredExcel = () => {
    if (selectedColumns.length === 0) {
      alert('En az bir sütun seçilmelidir!');
      return;
    }

    // Seçili sütunlara göre veriyi filtrele
    const exportData = displayRecords.map(record => {
      const filteredRecord: any = {};
      selectedColumns.forEach(column => {
        const colDef = availableColumns.find(c => c.key === column);
        const label = colDef ? colDef.label : column;

        let value: any = record[column as keyof AccommodationRecord];

        if (column === 'girisTarihi' || column === 'cikisTarihi') {
          value = formatDate(value as string);
        }

        filteredRecord[label] = value;
      });
      return filteredRecord;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Konaklamalar");
    XLSX.writeFile(wb, "Konaklama_Listesi.xlsx");
    setShowExportFilterModal(false);
  };

  const handleExportPDF = () => {
    if (selectedColumns.length === 0) {
      alert('En az bir sütun seçilmelidir!');
      return;
    }

    const doc = new jsPDF({
      orientation: 'landscape', // Yatay yönlendirme daha geniş tablo için
      unit: 'mm',
      format: 'a4'
    });

    // Türkçe karakter desteği için font ayarları
    doc.setFont('helvetica', 'normal');

    // Başlık
    doc.setFontSize(18);
    doc.text("Konaklama Listesi", 14, 15);
    doc.setFontSize(10);
    doc.text(`Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })}`, 14, 22);
    doc.text(`Toplam Kayıt: ${displayRecords.length}`, 14, 27);

    // Tablo başlıkları ve verileri
    const tableHeaders = selectedColumns.map(col => {
      const colDef = availableColumns.find(c => c.key === col);
      return colDef ? colDef.label : col;
    });

    const tableData = displayRecords.map(record => {
      return selectedColumns.map(column => {
        let value: any = record[column as keyof AccommodationRecord];
        
        // Veri formatlama
        if (column === 'girisTarihi' || column === 'cikisTarihi') {
          value = formatDate(value as string);
        } else if (column === 'gecelikUcret' || column === 'toplamUcret') {
          // Para birimi formatı
          value = typeof value === 'number' ? `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : (value || '₺0,00');
        } else if (column === 'numberOfNights') {
          // Gece sayısı formatı
          value = value ? `${value} gece` : '0 gece';
        } else if (column === 'id') {
          // ID formatı
          value = value ? `#${value}` : '';
        } else if (value === null || value === undefined) {
          value = '-';
        } else {
          // String değerleri temizle
          value = String(value).trim();
        }
        
        return value || '-';
      });
    });

    // Tablo genişliklerini ayarla
    const columnWidths = selectedColumns.map(col => {
      // Sütun tipine göre genişlik belirle
      if (col === 'id') return 15;
      if (col === 'adiSoyadi' || col === 'unvani') return 35;
      if (col === 'girisTarihi' || col === 'cikisTarihi') return 25;
      if (col === 'gecelikUcret' || col === 'toplamUcret') return 30;
      if (col === 'otelAdi') return 40;
      if (col === 'ulke' || col === 'sehir') return 25;
      if (col === 'odaTipi' || col === 'konaklamaTipi') return 25;
      if (col === 'numberOfNights') return 20;
      return 30; // Varsayılan genişlik
    });

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: 32,
      styles: { 
        fontSize: 7, 
        cellPadding: 2,
        font: 'helvetica',
        textColor: [0, 0, 0],
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      headStyles: { 
        fillColor: [66, 139, 202],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: selectedColumns.reduce((acc, col, index) => {
        acc[index] = { 
          cellWidth: columnWidths[index],
          halign: col === 'gecelikUcret' || col === 'toplamUcret' || col === 'numberOfNights' || col === 'id' ? 'right' : 
                  col === 'girisTarihi' || col === 'cikisTarihi' ? 'center' : 'left'
        };
        return acc;
      }, {} as any),
      margin: { top: 32, right: 10, bottom: 10, left: 10 },
      tableWidth: 'wrap',
      showHead: 'everyPage',
      pageBreak: 'auto',
      theme: 'striped',
    });

    // Her sayfaya sayfa numarası ekle
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Sayfa ${i} / ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 5,
        { align: 'center' }
      );
    }

    doc.save("Konaklama_Listesi.pdf");
    setShowExportFilterModal(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="İsim Ara..."
            className="px-3 py-2 border rounded-md text-sm"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Unvan Ara..."
            className="px-3 py-2 border rounded-md text-sm"
            value={filterTitle}
            onChange={(e) => setFilterTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="Organizasyon Ara..."
            className="px-3 py-2 border rounded-md text-sm"
            value={filterOrg}
            onChange={(e) => setFilterOrg(e.target.value)}
          />
          
          {/* Gelişmiş Filtreler */}
          <AdvancedFilters
            hotels={hotels.map(h => ({ id: h.id, adi: h.adi }))}
            onFilterChange={(filters) => {
              setAdvancedFilters(filters);
            }}
            onReset={() => {
              setAdvancedFilters(null);
            }}
          />
          
          {/* Bulk Actions Menu */}
          {selectedRecordIds.length > 0 && (
            <BulkActionsMenu
              selectedCount={selectedRecordIds.length}
              onBulkDelete={handleBulkDeleteRequest}
              customActions={customBulkActions}
            />
          )}
        </div>

        <div className="flex gap-2">
          {canAdd() && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Yeni Kayıt
            </button>
          )}

          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            İçe Aktar
          </button>

          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm font-medium flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Dışa Aktar
          </button>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedRecordIds.length === paginatedRecords.length && paginatedRecords.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('adiSoyadi')}
                >
                  <div className="flex items-center">
                    Adı Soyadı
                    <SortIcon column="adiSoyadi" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('girisTarihi')}
                >
                  <div className="flex items-center">
                    Giriş Tarihi
                    <SortIcon column="girisTarihi" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('cikisTarihi')}
                >
                  <div className="flex items-center">
                    Çıkış Tarihi
                    <SortIcon column="cikisTarihi" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Otel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    Yükleniyor...
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((record) => {
                  const isTransferred = transferredRecordIds.has(record.id);
                  return (
                  <tr 
                    key={record.id} 
                    className={`hover:bg-gray-50 ${isTransferred ? 'bg-green-50 border-l-4 border-l-green-500' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedRecordIds.includes(record.id)}
                        onChange={() => handleSelectRecord(record.id)}
                        disabled={isTransferred}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.adiSoyadi}</div>
                          <div className="text-sm text-gray-500">{record.unvani}</div>
                        </div>
                        {isTransferred && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-300">
                            Satışa Aktarıldı
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(record.girisTarihi)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(record.cikisTarihi)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.otelAdi || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isTransferred ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Satışa Aktarıldı
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Aktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!isTransferred && (
                        <>
                          {canEdit() && (
                            <button
                              onClick={() => handleEditClick(record.id)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Düzenle
                            </button>
                          )}
                          {canDelete() && (
                            <button
                              onClick={() => handleDeleteClick(record.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Sil
                            </button>
                          )}
                        </>
                      )}
                      {isTransferred && (
                        <span className="text-xs text-gray-500 italic">Satış sayfasında görüntülenebilir</span>
                      )}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Sayfalama */}
        {displayRecords.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={displayRecords.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(newItemsPerPage) => {
              setItemsPerPage(newItemsPerPage);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Excel'den İçe Aktar</h2>
            <p className="text-sm text-gray-600 mb-4">
              Lütfen .xlsx veya .xls formatında bir dosya seçin. Dosyanızın ilk satırı başlıkları içermelidir.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Excel Dosyası
              </label>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleImportExcel}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Dışa Aktarma Seçenekleri</h2>
            <p className="text-sm text-gray-600 mb-4">
              Dışa aktarmak istediğiniz sütunları seçin.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-6 max-h-60 overflow-y-auto">
              {availableColumns.map(col => (
                <label key={col.key} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(col.key)}
                    onChange={() => handleColumnToggle(col.key)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{col.label}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={closeExportFilterModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                İptal
              </button>
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                PDF İndir
              </button>
              <button
                onClick={handleExportFilteredExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Excel İndir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <AccommodationFormModal
        isOpen={showAddModal}
        onClose={closeAddModal}
        formData={formData}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Payment Modal */}
      {showPaymentModal && paymentData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentData(null);
          }}
          onSuccess={() => {
            setShowPaymentModal(false);
            setPaymentData(null);
            // Sayfayı yenile
            window.location.reload();
          }}
          accommodationCount={paymentData.accommodationCount}
          accommodationSaleCount={paymentData.accommodationSaleCount}
          message={paymentData.message}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Kayıt Düzenle</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adı Soyadı</label>
                  <input type="text" name="adiSoyadi" value={editingRecord.adiSoyadi} onChange={handleEditInputChange} className="mt-1 block w-full border rounded-md shadow-sm p-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unvanı</label>
                  <input type="text" name="unvani" value={editingRecord.unvani} onChange={handleEditInputChange} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Giriş Tarihi</label>
                  <input type="date" name="girisTarihi" value={editingRecord.girisTarihi ? new Date(editingRecord.girisTarihi).toISOString().split('T')[0] : ''} onChange={handleEditInputChange} className="mt-1 block w-full border rounded-md shadow-sm p-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Çıkış Tarihi</label>
                  <input type="date" name="cikisTarihi" value={editingRecord.cikisTarihi ? new Date(editingRecord.cikisTarihi).toISOString().split('T')[0] : ''} onChange={handleEditInputChange} className="mt-1 block w-full border rounded-md shadow-sm p-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Oda Tipi</label>
                  <select name="odaTipi" value={editingRecord.odaTipi} onChange={handleEditInputChange} className="mt-1 block w-full border rounded-md shadow-sm p-2">
                    <option value="Single Oda">Single Oda</option>
                    <option value="Double Oda">Double Oda</option>
                    <option value="Triple Oda">Triple Oda</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Konaklama Tipi</label>
                  <select name="konaklamaTipi" value={editingRecord.konaklamaTipi} onChange={handleEditInputChange} className="mt-1 block w-full border rounded-md shadow-sm p-2">
                    <option value="BB">BB (Oda Kahvaltı)</option>
                    <option value="HB">HB (Yarım Pansiyon)</option>
                    <option value="FB">FB (Tam Pansiyon)</option>
                    <option value="UHD">UHD (Ultra Her Şey Dahil)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gecelik Ücret</label>
                  <input type="number" name="gecelikUcret" value={editingRecord.gecelikUcret} onChange={handleEditInputChange} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Toplam Ücret</label>
                  <input type="number" name="toplamUcret" value={editingRecord.toplamUcret} readOnly className="mt-1 block w-full border rounded-md shadow-sm p-2 bg-gray-100" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={closeEditModal} className="px-4 py-2 bg-gray-200 rounded-md">İptal</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Güncelle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Toplu Silme</h2>
            <p className="mb-4">Seçili {selectedRecordIds.length} kaydı silmek istediğinize emin misiniz?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowBulkDeleteModal(false)} className="px-4 py-2 bg-gray-200 rounded-md">İptal</button>
              <button onClick={handleBulkDeleteConfirm} disabled={pendingBulkDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                {pendingBulkDelete ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}