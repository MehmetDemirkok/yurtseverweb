'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export default function PageHeader({ title, description, icon }: PageHeaderProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleDashboardClick = () => {
    if (isNavigating) return; // Eğer zaten yönlendirme yapılıyorsa, işlemi engelle
    
    setIsNavigating(true);
    router.push('/dashboard');
  };

  return (
    <header className="relative overflow-hidden rounded-xl shadow-2xl mb-8 animate-fade-in">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 opacity-90" />
      <div className="relative flex flex-col md:flex-row items-center justify-between px-8 py-10 md:py-14">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="flex-shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg mb-2">{title}</h1>
            {description && <p className="text-blue-100 text-lg font-medium drop-shadow">{description}</p>}
          </div>
        </div>
        <div className="mt-4 md:mt-0 relative z-40"> {/* z-index değerini artırdık */}
          <button 
            onClick={handleDashboardClick}
            disabled={isNavigating}
            className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg shadow-md hover:bg-blue-50 transition-colors font-medium cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed relative z-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Dashboard
          </button>
        </div>
      </div>
      {/* Dekoratif daireler */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-white opacity-10 rounded-full" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-white opacity-10 rounded-full" />
    </header>
  );
}