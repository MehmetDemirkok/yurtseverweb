'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
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
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
        <div className="relative h-full overflow-auto">
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
          <main className="p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}