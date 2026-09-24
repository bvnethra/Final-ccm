// src/super-admin/pages/SuperAdminDashboardPage.tsx
import React, { useState, useMemo } from 'react';
import { useSuperAdminDashboard } from '../hooks/useSuperAdminDashboard';
import { TenantMetricsCards } from '../components/dashboard/TenantMetricsCards';
import { TenantStatusDistribution } from '../components/dashboard/TenantStatusDistribution';
import { RecentPlatformActivity } from '../components/dashboard/RecentPlatformActivity';
import { Card, Button, Badge } from '../../components/ui/UIPrimitives';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  MapPin,
} from 'lucide-react';
import { usePlatformAuth } from '../hooks/usePlatformAuth';
import { openOperationalAppForTenant } from '../../services/crossAppNav';
import { cn } from '../../lib/utils';

const AVATAR_PALETTES = [
  { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
];

export default function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const { data: metrics, isLoading, error, refetch } = useSuperAdminDashboard();
  const { data: platformSession } = usePlatformAuth();
  const isSupport = platformSession?.isPlatformSupport;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DEACTIVATED' | 'AUDIT'>('ALL');

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
  const operatorName = platformSession?.user?.fullName || 'Nethra Super Admin';

  // Client-side search and filtering over recent tenants
  const filteredTenants = useMemo(() => {
    return data.recentTenants.filter((tenant) => {
      if (statusFilter === 'ACTIVE' && tenant.status !== 'ACTIVE') return false;
      if (statusFilter === 'DEACTIVATED' && tenant.status !== 'DEACTIVATED') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          tenant.name?.toLowerCase().includes(q) ||
          tenant.code?.toLowerCase().includes(q) ||
          tenant.adminEmail?.toLowerCase().includes(q) ||
          tenant.tenantType?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [data.recentTenants, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner matching localhost:5174 Command Center */}
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
            className="text-xs gap-1.5 h-9 px-3.5 bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
            title="Refresh database metrics"
          >
            <RefreshCw className="size-3.5 text-slate-500" />
            <span>Refresh</span>
          </Button>

          {!isSupport && (
            <Button
              variant="primary"
              onClick={() => navigate('/tenants/new')}
              className="text-xs gap-1.5 h-9 px-4 bg-[#0274BB] hover:bg-[#003B8C] text-white font-semibold rounded-md shadow-xs"
            >
              <Plus className="size-4" />
              <span>Onboard New Tenant</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Interactive Filter Pills Row matching localhost:5174 */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={cn(
            'px-5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer select-none',
            statusFilter === 'ALL'
              ? 'bg-[#0274BB] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          )}
        >
          All Enterprises
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('ACTIVE')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer select-none',
            statusFilter === 'ACTIVE'
              ? 'bg-[#0274BB] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          )}
        >
          <span
            className={cn(
              'size-2 rounded-full',
              statusFilter === 'ACTIVE' ? 'bg-white' : 'bg-emerald-500'
            )}
          />
          Active Operational
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('DEACTIVATED')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer select-none',
            statusFilter === 'DEACTIVATED'
              ? 'bg-[#0274BB] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          )}
        >
          <span
            className={cn(
              'size-2 rounded-full',
              statusFilter === 'DEACTIVATED' ? 'bg-white' : 'bg-rose-500'
            )}
          />
          Deactivated / Inactive
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('AUDIT')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer select-none',
            statusFilter === 'AUDIT'
              ? 'bg-[#0274BB] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          )}
        >
          <span
            className={cn(
              'size-2 rounded-full',
              statusFilter === 'AUDIT' ? 'bg-white' : 'bg-blue-500'
            )}
          />
          Audit Telemetry
        </button>
      </div>

      {/* 3. 4 Stat Metric Cards matching localhost:5174 */}
      <TenantMetricsCards
        metrics={data}
        isLoading={isLoading}
        activeFilter={statusFilter}
        onFilterChange={(id) => setStatusFilter(id as any)}
      />

      {/* 4. Live Enterprise Command Table Container matching localhost:5174 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Top Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#E6F2FF] text-[#0274BB] flex items-center justify-center shrink-0">
              <Building2 className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Registered Enterprise Tenants
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-tenant organizations actively provisioned in PostgreSQL database
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search enterprise name, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition-all"
              />
            </div>
            <Link
              to="/tenants"
              className="text-xs font-semibold text-[#0274BB] hover:underline whitespace-nowrap hidden sm:flex items-center gap-1"
            >
              Manage All <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Enterprise Data Table matching 5174 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Enterprise Name</th>
                <th className="py-3 px-4">Tenant Code</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Admin Email</th>
                <th className="py-3 px-4">Facilities</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono animate-pulse">
                    Querying live enterprise tenants...
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Building2 className="size-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No enterprise tenants match criteria</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting search query or filters</p>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t, idx) => {
                  const palette = AVATAR_PALETTES[idx % AVATAR_PALETTES.length];
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'size-9 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0',
                              palette.bg,
                              palette.text,
                              palette.border
                            )}
                          >
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link
                              to={`/tenants/${t.id}`}
                              className="font-semibold text-slate-900 hover:text-[#0274BB] transition-colors"
                            >
                              {t.name}
                            </Link>
                            <div className="text-[11px] text-slate-400">
                              Registered on platform
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-semibold text-[#0274BB] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                          {t.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          <Layers className="size-3 text-slate-500" />
                          {t.tenantType || 'Commercial Lab'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {t.adminEmail || 'admin@nethra.com'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                          <Building2 className="size-3.5 text-slate-400" />
                          {t.branchesCount ?? 1} Lab
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                            t.status === 'ACTIVE'
                              ? 'bg-[#E8F8F0] text-[#16A34A] border-[#D1F2E0]'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          )}
                        >
                          <span
                            className={cn(
                              'size-1.5 rounded-full',
                              t.status === 'ACTIVE' ? 'bg-[#16A34A]' : 'bg-rose-600'
                            )}
                          />
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openOperationalAppForTenant(t.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-[#0274BB] hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors cursor-pointer"
                            title="Launch this Tenant in Operational App on localhost:5174"
                          >
                            <ExternalLink className="size-3.5" />
                            <span>Launch App</span>
                          </button>
                          <Link
                            to={`/tenants/${t.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <span>Inspect</span>
                            <ArrowUpRight className="size-3.5 text-slate-400" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{filteredTenants.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{data.totalTenants}</span> total enterprises
          </div>
          <Link
            to="/tenants"
            className="font-semibold text-[#0274BB] hover:underline flex items-center gap-1"
          >
            Open Full Directory <ChevronRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* 5. Distribution & Telemetry Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TenantStatusDistribution
          distribution={data.statusDistribution}
          totalTenants={data.totalTenants}
        />

        {/* Real Audit Activity Stream */}
        <RecentPlatformActivity activity={data.recentActivity} />
      </div>
    </div>
  );
}
