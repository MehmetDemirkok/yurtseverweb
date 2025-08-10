'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Ana sayfaya gelen kullanıcıyı dashboard'a yönlendir
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-700 via-purple-700 to-cyan-700">
      <div className="flex flex-col items-center justify-center">
        <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-white text-xl font-medium">Dashboard'a yönlendiriliyor...</p>
            </div>
          </div>
  );
}