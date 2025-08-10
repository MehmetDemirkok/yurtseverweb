'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import UserHeader from '../components/UserHeader';

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
