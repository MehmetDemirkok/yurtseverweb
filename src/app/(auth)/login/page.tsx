"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.message) {
        // Başarılı giriş sonrası session expired alert flag'ini temizle
        localStorage.removeItem('sessionExpiredAlertShown');
        
        if (process.env.NODE_ENV === "development") {
          setTimeout(() => {
            const cookies = document.cookie;
            if (!cookies.includes("token")) {
              console.warn("Dikkat! Token cookie'si set edilmedi. JWT_SECRET, domain veya secure flag ayarlarını kontrol edin.");
            } else {
              console.log("Token cookie başarıyla set edildi.");
            }
          }, 1000);
        }
        router.push("/dashboard");
      } else {
        setError("Giriş başarısız! Lütfen bilgilerinizi kontrol edin.");
        if (process.env.NODE_ENV === "development") {
          console.error("Login error:", data.error);
        }
      }
    } catch (err) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      if (process.env.NODE_ENV === "development") {
        console.error("Login exception:", err);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-cyan-100 animate-fade-in">
      <div className="card p-8 w-full max-w-md shadow-2xl animate-scale-in">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-2 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Yurtsever Giriş</h1>
          <p className="text-gray-500 text-sm">Lütfen giriş yapın</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1">Kullanıcı Adı</label>
            <input
              id="username"
              type="text"
              className="input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Kullanıcı adınızı girin"
              autoFocus
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">Şifre</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Şifrenizi girin"
              autoComplete="current-password"
            />
          </div>
          {error && <div className="text-red-600 text-sm font-medium animate-fade-in">{error}</div>}
          <button type="submit" className="btn btn-primary w-full text-lg py-2 mt-2">Giriş Yap</button>
        </form>
      </div>
    </div>
  );
}