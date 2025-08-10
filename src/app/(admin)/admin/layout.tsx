'use client';
import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  Building2, 
  FileText, 
  Settings, 
  Menu, 
  X,
  BarChart3,
  Shield,
  Home
} from 'lucide-react';
import UserHeader from '@/app/components/UserHeader';
import AuthGuard from '@/app/components/AuthGuard';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Kullanıcı bilgilerini kontrol et
  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch('/api/user', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error('Kullanıcı bilgisi alınamadı:', error);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  // Admin yetkisi kontrolü
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erişim Kısıtlı</h1>
          <p className="text-gray-600 mb-4">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
          <Link 
            href="/dashboard"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Dashboard'a Dön
          </Link>
        </div>
      </div>
    );
  }

  const navigation = [
    {
      name: 'Dashboard\'a Dönüş',
      href: '/dashboard',
      icon: Home,
      current: false
    },
    {
      name: 'Kullanıcı Yönetimi',
      href: '/admin',
      icon: Users,
      current: pathname === '/admin'
    },
    {
      name: 'Şirket Yönetimi',
      href: '/admin/companies',
      icon: Building2,
      current: pathname === '/admin/companies'
    },
    {
      name: 'Sistem Logları',
      href: '/admin/logs',
      icon: FileText,
      current: pathname === '/admin/logs'
    }
  ];

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                Admin Panel
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="mt-6 px-3">
            {/* Dashboard'a Dönüş Linki */}
            <div className="mb-6">
              <Link
                href="/dashboard"
                className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                onClick={() => setSidebarOpen(false)}
              >
                <Home className="text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300 mr-3 flex-shrink-0 h-5 w-5" />
                Dashboard'a Dönüş
              </Link>
            </div>

            {/* Admin Menü Başlığı */}
            <div className="mb-4">
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Admin İşlemleri
              </h3>
            </div>

            {/* Admin Navigation */}
            <div className="space-y-1">
              {navigation.slice(1).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      item.current
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    } group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon
                      className={`${
                        item.current
                          ? 'text-blue-500 dark:text-blue-400'
                          : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                      } mr-3 flex-shrink-0 h-5 w-5`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <h1 className="ml-2 lg:ml-0 text-xl font-semibold text-gray-900 dark:text-white">
                  Admin Paneli
                </h1>
              </div>
              <UserHeader />
            </div>
          </header>
          
          {/* Main content area */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </AuthGuard>
  );
}
