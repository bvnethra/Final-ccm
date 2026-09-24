// src/super-admin/components/layout/SuperAdminLayout.tsx
import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { SuperAdminHeader } from './SuperAdminHeader';
import { SuperAdminSidebar } from './SuperAdminSidebar';

export const SuperAdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-900 font-sans">
      <SuperAdminHeader />
      <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
        <SuperAdminSidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto w-full min-w-0">
          <Suspense
            fallback={
              <div className="min-h-[400px] flex items-center justify-center text-slate-400 font-mono text-xs">
                Loading platform module...
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};
