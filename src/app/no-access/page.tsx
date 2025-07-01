"use client";

export default function NoAccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-6xl mb-4">🚫</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Erişim Engellendi</h1>
      <p className="text-gray-600 mb-6">Bu sayfaya erişim için yetkiniz yok.</p>
      <a href="/login" className="btn btn-primary">Giriş Sayfasına Dön</a>
    </div>
  );
} 