// src/routes/RouteGuards.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthContext();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-sm">
        Authenticating session & dynamic permission matrix...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const PermissionRoute: React.FC<{ permission: string; children: React.ReactNode }> = ({
  permission,
  children,
}) => {
  const { hasPermission } = useAuthContext();

  if (!hasPermission(permission)) {
    return (
      <div className="p-8 text-center space-y-3">
        <h2 className="text-xl font-bold text-rose-400">Access Restricted (403)</h2>
        <p className="text-sm text-slate-400">Your dynamic assigned role does not grant permission code <code className="bg-slate-900 px-2 py-1 rounded text-indigo-400 font-mono">{permission}</code>.</p>
      </div>
    );
  }

  return <>{children}</>;
};
