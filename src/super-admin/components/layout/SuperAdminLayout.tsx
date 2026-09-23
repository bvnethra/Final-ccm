// src/super-admin/components/layout/SuperAdminLayout.tsx
import React, { Suspense, useState } from 'react';
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
  Menu,
  X,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

export const SuperAdminLayout: React.FC = () => {
  const { data: platformSession } = usePlatformAuth();
  const { data: brandingConfigs } = usePlatformConfig('platform_branding');
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isSupport = platformSession?.isPlatformSupport;

  const platformName =
    brandingConfigs?.find((c) => c.code === 'PLATFORM_NAME')?.label || 'CCM PLATFORM';
  const platformTagline =
    brandingConfigs?.find((c) => c.code === 'PLATFORM_TAGLINE')?.label ||
    'Calibration Commercial Module Governance';

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/tenants', label: 'Tenants', icon: Building2 },
    ...(!isSupport ? [{ to: '/tenants/new', label: 'Onboard Tenant', icon: PlusCircle }] : []),
    { to: '/users', label: 'Platform Users', icon: Users2 },
    { to: '/audit', label: 'Audit Trail', icon: FileText },
  ];

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2 px-3.5 py-1.5 rounded-[4px] text-xs font-medium transition-colors',
      isActive
        ? 'bg-[#E6F2FF] text-[#0274BB] border border-[#b8dcff] font-semibold'
        : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F5F7FA]'
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
      {/* ── Platform Top Header ─────────────────────────────────────────── */}
      <header className="h-14 border-b border-[#E5E7EB] bg-white px-5 flex items-center justify-between sticky top-0 z-40 shadow-[0_1px_0_#E5E7EB]">
        {/* Brand */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="size-8 rounded-[4px] bg-[#0274BB] flex items-center justify-center text-white">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <div className="font-bold text-xs tracking-tight text-[#111827] leading-tight">
                {platformName}
              </div>
              <p className="text-[10px] text-[#9CA3AF] font-normal hidden sm:block">{platformTagline}</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={navLinkClasses}
              >
                <item.icon className="size-3.5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right: User + Logout */}
        <div className="flex items-center gap-3">
          {/* User identity */}
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="size-7 rounded-full bg-[#003B8C] text-white flex items-center justify-center font-semibold text-[10px]">
              {getInitials(displayName)}
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-[#111827] leading-tight">{displayName}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="size-1.5 rounded-full bg-[#16A34A]" />
                <span className="text-[10px] font-mono text-[#9CA3AF] uppercase">{displayRole}</span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-[#6B7280] hover:text-[#111827] gap-1.5 px-2 h-8 text-xs font-medium"
            onClick={() => logout().then(() => navigate('/login'))}
            title="Sign out of platform"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 rounded-[4px] text-[#6B7280] hover:text-[#111827] hover:bg-[#F5F7FA] transition-colors"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}
          >
            {mobileNavOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </header>

      {/* ── Mobile Navigation Drawer ────────────────────────────────────── */}
      {mobileNavOpen && (
        <div className="md:hidden bg-white border-b border-[#E5E7EB] px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={navLinkClasses}
              onClick={() => setMobileNavOpen(false)}
            >
              <item.icon className="size-3.5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}

      {/* ── Main Workspace ───────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Suspense
          fallback={
            <div className="min-h-[400px] flex items-center justify-center text-[#9CA3AF] font-mono text-xs animate-pulse">
              Loading platform module...
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};
