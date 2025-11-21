'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserHeader from '@/components/layout/UserHeader';
import AuthGuard from '@/components/layout/AuthGuard';
import PermissionGuard from '@/components/layout/PermissionGuard';
import {
  Home,
  BedDouble,
  Banknote,
  Building2,
  Users,
  UserCircle,
  Truck,
  PieChart,
  Shield,
  X,
  Menu
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const menuItems = [
    {
      name: 'Ana Dashboard',
      path: '/dashboard',
      icon: <Home className="w-5 h-5" />,
    },
    {
      name: 'Konaklama Alış',
      path: '/konaklama-alis',
      icon: <BedDouble className="w-5 h-5" />,
    },
    {
      name: 'Konaklama Satış',
      path: '/konaklama-satis',
      icon: <Banknote className="w-5 h-5" />,
    },
    {
      name: 'Finans',
      path: '/finans',
      icon: <PieChart className="w-5 h-5" />,
    },
    {
      name: 'Kullanıcı Yönetimi',
      path: '/admin',
      icon: <Shield className="w-5 h-5" />,
    },
  ];

  return (
    <AuthGuard>
      <PermissionGuard>
        <div className="flex h-screen bg-[#F3F4F6]">
          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={toggleSidebar}
            />
          )}

          {/* Sidebar */}
          <aside
            className={`fixed md:static top-0 left-0 h-full bg-white shadow-xl md:shadow-none z-50 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
              } w-[280px] flex flex-col border-r border-gray-200`}
          >
            {/* Sidebar Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  Y
                </div>
                <span className="font-bold text-gray-800 text-lg">Yurtsever</span>
              </div>
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar Menu */}
            <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
              {menuItems.map((item, index) => {
                const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                // Special case for dashboard to avoid matching everything
                const isDashboard = item.path === '/dashboard';
                const isExactMatch = pathname === item.path;
                const active = isDashboard ? isExactMatch : isActive;

                return (
                  <Link
                    key={index}
                    href={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${active
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Sidebar Footer - User Profile */}
            <div className="p-4 border-t border-gray-100">
              {/* UserHeader component handles the user profile display */}
            </div>
          </aside>

          {/* Main Content Wrapper */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top Navigation Bar */}
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleSidebar}
                  className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-semibold text-gray-800 hidden sm:block">Yönetim Paneli</h1>
              </div>

              <UserHeader />
            </header>

            {/* Page Content */}
            <main className="flex-1 overflow-auto p-4 sm:p-8">
              {children}
            </main>
          </div>
        </div>
      </PermissionGuard>
    </AuthGuard>
  );
}
