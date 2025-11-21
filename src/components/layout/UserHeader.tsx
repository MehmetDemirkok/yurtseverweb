'use client';

import { useState, useEffect } from 'react';
import { User, LogOut, Settings, Building, ChevronDown } from 'lucide-react';

interface UserData {
  id: number;
  email: string;
  name?: string;
  role: string;
  companyId?: number;
  companyName?: string;
}

export default function UserHeader() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Kullanıcı bilgileri alınamadı:', error);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-header-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  if (!user) {
    return (
      <div className="flex items-center space-x-4">
        <div className="animate-pulse bg-gray-200 h-8 w-8 rounded-full"></div>
        <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
      </div>
    );
  }

  return (
    <div className="relative user-header-dropdown">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-0"
      >
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="text-left min-w-0 flex-1 hidden sm:block">
          <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={user.name || user.email}>
            {user.name || user.email}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <Building className="w-3 h-3 mr-1 flex-shrink-0" />
            {user.companyName ? (
              <span className="truncate text-gray-600" title={user.companyName}>
                {user.companyName}
              </span>
            ) : (
              <span className="text-orange-600 text-xs">Şirket Atanmamış</span>
            )}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
            {user.role}
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 hidden sm:block" />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {user.name || 'İsimsiz Kullanıcı'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {user.email}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
              <Building className="w-3 h-3 mr-1 flex-shrink-0" />
              {user.companyName ? (
                <span className="truncate text-gray-600">{user.companyName}</span>
              ) : (
                <span className="text-orange-600 text-xs">Şirket Atanmamış</span>
              )}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
              {user.role}
            </div>
          </div>
          
          <div className="p-2">
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                window.location.href = '/ayarlar';
              }}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <Settings className="w-4 h-4 mr-3" />
              Ayarlar
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { UserHeader };

