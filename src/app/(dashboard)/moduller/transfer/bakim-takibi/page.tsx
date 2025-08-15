'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, AlertTriangle, CheckCircle, Clock, X, Edit, Trash2, Eye, Download } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import BakimModal from './components/BakimModal';

interface AracBakim {
  id: string;
  aracId: string;
  bakimTipi: 'BAKIM' | 'ONARIM' | 'SIGORTA' | 'MUAYENE' | 'LASTIK' | 'YAKIT' | 'DIGER';
  durum: 'PLANLANDI' | 'DEVAM_EDIYOR' | 'TAMAMLANDI' | 'IPTAL';
  baslik: string;
  aciklama?: string;
  planlananTarih: string;
  baslamaTarihi?: string;
  bitisTarihi?: string;
  maliyet?: number;
  odemeDurumu: boolean;
  odemeTarihi?: string;
  tedarikci?: string;
  tedarikciTelefon?: string;
  tedarikciAdres?: string;
  notlar?: string;
  dosyalar: string[];
  createdAt: string;
  updatedAt: string;
  arac: {
    id: string;
    plaka: string;
    marka: string;
    model: string;
  };
  user: {
    id: number;
    name: string;
  };
}

export default function BakimTakibiPage() {
  const [bakimlar, setBakimlar] = useState<AracBakim[]>([]);
  const [araclar, setAraclar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('TUMU');
  const [showModal, setShowModal] = useState(false);
  const [selectedBakim, setSelectedBakim] = useState<AracBakim | null>(null);
  const [editingBakim, setEditingBakim] = useState<AracBakim | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchBakimlar();
    fetchAraclar();
  }, []);

  const fetchBakimlar = async () => {
    try {
      const response = await fetch('/api/moduller/transfer/bakim-takibi', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setBakimlar(data.bakimlar);
      }
    } catch (error) {
      console.error('Bakım verileri alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAraclar = async () => {
    try {
      const response = await fetch('/api/moduller/transfer/araclar', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setAraclar(data.araclar);
      }
    } catch (error) {
      console.error('Araç verileri alınamadı:', error);
    }
  };

  const getBakimTipiColor = (tip: string) => {
    const colors = {
      BAKIM: 'bg-blue-100 text-blue-800',
      ONARIM: 'bg-red-100 text-red-800',
      SIGORTA: 'bg-green-100 text-green-800',
      MUAYENE: 'bg-yellow-100 text-yellow-800',
      LASTIK: 'bg-purple-100 text-purple-800',
      YAKIT: 'bg-orange-100 text-orange-800',
      DIGER: 'bg-gray-100 text-gray-800'
    };
    return colors[tip as keyof typeof colors] || colors.DIGER;
  };

  const getDurumColor = (durum: string) => {
    const colors = {
      PLANLANDI: 'bg-yellow-100 text-yellow-800',
      DEVAM_EDIYOR: 'bg-blue-100 text-blue-800',
      TAMAMLANDI: 'bg-green-100 text-green-800',
      IPTAL: 'bg-red-100 text-red-800'
    };
    return colors[durum as keyof typeof colors] || colors.PLANLANDI;
  };

  const getDurumIcon = (durum: string) => {
    switch (durum) {
      case 'PLANLANDI':
        return <Clock className="h-4 w-4" />;
      case 'DEVAM_EDIYOR':
        return <AlertTriangle className="h-4 w-4" />;
      case 'TAMAMLANDI':
        return <CheckCircle className="h-4 w-4" />;
      case 'IPTAL':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredBakimlar = bakimlar.filter(bakim => {
    const matchesSearch = bakim.baslik.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bakim.arac.plaka.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bakim.tedarikci?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = selectedFilter === 'TUMU' || bakim.durum === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getBakimTipiText = (tip: string) => {
    const texts = {
      BAKIM: 'Bakım',
      ONARIM: 'Onarım',
      SIGORTA: 'Sigorta',
      MUAYENE: 'Muayene',
      LASTIK: 'Lastik',
      YAKIT: 'Yakıt',
      DIGER: 'Diğer'
    };
    return texts[tip as keyof typeof texts] || 'Diğer';
  };

  const getDurumText = (durum: string) => {
    const texts = {
      PLANLANDI: 'Planlandı',
      DEVAM_EDIYOR: 'Devam Ediyor',
      TAMAMLANDI: 'Tamamlandı',
      IPTAL: 'İptal'
    };
    return texts[durum as keyof typeof texts] || 'Planlandı';
  };

  const yaklasanBakimlar = bakimlar.filter(bakim => {
    const planlananTarih = new Date(bakim.planlananTarih);
    const bugun = new Date();
    const fark = planlananTarih.getTime() - bugun.getTime();
    const gunFarki = Math.ceil(fark / (1000 * 3600 * 24));
    return gunFarki <= 7 && gunFarki >= 0 && bakim.durum === 'PLANLANDI';
  });

  const gecmisBakimlar = bakimlar.filter(bakim => {
    const planlananTarih = new Date(bakim.planlananTarih);
    const bugun = new Date();
    return planlananTarih < bugun && bakim.durum === 'TAMAMLANDI';
  });

  const handleSaveBakim = async (bakimData: any) => {
    setModalLoading(true);
    try {
      const url = editingBakim 
        ? `/api/moduller/transfer/bakim-takibi/${editingBakim.id}`
        : '/api/moduller/transfer/bakim-takibi';
      
      const method = editingBakim ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(bakimData),
      });

      if (response.ok) {
        await fetchBakimlar();
        setShowModal(false);
        setEditingBakim(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Bakım kaydedilirken hata:', error);
      alert('Bakım kaydedilemedi');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteBakim = async (bakimId: string) => {
    if (!confirm('Bu bakım kaydını silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/moduller/transfer/bakim-takibi/${bakimId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchBakimlar();
      } else {
        const error = await response.json();
        alert(error.error || 'Silme işlemi başarısız');
      }
    } catch (error) {
      console.error('Bakım silinirken hata:', error);
      alert('Bakım silinemedi');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sayfa Başlığı */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Araç Bakım Takibi
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Araç bakım, onarım, sigorta ve muayene işlemlerini takip edin
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Bakım Ekle
          </button>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Planlanan Bakımlar
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {bakimlar.filter(b => b.durum === 'PLANLANDI').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Devam Eden
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {bakimlar.filter(b => b.durum === 'DEVAM_EDIYOR').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Tamamlanan
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {bakimlar.filter(b => b.durum === 'TAMAMLANDI').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Yaklaşan (7 gün)
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {yaklasanBakimlar.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Yaklaşan Bakımlar Uyarısı */}
      {yaklasanBakimlar.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Yaklaşan Bakımlar
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  Önümüzdeki 7 gün içinde {yaklasanBakimlar.length} adet bakım planlanmıştır.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtreler ve Arama */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Araç plakası, başlık veya tedarikçi ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="TUMU">Tümü</option>
              <option value="PLANLANDI">Planlandı</option>
              <option value="DEVAM_EDIYOR">Devam Ediyor</option>
              <option value="TAMAMLANDI">Tamamlandı</option>
              <option value="IPTAL">İptal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bakım Listesi */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            Bakım Listesi
          </h3>
          
          {filteredBakimlar.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Bakım kaydı bulunamadı
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Yeni bir bakım kaydı ekleyerek başlayın.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Araç
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Bakım Tipi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Başlık
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Planlanan Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Maliyet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredBakimlar.map((bakim) => (
                    <tr key={bakim.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {bakim.arac.plaka}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {bakim.arac.marka} {bakim.arac.model}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBakimTipiColor(bakim.bakimTipi)}`}>
                          {getBakimTipiText(bakim.bakimTipi)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white font-medium">
                          {bakim.baslik}
                        </div>
                        {bakim.aciklama && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {bakim.aciklama}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getDurumIcon(bakim.durum)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDurumColor(bakim.durum)}`}>
                            {getDurumText(bakim.durum)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {format(new Date(bakim.planlananTarih), 'dd MMM yyyy', { locale: tr })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {bakim.maliyet ? (
                          <div className="text-sm text-gray-900 dark:text-white">
                            ₺{bakim.maliyet.toLocaleString('tr-TR')}
                            {bakim.odemeDurumu && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Ödendi
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedBakim(bakim)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                                                     <button
                             onClick={() => setEditingBakim(bakim)}
                             className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                           >
                             <Edit className="h-4 w-4" />
                           </button>
                           <button
                             onClick={() => handleDeleteBakim(bakim.id)}
                             className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                           >
                             <Trash2 className="h-4 w-4" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detay Modal */}
      {selectedBakim && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Bakım Detayları
                </h3>
                <button
                  onClick={() => setSelectedBakim(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Araç
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedBakim.arac.plaka} - {selectedBakim.arac.marka} {selectedBakim.arac.model}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Başlık
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedBakim.baslik}
                  </p>
                </div>
                
                {selectedBakim.aciklama && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Açıklama
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedBakim.aciklama}
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Bakım Tipi
                    </label>
                    <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBakimTipiColor(selectedBakim.bakimTipi)}`}>
                      {getBakimTipiText(selectedBakim.bakimTipi)}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Durum
                    </label>
                    <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDurumColor(selectedBakim.durum)}`}>
                      {getDurumText(selectedBakim.durum)}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Planlanan Tarih
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {format(new Date(selectedBakim.planlananTarih), 'dd MMM yyyy', { locale: tr })}
                    </p>
                  </div>
                  
                  {selectedBakim.maliyet && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Maliyet
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        ₺{selectedBakim.maliyet.toLocaleString('tr-TR')}
                      </p>
                    </div>
                  )}
                </div>
                
                {selectedBakim.tedarikci && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tedarikçi
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedBakim.tedarikci}
                      {selectedBakim.tedarikciTelefon && (
                        <span className="block text-gray-500 dark:text-gray-400">
                          {selectedBakim.tedarikciTelefon}
                        </span>
                      )}
                    </p>
                  </div>
                )}
                
                {selectedBakim.notlar && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notlar
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedBakim.notlar}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedBakim(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
                 </div>
       )}

       {/* Bakım Modal */}
       <BakimModal
         isOpen={showModal || !!editingBakim}
         onClose={() => {
           setShowModal(false);
           setEditingBakim(null);
         }}
         onSave={handleSaveBakim}
         bakim={editingBakim}
         araclar={araclar}
         loading={modalLoading}
       />
     </div>
   );
 }
