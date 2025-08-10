"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
  name?: string;
  role: 'ADMIN' | 'MUDUR' | 'OPERATOR' | 'KULLANICI';
  permissions?: string[];
}

export default function UserHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/user", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Kullanıcı bilgisi alınamadı:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/user/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        router.push('/login');
      } else {
        console.error('Logout başarısız');
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout hatası:', error);
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 rounded-full animate-pulse"></div>
        <div className="h-4 w-20 bg-gray-300 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = user.name || user.email || 'Kullanıcı';

  return (
    <div className="flex items-center space-x-2 sm:space-x-4">
      <div className="flex items-center space-x-1 sm:space-x-2 bg-blue-50 rounded-lg px-2 sm:px-3 py-1 sm:py-2">
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <span className="text-xs sm:text-sm font-medium text-gray-700 hidden sm:block">{displayName}</span>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center space-x-1 sm:space-x-2 bg-red-500 hover:bg-red-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg transition-colors duration-200 text-xs sm:text-sm font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span className="hidden sm:block">Çıkış Yap</span>
      </button>
    </div>
  );
}
