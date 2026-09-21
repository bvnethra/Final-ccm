// src/super-admin/components/layout/SuperAdminLayout.tsx
import React, { Suspense } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { usePlatformAuth } from '../../hooks/usePlatformAuth';
import { usePlatformConfig } from '../../hooks/usePlatformConfig';
import { useAuthContext } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/UIPrimitives';
import { 
  Building2, 
  LayoutDashboard, 
  PlusCircle, 
  Users2, 
  FileText, 
  ShieldCheck,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { openOperationalApp } from '../../../services/crossAppNav';

export const SuperAdminLayout: React.FC = () => {
  const { data: platformSession } = usePlatformAuth();
  const { data: brandingConfigs } = usePlatformConfig('platform_branding');
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const isSupport = platformSession?.isPlatformSupport;

  const platformName =
    brandingConfigs?.find((c) => c.code === 'PLATFORM_NAME')?.label || 'CCM PLATFORM';
  const platformTagline =
    brandingConfigs?.find((c) => c.code === 'PLATFORM_TAGLINE')?.label ||
    'Calibration Commercial Module Governance';

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2 px-3.5 py-1.5 rounded-[4px] text-xs font-medium transition-colors',
      isActive
        ? 'bg-[#E6F2FF] text-[#0274BB] border border-[#b8dcff] font-semibold'
        : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F5F7FA]'
    );

  const sidebarIconClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'p-2 rounded-[4px] transition-colors flex items-center justify-center',
      isActive
        ? 'bg-[#E6F2FF] text-[#0274BB]'
        : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F5F7FA]'
    );

  const getInitials = (name?: string) => {
    if (!name) return 'SA';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = platformSession?.user?.fullName || user?.fullName || 'Platform Administrator';
  const displayRole = platformSession?.user?.role || 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111827] flex flex-col font-sans">
      {/* Platform Top Header */}
      <header className="h-16 border-b border-[#E5E7EB] bg-white px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-[4px] bg-[#0274BB] flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-[#111827]">
                  {platformName}
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280] font-normal">{platformTagline}</p>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => openOperationalApp()}
            className="text-xs h-8 gap-1.5 border-[#b8dcff] bg-[#E6F2FF] text-[#0274BB] hover:bg-[#d0e7ff] font-semibold shadow-xs cursor-pointer"
            title="Open Connected Operational Application on localhost:5174"
          >
            <ExternalLink className="size-3.5" />
            <span className="hidden sm:inline">Operational App</span>
            <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-[#b8dcff] text-[#0274BB]">5174</span>
          </Button>

          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-[#003B8C] text-white flex items-center justify-center font-semibold text-xs shadow-xs">
              {getInitials(displayName)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-[#111827] leading-tight">
                {displayName}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="size-1.5 rounded-full bg-[#16A34A]" />
                <span className="text-[10px] font-mono text-[#6B7280] uppercase">
                  {displayRole}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#6B7280] hover:text-[#111827] gap-1.5 px-2.5 h-8 text-xs font-medium ml-2"
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
        <aside className="w-14 bg-white border-r border-[#E5E7EB] hidden md:flex flex-col items-center py-4 gap-3 shrink-0">
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
          <div className="mt-auto pb-2">
            <button
              onClick={() => openOperationalApp()}
              className="p-2 rounded-[4px] text-[#0274BB] hover:bg-[#E6F2FF] transition flex items-center justify-center cursor-pointer"
              title="Launch Connected Operational App (localhost:5174)"
            >
              <ExternalLink className="size-4" />
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
          <Suspense fallback={
            <div className="min-h-[400px] flex items-center justify-center text-[#6B7280] font-mono text-xs">
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
