'use client';
import { ReactNode } from 'react';
import AuthGuard from '@/app/components/AuthGuard';
import PermissionGuard from '@/app/components/PermissionGuard';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthGuard>
      <PermissionGuard>
        {children}
      </PermissionGuard>
    </AuthGuard>
  );
}

