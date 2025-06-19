"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function UserStatus() {
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const router = useRouter();
  const pathname = usePathname();

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
      } catch {
        setUser(null);
      }
    }
    fetchUser();
  }, []);

  if (pathname === "/login" || !user) return null;

  const displayName = (user.name || user.email || '').toUpperCase();

  return (
    <div className="absolute top-6 right-8 z-30 flex items-center">
      <div className="flex items-center gap-3 bg-white/80 backdrop-blur px-5 py-2 rounded-full shadow-lg border border-blue-200 transition-all duration-200 hover:shadow-xl hover:bg-white/95">
        <span className="font-semibold text-blue-700 text-base max-w-xs truncate">{displayName}</span>
        <button
          className="btn btn-primary px-4 py-1 text-base rounded-full shadow hover:scale-105 transition-transform"
          onClick={async () => {
            await fetch("/api/user/logout", { method: "POST", credentials: "include" });
            setTimeout(() => {
              router.replace("/login");
            }, 100);
          }}
        >
          Çıkış Yap
        </button>
      </div>
      <style jsx>{`
        @media (max-width: 768px) {
          div.absolute.top-6.right-8 {
            position: static !important;
            margin-top: 1rem;
            justify-content: center;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
} 