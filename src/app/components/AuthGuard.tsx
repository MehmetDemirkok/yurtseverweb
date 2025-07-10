"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/user", { credentials: "include" });
        if (res.status === 401) {
          alert("Oturumunuz sona erdi, lütfen tekrar giriş yapın.");
          router.replace("/login");
        } else if (res.status === 200) {
          if (process.env.NODE_ENV === "development") {
            console.log("Kullanıcı doğrulandı, cookie mevcut.");
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Auth kontrolünde hata:", err);
        }
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [pathname, router]);

  if (loading) return null;
  return <>{children}</>;
}