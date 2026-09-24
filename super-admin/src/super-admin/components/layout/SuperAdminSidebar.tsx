// src/super-admin/components/layout/SuperAdminSidebar.tsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  Users2,
  ShieldCheck,
  History,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { usePlatformAuth } from '../../hooks/usePlatformAuth';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
}

const governanceItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Enterprise Tenants', to: '/tenants', icon: Building2 },
  { label: 'Onboard Tenant', to: '/tenants/new', icon: PlusCircle },
];

const administrationItems: NavItem[] = [
  { label: 'Platform Users', to: '/users', icon: Users2 },
  { label: 'Role & Permissions', to: '/permissions', icon: ShieldCheck },
];

const complianceItems: NavItem[] = [
  { label: 'Platform Audit Trail', to: '/audit', icon: History },
];

interface SectionProps {
  label: string;
  items: NavItem[];
  isCollapsed: boolean;
}

const NavSection: React.FC<SectionProps> = ({ label, items, isCollapsed }) => {
  if (items.length === 0) return null;

  return (
    <div className="space-y-1">
      {isCollapsed ? (
        <div className="my-2 border-t border-slate-200 mx-2" title={label} />
      ) : (
        <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          {label}
        </span>
      )}
      <nav className="mt-1 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              title={item.label}
              className={({ isActive }) =>
                cn(
                  'flex items-center transition-all group relative',
                  isCollapsed
                    ? cn(
                        'size-11 mx-auto justify-center rounded-xl',
                        isActive
                          ? 'bg-[#EBF5FF] text-[#0274BB] font-semibold shadow-xs ring-1 ring-[#0274BB]/20'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )
                    : cn(
                        'gap-3 px-3.5 py-2.5 text-sm font-medium border-l-[3px] rounded-r-md',
                        isActive
                          ? 'bg-[#EBF5FF] text-[#0274BB] border-l-[#0274BB] font-semibold'
                          : 'text-slate-600 border-l-transparent hover:bg-slate-50 hover:text-slate-900'
                      )
                )
              }
            >
              <Icon className={cn('shrink-0', isCollapsed ? 'size-5' : 'size-4')} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}

              {/* Hover Tooltip when collapsed */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export const SuperAdminSidebar: React.FC = () => {
  const { data: platformSession } = usePlatformAuth();
  const isSupport = platformSession?.isPlatformSupport;

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ccm_superadmin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ccm_superadmin_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const visibleGovernanceItems = governanceItems.filter((item) => {
    if (isSupport && item.to === '/tenants/new') return false;
    return true;
  });

  return (
    <aside
      className={cn(
        'sticky top-16 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 select-none transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-[72px]' : 'w-60'
      )}
    >
      {/* Floating Edge Arrow Button matching localhost:5174 */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="absolute -right-3 top-4 z-30 size-6 bg-white border border-slate-200 rounded-full shadow-xs flex items-center justify-center text-slate-500 hover:text-[#0274BB] hover:border-[#0274BB] hover:scale-110 transition-all cursor-pointer focus:outline-none"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar (show symbols only)'}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
      </button>

      {/* Top Navigation Header matching localhost:5174 */}
      {!isCollapsed ? (
        <div className="flex items-center pb-3 pt-4 border-b border-slate-100 px-4">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
            Navigation
          </span>
        </div>
      ) : (
        <div className="pt-3 pb-2 border-b border-slate-100" />
      )}

      {/* Nav List with Independent Scroll */}
      <div className={cn('flex-1 overflow-y-auto overflow-x-hidden space-y-6 py-4', isCollapsed ? 'px-2' : 'px-2')}>
        <NavSection
          label="PLATFORM GOVERNANCE"
          items={visibleGovernanceItems}
          isCollapsed={isCollapsed}
        />
        <NavSection
          label="ADMINISTRATION"
          items={administrationItems}
          isCollapsed={isCollapsed}
        />
        <NavSection
          label="COMPLIANCE & AUDIT"
          items={complianceItems}
          isCollapsed={isCollapsed}
        />
      </div>
    </aside>
  );
};

