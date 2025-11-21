"use client";

import { useState } from 'react';
import { Filter, X, Calendar, DollarSign, Hotel, Moon } from 'lucide-react';

interface AdvancedFiltersProps {
  hotels: Array<{ id: number; adi: string }>;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
}

export interface FilterState {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  priceRange: {
    minPrice: number | '';
    maxPrice: number | '';
  };
  selectedHotels: number[];
  roomType: string;
  accommodationType: string;
  nightsRange: {
    minNights: number | '';
    maxNights: number | '';
  };
  status: 'all' | 'active' | 'past' | 'upcoming';
}

export default function AdvancedFilters({ hotels, onFilterChange, onReset }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      startDate: '',
      endDate: '',
    },
    priceRange: {
      minPrice: '',
      maxPrice: '',
    },
    selectedHotels: [],
    roomType: '',
    accommodationType: '',
    nightsRange: {
      minNights: '',
      maxNights: '',
    },
    status: 'all',
  });

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = {
      ...filters,
      [key]: value,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleHotelToggle = (hotelId: number) => {
    const newSelectedHotels = filters.selectedHotels.includes(hotelId)
      ? filters.selectedHotels.filter(id => id !== hotelId)
      : [...filters.selectedHotels, hotelId];
    handleFilterChange('selectedHotels', newSelectedHotels);
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      dateRange: { startDate: '', endDate: '' },
      priceRange: { minPrice: '', maxPrice: '' },
      selectedHotels: [],
      roomType: '',
      accommodationType: '',
      nightsRange: { minNights: '', maxNights: '' },
      status: 'all',
    };
    setFilters(resetFilters);
    onReset();
  };

  const activeFilterCount = 
    (filters.dateRange.startDate ? 1 : 0) +
    (filters.dateRange.endDate ? 1 : 0) +
    (filters.priceRange.minPrice ? 1 : 0) +
    (filters.priceRange.maxPrice ? 1 : 0) +
    (filters.selectedHotels.length > 0 ? 1 : 0) +
    (filters.roomType ? 1 : 0) +
    (filters.accommodationType ? 1 : 0) +
    (filters.nightsRange.minNights ? 1 : 0) +
    (filters.nightsRange.maxNights ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
          activeFilterCount > 0
            ? 'bg-blue-50 border-blue-300 text-blue-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Filter className="w-4 h-4" />
        <span>Gelişmiş Filtreler</span>
        {activeFilterCount > 0 && (
          <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Gelişmiş Filtreler</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {/* Tarih Aralığı */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  Tarih Aralığı
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Başlangıç</label>
                    <input
                      type="date"
                      value={filters.dateRange.startDate}
                      onChange={(e) =>
                        handleFilterChange('dateRange', {
                          ...filters.dateRange,
                          startDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Bitiş</label>
                    <input
                      type="date"
                      value={filters.dateRange.endDate}
                      onChange={(e) =>
                        handleFilterChange('dateRange', {
                          ...filters.dateRange,
                          endDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Fiyat Aralığı */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4" />
                  Fiyat Aralığı (₺)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Min</label>
                    <input
                      type="number"
                      value={filters.priceRange.minPrice}
                      onChange={(e) =>
                        handleFilterChange('priceRange', {
                          ...filters.priceRange,
                          minPrice: e.target.value ? parseFloat(e.target.value) : '',
                        })
                      }
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Max</label>
                    <input
                      type="number"
                      value={filters.priceRange.maxPrice}
                      onChange={(e) =>
                        handleFilterChange('priceRange', {
                          ...filters.priceRange,
                          maxPrice: e.target.value ? parseFloat(e.target.value) : '',
                        })
                      }
                      placeholder="∞"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Otel Seçimi */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Hotel className="w-4 h-4" />
                  Oteller
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {hotels.length === 0 ? (
                    <p className="text-xs text-gray-500">Otel bulunamadı</p>
                  ) : (
                    hotels.map((hotel) => (
                      <label
                        key={hotel.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.selectedHotels.includes(hotel.id)}
                          onChange={() => handleHotelToggle(hotel.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{hotel.adi}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Oda Tipi */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Oda Tipi</label>
                <select
                  value={filters.roomType}
                  onChange={(e) => handleFilterChange('roomType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Tümü</option>
                  <option value="Single Oda">Single Oda</option>
                  <option value="Double Oda">Double Oda</option>
                  <option value="Twin Oda">Twin Oda</option>
                  <option value="Suite">Suite</option>
                </select>
              </div>

              {/* Konaklama Tipi */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Konaklama Tipi</label>
                <select
                  value={filters.accommodationType}
                  onChange={(e) => handleFilterChange('accommodationType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Tümü</option>
                  <option value="BB">BB (Oda Kahvaltı)</option>
                  <option value="HB">HB (Yarım Pansiyon)</option>
                  <option value="FB">FB (Tam Pansiyon)</option>
                  <option value="UHD">UHD (Her Şey Dahil)</option>
                </select>
              </div>

              {/* Gece Sayısı */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Moon className="w-4 h-4" />
                  Gece Sayısı
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Min</label>
                    <input
                      type="number"
                      value={filters.nightsRange.minNights}
                      onChange={(e) =>
                        handleFilterChange('nightsRange', {
                          ...filters.nightsRange,
                          minNights: e.target.value ? parseInt(e.target.value) : '',
                        })
                      }
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Max</label>
                    <input
                      type="number"
                      value={filters.nightsRange.maxNights}
                      onChange={(e) =>
                        handleFilterChange('nightsRange', {
                          ...filters.nightsRange,
                          maxNights: e.target.value ? parseInt(e.target.value) : '',
                        })
                      }
                      placeholder="∞"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Durum */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Durum</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">Tümü</option>
                  <option value="active">Aktif (Şu anda konaklıyor)</option>
                  <option value="past">Geçmiş</option>
                  <option value="upcoming">Gelecek</option>
                </select>
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
              >
                Temizle
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                Uygula
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

