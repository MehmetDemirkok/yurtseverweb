'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import UserHeader from '@/components/layout/UserHeader';

export default function KonaklamaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobilde kapalı başlasın

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

    // Resize event listener
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Konaklama menü öğeleri
  const menuItems = [
    {
      name: 'Ana Dashboard',
      path: '/',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'Konaklama Kayıtları',
      path: '/konaklama',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 10V7a5 5 0 0110 0v3M5 21h14a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: 'Oteller',
      path: '/konaklama/oteller',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Overlay - Mobil görünümde sidebar açıkken arka planı karartır */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" 
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-lg z-30 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-0 md:w-16'} overflow-hidden`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          <div className={`flex items-center ${!sidebarOpen && 'md:hidden'}`}>
            <Image src="/logo.svg" alt="Logo" width={32} height={32} className="h-6 w-6 sm:h-8 sm:w-8" />
            <span className={`ml-2 font-semibold text-gray-800 dark:text-white transition-opacity duration-300 text-sm sm:text-base ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
              Konaklama
            </span>
          </div>
          <button 
            onClick={toggleSidebar} 
            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Sidebar Menu */}
        <nav className="mt-4 sm:mt-5 px-2">
          <ul className="space-y-1 sm:space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <Link 
                  href={item.path}
                  className="flex items-center p-2 sm:p-3 rounded-md transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm sm:text-base"
                >
                  <div className="flex-shrink-0">
                    {item.icon}
                  </div>
                  <span className={`ml-2 sm:ml-3 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
                    {item.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
        {/* Top Navigation Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Konaklama Yönetim Sistemi</h1>
          </div>
          
          {/* User Info */}
          <UserHeader />
        </div>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto p-2 sm:p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
