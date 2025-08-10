'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import UserHeader from '../components/UserHeader';

interface AdminSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

function AdminSidebar({ isOpen, toggleSidebar }: AdminSidebarProps) {
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

  const hasPermission = (permission: string) => {
    return currentUser?.permissions?.includes(permission) || currentUser?.role === 'ADMIN';
  };

  const menuItems = [
    {
      name: 'Ana Dashboard',
      path: '/dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
        </svg>
      ),
      permission: null, // Ana dashboard herkes erişebilir
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
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" 
          onClick={toggleSidebar}
        />
      )}
      
      <div 
        className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-lg z-30 transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-0 md:w-16'} overflow-hidden`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className={`flex items-center ${!isOpen && 'md:hidden'}`}>
            <Image src="/logo.svg" alt="Logo" width={32} height={32} className="h-8 w-8" />
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
        <nav className="mt-5 px-2">
          <ul className="space-y-2">
            {menuItems.map((item, index) => {
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="sidebar-layout">
      <AdminSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`sidebar-content ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'} ml-0`}>
        <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <UserHeader />
        </div>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
