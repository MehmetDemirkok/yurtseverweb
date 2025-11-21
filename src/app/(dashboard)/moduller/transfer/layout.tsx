'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import UserHeader from '@/components/layout/UserHeader';

interface TransferSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

function TransferSidebar({ isOpen, toggleSidebar }: TransferSidebarProps) {
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

  // Transfer modülü menü öğeleri
  const menuItems = [
    {
      name: 'Dashboard',
      path: '/moduller/transfer',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      permission: 'transfer',
    },
    {
      name: 'Transferler',
      path: '/moduller/transfer/transferler',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      permission: 'transfer',
    },
    {
      name: 'Araçlar',
      path: '/moduller/transfer/araclar',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      permission: 'transfer',
    },
    {
      name: 'Şoförler',
      path: '/moduller/transfer/soforler',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      permission: 'transfer',
    },
    {
      name: 'Cariler',
      path: '/cariler',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      permission: 'transfer',
    },
    {
      name: 'Tedarikçiler',
      path: '/tedarikciler',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      permission: 'transfer',
    },
    {
      name: 'Araç Bakım Takibi',
      path: '/moduller/transfer/bakim-takibi',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      permission: 'transfer',
    },
    {
      name: 'Ana Sisteme Dön',
      path: '/dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      ),
      permission: 'transfer',
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
            <Image src="/logo.svg" alt="Logo" width={32} height={32} className="h-8 w-8" />
            <span className={`ml-2 font-semibold text-gray-800 dark:text-white transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
              Transfer Sistemi
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
              
              return (
                <li key={index}>
                  <Link 
                    href={item.path}
                    className="flex items-center p-2 rounded-md transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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

export default function TransferLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Ekran boyutu değiştiğinde sidebar durumunu ayarla
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // İlk yükleme
    handleResize();

    // Ekran boyutu değişikliklerini dinle
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="sidebar-layout">
      {/* Transfer Sidebar */}
      <TransferSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main Content */}
      <div className={`sidebar-content ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'} ml-0`}>
        <div className="relative h-full">
          {/* User Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">Transfer Yönetim Sistemi</h1>
            <UserHeader />
          </div>
          
          {/* Mobil menü butonu */}
          <button 
            onClick={toggleSidebar}
            className="fixed top-4 left-4 z-20 md:hidden p-2 rounded-md bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* İçerik */}
          <main className="p-4 md:p-6 w-full h-full overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 