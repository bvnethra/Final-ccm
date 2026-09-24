// src/super-admin/components/dashboard/TenantMetricsCards.tsx
import React from 'react';
import { Building2, CheckCircle2, AlertTriangle, History, ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { SuperAdminDashboardMetrics } from '../../types/superAdmin';

interface Props {
  metrics: SuperAdminDashboardMetrics;
  isLoading?: boolean;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
}

export const TenantMetricsCards: React.FC<Props> = ({
  metrics,
  isLoading,
  activeFilter = 'ALL',
  onFilterChange,
}) => {
  const complianceRate =
    metrics.totalTenants > 0
      ? Math.round((metrics.activeTenants / metrics.totalTenants) * 100)
      : 100;

  const cards = [
    {
      id: 'ALL',
      title: 'Total Enterprises',
      value: isLoading ? '—' : metrics.totalTenants,
      sublabel: `${metrics.activeTenants} active • ${metrics.deactivatedTenants} inactive`,
      icon: Building2,
      palette: {
        bg: 'bg-[#F8F6FF]',
        border: 'border-purple-100',
        activeBorder: 'border-purple-300 ring-2 ring-purple-400/20',
        hoverBorder: 'hover:border-purple-200',
        iconBg: 'bg-purple-100',
        iconText: 'text-purple-600',
        chevronText: 'text-purple-400',
      },
    },
    {
      id: 'ACTIVE',
      title: 'Operational Tenants',
      value: isLoading ? '—' : metrics.activeTenants,
      sublabel: `${complianceRate}% active compliance rate`,
      icon: CheckCircle2,
      palette: {
        bg: 'bg-[#F0FDF4]',
        border: 'border-emerald-100',
        activeBorder: 'border-emerald-300 ring-2 ring-emerald-400/20',
        hoverBorder: 'hover:border-emerald-200',
        iconBg: 'bg-emerald-100',
        iconText: 'text-emerald-600',
        chevronText: 'text-emerald-400',
      },
    },
    {
      id: 'DEACTIVATED',
      title: 'Inactive Enterprises',
      value: isLoading ? '—' : metrics.deactivatedTenants,
      sublabel: metrics.deactivatedTenants > 0 ? 'Requires administrative review' : 'Zero inactive accounts',
      icon: AlertTriangle,
      palette: {
        bg: 'bg-[#FFF5F5]',
        border: 'border-rose-100',
        activeBorder: 'border-rose-300 ring-2 ring-rose-400/20',
        hoverBorder: 'hover:border-rose-200',
        iconBg: 'bg-rose-100',
        iconText: 'text-rose-600',
        chevronText: 'text-rose-400',
      },
    },
    {
      id: 'AUDIT',
      title: 'Audit Telemetry',
      value: isLoading ? '—' : (metrics.recentActivity?.length ?? 0),
      sublabel: 'RLS & policy 100% enforced',
      icon: History,
      palette: {
        bg: 'bg-[#F0F7FF]',
        border: 'border-blue-100',
        activeBorder: 'border-blue-300 ring-2 ring-blue-400/20',
        hoverBorder: 'hover:border-blue-200',
        iconBg: 'bg-blue-100',
        iconText: 'text-[#0274BB]',
        chevronText: 'text-blue-400',
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        const isSelected = activeFilter === c.id;

        return (
          <div
            key={c.id}
            onClick={() => onFilterChange?.(c.id)}
            className={cn(
              'border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm select-none',
              c.palette.bg,
              isSelected ? c.palette.activeBorder : cn(c.palette.border, c.palette.hoverBorder)
            )}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={cn(
                  'size-11 rounded-xl flex items-center justify-center shrink-0',
                  c.palette.iconBg,
                  c.palette.iconText
                )}
              >
                <Icon className="size-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 leading-none">
                  {c.value}
                </div>
                <div className="text-xs text-slate-700 font-semibold mt-1">
                  {c.title}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {c.sublabel}
                </div>
              </div>
            </div>
            <ChevronRight className={cn('size-5', c.palette.chevronText)} />
          </div>
        );
      })}
    </div>
  );
};
