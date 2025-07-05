"use client";

import { useState } from "react";
import PageHeader from "../components/PageHeader";

interface Transaction {
  id: number;
  type: "ALIS" | "SATIS";
  description: string;
  amount: number;
  date: string;
}

const initialTransactions: Transaction[] = [
  { id: 1, type: "ALIS", description: "Otel Malzeme Alımı", amount: 5000, date: "2024-07-01" },
  { id: 2, type: "SATIS", description: "Konaklama Satışı - Ahmet Yılmaz", amount: 8000, date: "2024-07-02" },
  { id: 3, type: "ALIS", description: "Bakım Gideri", amount: 1200, date: "2024-07-03" },
  { id: 4, type: "SATIS", description: "Konaklama Satışı - Ayşe Kaya", amount: 9500, date: "2024-07-04" },
];

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"ALIS" | "SATIS">("ALIS");
  const [form, setForm] = useState({ description: "", amount: "", date: "" });

  const totalAlis = transactions.filter(t => t.type === "ALIS").reduce((sum, t) => sum + t.amount, 0);
  const totalSatis = transactions.filter(t => t.type === "SATIS").reduce((sum, t) => sum + t.amount, 0);
  const net = totalSatis - totalAlis;

  const handleAdd = (type: "ALIS" | "SATIS") => {
    setModalType(type);
    setForm({ description: "", amount: "", date: new Date().toISOString().slice(0, 10) });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.description || !form.amount || !form.date) return;
    setTransactions(prev => [
      ...prev,
      {
        id: prev.length ? prev[prev.length - 1].id + 1 : 1,
        type: modalType,
        description: form.description,
        amount: Number(form.amount),
        date: form.date,
      },
    ]);
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <PageHeader
        title="Finans Takibi"
        description="Alış ve satış işlemlerinizi kolayca yönetin"
        icon={<svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.343-4 3s1.79 3 4 3 4 1.343 4 3-1.79 3-4 3m0-12c1.657 0 3 .895 3 2s-1.343 2-3 2-3 .895-3 2 1.343 2 3 2m0-8v2m0 12v2" /></svg>}
      />
      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
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
      </div>
      {/* Ekleme Butonları */}
      <div className="flex gap-4 mb-6">
        <button className="btn btn-primary" onClick={() => handleAdd("ALIS")}>Alış Ekle</button>
        <button className="btn btn-success" onClick={() => handleAdd("SATIS")}>Satış Ekle</button>
      </div>
      {/* Tablo */}
      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Tarih</th>
              <th className="p-3 text-left">Tür</th>
              <th className="p-3 text-left">Açıklama</th>
              <th className="p-3 text-right">Tutar (₺)</th>
              <th className="p-3 text-center">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b last:border-b-0">
                <td className="p-3 whitespace-nowrap">{t.date}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.type === "ALIS" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{t.type === "ALIS" ? "Alış" : "Satış"}</span>
                </td>
                <td className="p-3">{t.description}</td>
                <td className="p-3 text-right font-semibold">{t.amount.toLocaleString('tr-TR')}</td>
                <td className="p-3 text-center">
                  <button className="btn btn-error btn-sm" onClick={() => handleDelete(t.id)}>Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  );
} 