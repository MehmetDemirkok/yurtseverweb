'use client';

import React from 'react';
import { Plus, X } from 'lucide-react';
import DatePickerWithQuickSelect from './DatePickerWithQuickSelect';

interface AccommodationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: {
    adiSoyadi: string;
    unvani: string;
    girisTarihi: string;
    cikisTarihi: string;
    odaTipi: string;
    konaklamaTipi: string;
    gecelikUcret: number | string;
    toplamUcret: number;
    otelAdi: string;
    numberOfNights: number;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
}

const AccommodationFormModal: React.FC<AccommodationFormModalProps> = ({
  isOpen,
  onClose,
  formData,
  onChange,
  onSubmit,
  isSubmitting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 p-6 relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none z-10"
          aria-label="Kapat"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Yeni Konaklama Kaydı</h2>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Adı Soyadı */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Adı Soyadı *</label>
                <input
                  type="text"
                  name="adiSoyadi"
                  value={formData.adiSoyadi}
                  onChange={onChange}
                  placeholder="Adı Soyadı"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Unvanı */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Unvanı *</label>
                <input
                  type="text"
                  name="unvani"
                  value={formData.unvani}
                  onChange={onChange}
                  placeholder="Unvanı"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Giriş Tarihi */}
              <div>
                <DatePickerWithQuickSelect
                  value={formData.girisTarihi}
                  onChange={(value) => {
                    const event = {
                      target: { name: 'girisTarihi', value, type: 'text' }
                    } as React.ChangeEvent<HTMLInputElement>;
                    onChange(event);
                  }}
                  label="Giriş Tarihi *"
                  maxDate={formData.cikisTarihi || undefined}
                  required
                />
              </div>

              {/* Çıkış Tarihi */}
              <div>
                <DatePickerWithQuickSelect
                  value={formData.cikisTarihi}
                  onChange={(value) => {
                    const event = {
                      target: { name: 'cikisTarihi', value, type: 'text' }
                    } as React.ChangeEvent<HTMLInputElement>;
                    onChange(event);
                  }}
                  label="Çıkış Tarihi *"
                  minDate={formData.girisTarihi || undefined}
                  required
                />
              </div>

              {/* Oda Tipi */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Oda Tipi</label>
                <select
                  name="odaTipi"
                  value={formData.odaTipi}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="Single Oda">Single Oda</option>
                  <option value="Double Oda">Double Oda</option>
                  <option value="Twin Oda">Twin Oda</option>
                  <option value="Suite">Suite</option>
                </select>
              </div>

              {/* Konaklama Tipi */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Konaklama Tipi</label>
                <select
                  name="konaklamaTipi"
                  value={formData.konaklamaTipi}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="BB">BB (Oda Kahvaltı)</option>
                  <option value="HB">HB (Yarım Pansiyon)</option>
                  <option value="FB">FB (Tam Pansiyon)</option>
                  <option value="UHD">UHD (Her Şey Dahil)</option>
                </select>
              </div>

              {/* Gecelik Ücret */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Gecelik Ücret *</label>
                <input
                  type="number"
                  name="gecelikUcret"
                  value={formData.gecelikUcret}
                  onChange={onChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Toplam Ücret (Otomatik) */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Toplam Ücret</label>
                <input
                  type="text"
                  value={formData.toplamUcret > 0 ? `₺${formData.toplamUcret.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₺0,00'}
                  disabled
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold cursor-not-allowed"
                />
                {formData.numberOfNights > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.numberOfNights} gece × ₺{(formData.gecelikUcret || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>

              {/* Otel Adı */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Otel Adı *</label>
                <input
                  type="text"
                  name="otelAdi"
                  value={formData.otelAdi}
                  onChange={onChange}
                  placeholder="Otel Adı"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Kaydet Butonu */}
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Kayıt Oluştur
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccommodationFormModal; 