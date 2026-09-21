// src/super-admin/components/tenants/TenantTable.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Card, Button, Badge } from '../../../components/ui/UIPrimitives';
import { useTenants, useTriggerAdminInvite } from '../../hooks/useTenants';
import { usePlatformConfig } from '../../hooks/usePlatformConfig';
import { usePlatformAuth } from '../../hooks/usePlatformAuth';
import type { PlatformTenant } from '../../types/superAdmin';
import { 
  Search, 
  Building2, 
  Mail, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpRight
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
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');

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
      <Card className="p-3.5 bg-white border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="size-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, code, email..."
              className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 transition"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 transition"
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
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 transition"
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
      <Card className="p-0 overflow-hidden bg-white border-slate-200 shadow-xs">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 font-mono text-xs animate-pulse">
            Querying PostgreSQL tenants...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-600 text-sm">
            Error loading tenants: {(error as Error).message}
          </div>
        ) : !paginatedData?.data || paginatedData.data.length === 0 ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
            <Building2 className="size-10 text-slate-300" />
            <div className="text-sm font-semibold text-slate-800">No Enterprise Tenants Found</div>
            <p className="text-xs text-slate-500 max-w-sm">
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
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Enterprise Name & Code</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Primary Administrator</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedData.data.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors duration-150">
                    <td className="py-3.5 px-4 cursor-pointer" onClick={() => navigate(`/tenants/${t.id}`)}>
                      <div className="font-semibold text-slate-900 hover:text-indigo-600 transition">
                        <Link
                          to={`/tenants/${t.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t.name}
                        </Link>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">{t.code}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 cursor-pointer" onClick={() => navigate(`/tenants/${t.id}`)}>
                      <div>{t.tenantType || 'COMMERCIAL_LAB'}</div>
                      <div className="text-[11px] text-slate-400">{t.branchesCount || 1} Branch facility</div>
                    </td>
                    <td className="py-3.5 px-4 cursor-pointer" onClick={() => navigate(`/tenants/${t.id}`)}>
                      <div className="text-slate-800 font-medium">{t.adminName || 'Admin'}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{t.adminEmail}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(t.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-2.5 gap-1 border-slate-200 text-slate-700 hover:bg-slate-50"
                          onClick={() => navigate(`/tenants/${t.id}`)}
                          title="View Tenant Profile"
                        >
                          <span>Details</span>
                          <ArrowUpRight className="size-3" />
                        </Button>
                        {!isSupport && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2 text-slate-400 hover:text-slate-700"
                            onClick={() => handleTriggerInvite(t)}
                            title="Dispatch Admin Invite"
                          >
                            <Mail className="size-3.5" />
                          </Button>
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
          <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing page <strong>{paginatedData.page}</strong> of <strong>{paginatedData.totalPages}</strong> ({paginatedData.total} total)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-xs h-7 px-2 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <ChevronLeft className="size-3 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= paginatedData.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs h-7 px-2 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Next <ChevronRight className="size-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
