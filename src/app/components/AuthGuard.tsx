"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function checkAuth() {
      try {
        const res = await fetch("/api/user", { credentials: "include" });
        if (res.status === 401 && pathname !== "/login") {
          router.replace("/login");
        } else if (res.status === 200 && pathname === "/login") {
          router.replace("/");
        }
      } catch {
        if (pathname !== "/login") router.replace("/login");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    checkAuth();
    return () => { ignore = true; };
  }, [pathname, router]);

  if (loading) return null;
  return <>{children}</>;
} 