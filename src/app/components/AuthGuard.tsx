"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthGuard({ children, requiredPermissions }: { children: React.ReactNode, requiredPermissions?: string[] }) {
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
        } else if (res.status === 200) {
          const data = await res.json();
          if (requiredPermissions && requiredPermissions.length > 0) {
            const userPerms = data.user.permissions || [];
            const hasPermission = requiredPermissions.some((perm: string) => userPerms.includes(perm));
            if (!hasPermission) {
              router.replace("/no-access");
              return;
            }
          }
          if (pathname === "/login") {
            router.replace("/");
          }
        }
      } catch {
        if (pathname !== "/login") router.replace("/login");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    checkAuth();
    return () => { ignore = true; };
  }, [pathname, router, requiredPermissions]);

  if (loading) return null;
  return <>{children}</>;
} 