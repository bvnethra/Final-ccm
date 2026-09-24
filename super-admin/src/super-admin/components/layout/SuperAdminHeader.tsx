// src/super-admin/components/layout/SuperAdminHeader.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatformAuth } from '../../hooks/usePlatformAuth';
import { usePlatformConfig } from '../../hooks/usePlatformConfig';
import { useAuthContext } from '../../../contexts/AuthContext';
import { Building2, ChevronDown, User, LogOut, Bell } from 'lucide-react';

export const SuperAdminHeader: React.FC = () => {
  const { data: platformSession } = usePlatformAuth();
  const { data: brandingConfigs } = usePlatformConfig('platform_branding');
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const platformName =
    brandingConfigs?.find((c) => c.code === 'PLATFORM_NAME')?.label || 'Nethra CCM';

  const displayName = platformSession?.user?.fullName || user?.fullName || 'Nethra Super Admin';
  const displayRole = platformSession?.user?.role || user?.role || 'SUPER_ADMIN';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Brand & Platform Context */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-[#0274BB] flex items-center justify-center text-white font-bold text-lg shadow-xs">
            C
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-none tracking-tight">
              {platformName}
            </h1>
            <span className="text-[11px] text-slate-500">Super Admin Governance</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-200">
          <Building2 className="size-4 text-slate-500" />
          <span className="text-xs text-slate-500">
            Tenant:{' '}
            <span className="font-semibold text-xs text-[#0274BB]">Nethra Metrology Services Ltd</span>
          </span>
          <ChevronDown className="size-3.5 text-[#0274BB]" />
        </div>
      </div>

      {/* Right User Actions & Profile matching 5174 */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          type="button"
          className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0274BB]/30 cursor-pointer"
          title="Platform Alerts & Telemetry"
        >
          <Bell className="size-5" />
        </button>

        {/* User Info & Avatar matching 5174 */}
        <div className="hidden sm:flex items-center gap-2.5 pl-2">
          <div className="size-8 rounded-full bg-[#EBF5FF] text-[#0274BB] flex items-center justify-center border border-blue-200/60 font-semibold text-xs shrink-0">
            <User className="size-4" />
          </div>
          <span className="text-xs font-semibold text-slate-800 leading-tight">
            {displayName}
          </span>
          <ChevronDown className="size-3.5 text-slate-400" />
        </div>

        {/* Sign Out Button matching 5174 */}
        <button
          type="button"
          onClick={() => logout().then(() => navigate('/login'))}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
          title="Sign out of platform"
        >
          <LogOut className="size-4 text-slate-500" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};

