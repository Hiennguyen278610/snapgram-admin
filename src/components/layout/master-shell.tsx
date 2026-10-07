'use client';

import type { ReactNode } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { TopBar } from '@/components/layout/top-bar';

export function MasterShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-2 sm:p-5 lg:p-8">
      <div className="flex min-h-[920px] w-full max-w-[1440px] flex-col gap-6 overflow-hidden rounded-[32px] border border-border bg-card p-5 shadow-[0_20px_45px_-15px_rgba(26,42,70,0.12)] sm:rounded-[40px] sm:p-7 lg:flex-row lg:gap-8 lg:p-9">
        <SidebarNav />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
