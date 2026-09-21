// src/super-admin/components/tenants/TenantTable.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Card, Button, Badge } from '../../../components/ui/UIPrimitives';
import { useTenants, useTriggerAdminInvite, useDeleteTenant } from '../../hooks/useTenants';
import { usePlatformConfig } from '../../hooks/usePlatformConfig';
import { usePlatformAuth } from '../../hooks/usePlatformAuth';
import type { PlatformTenant } from '../../types/superAdmin';
import { 
  Search, 
  Building2, 
  Mail, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpRight,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';

export const TenantTable: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: platformSession } = usePlatformAuth();
  const isSupport = platformSession?.isPlatformSupport;

  const urlStatus = searchParams.get('status');

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(urlStatus || 'ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    const s = searchParams.get('status');
    if (s && (s === 'ACTIVE' || s === 'DEACTIVATED' || s === 'ALL')) {
      setStatusFilter(s);
      setPage(1);
    } else if (!s) {
      setStatusFilter('ALL');
    }
  }, [searchParams]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">ACTIVE</Badge>;
      case 'DEACTIVATED':
        return <Badge variant="destructive">DEACTIVATED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {inviteSuccessMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fadeIn">
          <span>{inviteSuccessMsg}</span>
          <button onClick={() => setInviteSuccessMsg('')} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <Card className="p-3.5 bg-white border-[#E5E7EB] rounded-[8px] shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="size-3.5 text-[#9CA3AF] absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, code, email..."
              className="w-full bg-white border border-[#E5E7EB] rounded-[4px] pl-8 pr-3 py-1.5 text-xs text-[#111827] placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0274BB] focus-visible:border-[#0274BB] transition"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full bg-white border border-[#E5E7EB] rounded-[4px] px-3 py-1.5 text-xs text-[#374151] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0274BB] focus-visible:border-[#0274BB] transition"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DEACTIVATED">DEACTIVATED</option>
            </select>
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="w-full bg-white border border-[#E5E7EB] rounded-[4px] px-3 py-1.5 text-xs text-[#374151] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0274BB] focus-visible:border-[#0274BB] transition"
            >
              <option value="ALL">All Tenant Types</option>
              {tenantTypes.map((type) => (
                <option key={type.code} value={type.code}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Table Content */}
      <Card className="p-0 overflow-hidden bg-white border-[#E5E7EB] rounded-[8px] shadow-xs">
        {isLoading ? (
          <div className="py-20 text-center text-[#9CA3AF] font-mono text-xs animate-pulse">
            Loading tenants...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-[#DC2626] text-sm">
            Error loading tenants: {(error as Error).message}
          </div>
        ) : !paginatedData?.data || paginatedData.data.length === 0 ? (
          <div className="py-16 text-center text-[#9CA3AF] flex flex-col items-center gap-3">
            <Building2 className="size-10 text-[#D1D5DB]" />
            <div className="text-sm font-semibold text-[#111827]">No Enterprise Tenants Found</div>
            <p className="text-xs text-[#6B7280] max-w-sm">
              No matching records in the database with the applied filters.
            </p>
            {!isSupport && (
              <Button variant="default" size="sm" onClick={() => navigate('/tenants/new')} className="mt-2 text-xs">
                Onboard New Tenant
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F5F7FA] text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider">
                  <th className="py-3 px-4">Enterprise Name & Code</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Primary Administrator</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-xs">
                {paginatedData.data.map((t) => (
                  <tr key={t.id} className="hover:bg-[#F5F7FA] transition-colors duration-150">
                    <td className="py-3.5 px-4 cursor-pointer" onClick={() => navigate(`/tenants/${t.id}`)}>
                      <div className="font-semibold text-[#111827] hover:text-[#0274BB] transition">
                        <Link
                          to={`/tenants/${t.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t.name}
                        </Link>
                      </div>
                      <div className="text-[11px] font-mono text-[#6B7280]">{t.code}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#374151] cursor-pointer" onClick={() => navigate(`/tenants/${t.id}`)}>
                      <div>{t.tenantType || 'COMMERCIAL_LAB'}</div>
                      <div className="text-[11px] text-[#9CA3AF]">{t.branchesCount || 1} Branch facility</div>
                    </td>
                    <td className="py-3.5 px-4 cursor-pointer" onClick={() => navigate(`/tenants/${t.id}`)}>
                      <div className="text-[#111827] font-medium">{t.adminName || 'Admin'}</div>
                      <div className="text-[#6B7280] font-mono text-[11px]">{t.adminEmail}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(t.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-2.5 gap-1 border-[#E5E7EB] text-[#374151] hover:bg-[#F5F7FA]"
                          onClick={() => navigate(`/tenants/${t.id}`)}
                          title="View Tenant Profile"
                        >
                          <span>Details</span>
                          <ArrowUpRight className="size-3" />
                        </Button>
                        {!isSupport && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 px-2 text-[#9CA3AF] hover:text-[#111827]"
                              onClick={() => handleTriggerInvite(t)}
                              title="Dispatch Admin Invite"
                            >
                              <Mail className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 px-2 text-[#9CA3AF] hover:text-[#DC2626] hover:bg-rose-50"
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
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {paginatedData && paginatedData.totalPages > 1 && (
          <div className="p-3 border-t border-[#E5E7EB] bg-[#F5F7FA] flex items-center justify-between text-xs text-[#6B7280]">
            <div>
              Showing page <strong>{paginatedData.page}</strong> of <strong>{paginatedData.totalPages}</strong> ({paginatedData.total} total)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-xs h-7 px-2 border-[#E5E7EB] text-[#374151] hover:bg-white"
              >
                <ChevronLeft className="size-3 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= paginatedData.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs h-7 px-2 border-[#E5E7EB] text-[#374151] hover:bg-white"
              >
                Next <ChevronRight className="size-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      {tenantToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-[8px] border border-[#E5E7EB] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 rounded-[6px] text-[#DC2626]">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827]">Delete Enterprise Tenant</h3>
                  <p className="text-xs text-[#6B7280]">Permanent removal from platform</p>
                </div>
              </div>
              <button
                onClick={() => setTenantToDelete(null)}
                className="text-[#9CA3AF] hover:text-[#374151] p-1 rounded transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-[#111827]">{tenantToDelete.name}</strong> (<span className="font-mono">{tenantToDelete.code}</span>)?
              This will immediately remove the tenant, their branches, organizations, and all tenant-scoped data. This action <strong className="text-[#DC2626]">cannot be undone</strong>.
            </p>

            {deleteError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-[4px] text-xs text-rose-700">
                {deleteError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-[#374151] uppercase tracking-wider mb-1">
                Audit Reason
              </label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Reason for deletion..."
                className="w-full bg-white border border-[#E5E7EB] rounded-[4px] px-3 py-1.5 text-xs text-[#111827] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#DC2626] focus-visible:border-[#DC2626]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-[#E5E7EB] text-[#374151] hover:bg-[#F5F7FA]"
                disabled={deleteTenantMutation.isPending}
                onClick={() => setTenantToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="text-xs bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-[4px]"
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
