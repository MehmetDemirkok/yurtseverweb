'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ role?: string; permissions?: string[] } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/user', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error('Kullanıcı bilgisi alınamadı:', error);
      }
    }
    fetchUser();
  }, []);

  // Kullanıcının belirli bir izne sahip olup olmadığını kontrol eden fonksiyon
  const hasPermission = (permission: string) => {
    return currentUser?.permissions?.includes(permission) || currentUser?.role === 'ADMIN';
  };

  // Menü öğeleri
  const menuItems = [
    {
      name: 'Ana Sayfa',
      path: '/',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      permission: null, // Herkes erişebilir
    },
    {
      name: 'Konaklama Kayıtları',
      path: '/accommodation',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 10V7a5 5 0 0110 0v3M5 21h14a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z" />
        </svg>
      ),
      permission: null, // Herkes erişebilir
    },
    {
      name: 'Kullanıcı Yönetimi',
      path: '/admin',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      permission: 'user-management',
    },
    {
      name: 'Satışlar',
      path: '/sales',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      permission: 'sales',
    },
    {
      name: 'Finans',
      path: '/finance',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.343-4 3s1.79 3 4 3 4 1.343 4 3-1.79 3-4 3m0-12c1.657 0 3 .895 3 2s-1.343 2-3 2-3 .895-3 2 1.343 2 3 2m0-8v2m0 12v2" />
        </svg>
      ),
      permission: null, // Herkes erişebilir
    },
    {
      name: 'Sistem Logları',
      path: '/admin/logs',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      permission: 'logs',
    },
  ];

  return (
    <>
      {/* Overlay - Mobil görünümde sidebar açıkken arka planı karartır */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" 
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-lg z-30 transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-0 md:w-16'} overflow-hidden`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className={`flex items-center ${!isOpen && 'md:hidden'}`}>
            <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
            <span className={`ml-2 font-semibold text-gray-800 dark:text-white transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
              Yurtsever
            </span>
          </div>
          <button 
            onClick={toggleSidebar} 
            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Sidebar Menu */}
        <nav className="mt-5 px-2">
          <ul className="space-y-2">
            {menuItems.map((item, index) => {
              // İzin kontrolü
              if (item.permission && !hasPermission(item.permission)) {
                return null;
              }
              
              const isActive = pathname === item.path;
              
              return (
                <li key={index}>
                  <Link 
                    href={item.path}
                    className={`flex items-center p-2 rounded-md transition-all duration-200 ${isActive ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    <div className="flex-shrink-0">
                      {item.icon}
                    </div>
                    <span className={`ml-3 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
                      {item.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}