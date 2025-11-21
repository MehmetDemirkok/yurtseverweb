"use client";

import { useState } from 'react';
import { X, DollarSign } from 'lucide-react';

interface SalesPriceModalProps {
  isOpen: boolean;
  records: Array<{
    id: number;
    adiSoyadi: string;
    toplamUcret: number;
    numberOfNights?: number;
  }>;
  onClose: () => void;
  onConfirm: (prices: Record<number, { satisFiyati: number; toplamSatisFiyati: number }>) => void;
}

export default function SalesPriceModal({ isOpen, records, onClose, onConfirm }: SalesPriceModalProps) {
  const [prices, setPrices] = useState<Record<number, { satisFiyati: number; toplamSatisFiyati: number }>>({});
  const [skipAll, setSkipAll] = useState(false);

  if (!isOpen) return null;

  const handlePriceChange = (id: number, field: 'satisFiyati' | 'toplamSatisFiyati', value: string) => {
    const numValue = parseFloat(value) || 0;
    setPrices(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: numValue,
      }
    }));
  };

  const handleConfirm = () => {
    if (skipAll) {
      // Tüm fiyatları boş olarak gönder
      onConfirm({});
    } else {
      // Girilen fiyatları gönder
      onConfirm(prices);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Satış Fiyatları</h2>
              <p className="text-sm text-gray-500 mt-1">
                {records.length} kayıt için satış fiyatlarını girebilir veya boş bırakabilirsiniz
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={skipAll}
                onChange={(e) => setSkipAll(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-yellow-800">
                Tüm kayıtları satış fiyatı olmadan aktar (boş bırak)
              </span>
            </label>
          </div>

          {!skipAll && (
            <div className="space-y-4">
              {records.map((record) => {
                const recordPrices = prices[record.id] || { satisFiyati: 0, toplamSatisFiyati: 0 };
                const gecelikUcret = record.toplamUcret / (record.numberOfNights || 1);

                return (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{record.adiSoyadi}</h3>
                        <p className="text-sm text-gray-500">
                          Alış Fiyatı: ₺{record.toplamUcret.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          {record.numberOfNights && ` (${record.numberOfNights} gece)`}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gecelik Satış Fiyatı (₺)
                        </label>
                        <input
                          type="number"
                          value={recordPrices.satisFiyati || ''}
                          onChange={(e) => handlePriceChange(record.id, 'satisFiyati', e.target.value)}
                          placeholder={gecelikUcret.toFixed(2)}
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Toplam Satış Fiyatı (₺)
                        </label>
                        <input
                          type="number"
                          value={recordPrices.toplamSatisFiyati || ''}
                          onChange={(e) => handlePriceChange(record.id, 'toplamSatisFiyati', e.target.value)}
                          placeholder={record.toplamUcret.toFixed(2)}
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            {skipAll ? 'Boş Olarak Aktar' : 'Fiyatları Kaydet ve Aktar'}
          </button>
        </div>
      </div>
    </div>
  );
}

