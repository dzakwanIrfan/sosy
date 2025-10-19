'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { Breadcrumb } from './Breadcrumb';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardNav />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Breadcrumb />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}