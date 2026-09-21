// src/super-admin/components/layout/SuperAdminLayout.tsx
import React, { Suspense } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { usePlatformAuth } from '../../hooks/usePlatformAuth';
import { useAuthContext } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/UIPrimitives';
import { 
  Building2, 
  LayoutDashboard, 
  PlusCircle, 
  Users2, 
  FileText, 
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { cn } from '../../../lib/utils';

export const SuperAdminLayout: React.FC = () => {
  const { data: platformSession } = usePlatformAuth();
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const isSupport = platformSession?.isPlatformSupport;

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
      isActive
        ? 'bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700/50'
        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
    );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-zinc-800 selection:text-zinc-100">
      {/* Platform Top Header */}
      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-md bg-zinc-900 border border-zinc-700/80 flex items-center justify-center">
              <ShieldCheck className="size-4 text-zinc-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-zinc-100">
                  NETHRA PLATFORM
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-zinc-700/60 bg-zinc-800/80 text-zinc-300">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">Calibration Commercial Module Governance</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={navLinkClasses}>
              <LayoutDashboard className="size-3.5" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/tenants" className={navLinkClasses}>
              <Building2 className="size-3.5" />
              <span>Tenants</span>
            </NavLink>
            {!isSupport && (
              <NavLink to="/tenants/new" className={navLinkClasses}>
                <PlusCircle className="size-3.5" />
                <span>Onboard Tenant</span>
              </NavLink>
            )}
            <NavLink to="/users" className={navLinkClasses}>
              <Users2 className="size-3.5" />
              <span>Platform Users</span>
            </NavLink>
            <NavLink to="/audit" className={navLinkClasses}>
              <FileText className="size-3.5" />
              <span>Audit Trail</span>
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-medium text-zinc-200">
                {platformSession?.user?.fullName || user?.fullName || 'Platform Administrator'}
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-mono text-zinc-400">
                  {platformSession?.user?.role || 'SUPER_ADMIN'}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-red-400 gap-1.5 px-2.5 h-8 text-xs"
              onClick={() => logout().then(() => navigate('/login'))}
              title="Sign out of platform"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Super Admin Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        <Suspense fallback={
          <div className="min-h-[400px] flex items-center justify-center text-zinc-500 font-mono text-xs">
            Loading platform module...
          </div>
        }>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};
