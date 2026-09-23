// src/super-admin/components/dashboard/TenantMetricsCards.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FlaskConical, Ban } from 'lucide-react';
import type { SuperAdminDashboardMetrics } from '../../types/superAdmin';

interface Props {
  metrics: SuperAdminDashboardMetrics;
  isLoading?: boolean;
}

const cards = [
  {
    title: 'Total Tenants',
    key: 'totalTenants' as const,
    subtext: 'Registered platform enterprises',
    icon: Building2,
    iconBg: 'bg-[#E6F2FF] text-[#0274BB]',
    path: '/tenants',
  },
  {
    title: 'Active Tenants',
    key: 'activeTenants' as const,
    subtext: 'Operational & calibrating labs',
    icon: FlaskConical,
    iconBg: 'bg-[#F0FDF4] text-[#16A34A]',
    path: '/tenants?status=ACTIVE',
  },
  {
    title: 'Deactivated Tenants',
    key: 'deactivatedTenants' as const,
    subtext: 'Archived / inactive enterprises',
    icon: Ban,
    iconBg: 'bg-[#F5F7FA] text-[#9CA3AF]',
    path: '/tenants?status=DEACTIVATED',
  },
];

export const TenantMetricsCards: React.FC<Props> = ({ metrics, isLoading }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        const count = metrics[c.key];
        return (
          <div
            key={c.key}
            onClick={() => navigate(c.path)}
            className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 shadow-xs transition-all hover:border-[#b8dcff] hover:shadow-sm cursor-pointer select-none group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(c.path);
              }
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`size-9 rounded-[6px] ${c.iconBg} flex items-center justify-center shrink-0`}>
                <Icon className="size-4" />
              </div>
            </div>

            <div className="space-y-1">
              {isLoading ? (
                <div className="w-10 h-7 rounded-[4px] bg-[#F5F7FA] animate-pulse" />
              ) : (
                <div className="text-2xl font-bold text-[#111827] tracking-tight tabular-nums">
                  {count}
                </div>
              )}
              <div className="text-[11px] font-semibold text-[#374151] uppercase tracking-wider">
                {c.title}
              </div>
              <div className="text-xs text-[#6B7280]">{c.subtext}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
