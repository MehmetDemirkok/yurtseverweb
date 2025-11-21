'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, DollarSign, User, Phone, MapPin, FileText } from 'lucide-react';

interface Arac {
  id: string;
  plaka: string;
  marka: string;
  model: string;
  sigortaTarihi?: string;
  muayeneTarihi?: string;
}

interface BakimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bakimData: any) => void;
  bakim?: any;
  araclar: Arac[];
  loading?: boolean;
}

export default function BakimModal({ isOpen, onClose, onSave, bakim, araclar, loading = false }: BakimModalProps) {
  const [formData, setFormData] = useState({
    aracId: '',
    bakimTipi: 'BAKIM',
    baslik: '',
    aciklama: '',
    planlananTarih: '',
    baslamaTarihi: '',
    bitisTarihi: '',
    maliyet: '',
    odemeDurumu: false,
    odemeTarihi: '',
    tedarikci: '',
    tedarikciTelefon: '',
    tedarikciAdres: '',
    notlar: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (bakim) {
      setFormData({
        aracId: bakim.aracId,
        bakimTipi: bakim.bakimTipi,
        baslik: bakim.baslik,
        aciklama: bakim.aciklama || '',
        planlananTarih: bakim.planlananTarih ? new Date(bakim.planlananTarih).toISOString().split('T')[0] : '',
        baslamaTarihi: bakim.baslamaTarihi ? new Date(bakim.baslamaTarihi).toISOString().split('T')[0] : '',
        bitisTarihi: bakim.bitisTarihi ? new Date(bakim.bitisTarihi).toISOString().split('T')[0] : '',
        maliyet: bakim.maliyet ? bakim.maliyet.toString() : '',
        odemeDurumu: bakim.odemeDurumu || false,
        odemeTarihi: bakim.odemeTarihi ? new Date(bakim.odemeTarihi).toISOString().split('T')[0] : '',
        tedarikci: bakim.tedarikci || '',
        tedarikciTelefon: bakim.tedarikciTelefon || '',
        tedarikciAdres: bakim.tedarikciAdres || '',
        notlar: bakim.notlar || '',
      });
    } else {
      setFormData({
        aracId: '',
        bakimTipi: 'BAKIM',
        baslik: '',
        aciklama: '',
        planlananTarih: '',
        baslamaTarihi: '',
        bitisTarihi: '',
        maliyet: '',
        odemeDurumu: false,
        odemeTarihi: '',
        tedarikci: '',
        tedarikciTelefon: '',
        tedarikciAdres: '',
        notlar: '',
      });
    }
    setErrors({});
  }, [bakim, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Araç seçildiğinde otomatik öneriler
    if (name === 'aracId' && value) {
      const selectedArac = araclar.find(arac => arac.id === value);
      if (selectedArac) {
        // Sigorta tarihi yaklaşıyorsa öner
        if (selectedArac.sigortaTarihi) {
          const sigortaTarihi = new Date(selectedArac.sigortaTarihi);
          const bugun = new Date();
          const gunFarki = Math.ceil((sigortaTarihi.getTime() - bugun.getTime()) / (1000 * 3600 * 24));
          
          if (gunFarki <= 30 && gunFarki >= 0) {
            // Sigorta 30 gün içinde bitiyorsa otomatik öner
            setFormData(prev => ({
              ...prev,
              bakimTipi: 'SIGORTA',
              baslik: `${selectedArac.plaka} - Sigorta Yenileme`,
              planlananTarih: selectedArac.sigortaTarihi,
              aciklama: `Araç sigortası ${gunFarki} gün sonra sona erecek. Yenileme işlemi gerekli.`
            }));
          }
        }
        
        // Muayene tarihi yaklaşıyorsa öner
        if (selectedArac.muayeneTarihi) {
          const muayeneTarihi = new Date(selectedArac.muayeneTarihi);
          const bugun = new Date();
          const gunFarki = Math.ceil((muayeneTarihi.getTime() - bugun.getTime()) / (1000 * 3600 * 24));
          
          if (gunFarki <= 30 && gunFarki >= 0) {
            // Muayene 30 gün içinde bitiyorsa otomatik öner
            setFormData(prev => ({
              ...prev,
              bakimTipi: 'MUAYENE',
              baslik: `${selectedArac.plaka} - Muayene`,
              planlananTarih: selectedArac.muayeneTarihi,
              aciklama: `Araç muayenesi ${gunFarki} gün sonra sona erecek. Muayene işlemi gerekli.`
            }));
          }
        }
      }
    }

    // Hata mesajını temizle
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.aracId) {
      newErrors.aracId = 'Araç seçimi zorunludur';
    }

    if (!formData.baslik.trim()) {
      newErrors.baslik = 'Başlık zorunludur';
    }

    if (!formData.planlananTarih) {
      newErrors.planlananTarih = 'Planlanan tarih zorunludur';
    }

    if (formData.maliyet && isNaN(parseFloat(formData.maliyet))) {
      newErrors.maliyet = 'Geçerli bir maliyet giriniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {bakim ? 'Bakım Düzenle' : 'Yeni Bakım Ekle'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Araç Seçimi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Araç *
            </label>
            <select
              name="aracId"
              value={formData.aracId}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                errors.aracId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <option value="">Araç seçiniz</option>
              {araclar.map((arac) => (
                <option key={arac.id} value={arac.id}>
                  {arac.plaka} - {arac.marka} {arac.model}
                </option>
              ))}
            </select>
            {errors.aracId && (
              <p className="mt-1 text-sm text-red-600">{errors.aracId}</p>
            )}
          </div>

          {/* Bakım Tipi ve Başlık */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bakım Tipi
              </label>
              <select
                name="bakimTipi"
                value={formData.bakimTipi}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="BAKIM">Bakım</option>
                <option value="ONARIM">Onarım</option>
                <option value="SIGORTA">Sigorta</option>
                <option value="MUAYENE">Muayene</option>
                <option value="LASTIK">Lastik</option>
                <option value="YAKIT">Yakıt</option>
                <option value="DIGER">Diğer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Başlık *
              </label>
              <input
                type="text"
                name="baslik"
                value={formData.baslik}
                onChange={handleInputChange}
                placeholder="Bakım başlığı"
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.baslik ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.baslik && (
                <p className="mt-1 text-sm text-red-600">{errors.baslik}</p>
              )}
            </div>
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="inline h-4 w-4 mr-1" />
              Açıklama
            </label>
            <textarea
              name="aciklama"
              value={formData.aciklama}
              onChange={handleInputChange}
              rows={3}
              placeholder="Bakım detayları..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Tarihler */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Planlanan Tarih *
              </label>
              <input
                type="date"
                name="planlananTarih"
                value={formData.planlananTarih}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.planlananTarih ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.planlananTarih && (
                <p className="mt-1 text-sm text-red-600">{errors.planlananTarih}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Başlama Tarihi
              </label>
              <input
                type="date"
                name="baslamaTarihi"
                value={formData.baslamaTarihi}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                name="bitisTarihi"
                value={formData.bitisTarihi}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Maliyet ve Ödeme */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Maliyet (₺)
              </label>
              <input
                type="number"
                name="maliyet"
                value={formData.maliyet}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.maliyet ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.maliyet && (
                <p className="mt-1 text-sm text-red-600">{errors.maliyet}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="odemeDurumu"
                checked={formData.odemeDurumu}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Ödeme Yapıldı
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ödeme Tarihi
              </label>
              <input
                type="date"
                name="odemeTarihi"
                value={formData.odemeTarihi}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Tedarikçi Bilgileri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Tedarikçi
              </label>
              <input
                type="text"
                name="tedarikci"
                value={formData.tedarikci}
                onChange={handleInputChange}
                placeholder="Tedarikçi adı"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Phone className="inline h-4 w-4 mr-1" />
                Tedarikçi Telefon
              </label>
              <input
                type="tel"
                name="tedarikciTelefon"
                value={formData.tedarikciTelefon}
                onChange={handleInputChange}
                placeholder="Telefon numarası"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              Tedarikçi Adres
            </label>
            <textarea
              name="tedarikciAdres"
              value={formData.tedarikciAdres}
              onChange={handleInputChange}
              rows={2}
              placeholder="Tedarikçi adresi"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Notlar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="inline h-4 w-4 mr-1" />
              Notlar
            </label>
            <textarea
              name="notlar"
              value={formData.notlar}
              onChange={handleInputChange}
              rows={3}
              placeholder="Ek notlar..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Butonlar */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Kaydediliyor...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  {bakim ? 'Güncelle' : 'Kaydet'}
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
