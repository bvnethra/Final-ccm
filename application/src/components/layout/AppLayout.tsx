// application/src/components/layout/AppLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col text-[#111827]">
      <AppHeader />
      <div className="flex flex-1">
        <AppSidebar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
