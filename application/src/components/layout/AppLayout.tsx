// application/src/components/layout/AppLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-900">
      <AppHeader />
      <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
        <AppSidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto w-full min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
