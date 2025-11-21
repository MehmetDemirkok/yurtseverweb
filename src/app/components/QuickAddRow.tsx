'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

interface QuickAddRowProps {
    onAddRecord: (record: any) => void;
}

export default function QuickAddRow({ onAddRecord }: QuickAddRowProps) {
    const [quickFormData, setQuickFormData] = useState({
        adiSoyadi: '',
        unvani: '',
        girisTarihi: '',
        cikisTarihi: '',
        odaTipi: 'Single Oda',
        konaklamaTipi: 'BB',
        gecelikUcret: '',
        toplamUcret: '',
        otelAdi: '',
        numberOfNights: 0,
    });

    // Gece sayısını ve toplam ücreti hesapla
    useEffect(() => {
        if (quickFormData.girisTarihi && quickFormData.cikisTarihi) {
            const checkIn = new Date(quickFormData.girisTarihi);
            const checkOut = new Date(quickFormData.cikisTarihi);
            const diffTime = checkOut.getTime() - checkIn.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            const nights = diffDays > 0 ? diffDays : 0;

            if (nights > 0) {
                const gecelikUcret = parseFloat(quickFormData.gecelikUcret) || 0;
                const total = nights * gecelikUcret;
                setQuickFormData(prev => ({
                    ...prev,
                    numberOfNights: nights,
                    toplamUcret: total.toFixed(2)
                }));
            } else {
                setQuickFormData(prev => ({
                    ...prev,
                    numberOfNights: 0,
                    toplamUcret: ''
                }));
            }
        } else {
            setQuickFormData(prev => ({
                ...prev,
                numberOfNights: 0,
                toplamUcret: ''
            }));
        }
    }, [quickFormData.girisTarihi, quickFormData.cikisTarihi, quickFormData.gecelikUcret]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setQuickFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleQuickAdd = async () => {
        // Validation
        if (!quickFormData.adiSoyadi || !quickFormData.unvani || !quickFormData.girisTarihi ||
            !quickFormData.cikisTarihi || !quickFormData.otelAdi) {
            alert('Lütfen tüm gerekli alanları doldurun!');
            return;
        }

        const gecelikUcret = parseFloat(quickFormData.gecelikUcret);
        if (isNaN(gecelikUcret) || gecelikUcret <= 0) {
            alert('Gecelik ücret 0\'dan büyük olmalıdır!');
            return;
        }

        try {
            const response = await fetch('/api/accommodation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adiSoyadi: quickFormData.adiSoyadi,
                    unvani: quickFormData.unvani,
                    girisTarihi: quickFormData.girisTarihi,
                    cikisTarihi: quickFormData.cikisTarihi,
                    odaTipi: quickFormData.odaTipi,
                    konaklamaTipi: quickFormData.konaklamaTipi,
                    gecelikUcret: parseFloat(quickFormData.gecelikUcret),
                    toplamUcret: parseFloat(quickFormData.toplamUcret),
                    otelAdi: quickFormData.otelAdi,
                    numberOfNights: quickFormData.numberOfNights,
                    ulke: 'Türkiye',
                    sehir: '',
                    isMunferit: false,
                }),
            });

            if (response.ok) {
                const newRecord = await response.json();
                onAddRecord(newRecord);

                // Form'u temizle
                setQuickFormData({
                    adiSoyadi: '',
                    unvani: '',
                    girisTarihi: '',
                    cikisTarihi: '',
                    odaTipi: 'Single Oda',
                    konaklamaTipi: 'BB',
                    gecelikUcret: '',
                    toplamUcret: '',
                    otelAdi: '',
                    numberOfNights: 0,
                });

                // Sayfayı yenile
                window.location.reload();
            } else {
                const error = await response.json();
                alert(`Hata: ${error.error || 'Kayıt eklenemedi'}`);
            }
        } catch (error) {
            console.error('Quick add error:', error);
            alert('Kayıt eklenirken bir hata oluştu!');
        }
    };

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-800">Hızlı Kayıt Ekle</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Adı Soyadı */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Adı Soyadı *</label>
                    <input
                        type="text"
                        name="adiSoyadi"
                        value={quickFormData.adiSoyadi}
                        onChange={handleInputChange}
                        placeholder="Adı Soyadı"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                </div>

                {/* Unvanı */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Unvanı *</label>
                    <input
                        type="text"
                        name="unvani"
                        value={quickFormData.unvani}
                        onChange={handleInputChange}
                        placeholder="Unvanı"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                </div>

                {/* Giriş Tarihi */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Giriş Tarihi *</label>
                    <input
                        type="date"
                        name="girisTarihi"
                        value={quickFormData.girisTarihi}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                </div>

                {/* Çıkış Tarihi */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Çıkış Tarihi *</label>
                    <input
                        type="date"
                        name="cikisTarihi"
                        value={quickFormData.cikisTarihi}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                </div>

                {/* Oda Tipi */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Oda Tipi</label>
                    <select
                        name="odaTipi"
                        value={quickFormData.odaTipi}
                        onChange={handleInputChange}
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
                        value={quickFormData.konaklamaTipi}
                        onChange={handleInputChange}
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
                        value={quickFormData.gecelikUcret}
                        onChange={handleInputChange}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                </div>

                {/* Toplam Ücret (Otomatik) */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Toplam Ücret</label>
                    <input
                        type="number"
                        value={quickFormData.toplamUcret}
                        disabled
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold"
                    />
                    {quickFormData.numberOfNights > 0 && (
                        <p className="text-xs text-gray-500 mt-1">{quickFormData.numberOfNights} gece</p>
                    )}
                </div>

                {/* Otel Adı */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Otel Adı *</label>
                    <input
                        type="text"
                        name="otelAdi"
                        value={quickFormData.otelAdi}
                        onChange={handleInputChange}
                        placeholder="Otel Adı"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                </div>

                {/* Kaydet Butonu */}
                <div className="flex items-end">
                    <button
                        onClick={handleQuickAdd}
                        className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Kayıt Oluştur
                    </button>
                </div>
            </div>
        </div>
    );
}
