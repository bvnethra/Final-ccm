// src/super-admin/components/dashboard/TenantMetricsCards.tsx
import React from 'react';
import { Card } from '../../../components/ui/UIPrimitives';
import { Building2, CheckCircle, XCircle } from 'lucide-react';
import type { SuperAdminDashboardMetrics } from '../../types/superAdmin';

interface Props {
  metrics: SuperAdminDashboardMetrics;
  isLoading?: boolean;
}

export const TenantMetricsCards: React.FC<Props> = ({ metrics, isLoading }) => {
  const cards = [
    {
      title: 'Total Tenants',
      count: metrics.totalTenants,
      subtext: 'Registered platform enterprises',
      icon: Building2,
    },
    {
      title: 'Active Tenants',
      count: metrics.activeTenants,
      subtext: 'Operational & calibrating labs',
      icon: CheckCircle,
    },
    {
      title: 'Deactivated Tenants',
      count: metrics.deactivatedTenants,
      subtext: 'Archived / inactive enterprises',
      icon: XCircle,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <Card
            key={idx}
            className="p-5 bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                {c.title}
              </span>
              <div className="size-8 rounded-md bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                <Icon className="size-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 mb-1">
              {isLoading ? (
                <div className="w-12 h-8 rounded bg-zinc-800 animate-pulse" />
              ) : (
                c.count
              )}
            </div>
            <div className="text-[11px] text-zinc-500">
              {c.subtext}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
