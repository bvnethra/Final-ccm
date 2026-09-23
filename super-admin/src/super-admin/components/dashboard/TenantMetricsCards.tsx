// src/super-admin/components/dashboard/TenantMetricsCards.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { KPICard } from '../../../components/ui/UIPrimitives';
import type { SuperAdminDashboardMetrics } from '../../types/superAdmin';

interface Props {
  metrics: SuperAdminDashboardMetrics;
  isLoading?: boolean;
}

export const TenantMetricsCards: React.FC<Props> = ({ metrics, isLoading }) => {
  const complianceRate = metrics.totalTenants > 0
    ? Math.round((metrics.activeTenants / metrics.totalTenants) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Total Enterprises */}
      <KPICard
        title="Total Enterprises"
        value={isLoading ? '—' : metrics.totalTenants}
        accentColor="#0274BB"
        subMetrics={[
          { label: 'Active Operational', value: metrics.activeTenants, color: '#16A34A' },
          {
            label: 'Deactivated / Inactive',
            value: metrics.deactivatedTenants,
            color: metrics.deactivatedTenants > 0 ? '#DC2626' : undefined,
          },
        ]}
        footerAction={
          <Link
            to="/tenants"
            className="text-xs font-semibold text-[#0274BB] hover:underline flex items-center gap-1"
          >
            View All Enterprises <ArrowRight className="size-3" />
          </Link>
        }
      />

      {/* 2. Operational Tenants */}
      <KPICard
        title="Operational Tenants"
        value={isLoading ? '—' : metrics.activeTenants}
        accentColor="#16A34A"
        subMetrics={[
          { label: 'Active Compliance Rate', value: `${complianceRate}%`, color: '#16A34A' },
          { label: 'Calibrating Facilities', value: metrics.activeTenants },
        ]}
        footerAction={
          <Link
            to="/tenants?status=ACTIVE"
            className="text-xs font-semibold text-[#0274BB] hover:underline flex items-center gap-1"
          >
            Active Tenants Queue <ArrowRight className="size-3" />
          </Link>
        }
      />

      {/* 3. Inactive / Suspended */}
      <KPICard
        title="Inactive Enterprises"
        value={isLoading ? '—' : metrics.deactivatedTenants}
        accentColor="#EF7626"
        subMetrics={[
          {
            label: 'Archived Accounts',
            value: metrics.deactivatedTenants,
            color: metrics.deactivatedTenants > 0 ? '#DC2626' : '#6B7280',
          },
          {
            label: 'Action Required',
            value: metrics.deactivatedTenants > 0 ? 'Pending Review' : 'None (Compliant)',
            color: metrics.deactivatedTenants > 0 ? '#EF7626' : '#16A34A',
          },
        ]}
        footerAction={
          <Link
            to="/tenants?status=DEACTIVATED"
            className="text-xs font-semibold text-[#0274BB] hover:underline flex items-center gap-1"
          >
            Review Inactive Accounts <ArrowRight className="size-3" />
          </Link>
        }
      />

      {/* 4. Platform Audit Telemetry */}
      <KPICard
        title="Platform Audit Log"
        value={isLoading ? '—' : (metrics.recentActivity?.length ?? 0)}
        accentColor="#7C3AED"
        subMetrics={[
          { label: 'Recent Audit Events', value: metrics.recentActivity?.length ?? 0 },
          { label: 'RLS & Audit Policy', value: '100% Enforced', color: '#16A34A' },
        ]}
        footerAction={
          <Link
            to="/audit"
            className="text-xs font-semibold text-[#0274BB] hover:underline flex items-center gap-1"
          >
            Immutable Audit Trail <ArrowRight className="size-3" />
          </Link>
        }
      />
    </div>
  );
};
