'use client';

import { useState } from 'react';
import {
    PieChart,
    TrendingUp,
    TrendingDown,
    DollarSign,
    CreditCard,
    Calendar
} from 'lucide-react';

export default function FinancePage() {
    const [stats] = useState({
        totalRevenue: 125000,
        totalExpense: 45000,
        netProfit: 80000,
        pendingPayments: 12000
    });

    const StatCard = ({ title, value, icon: Icon, colorClass, bgClass, trend }: any) => (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${bgClass}`}>
                    <Icon className={`w-6 h-6 ${colorClass}`} />
                </div>
                {trend && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </div>
            <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">₺{value.toLocaleString('tr-TR')}</h3>
                <p className="text-sm text-gray-500">{title}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Finans Yönetimi</h1>
                <p className="text-gray-500 mt-1">Gelir, gider ve nakit akışı takibi</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Toplam Gelir"
                    value={stats.totalRevenue}
                    icon={TrendingUp}
                    colorClass="text-green-600"
                    bgClass="bg-green-50"
                    trend={12}
                />
                <StatCard
                    title="Toplam Gider"
                    value={stats.totalExpense}
                    icon={TrendingDown}
                    colorClass="text-red-600"
                    bgClass="bg-red-50"
                    trend={-5}
                />
                <StatCard
                    title="Net Kar"
                    value={stats.netProfit}
                    icon={PieChart}
                    colorClass="text-blue-600"
                    bgClass="bg-blue-50"
                    trend={8}
                />
                <StatCard
                    title="Bekleyen Ödemeler"
                    value={stats.pendingPayments}
                    icon={CreditCard}
                    colorClass="text-orange-600"
                    bgClass="bg-orange-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Son İşlemler</h2>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-full ${i % 2 === 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        <DollarSign className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{i % 2 === 0 ? 'Ofis Giderleri' : 'Konaklama Ödemesi'}</p>
                                        <p className="text-xs text-gray-500">21 Kasım 2025</p>
                                    </div>
                                </div>
                                <span className={`font-bold ${i % 2 === 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {i % 2 === 0 ? '-' : '+'}₺{Math.floor(Math.random() * 5000) + 500}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Yaklaşan Ödemeler</h2>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Tedarikçi Ödemesi</p>
                                        <p className="text-xs text-gray-500">Vade: 25 Kasım 2025</p>
                                    </div>
                                </div>
                                <span className="font-bold text-gray-900">
                                    ₺{Math.floor(Math.random() * 10000) + 1000}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
