// src/super-admin/pages/SuperAdminDashboardPage.tsx
import React from 'react';
import { useSuperAdminDashboard } from '../hooks/useSuperAdminDashboard';
import { TenantMetricsCards } from '../components/dashboard/TenantMetricsCards';
import { TenantStatusDistribution } from '../components/dashboard/TenantStatusDistribution';
import { RecentPlatformActivity } from '../components/dashboard/RecentPlatformActivity';
import { Card, Button, Badge } from '../../components/ui/UIPrimitives';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Plus, ArrowUpRight, RefreshCw } from 'lucide-react';
import { usePlatformAuth } from '../hooks/usePlatformAuth';

export default function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const { data: metrics, isLoading, error, refetch } = useSuperAdminDashboard();
  const { data: platformSession } = usePlatformAuth();
  const isSupport = platformSession?.isPlatformSupport;

  if (error) {
    return (
      <div className="p-6 rounded-lg bg-red-950/20 border border-red-800/40 text-red-300 text-sm">
        Failed to load platform metrics: {(error as Error).message}
      </div>
    );
  }

  const fallbackMetrics = {
    totalTenants: 0,
    activeTenants: 0,
    deactivatedTenants: 0,
    statusDistribution: [],
    recentTenants: [],
    recentActivity: [],
  };

  const data = metrics || fallbackMetrics;
  const operatorName = platformSession?.user?.fullName || 'Platform Administrator';

  return (
    <div className="space-y-8">
      {/* Header Banner matching 5174 Command Center */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#111827] tracking-tight">
              Platform Governance Dashboard
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <p className="text-sm text-[#6B7280] mt-1">
            Centralized Enterprise Oversight &amp; Immutable Audit Telemetry • Welcome, {operatorName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="text-xs gap-1.5 h-9 px-3.5"
            title="Refresh database metrics"
          >
            <RefreshCw className="size-3.5" />
            <span>Refresh</span>
          </Button>

          {!isSupport && (
            <Button
              variant="primary"
              onClick={() => navigate('/tenants/new')}
              className="text-xs gap-1.5 h-9 px-4"
            >
              <Plus className="size-4" />
              <span>Onboard New Tenant</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <TenantMetricsCards metrics={data} isLoading={isLoading} />

      {/* Charts & Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TenantStatusDistribution
          distribution={data.statusDistribution}
          totalTenants={data.totalTenants}
        />

        {/* Recently Onboarded Tenants Card */}
        <Card className="p-5 bg-white border-[#E5E7EB] rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-[#E6F2FF] text-[#0274BB] flex items-center justify-center shrink-0">
                <Building2 className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111827]">Recently Onboarded</h3>
                <p className="text-xs text-[#6B7280]">Latest enterprise registrations</p>
              </div>
            </div>
            <Link
              to="/tenants"
              className="text-xs text-[#0274BB] hover:text-[#003B8C] font-semibold transition-colors flex items-center gap-1"
            >
              View All &rarr;
            </Link>
          </div>

          {data.recentTenants.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#9CA3AF]">
              No recent tenants registered.
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {data.recentTenants.map((t) => (
                <div key={t.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0 text-xs">
                  <div>
                    <div className="font-semibold text-[#111827] hover:text-[#0274BB] transition-colors">
                      <Link to={`/tenants/${t.id}`}>{t.name}</Link>
                    </div>
                    <div className="text-[11px] text-[#6B7280] font-mono mt-0.5">
                      {t.code} {t.adminEmail ? <>&bull; <span className="text-[#9CA3AF]">{t.adminEmail}</span></> : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Badge variant={t.status === 'ACTIVE' ? 'success' : 'destructive'} className="rounded-full px-2.5">
                      {t.status}
                    </Badge>
                    <Link
                      to={`/tenants/${t.id}`}
                      className="p-1 rounded-[4px] text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F5F7FA] transition-colors"
                    >
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Real Audit Activity Stream */}
      <RecentPlatformActivity activity={data.recentActivity} />
    </div>
  );
}
