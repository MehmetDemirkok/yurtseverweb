import React from 'react';
import type { AccommodationRecord } from '../page';

interface AccommodationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: Omit<AccommodationRecord, 'id' | 'toplamUcret' | 'numberOfNights'>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
}

const AccommodationFormModal: React.FC<AccommodationFormModalProps> = ({
  isOpen,
  onClose,
  formData,
  onChange,
  onCheckboxChange,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 p-8 relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
          aria-label="Kapat"
        >
          ×
        </button>
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Yeni Konaklama Kaydı</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label htmlFor="kurumCari" className="block text-sm font-semibold text-gray-700">Kurum / Cari</label>
            <input type="text" id="kurumCari" className="input" value={formData.kurumCari} onChange={onChange} placeholder="Kurum adını girin" />
          </div>
          <div className="space-y-2">
            <label htmlFor="organizasyonAdi" className="block text-sm font-semibold text-gray-700">Organizasyon Adı</label>
            <input type="text" id="organizasyonAdi" className="input" value={formData.organizasyonAdi} onChange={onChange} placeholder="Organizasyon adını girin" />
          </div>
          <div className="space-y-2">
            <label htmlFor="otelAdi" className="block text-sm font-semibold text-gray-700">Otel Adı</label>
            <input type="text" id="otelAdi" className="input" value={formData.otelAdi} onChange={onChange} placeholder="Otel adını girin" />
          </div>
          <div className="space-y-2">
            <label htmlFor="adiSoyadi" className="block text-sm font-semibold text-gray-700">Adı Soyadı</label>
            <input type="text" id="adiSoyadi" className="input" value={formData.adiSoyadi} onChange={onChange} placeholder="Kişi adını girin" />
          </div>
          <div className="space-y-2">
            <label htmlFor="unvani" className="block text-sm font-semibold text-gray-700">Unvanı</label>
            <input type="text" id="unvani" className="input" value={formData.unvani} onChange={onChange} placeholder="Unvanını girin" />
          </div>
          <div className="space-y-2">
            <label htmlFor="ulke" className="block text-sm font-semibold text-gray-700">Ülke</label>
            <input type="text" id="ulke" className="input" value={formData.ulke} onChange={onChange} placeholder="Ülke adını girin" />
          </div>
          <div className="space-y-2">
            <label htmlFor="sehir" className="block text-sm font-semibold text-gray-700">Şehir</label>
            <input type="text" id="sehir" className="input" value={formData.sehir} onChange={onChange} placeholder="Şehir adını girin" />
          </div>
          <div className="space-y-2">
            <label htmlFor="girisTarihi" className="block text-sm font-semibold text-gray-700">Giriş Tarihi</label>
            <input type="date" id="girisTarihi" className="input" value={formData.girisTarihi} onChange={onChange} />
          </div>
          <div className="space-y-2">
            <label htmlFor="cikisTarihi" className="block text-sm font-semibold text-gray-700">Çıkış Tarihi</label>
            <input type="date" id="cikisTarihi" className="input" value={formData.cikisTarihi} onChange={onChange} />
          </div>
          <div className="space-y-2">
            <label htmlFor="odaTipi" className="block text-sm font-semibold text-gray-700">Oda Tipi</label>
            <select id="odaTipi" className="input" value={formData.odaTipi} onChange={onChange}>
              <option value="Single Oda">Single Oda</option>
              <option value="Double Oda">Double Oda</option>
              <option value="Triple Oda">Triple Oda</option>
              <option value="Suit Oda">Suit Oda</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="konaklamaTipi" className="block text-sm font-semibold text-gray-700">Konaklama Tipi</label>
            <select id="konaklamaTipi" className="input" value={formData.konaklamaTipi} onChange={onChange}>
              <option value="BB">BB</option>
              <option value="HB">HB</option>
              <option value="FB">FB</option>
              <option value="UHD">UHD</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="gecelikUcret" className="block text-sm font-semibold text-gray-700">Gecelik Ücret (₺)</label>
            <input type="number" id="gecelikUcret" className="input" value={formData.gecelikUcret || ''} onChange={onChange} step="1" min="0" placeholder="0" />
          </div>
        </div>
        <div className="flex justify-center mt-8">
          <button onClick={onSubmit} className="btn btn-primary text-lg px-8 py-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Kaydı Ekle
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccommodationFormModal; 