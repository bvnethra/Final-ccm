// src/super-admin/pages/SuperAdminDashboardPage.tsx
import { useSuperAdminDashboard } from '../hooks/useSuperAdminDashboard';
import { TenantMetricsCards } from '../components/dashboard/TenantMetricsCards';
import { TenantStatusDistribution } from '../components/dashboard/TenantStatusDistribution';
import { RecentPlatformActivity } from '../components/dashboard/RecentPlatformActivity';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Card, Button } from '../../components/ui/UIPrimitives';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Plus, ArrowUpRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { usePlatformAuth } from '../hooks/usePlatformAuth';

export default function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const { data: metrics, isLoading, error, refetch } = useSuperAdminDashboard();
  const { data: platformSession } = usePlatformAuth();
  const isSupport = platformSession?.isPlatformSupport;

  if (error) {
    return (
      <div className="p-4 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm flex items-start gap-3">
        <AlertTriangle className="size-4 mt-0.5 shrink-0" />
        <div>
          <div className="font-semibold text-xs mb-0.5">Failed to load platform metrics</div>
          <div className="text-xs text-[#9CA3AF]">{(error as Error).message}</div>
        </div>
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Platform Governance Dashboard"
        description="Centralized platform oversight, enterprise tenant metrics, and immutable audit telemetry."
        bordered={false}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs gap-1.5 h-8 px-3 rounded-[4px] border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F5F7FA] font-medium shadow-xs"
              title="Refresh database metrics"
            >
              <RefreshCw className="size-3.5" />
              <span>Refresh</span>
            </Button>

            {!isSupport && (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/tenants/new')}
                className="text-xs gap-1.5 h-8 px-3.5 rounded-[4px] bg-[#0274BB] hover:bg-[#003B8C] text-white font-semibold shadow-xs"
              >
                <Plus className="size-3.5" />
                <span>Onboard Tenant</span>
              </Button>
            )}
          </>
        }
      />

      {/* KPI Metric Cards */}
      <TenantMetricsCards metrics={data} isLoading={isLoading} />

      {/* Distribution + Recent Tenants row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TenantStatusDistribution
          distribution={data.statusDistribution}
          totalTenants={data.totalTenants}
        />

        {/* Recently Onboarded Tenants */}
        <Card className="p-5 bg-white border-[#E5E7EB] rounded-[8px] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-[4px] bg-[#E6F2FF] text-[#0274BB] flex items-center justify-center shrink-0">
                <Building2 className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111827]">Recently Onboarded</h3>
                <p className="text-xs text-[#6B7280]">Latest enterprise registrations</p>
              </div>
            </div>
            <Link
              to="/tenants"
              className="text-xs text-[#0274BB] hover:text-[#003B8C] font-semibold transition-colors"
            >
              View All →
            </Link>
          </div>

          {data.recentTenants.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#9CA3AF]">
              No recent tenants registered.
            </div>
          ) : (
            <div className="divide-y divide-[#F5F7FA]">
              {data.recentTenants.map((t) => (
                <div
                  key={t.id}
                  className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/tenants/${t.id}`}
                      className="text-xs font-semibold text-[#111827] hover:text-[#0274BB] transition-colors block truncate"
                    >
                      {t.name}
                    </Link>
                    <div className="text-[10px] text-[#9CA3AF] font-mono mt-0.5 truncate">
                      {t.code}
                      {t.adminEmail && <> · {t.adminEmail}</>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={t.status} showDot={false} />
                    <Link
                      to={`/tenants/${t.id}`}
                      className="p-1 rounded-[4px] text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F5F7FA] transition-colors"
                      title={`View ${t.name}`}
                    >
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Audit Activity Stream */}
      <RecentPlatformActivity activity={data.recentActivity} />
    </div>
  );
}
