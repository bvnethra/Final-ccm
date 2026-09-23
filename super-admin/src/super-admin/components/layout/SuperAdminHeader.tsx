// src/super-admin/components/layout/SuperAdminHeader.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatformAuth } from '../../hooks/usePlatformAuth';
import { usePlatformConfig } from '../../hooks/usePlatformConfig';
import { useAuthContext } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/UIPrimitives';
import { ShieldCheck, LogOut, Shield } from 'lucide-react';

export const SuperAdminHeader: React.FC = () => {
  const { data: platformSession } = usePlatformAuth();
  const { data: brandingConfigs } = usePlatformConfig('platform_branding');
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const platformName =
    brandingConfigs?.find((c) => c.code === 'PLATFORM_NAME')?.label || 'NETHRA CCM';
  const platformTagline =
    brandingConfigs?.find((c) => c.code === 'PLATFORM_TAGLINE')?.label ||
    'Calibration & Commercial Module Governance';

  const getInitials = (name?: string) => {
    if (!name) return 'SA';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = platformSession?.user?.fullName || user?.fullName || 'Platform Administrator';
  const displayRole = platformSession?.user?.role || user?.role || 'SUPER_ADMIN';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Brand & Platform Context */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-[#0274BB] flex items-center justify-center text-white font-bold text-lg shadow-xs">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-none tracking-tight">
              {platformName}
            </h1>
            <span className="text-[11px] text-slate-500 font-medium">
              {platformTagline}
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-200">
          <Shield className="size-3.5 text-[#0274BB]" />
          <span className="text-xs text-slate-500">
            Console:{' '}
            <span className="font-semibold text-xs text-[#0274BB]">Super Admin Governance</span>
          </span>
        </div>
      </div>

      {/* Right User Actions & Profile */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-[#003B8C] text-white flex items-center justify-center font-semibold text-xs shadow-xs">
            {getInitials(displayName)}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-slate-900 leading-tight">
              {displayName}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="size-1.5 rounded-full bg-[#16A34A]" />
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                {displayRole}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-slate-600 hover:text-slate-900 gap-1.5 px-2.5 h-8 text-xs font-medium border-slate-200 ml-2"
            onClick={() => logout().then(() => navigate('/login'))}
            title="Sign out of platform"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
