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
          // localStorage ile alert'in gösterilip gösterilmediğini kontrol et
          const sessionExpiredAlertShown = localStorage.getItem('sessionExpiredAlertShown');
          
          if (!sessionExpiredAlertShown) {
            // Alert'i göster ve localStorage'a kaydet
            localStorage.setItem('sessionExpiredAlertShown', 'true');
            alert("Oturumunuz sona erdi, lütfen tekrar giriş yapın.");
          }
          
          // Login sayfasına yönlendir
          router.replace("/login");
        } else if (res.status === 200) {
          // Kullanıcı başarıyla giriş yaptıysa localStorage'ı temizle
          localStorage.removeItem('sessionExpiredAlertShown');
          
          if (process.env.NODE_ENV === "development") {
            console.log("Kullanıcı doğrulandı, cookie mevcut.");
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Auth kontrolünde hata:", err);
        }
        // Hata durumunda da aynı mantığı uygula
        const sessionExpiredAlertShown = localStorage.getItem('sessionExpiredAlertShown');
        
        if (!sessionExpiredAlertShown) {
          localStorage.setItem('sessionExpiredAlertShown', 'true');
          alert("Oturumunuz sona erdi, lütfen tekrar giriş yapın.");
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

export { AuthGuard };