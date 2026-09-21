// src/super-admin/components/tenants/TenantTable.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const { data: platformSession } = usePlatformAuth();
  const isSupport = platformSession?.isPlatformSupport;

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 8;

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
        <div className="p-3 rounded-md bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
          <span>{inviteSuccessMsg}</span>
          <button onClick={() => setInviteSuccessMsg('')} className="text-zinc-400 hover:text-zinc-100">✕</button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <Card className="p-3.5 bg-zinc-900/40 border-zinc-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="size-3.5 text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, code, email..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 transition"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 transition"
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
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 transition"
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
      <Card className="p-0 overflow-hidden bg-zinc-900/40 border-zinc-800">
        {isLoading ? (
          <div className="py-20 text-center text-zinc-500 font-mono text-xs animate-pulse">
            Querying PostgreSQL tenants...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-400 text-sm">
            Error loading tenants: {(error as Error).message}
          </div>
        ) : !paginatedData?.data || paginatedData.data.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 flex flex-col items-center gap-3">
            <Building2 className="size-10 text-zinc-700" />
            <div className="text-sm font-semibold text-zinc-300">No Enterprise Tenants Found</div>
            <p className="text-xs text-zinc-500 max-w-sm">
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
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Enterprise Name & Code</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Primary Administrator</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-xs">
                {paginatedData.data.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-900/30 transition-colors duration-150">
                    <td className="py-3.5 px-4 cursor-pointer" onClick={() => navigate(`/tenants/${t.id}`)}>
                      <div className="font-semibold text-zinc-200 hover:text-zinc-100 transition">
                        <Link
                          to={`/tenants/${t.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t.name}
                        </Link>
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400">{t.code}</div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300 cursor-pointer" onClick={() => navigate(`/tenants/${t.id}`)}>
                      <div>{t.tenantType || 'COMMERCIAL_LAB'}</div>
                      <div className="text-[11px] text-zinc-500">{t.branchesCount || 1} Branch facility</div>
                    </td>
                    <td className="py-3.5 px-4 cursor-pointer" onClick={() => navigate(`/tenants/${t.id}`)}>
                      <div className="text-zinc-200 font-medium">{t.adminName || 'Admin'}</div>
                      <div className="text-zinc-400 font-mono text-[11px]">{t.adminEmail}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(t.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-2.5 gap-1"
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
                            className="text-xs h-7 px-2 text-zinc-400 hover:text-zinc-100"
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
          <div className="p-3 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-between text-xs text-zinc-400">
            <div>
              Showing page <strong>{paginatedData.page}</strong> of <strong>{paginatedData.totalPages}</strong> ({paginatedData.total} total)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-xs h-7 px-2"
              >
                <ChevronLeft className="size-3 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= paginatedData.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs h-7 px-2"
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
