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
      'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
      isActive
        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 font-semibold shadow-2xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    );

  const sidebarIconClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'p-2 rounded-lg transition-colors flex items-center justify-center',
      isActive
        ? 'bg-indigo-50 text-indigo-600'
        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
    );

  const getInitials = (name?: string) => {
    if (!name) return 'SA';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = platformSession?.user?.fullName || user?.fullName || 'Nethra Super Admin';
  const displayRole = platformSession?.user?.role || 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
      {/* Platform Top Header */}
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-slate-900">
                  NETHRA PLATFORM
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal">Calibration Commercial Module Governance</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1.5">
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
            <div className="size-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-xs shadow-xs">
              {getInitials(displayName)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {displayName}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  {displayRole}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-slate-900 gap-1.5 px-2.5 h-8 text-xs font-medium ml-2"
              onClick={() => logout().then(() => navigate('/login'))}
              title="Sign out of platform"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Body with Left Icon Sidebar & Main Workspace */}
      <div className="flex-1 flex">
        {/* Left Vertical Icon Bar */}
        <aside className="w-14 bg-white border-r border-slate-200 hidden md:flex flex-col items-center py-4 gap-3 shrink-0">
          <NavLink to="/" end className={sidebarIconClasses} title="Dashboard">
            <LayoutDashboard className="size-4" />
          </NavLink>
          <NavLink to="/tenants" className={sidebarIconClasses} title="Tenants">
            <Building2 className="size-4" />
          </NavLink>
          <NavLink to="/users" className={sidebarIconClasses} title="Platform Users">
            <Users2 className="size-4" />
          </NavLink>
          <NavLink to="/audit" className={sidebarIconClasses} title="Audit Trail">
            <FileText className="size-4" />
          </NavLink>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
          <Suspense fallback={
            <div className="min-h-[400px] flex items-center justify-center text-slate-400 font-mono text-xs">
              Loading platform module...
            </div>
          }>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};
