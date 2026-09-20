// src/super-admin/pages/SuperAdminDashboardPage.tsx
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

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2.5 tracking-tight">
            <span>Platform Governance Dashboard</span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-emerald-950/50 border border-emerald-800/40 text-emerald-300">
              Live DB
            </span>
          </h1>
          <p className="text-zinc-400 text-xs mt-0.5">
            Centralized platform oversight, enterprise tenant metrics, and immutable audit telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs gap-1.5 h-8"
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
              className="text-xs gap-1.5 h-8 font-medium"
            >
              <Plus className="size-3.5" />
              <span>Onboard New Tenant</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <TenantMetricsCards metrics={data} isLoading={isLoading} />

      {/* Charts & Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TenantStatusDistribution
          distribution={data.statusDistribution}
          totalTenants={data.totalTenants}
        />

        {/* Recently Onboarded Tenants Card */}
        <Card className="p-5 bg-zinc-900/40 border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-md bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                <Building2 className="size-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Recently Onboarded</h3>
                <p className="text-[11px] text-zinc-500">Latest enterprise registrations in PostgreSQL</p>
              </div>
            </div>
            <Link
              to="/tenants"
              className="text-xs text-zinc-400 hover:text-zinc-200 font-medium transition-colors"
            >
              View All &rarr;
            </Link>
          </div>

          {data.recentTenants.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No recent tenants registered.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {data.recentTenants.map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0 text-xs">
                  <div>
                    <div className="font-medium text-zinc-200 hover:text-zinc-100 transition-colors">
                      <Link to={`/tenants/${t.id}`}>{t.name}</Link>
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      {t.code} &bull; <span className="text-zinc-400">{t.adminEmail}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={t.status === 'ACTIVE' ? 'success' : 'destructive'}>
                      {t.status}
                    </Badge>
                    <Link
                      to={`/tenants/${t.id}`}
                      className="p-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
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

      {/* Real Audit Activity Stream */}
      <RecentPlatformActivity activity={data.recentActivity} />
    </div>
  );
}
