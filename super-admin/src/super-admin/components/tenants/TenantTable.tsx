// src/super-admin/components/tenants/TenantTable.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Card, Button, Badge } from '../../../components/ui/UIPrimitives';
import { useTenants, useTriggerAdminInvite, useDeleteTenant } from '../../hooks/useTenants';
import { usePlatformConfig } from '../../hooks/usePlatformConfig';
import { usePlatformAuth } from '../../hooks/usePlatformAuth';
import type { PlatformTenant } from '../../types/superAdmin';
import { openOperationalAppForTenant } from '../../../services/crossAppNav';
import { 
  Search, 
  Building2, 
  Mail, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpRight,
  Trash2,
  AlertTriangle,
  X,
  Plus,
  ExternalLink,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

const AVATAR_PALETTES = [
  { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
];

export const TenantTable: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: platformSession } = usePlatformAuth();
  const isSupport = platformSession?.isPlatformSupport;

  const urlStatus = searchParams.get('status');

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(urlStatus || 'ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const s = searchParams.get('status');
    if (s && (s === 'ACTIVE' || s === 'DEACTIVATED' || s === 'ALL')) {
      setStatusFilter(s);
      setPage(1);
    } else if (!s) {
      setStatusFilter('ALL');
    }
  }, [searchParams]);

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
    if (newStatus === 'ALL') {
      searchParams.delete('status');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ status: newStatus });
    }
  };

  // Dynamic config for tenant types (zero hardcoding)
  const { data: tenantTypes = [] } = usePlatformConfig('tenant_types');

  // Query tenants
  const { data: paginatedData, isLoading, error } = useTenants({
    search,
    status: statusFilter,
    tenantType: typeFilter,
    page,
    pageSize,
  });

  const triggerInviteMutation = useTriggerAdminInvite();
  const deleteTenantMutation = useDeleteTenant();
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');
  const [tenantToDelete, setTenantToDelete] = useState<PlatformTenant | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const handleTriggerInvite = (tenant: PlatformTenant) => {
    triggerInviteMutation.mutate(tenant.id, {
      onSuccess: () => {
        setInviteSuccessMsg(`Admin invite dispatched to ${tenant.adminEmail}`);
        setTimeout(() => setInviteSuccessMsg(''), 4000);
      },
    });
  };

  const totalCount = paginatedData?.total ?? 0;

  return (
    <div className="space-y-5">
      {inviteSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>{inviteSuccessMsg}</span>
          </div>
          <button onClick={() => setInviteSuccessMsg('')} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* 1. Top Header Banner matching localhost:5174 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-[#0274BB] flex items-center justify-center text-white shadow-sm shrink-0">
            <Building2 className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              Enterprise Tenant Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Enterprise Tenant Registry &amp; Multi-Tenant Operational Isolation ({totalCount} Registered)
            </p>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs font-semibold text-[#0274BB] tracking-wide">
            Govern • Audit • Scale
          </span>
          <div className="h-0.5 w-7 bg-[#0274BB] mt-1 rounded-full" />
        </div>
      </div>

      {/* 2. Filter and Search Bar matching localhost:5174 */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="size-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by enterprise name, code, admin email, city..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition-all shadow-xs"
          />
        </div>

        {/* Filter Buttons & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleStatusFilterChange('ALL')}
            className={cn(
              'px-5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer select-none',
              statusFilter === 'ALL'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => handleStatusFilterChange('ACTIVE')}
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
            Active
          </button>

          <button
            type="button"
            onClick={() => handleStatusFilterChange('DEACTIVATED')}
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
            Deactivated
          </button>

          {/* Dynamic Tenant Classification Selector */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB]"
          >
            <option value="ALL">All Classifications</option>
            {tenantTypes.map((type) => (
              <option key={type.code} value={type.code}>
                {type.label}
              </option>
            ))}
          </select>

          {!isSupport && (
            <Button
              variant="primary"
              size="default"
              onClick={() => navigate('/tenants/new')}
              className="h-10 px-4 rounded-lg bg-[#0274BB] hover:bg-[#003B8C] text-white font-semibold shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus className="size-4" />
              <span>Onboard Tenant</span>
            </Button>
          )}
        </div>
      </div>

      {/* 3. Table Content matching localhost:5174 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-24 text-center text-slate-400 font-mono text-xs animate-pulse">
            Querying PostgreSQL multi-tenant database...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-600 text-sm">
            Error loading tenants: {(error as Error).message}
          </div>
        ) : !paginatedData?.data || paginatedData.data.length === 0 ? (
          <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-3">
            <Building2 className="size-12 text-slate-300" />
            <div className="text-base font-bold text-slate-800">No Enterprise Tenants Found</div>
            <p className="text-xs text-slate-500 max-w-sm">
              No matching records in the database with the applied filters.
            </p>
            {!isSupport && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/tenants/new')}
                className="mt-2 text-xs bg-[#0274BB]"
              >
                Onboard New Tenant
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Enterprise Name</th>
                  <th className="py-3 px-4">Tenant Code</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Primary Administrator</th>
                  <th className="py-3 px-4">Facilities</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedData.data.map((t, idx) => {
                  const palette = AVATAR_PALETTES[idx % AVATAR_PALETTES.length];
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors duration-150">
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
                              Registered enterprise
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
                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 font-semibold">{t.adminName || 'Administrator'}</div>
                        <div className="text-slate-500 font-mono text-[11px]">{t.adminEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                          <Building2 className="size-3.5 text-slate-400" />
                          {t.branchesCount || 1} Lab Facility
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openOperationalAppForTenant(t.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-[#0274BB] hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors cursor-pointer"
                            title="Launch this Tenant in Operational App on localhost:5174"
                          >
                            <ExternalLink className="size-3.5" />
                            <span>Launch App</span>
                          </button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2.5 gap-1 border-slate-200 text-slate-700 hover:bg-slate-50"
                            onClick={() => navigate(`/tenants/${t.id}`)}
                            title="View Tenant Profile"
                          >
                            <span>Inspect</span>
                            <ArrowUpRight className="size-3" />
                          </Button>
                          {!isSupport && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7 px-2 text-slate-400 hover:text-slate-800"
                                onClick={() => handleTriggerInvite(t)}
                                title="Dispatch Admin Invite"
                              >
                                <Mail className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7 px-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                onClick={() => {
                                  setTenantToDelete(t);
                                  setDeleteReason('Removed by Super Admin');
                                  setDeleteError('');
                                }}
                                title="Delete Tenant"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Pagination Bar matching localhost:5174 */}
        {paginatedData && (
          <div className="p-3.5 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800">{paginatedData.data.length}</span> of{' '}
              <span className="font-semibold text-slate-800">{paginatedData.total}</span> enterprises
            </div>
            {paginatedData.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="text-xs h-8 px-3 border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <ChevronLeft className="size-3 mr-1" /> Previous
                </Button>
                <span className="px-2 font-medium text-slate-700">
                  Page {paginatedData.page} of {paginatedData.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= paginatedData.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-xs h-8 px-3 border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Next <ChevronRight className="size-3 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {tenantToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 rounded-lg text-rose-600">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Enterprise Tenant</h3>
                  <p className="text-xs text-slate-500">Permanent removal from platform</p>
                </div>
              </div>
              <button
                onClick={() => setTenantToDelete(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900">{tenantToDelete.name}</strong> (<span className="font-mono">{tenantToDelete.code}</span>)?
              This will immediately remove the tenant, their branches, organizations, and all tenant-scoped data. This action <strong className="text-rose-600">cannot be undone</strong>.
            </p>

            {deleteError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700">
                {deleteError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Audit Reason
              </label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Reason for deletion..."
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
                disabled={deleteTenantMutation.isPending}
                onClick={() => setTenantToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-md"
                disabled={deleteTenantMutation.isPending}
                onClick={() => {
                  if (!deleteReason.trim()) {
                    setDeleteError('A reason is required for audit compliance.');
                    return;
                  }
                  deleteTenantMutation.mutate(
                    { tenantId: tenantToDelete.id, reason: deleteReason.trim() },
                    {
                      onSuccess: () => {
                        setTenantToDelete(null);
                      },
                      onError: (err: any) => {
                        setDeleteError(err.message || 'Failed to delete tenant');
                      },
                    }
                  );
                }}
              >
                {deleteTenantMutation.isPending ? 'Deleting...' : 'Permanently Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
