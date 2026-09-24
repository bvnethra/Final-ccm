// src/super-admin/pages/SuperAdminDashboardPage.tsx
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTenants } from '../hooks/useTenants';
import { usePlatformAuth } from '../hooks/usePlatformAuth';
import { Button } from '../../components/ui/UIPrimitives';
import {
  Building2,
  Plus,
  Search,
  ChevronRight,
  Zap,
  Calendar,
  Layers,
  Clock,
  ArrowRight,
  LayoutDashboard,
  Mail,
} from 'lucide-react';
import { openOperationalAppForTenant } from '../../services/crossAppNav';
import { cn } from '../../lib/utils';
import type { PlatformTenant } from '../types/superAdmin';

const AVATAR_PALETTES = [
  { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
];

export default function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const { data: platformSession } = usePlatformAuth();
  const isSupport = platformSession?.isPlatformSupport;

  // 100% Dynamic database query - no hardcoded tenants
  const { data: tenantsData, isLoading, error } = useTenants({ pageSize: 100 });
  const allTenants: PlatformTenant[] = tenantsData?.data || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Dynamic live metric calculations (zero hardcoding)
  const totalCount = allTenants.length;
  const activeCount = useMemo(
    () => allTenants.filter((t) => t.status === 'ACTIVE').length,
    [allTenants]
  );
  const pendingCount = useMemo(
    () => allTenants.filter((t) => t.status === 'ONBOARDING' || (t.status as string) === 'PENDING').length,
    [allTenants]
  );
  const suspendedCount = useMemo(
    () => allTenants.filter((t) => t.status === 'DEACTIVATED' || (t.status as string) === 'SUSPENDED').length,
    [allTenants]
  );

  // Client-side filtering for immediate responsiveness matching 5174
  const filteredTenants = useMemo(() => {
    return allTenants.filter((tenant) => {
      // Filter by status/metric
      if (statusFilter === 'ACTIVE' && tenant.status !== 'ACTIVE') return false;
      if (statusFilter === 'ONBOARDING' && tenant.status !== 'ONBOARDING' && (tenant.status as string) !== 'PENDING') return false;
      if (statusFilter === 'DEACTIVATED' && tenant.status !== 'DEACTIVATED' && (tenant.status as string) !== 'SUSPENDED') return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          tenant.name?.toLowerCase().includes(q) ||
          tenant.code?.toLowerCase().includes(q) ||
          tenant.adminEmail?.toLowerCase().includes(q) ||
          tenant.tenantType?.toLowerCase().includes(q) ||
          tenant.status?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [allTenants, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F8F0] text-[#16A34A] border border-[#D1F2E0] whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-[#16A34A]" /> ACTIVE
          </span>
        );
      case 'ONBOARDING':
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0274BB] border border-blue-200 whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-[#0274BB]" /> ONBOARDING
          </span>
        );
      case 'DEACTIVATED':
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-rose-600" /> DEACTIVATED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-slate-400" /> {status}
          </span>
        );
    }
  };

  const operatorName = platformSession?.user?.fullName || 'Nethra Super Admin';

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
        Failed to load tenants: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Top Header Banner matching localhost:5174 Command Center */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-[#0274BB] flex items-center justify-center text-white shadow-sm shrink-0">
            <LayoutDashboard className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              Tenant Platform Governance
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Global Tenant Roster &amp; Operational Launchpad • Welcome, {operatorName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isSupport && (
            <Link to="/tenants/new">
              <Button className="bg-[#0274BB] hover:bg-[#02629e] text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 text-sm shadow-xs transition-all cursor-pointer">
                <Plus className="size-4" /> Onboard Tenant
              </Button>
            </Link>
          )}
          <Link to="/tenants">
            <Button
              variant="outline"
              className="border-slate-200 text-slate-700 hover:bg-slate-50 font-medium px-4 py-2 rounded-lg flex items-center gap-2 text-sm shadow-xs transition-all"
            >
              <Building2 className="size-4" /> All Tenants
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Filter and Search Bar matching localhost:5174 */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="size-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by tenant name, code, admin email, status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition-all shadow-xs"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={cn(
              'px-5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
              statusFilter === 'ALL'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            All Tenants
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
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
            Active
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('ONBOARDING')}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
              statusFilter === 'ONBOARDING'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                statusFilter === 'ONBOARDING' ? 'bg-white' : 'bg-blue-500'
              )}
            />
            Pending Setup
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('DEACTIVATED')}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
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
            Suspended
          </button>
        </div>
      </div>

      {/* 3. 4 Stat Metric Cards matching localhost:5174 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Tenants */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className={cn(
            'bg-[#F8F6FF] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            statusFilter === 'ALL'
              ? 'border-purple-300 ring-2 ring-purple-400/20'
              : 'border-purple-100 hover:border-purple-200'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Building2 className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">
                {isLoading ? '—' : totalCount}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">Total Tenants</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-purple-400" />
        </div>

        {/* Card 2: Active Tenants */}
        <div
          onClick={() => setStatusFilter('ACTIVE')}
          className={cn(
            'bg-[#F0FDF4] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            statusFilter === 'ACTIVE'
              ? 'border-emerald-300 ring-2 ring-emerald-400/20'
              : 'border-emerald-100 hover:border-emerald-200'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <span className="size-3 rounded-full bg-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">
                {isLoading ? '—' : activeCount}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">Active Tenants</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-emerald-400" />
        </div>

        {/* Card 3: Pending Onboarding */}
        <div
          onClick={() => setStatusFilter('ONBOARDING')}
          className={cn(
            'bg-[#F8FAFC] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            statusFilter === 'ONBOARDING'
              ? 'border-slate-300 ring-2 ring-slate-400/20'
              : 'border-slate-200 hover:border-slate-300'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <span className="size-3 rounded-full bg-slate-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">
                {isLoading ? '—' : pendingCount}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">Pending Setup</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-slate-400" />
        </div>

        {/* Card 4: Suspended / Inactive */}
        <div
          onClick={() => setStatusFilter('DEACTIVATED')}
          className={cn(
            'bg-[#EFF6FF] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            statusFilter === 'DEACTIVATED'
              ? 'border-blue-300 ring-2 ring-blue-400/20'
              : 'border-blue-100 hover:border-blue-200'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-blue-100 text-[#0274BB] flex items-center justify-center shrink-0">
              <Zap className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">
                {isLoading ? '—' : suspendedCount}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">Suspended Tenants</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-blue-400" />
        </div>
      </div>

      {/* 4. Active Tenant Pipeline Table matching localhost:5174 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Active Tenant Pipeline
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
              {filteredTenants.length} Tenants
            </span>
          </div>
          <Link
            to="/tenants"
            className="text-xs font-semibold text-[#0274BB] hover:underline flex items-center gap-1"
          >
            View Full Directory <ArrowRight className="size-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">Tenant Info</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Admin Account</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Onboarded Date</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Scope &amp; Facilities</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Classification</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Lifecycle Status</th>
                <th className="px-5 py-3.5 whitespace-nowrap">System Audit</th>
                <th className="px-5 py-3.5 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <div className="size-7 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">Loading tenant roster...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <Building2 className="size-6" />
                      </div>
                      <h3 className="font-semibold text-base text-slate-900">No Tenants Found</h3>
                      <p className="text-xs text-slate-500">
                        {searchQuery
                          ? 'No matching tenants found for your search/filter criteria.'
                          : 'No tenant accounts onboarded to platform yet.'}
                      </p>
                      {!isSupport && (
                        <Link to="/tenants/new">
                          <Button variant="secondary" size="sm" className="mt-2">
                            <Plus className="size-3.5" /> Onboard Tenant
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t, index) => {
                  const palette = AVATAR_PALETTES[index % AVATAR_PALETTES.length];
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* TENANT INFO */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'size-10 rounded-lg flex items-center justify-center border shrink-0',
                              palette.bg,
                              palette.text,
                              palette.border
                            )}
                          >
                            <Building2 className="size-5" />
                          </div>
                          <div>
                            <Link
                              to={`/tenants/${t.id}`}
                              className="font-semibold text-slate-900 text-sm hover:text-[#0274BB] transition-colors leading-tight line-clamp-1"
                              title={t.name}
                            >
                              {t.name}
                            </Link>
                            <span className="inline-block font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#0274BB] border border-blue-200 mt-1 whitespace-nowrap">
                              {t.code}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* ADMIN ACCOUNT */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                            <Mail className="size-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[190px]">
                              {t.adminEmail}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 ml-5">
                            Root Administrator
                          </div>
                        </div>
                      </td>

                      {/* ONBOARDED DATE */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-slate-400 shrink-0" />
                          <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* SCOPE & FACILITIES */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium border border-slate-200">
                          <Layers className="size-3 text-slate-500" />
                          <span>{t.branchesCount || 1} {t.branchesCount === 1 ? 'Facility' : 'Facilities'}</span>
                        </span>
                      </td>

                      {/* CLASSIFICATION */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0274BB] border border-blue-200 whitespace-nowrap">
                          {t.tenantType || 'ENTERPRISE'}
                        </span>
                      </td>

                      {/* LIFECYCLE STATUS */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {getStatusBadge(t.status)}
                      </td>

                      {/* SYSTEM AUDIT */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="size-3.5 text-slate-400" />
                          <span>Updated: {new Date(t.updatedAt || t.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openOperationalAppForTenant(t.id)}
                            className="text-xs h-8 px-3 rounded-lg bg-[#0274BB] hover:bg-[#003B8C] text-white font-medium cursor-pointer"
                            title={`Launch operational portal for ${t.name}`}
                          >
                            Launch App
                          </Button>
                          <Link to={`/tenants/${t.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8 px-3 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                            >
                              Manage
                            </Button>
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
      </div>
    </div>
  );
}
