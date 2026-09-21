// src/routes/index.tsx
import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './RouteGuards';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const SuperAdminRoutes = lazy(() =>
  import('../super-admin/routes/SuperAdminRoutes').then((m) => ({ default: m.SuperAdminRoutes }))
);

const PageLoader = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs">
    Loading Super Admin Platform...
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Super Admin Platform Governance (Root Application Shell) */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <SuperAdminRoutes />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
};
