'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

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

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
        {/* Top Navigation Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={toggleSidebar}
              className="p-1.5 sm:p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Konaklama Yönetim Sistemi</h1>
          </div>
          
          {/* User Info */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 hidden sm:block">Admin</span>
            </div>
          </div>
        </div>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto p-2 sm:p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
