// src/super-admin/routes/PlatformRouteGuards.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePlatformAuth } from '../hooks/usePlatformAuth';
import { useAuthContext } from '../../contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../../components/ui/UIPrimitives';

interface Props {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export const PlatformRouteGuard: React.FC<Props> = ({ children, requireSuperAdmin = false }) => {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuthContext();
  const { data: platformSession, isLoading: isPlatformLoading } = usePlatformAuth();
  const location = useLocation();

  if (isAuthLoading || isPlatformLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 font-mono text-xs">
        Verifying Platform Operator Privileges...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!platformSession?.isPlatformUser) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-lg bg-red-950/30 border border-red-900/50 text-red-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-zinc-100">Platform Access Restricted</h2>
          <p className="text-xs text-zinc-400">
            Your account ({user?.email}) is not registered in the Platform Operators directory (<code className="font-mono text-zinc-300">platform_users</code>).
          </p>
          <div className="pt-2">
            <Button variant="secondary" onClick={() => window.location.href = '/'}>
              Return Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (requireSuperAdmin && !platformSession.isSuperAdmin) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center space-y-3">
          <ShieldAlert className="w-7 h-7 text-amber-400 mx-auto" />
          <h3 className="text-base font-semibold text-zinc-100">Super Admin Privilege Required</h3>
          <p className="text-xs text-zinc-400">
            Platform Support accounts have read-only access and cannot perform this administrative mutation.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
