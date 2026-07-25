'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Toaster } from 'sonner';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="pl-64">
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
      <Toaster theme="dark" richColors position="top-right" />
    </div>
  );
}
