"use client";

import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import AuthGuard from "../components/AuthGuard";
import { useRouter } from "next/navigation";

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
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"ALIS" | "SATIS">("ALIS");
  const [form, setForm] = useState({ description: "", amount: "", date: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  // Kullanıcı bilgilerini ve işlemleri çek
  useEffect(() => {
    const fetchUserAndTransactions = async () => {
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
        
        // İşlemleri çek
        const transRes = await fetch('/api/transactions');
        if (!transRes.ok) {
          const errorData = await transRes.json();
          throw new Error(errorData.error || 'İşlemler alınamadı');
        }
        
        const transData = await transRes.json();
        setTransactions(transData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
        console.error('Veri çekme hatası:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndTransactions();
  }, [router]);

  const totalAlis = transactions.filter(t => t.type === "ALIS").reduce((sum, t) => sum + t.amount, 0);
  const totalSatis = transactions.filter(t => t.type === "SATIS").reduce((sum, t) => sum + t.amount, 0);
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

  // Kurum bazında özet
  const kurumSummary = transactions.reduce((acc, t) => {
    const kurum = t.type === 'SATIS' ? getKurumNameFromDescription(t.description) : 'Diğer';
    if (!acc[kurum]) acc[kurum] = { alis: 0, satis: 0 };
    if (t.type === 'ALIS') acc[kurum].alis += t.amount;
    if (t.type === 'SATIS') acc[kurum].satis += t.amount;
    return acc;
  }, {} as Record<string, { alis: number; satis: number }>);

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
                </div>
              </div>
              <div className="card p-6 flex items-center gap-4 bg-gradient-to-r from-green-100 to-green-50 border border-green-200">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-200">
                  <svg className="w-7 h-7 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
                </div>
                <div>
                  <div className="text-gray-500">Toplam Satış</div>
                  <div className="text-2xl font-bold text-green-700">{totalSatis.toLocaleString('tr-TR')} ₺</div>
                </div>
              </div>
              <div className="card p-6 flex items-center gap-4 bg-gradient-to-r from-purple-100 to-purple-50 border border-purple-200">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-200">
                  <svg className="w-7 h-7 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.343-4 3s1.79 3 4 3 4 1.343 4 3-1.79 3-4 3m0-12c1.657 0 3 .895 3 2s-1.343 2-3 2-3 .895-3 2 1.343 2 3 2m0-8v2m0 12v2" /></svg>
                </div>
                <div>
                  <div className="text-gray-500">Net Kar/Zarar</div>
                  <div className={`text-2xl font-bold ${net >= 0 ? 'text-green-700' : 'text-red-700'}`}>{net.toLocaleString('tr-TR')} ₺</div>
                </div>
              </div>
              <div className="card p-6 flex items-center gap-4 bg-gradient-to-r from-orange-100 to-orange-50 border border-orange-200">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-orange-200">
                  <svg className="w-7 h-7 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                  <div className="text-gray-500">Satış Kaynaklı</div>
                  <div className="text-2xl font-bold text-orange-700">
                    {transactions.filter(t => t.type === 'SATIS' && t.description.includes('Satış #')).length}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ekleme Butonları */}
            {canAddTransaction() && (
              <div className="flex gap-4 mb-6">
                <button className="btn btn-primary" onClick={() => handleAdd("ALIS")}>Alış Ekle</button>
                <button className="btn btn-success" onClick={() => handleAdd("SATIS")}>Satış Ekle</button>
              </div>
            )}
            
            {/* Tablo */}
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

            {/* Kurum Bazında Finans Tablosu */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-2 text-blue-900">Kurum Bazında Finans Özeti</h2>
              <div className="card overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="p-3 text-left">Kurum</th>
                      <th className="p-3 text-right">Toplam Alış (₺)</th>
                      <th className="p-3 text-right">Toplam Satış (₺)</th>
                      <th className="p-3 text-right">Net Kar/Zarar (₺)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(kurumSummary).map(([kurum, val]) => (
                      <tr key={kurum} className="border-b last:border-b-0">
                        <td className="p-3 font-bold text-blue-800">{kurum}</td>
                        <td className="p-3 text-right">{val.alis.toLocaleString('tr-TR')}</td>
                        <td className="p-3 text-right">{val.satis.toLocaleString('tr-TR')}</td>
                        <td className={`p-3 text-right font-bold ${val.satis - val.alis >= 0 ? 'text-green-700' : 'text-red-700'}`}>{(val.satis - val.alis).toLocaleString('tr-TR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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