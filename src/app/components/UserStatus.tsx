"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UserStatus() {
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (userStr) setUser(JSON.parse(userStr));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div style={{ position: "fixed", top: 16, right: 24, zIndex: 1000 }}>
      <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded shadow">
        <span className="font-semibold text-blue-700">{user.name || user.email} olarak giriş yapıldı</span>
        <button className="btn btn-primary" onClick={handleLogout}>Çıkış Yap</button>
      </div>
    </div>
  );
} 