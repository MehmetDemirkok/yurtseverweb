"use client";

import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import AuthGuard from "../components/AuthGuard";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface Transaction {
  id: number;
  type: "ALIS" | "SATIS";
  description: string;
  amount: number;
  date: string;
  user?: {
    name: string | null;
    email: string;
  };
}

interface User {
  id: number;
  email: string;
  name?: string;
  role: 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER';
  permissions?: string[];
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"ALIS" | "SATIS">("ALIS");
  const [form, setForm] = useState({ description: "", amount: "", date: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();
  
  // Kurum ve organizasyon seçimi için state'ler
  const [selectedKurum, setSelectedKurum] = useState<string>("");
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [availableOrgs, setAvailableOrgs] = useState<string[]>([]);
  const [kurumList, setKurumList] = useState<string[]>([]);
  const [showStats, setShowStats] = useState(false);

  // Kullanıcı bilgilerini, işlemleri, satışları ve konaklama kayıtlarını çek
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        // Kullanıcı bilgilerini al
        const userRes = await fetch('/api/user', { credentials: 'include' });
        if (userRes.status === 401) {
          router.replace('/login');
          return;
        }
        
        const userData = await userRes.json();
        setCurrentUser(userData.user);
        
        // Finans sayfasına erişim yetkisi kontrolü
        const hasPermission = userData.user.permissions.includes('FINANCE_VIEW') || 
                             userData.user.role === 'ADMIN' || 
                             userData.user.role === 'MANAGER';
        
        if (!hasPermission) {
          router.replace('/no-access');
          return;
        }
        
        // Paralel olarak tüm verileri çek
        const [transRes, salesRes, accommodationsRes] = await Promise.all([
          fetch('/api/transactions'),
          fetch('/api/sales'),
          fetch('/api/accommodation')
        ]);
        
        // İşlemleri kontrol et
        if (!transRes.ok) {
          const errorData = await transRes.json();
          throw new Error(errorData.error || 'İşlemler alınamadı');
        }
        
        // Satışları kontrol et
        if (!salesRes.ok) {
          const errorData = await salesRes.json();
          throw new Error(errorData.error || 'Satışlar alınamadı');
        }
        
        // Konaklama kayıtlarını kontrol et
        if (!accommodationsRes.ok) {
          const errorData = await accommodationsRes.json();
          throw new Error(errorData.error || 'Konaklama kayıtları alınamadı');
        }
        
        // Verileri ayarla
        const transData = await transRes.json();
        const salesData = await salesRes.json();
        const accommodationsData = await accommodationsRes.json();
        
        setTransactions(transData);
        setSales(salesData);
        setAccommodations(accommodationsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
        console.error('Veri çekme hatası:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, [router]);

  // Konaklama kayıtlarından toplam alış hesaplama
  const totalAlisFromAccommodation = accommodations.reduce((sum, acc) => sum + (acc.toplamUcret || 0), 0);
  
  // Satışlardan toplam satış hesaplama
  const totalSatisFromSales = sales.reduce((sum, sale) => {
    // Satış fiyatı ve gece sayısını kontrol et
    const fiyat = sale.fiyat || 0;
    const numberOfNights = sale.accommodation?.numberOfNights || 1;
    return sum + (fiyat * numberOfNights);
  }, 0);
  
  // Eski işlemlerden toplam alış ve satış (geriye dönük uyumluluk için)
  const totalAlisFromTransactions = transactions.filter(t => t.type === "ALIS").reduce((sum, t) => sum + t.amount, 0);
  const totalSatisFromTransactions = transactions.filter(t => t.type === "SATIS").reduce((sum, t) => sum + t.amount, 0);
  
  // Toplam değerler
  const totalAlis = totalAlisFromAccommodation + totalAlisFromTransactions;
  const totalSatis = totalSatisFromSales + totalSatisFromTransactions;
  const net = totalSatis - totalAlis;

  // İşlem ekleme yetkisi kontrolü
  const canAddTransaction = () => {
    if (!currentUser) return false;
    return currentUser.permissions?.includes('FINANCE_EDIT') || 
           currentUser.role === 'ADMIN' || 
           currentUser.role === 'MANAGER';
  };

  // İşlem silme yetkisi kontrolü
  const canDeleteTransaction = () => {
    if (!currentUser) return false;
    return currentUser.permissions?.includes('FINANCE_DELETE') || 
           currentUser.role === 'ADMIN';
  };

  const handleAdd = (type: "ALIS" | "SATIS") => {
    setModalType(type);
    setForm({ description: "", amount: "", date: new Date().toISOString().slice(0, 10) });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.description || !form.amount || !form.date) return;
    
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: modalType,
          description: form.description,
          amount: form.amount,
          date: form.date
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'İşlem eklenemedi');
      }
      
      const newTransaction = await res.json();
      setTransactions(prev => [...prev, newTransaction]);
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem eklenirken bir hata oluştu');
      console.error('İşlem ekleme hatası:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'İşlem silinemedi');
      }
      
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem silinirken bir hata oluştu');
      console.error('İşlem silme hatası:', err);
    }
  };

  // Kurum adını description'dan ayıkla
  function getKurumNameFromDescription(description: string) {
    // Format: "Kurum Adı | Organizasyon Adı - ..."
    if (!description) return 'Diğer';
    const match = description.match(/^(.*?)\s*\|/);
    if (match) return match[1].trim();
    return 'Diğer';
  }

  // Organizasyon adını description'dan ayıkla
  function getOrgNameFromDescription(description: string) {
    // Format: "Kurum Adı | Organizasyon Adı - ..."
    if (!description) return 'Diğer';
    const match = description.match(/^.*?\|\s*(.*?)\s*-/);
    if (match) return match[1].trim();
    return 'Diğer';
  }

  // Kurum ve organizasyon özetleri için state'ler
  const [kurumOrgSummary, setKurumOrgSummary] = useState<Record<string, Record<string, { alis: number; satis: number }>>>({});
  const [kurumSummary, setKurumSummary] = useState<Record<string, { alis: number; satis: number }>>({});

  // Özet hesaplamalarını useEffect içinde yap
  useEffect(() => {
    // Kurum > Organizasyon bazında özet hesaplama
    const calculateKurumOrgSummary = () => {
      // Başlangıç özeti
      const summary: Record<string, Record<string, { alis: number; satis: number }>> = {};
      
      // Eski işlemleri ekle (geriye dönük uyumluluk için)
      transactions.forEach(t => {
        if (t.type !== 'ALIS' && t.type !== 'SATIS') return;
        const kurum = t.type === 'SATIS' ? getKurumNameFromDescription(t.description) : 'Diğer';
        const org = t.type === 'SATIS' ? getOrgNameFromDescription(t.description) : 'Diğer';
        if (!summary[kurum]) summary[kurum] = {};
        if (!summary[kurum][org]) summary[kurum][org] = { alis: 0, satis: 0 };
        if (t.type === 'ALIS') summary[kurum][org].alis += t.amount;
        if (t.type === 'SATIS') summary[kurum][org].satis += t.amount;
      });
      
      // Satışları ekle
      sales.forEach(sale => {
        const kurum = sale.kurumCari || getKurumNameFromDescription(sale.organizasyonAdi) || 'Diğer';
        const org = sale.organizasyonAdi || 'Diğer';
        const fiyat = sale.fiyat || 0;
        const numberOfNights = sale.accommodation?.numberOfNights || 1;
        const satisTutari = fiyat * numberOfNights;
        
        if (!summary[kurum]) summary[kurum] = {};
        if (!summary[kurum][org]) summary[kurum][org] = { alis: 0, satis: 0 };
        summary[kurum][org].satis += satisTutari;
      });
      
      // Konaklama kayıtlarını ekle
      accommodations.forEach(acc => {
        const kurum = acc.kurumCari || 'Diğer';
        const org = acc.organizasyonAdi || 'Diğer';
        const toplamUcret = acc.toplamUcret || 0;
        
        if (!summary[kurum]) summary[kurum] = {};
        if (!summary[kurum][org]) summary[kurum][org] = { alis: 0, satis: 0 };
        summary[kurum][org].alis += toplamUcret;
      });
      
      return summary;
    };

    // Kurum bazında özet hesaplama
    const calculateKurumSummary = () => {
      // Başlangıç özeti
      const summary: Record<string, { alis: number; satis: number }> = {};
      
      // Eski işlemleri ekle (geriye dönük uyumluluk için)
      transactions.forEach(t => {
        const kurum = t.type === 'SATIS' ? getKurumNameFromDescription(t.description) : 'Diğer';
        if (!summary[kurum]) summary[kurum] = { alis: 0, satis: 0 };
        if (t.type === 'ALIS') summary[kurum].alis += t.amount;
        if (t.type === 'SATIS') summary[kurum].satis += t.amount;
      });
      
      // Satışları ekle
      sales.forEach(sale => {
        const kurum = sale.kurumCari || getKurumNameFromDescription(sale.organizasyonAdi) || 'Diğer';
        const fiyat = sale.fiyat || 0;
        const numberOfNights = sale.accommodation?.numberOfNights || 1;
        const satisTutari = fiyat * numberOfNights;
        
        if (!summary[kurum]) summary[kurum] = { alis: 0, satis: 0 };
        summary[kurum].satis += satisTutari;
      });
      
      // Konaklama kayıtlarını ekle
      accommodations.forEach(acc => {
        const kurum = acc.kurumCari || 'Diğer';
        const toplamUcret = acc.toplamUcret || 0;
        
        if (!summary[kurum]) summary[kurum] = { alis: 0, satis: 0 };
        summary[kurum].alis += toplamUcret;
      });
      
      return summary;
    };

    // Hesaplamaları yap ve state'leri güncelle
    const orgSummary = calculateKurumOrgSummary();
    const kurumSum = calculateKurumSummary();
    
    setKurumOrgSummary(orgSummary);
    setKurumSummary(kurumSum);
    
    // Kurum listesini güncelle
    const kurumlar = Object.keys(kurumSum).sort();
    setKurumList(kurumlar);
  }, [transactions, sales, accommodations]);

  // Kurum listesi değiştiğinde kontrol et
  useEffect(() => {
    // Eğer seçili kurum varsa ve bu kurum listede yoksa, seçimi sıfırla
    if (selectedKurum && !kurumList.includes(selectedKurum)) {
      setSelectedKurum("");
      setSelectedOrg("");
    }
  }, [kurumList]);

  // Seçili kurum değiştiğinde organizasyon listesini güncelle
  useEffect(() => {
    if (selectedKurum && kurumOrgSummary[selectedKurum]) {
      const orgs = Object.keys(kurumOrgSummary[selectedKurum]).sort();
      setAvailableOrgs(orgs);
      
      // Eğer seçili organizasyon varsa ve bu organizasyon listede yoksa, seçimi sıfırla
      if (selectedOrg && !orgs.includes(selectedOrg)) {
        setSelectedOrg("");
      }
    } else {
      setAvailableOrgs([]);
    }
  }, [selectedKurum, kurumOrgSummary]);

  return (
    <AuthGuard requiredPermissions={['FINANCE_VIEW']}>
      <div className="w-full max-w-5xl mx-auto px-4 py-8 animate-fade-in">
        <PageHeader
          title="Finans Takibi"
          description="Alış ve satış işlemlerinizi kolayca yönetin"
          icon={<svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.343-4 3s1.79 3 4 3 4 1.343 4 3-1.79 3-4 3m0-12c1.657 0 3 .895 3 2s-1.343 2-3 2-3 .895-3 2 1.343 2 3 2m0-8v2m0 12v2" /></svg>}
        />
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            <strong className="font-bold">Hata!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        ) : (
          <>
            {/* Özet Kartlar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
              <div className="card p-6 flex items-center gap-4 bg-gradient-to-r from-blue-100 to-blue-50 border border-blue-200">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-200">
                  <svg className="w-7 h-7 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.343-4 3s1.79 3 4 3 4 1.343 4 3-1.79 3-4 3m0-12c1.657 0 3 .895 3 2s-1.343 2-3 2-3 .895-3 2 1.343 2 3 2m0-8v2m0 12v2" /></svg>
                </div>
                <div>
                  <div className="text-gray-500">Toplam Alış</div>
                  <div className="text-2xl font-bold text-blue-700">{totalAlis.toLocaleString('tr-TR')} ₺</div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="inline-block mr-2">Konaklama: {totalAlisFromAccommodation.toLocaleString('tr-TR')} ₺</span>
                    <span className="inline-block">Diğer: {totalAlisFromTransactions.toLocaleString('tr-TR')} ₺</span>
                  </div>
                </div>
              </div>
              <div className="card p-6 flex items-center gap-4 bg-gradient-to-r from-green-100 to-green-50 border border-green-200">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-200">
                  <svg className="w-7 h-7 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
                </div>
                <div>
                  <div className="text-gray-500">Toplam Satış</div>
                  <div className="text-2xl font-bold text-green-700">{totalSatis.toLocaleString('tr-TR')} ₺</div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="inline-block mr-2">Satışlar: {totalSatisFromSales.toLocaleString('tr-TR')} ₺</span>
                    <span className="inline-block">Diğer: {totalSatisFromTransactions.toLocaleString('tr-TR')} ₺</span>
                  </div>
                </div>
              </div>
              <div className="card p-6 flex items-center gap-4 bg-gradient-to-r from-purple-100 to-purple-50 border border-purple-200">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-200">
                  <svg className="w-7 h-7 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.343-4 3s1.79 3 4 3 4 1.343 4 3-1.79 3-4 3m0-12c1.657 0 3 .895 3 2s-1.343 2-3 2-3 .895-3 2 1.343 2 3 2m0-8v2m0 12v2" /></svg>
                </div>
                <div>
                  <div className="text-gray-500">Net Kar/Zarar</div>
                  <div className={`text-2xl font-bold ${net >= 0 ? 'text-green-700' : 'text-red-700'}`}>{net.toLocaleString('tr-TR')} ₺</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Kar Marjı: {totalAlis > 0 ? Math.round((net / totalAlis) * 100) : 0}%
                  </div>
                </div>
              </div>
              <div className="card p-6 flex items-center gap-4 bg-gradient-to-r from-orange-100 to-orange-50 border border-orange-200">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-orange-200">
                  <svg className="w-7 h-7 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                  <div className="text-gray-500">İstatistikler</div>
                  <div className="text-sm font-bold text-orange-700 mt-1">
                    <div>Satış Kaydı: {sales.length}</div>
                    <div>Konaklama: {accommodations.length}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ekleme Butonları */}
            {/* Butonlar kaldırıldı */}
            
            {/* Tablo */}
            {/*
            <div className="card overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 text-left">Tarih</th>
                    <th className="p-3 text-left">Tür</th>
                    <th className="p-3 text-left">Açıklama</th>
                    <th className="p-3 text-right">Tutar (₺)</th>
                    {canDeleteTransaction() && <th className="p-3 text-center">İşlem</th>}
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={canDeleteTransaction() ? 5 : 4} className="p-4 text-center text-gray-500">Henüz işlem kaydı bulunmamaktadır.</td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id} className="border-b last:border-b-0">
                        <td className="p-3 whitespace-nowrap">{t.date}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.type === "ALIS" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{t.type === "ALIS" ? "Alış" : "Satış"}</span>
                        </td>
                        <td className="p-3">{t.description}</td>
                        <td className="p-3 text-right font-semibold">{t.amount.toLocaleString('tr-TR')}</td>
                        {canDeleteTransaction() && (
                          <td className="p-3 text-center">
                            <button className="btn btn-error btn-sm" onClick={() => handleDelete(t.id)}>Sil</button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            */}

            {/* Kurum ve Organizasyon Seçimi - Tek Kart Sistemi */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-blue-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Kurum ve Organizasyon Seçimi
              </h2>
              
              {/* Kurum Seçimi - Dropdown */}
              <div className="mb-6">
                <h3 className="text-md font-medium mb-3 text-blue-800">Kurumlar</h3>
                <div className="relative w-full max-w-md">
                  <select 
                    className="w-full p-3 bg-white border border-blue-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-800"
                    value={selectedKurum}
                    onChange={(e) => {
                      setSelectedKurum(e.target.value);
                      setSelectedOrg("");
                      setShowStats(!!e.target.value);
                    }}
                  >
                    <option value="">Kurum Seçiniz</option>
                    {Object.keys(kurumSummary).sort().map(kurum => (
                      <option key={kurum} value={kurum}>
                        {kurum} ({kurumSummary[kurum].alis.toLocaleString('tr-TR')} ₺ / {kurumSummary[kurum].satis.toLocaleString('tr-TR')} ₺)
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Organizasyon Seçimi - Dropdown - Sadece bir kurum seçildiğinde göster */}
              {selectedKurum && availableOrgs.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-medium mb-3 text-purple-800">
                    <span className="text-blue-700">{selectedKurum}</span> Kurumu - Organizasyonlar
                  </h3>
                  <div className="relative w-full max-w-md">
                    <select 
                      className="w-full p-3 bg-white border border-purple-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none text-gray-800"
                      value={selectedOrg}
                      onChange={(e) => {
                        setSelectedOrg(e.target.value);
                        setShowStats(true);
                      }}
                    >
                      <option value="">Tüm Organizasyonlar</option>
                      {availableOrgs.map(org => {
                        const data = kurumOrgSummary[selectedKurum]?.[org] || { alis: 0, satis: 0 };
                        return (
                          <option key={org} value={org}>
                            {org} ({data.alis.toLocaleString('tr-TR')} ₺ / {data.satis.toLocaleString('tr-TR')} ₺)
                          </option>
                        );
                      })}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-purple-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Seçilen Kurum/Organizasyon Kartı */}
              {showStats && selectedKurum && (
                <motion.div 
                  className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 overflow-hidden relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-blue-800">{selectedKurum}</h3>
                      {selectedOrg && <p className="text-md text-purple-700">{selectedOrg}</p>}
                    </div>
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {selectedOrg ? 'Organizasyon' : 'Kurum'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Toplam Alış */}
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800">Toplam Alış</h4>
                      </div>
                      <p className="text-2xl font-bold text-red-600">
                        {(selectedOrg 
                          ? (kurumOrgSummary[selectedKurum]?.[selectedOrg]?.alis || 0) 
                          : (kurumSummary[selectedKurum]?.alis || 0)).toLocaleString('tr-TR')} ₺
                      </p>
                    </div>
                    
                    {/* Toplam Satış */}
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800">Toplam Satış</h4>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {(selectedOrg 
                          ? (kurumOrgSummary[selectedKurum]?.[selectedOrg]?.satis || 0) 
                          : (kurumSummary[selectedKurum]?.satis || 0)).toLocaleString('tr-TR')} ₺
                      </p>
                    </div>
                    
                    {/* Net Kar/Zarar */}
                    {(() => {
                      const alis = selectedOrg 
                        ? (kurumOrgSummary[selectedKurum]?.[selectedOrg]?.alis || 0) 
                        : (kurumSummary[selectedKurum]?.alis || 0);
                      const satis = selectedOrg 
                        ? (kurumOrgSummary[selectedKurum]?.[selectedOrg]?.satis || 0) 
                        : (kurumSummary[selectedKurum]?.satis || 0);
                      const net = satis - alis;
                      const karMarji = satis > 0 ? ((net / satis) * 100).toFixed(2) : "0";
                      const isPositive = net >= 0;
                      
                      return (
                        <div className={`${isPositive ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'} p-4 rounded-lg border`}>
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 flex items-center justify-center rounded-full ${isPositive ? 'bg-blue-100' : 'bg-red-100'}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isPositive ? 'text-blue-500' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-gray-800">Net Kar/Zarar</h4>
                          </div>
                          <p className={`text-2xl font-bold ${isPositive ? 'text-blue-600' : 'text-red-600'}`}>
                            {net.toLocaleString('tr-TR')} ₺
                          </p>
                          <p className="text-sm mt-1">
                            Kar Marjı: <span className={`font-medium ${parseFloat(karMarji) >= 0 ? 'text-green-600' : 'text-red-600'}`}>%{karMarji}</span>
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* Alış/Satış Oranı */}
                  {(() => {
                    const alis = selectedOrg 
                      ? (kurumOrgSummary[selectedKurum]?.[selectedOrg]?.alis || 0) 
                      : (kurumSummary[selectedKurum]?.alis || 0);
                    const satis = selectedOrg 
                      ? (kurumOrgSummary[selectedKurum]?.[selectedOrg]?.satis || 0) 
                      : (kurumSummary[selectedKurum]?.satis || 0);
                    const alisOrani = alis > 0 && satis > 0 ? ((alis / satis) * 100).toFixed(2) : "0";
                    
                    return (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="text-lg font-semibold mb-3 text-gray-800">Alış/Satış Oranı</h4>
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-200">
                                Alış
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold inline-block text-red-600">
                                {alisOrani}%
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                            <div style={{ width: `${Math.min(parseFloat(alisOrani), 100)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"></div>
                          </div>
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                                Satış
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold inline-block text-green-600">
                                100%
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 text-xs flex rounded bg-green-200">
                            <div style={{ width: '100%' }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              )}
            </div>
          </>
        )}
        
        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-lg p-8 shadow-xl w-full max-w-md relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShowModal(false)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <h2 className="text-xl font-bold mb-4 text-blue-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.343-4 3s1.79 3 4 3 4 1.343 4 3-1.79 3-4 3m0-12c1.657 0 3 .895 3 2s-1.343 2-3 2-3 .895-3 2 1.343 2 3 2m0-8v2m0 12v2" /></svg>
                {modalType === "ALIS" ? "Alış Ekle" : "Satış Ekle"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <input type="text" className="input w-full" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺)</label>
                  <input type="number" className="input w-full" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                  <input type="date" className="input w-full" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
                <button className="btn btn-success" onClick={handleSave}>Kaydet</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}