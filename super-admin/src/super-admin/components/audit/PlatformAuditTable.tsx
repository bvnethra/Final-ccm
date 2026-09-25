// src/super-admin/components/audit/PlatformAuditTable.tsx
import React, { useState, useMemo } from 'react';
import { usePlatformAudit } from '../../hooks/usePlatformAudit';
import { 
  FileText, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Shield, 
  User, 
  Clock, 
  Tag, 
  Layers, 
  ShieldCheck, 
  AlertTriangle,
  Info,
} from 'lucide-react';
import { TableBodySkeleton } from '../../../components/ui/Skeleton';
import { cn } from '../../../lib/utils';

const AVATAR_PALETTES = [
  { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
];

export const PlatformAuditTable: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'TENANT' | 'USER' | 'CONFIG'>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch all recent audit events from PostgreSQL
  const { data: logs = [], isLoading, error } = usePlatformAudit({
    limit: 500,
  });

  // Dynamically extract distinct action types from the database logs (Zero Hardcoding)
  const dynamicActions = useMemo(() => {
    const actionSet = new Set<string>();
    logs.forEach((log) => {
      if (log.action) actionSet.add(log.action);
    });
    return Array.from(actionSet).sort();
  }, [logs]);

  // Filtered & Paginated Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (log.actorEmail && log.actorEmail.toLowerCase().includes(term)) ||
        (log.action && log.action.toLowerCase().includes(term)) ||
        (log.reason && log.reason.toLowerCase().includes(term)) ||
        (log.referenceId && log.referenceId.toLowerCase().includes(term)) ||
        (log.actorRole && log.actorRole.toLowerCase().includes(term));

      const matchesAction =
        selectedAction === 'ALL' || log.action === selectedAction;

      let matchesCategory = true;
      if (categoryFilter === 'TENANT') {
        matchesCategory = Boolean(log.action.includes('TENANT') || log.action.includes('ORGANIZATION'));
      } else if (categoryFilter === 'USER') {
        matchesCategory = Boolean(log.action.includes('USER') || log.action.includes('ROLE') || log.action.includes('PERMISSION'));
      } else if (categoryFilter === 'CONFIG') {
        matchesCategory = Boolean(log.action.includes('CONFIG'));
      }

      return matchesSearch && matchesAction && matchesCategory;
    });
  }, [logs, search, selectedAction, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const validPage = Math.min(page, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

  const getActionBadgeStyle = (action: string) => {
    if (action.includes('DEACTIVATED') || action.includes('SUSPENDED') || action.includes('DELETED')) {
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
      };
    }
    if (action.includes('ONBOARDED') || action.includes('CREATED') || action.includes('ACTIVE')) {
      return {
        bg: 'bg-[#E8F8F0] text-[#16A34A] border-[#D1F2E0]',
        dot: 'bg-[#16A34A]',
      };
    }
    if (action.includes('STATUS') || action.includes('UPDATED') || action.includes('ROLE')) {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
      };
    }
    return {
      bg: 'bg-blue-50 text-[#0274BB] border-blue-200',
      dot: 'bg-[#0274BB]',
    };
  };

  const tenantCount = useMemo(
    () => logs.filter((l) => l.action.includes('TENANT') || l.action.includes('ORGANIZATION')).length,
    [logs]
  );
  const userCount = useMemo(
    () => logs.filter((l) => l.action.includes('USER') || l.action.includes('ROLE') || l.action.includes('PERMISSION')).length,
    [logs]
  );

  return (
    <div className="space-y-5">
      {/* 1. Command Center Top Header Banner matching Tenant Directory */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-[#0274BB] flex items-center justify-center text-white shadow-sm shrink-0">
            <FileText className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              Platform Audit Trail
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Chronological, tamper-evident security audit log of platform operations ({logs.length} Events Logged)
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

      {/* 2. Filter & Search Toolbar matching Tenant Directory */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="size-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by actor email, event action, reason, reference ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition-all shadow-xs"
          />
        </div>

        {/* Filter Pills and Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('ALL');
              setPage(1);
            }}
            className={cn(
              'px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer select-none',
              categoryFilter === 'ALL'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            All ({logs.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoryFilter('TENANT');
              setPage(1);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer select-none',
              categoryFilter === 'TENANT'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <Layers className="size-4 text-slate-400" />
            Tenants ({tenantCount})
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoryFilter('USER');
              setPage(1);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer select-none',
              categoryFilter === 'USER'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <ShieldCheck className="size-4 text-slate-400" />
            Users &amp; Roles ({userCount})
          </button>

          {/* Dynamic Action Selector (Zero Hardcoding) */}
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB]"
          >
            <option value="ALL">All Event Actions</option>
            {dynamicActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>

          {/* Items Per Page */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-10 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB]"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>

      {/* 3. Table Container matching Tenant Directory */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="px-5 py-3.5 whitespace-nowrap">Timestamp</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Governance Actor</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Action Type</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Target / Reference</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Reason &amp; Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                <TableBodySkeleton rows={6} columns={5} hasAvatar={false} actionCol={false} />
              </tbody>
            </table>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-600 text-sm">
            Error loading audit trail: {(error as Error).message}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-3">
            <FileText className="size-12 text-slate-300" />
            <div className="text-base font-bold text-slate-800">No Audit Records Found</div>
            <p className="text-xs text-slate-500 max-w-sm">
              {search || selectedAction !== 'ALL' || categoryFilter !== 'ALL'
                ? 'No events match your current filter parameters.'
                : 'No platform audit events logged yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="px-5 py-3.5 whitespace-nowrap">Timestamp</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Governance Actor</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Action Type</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Target / Reference</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Reason &amp; Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {paginatedLogs.map((log, idx) => {
                  const palette = AVATAR_PALETTES[idx % AVATAR_PALETTES.length];
                  const badge = getActionBadgeStyle(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* TIMESTAMP */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 font-mono">
                            <Clock className="size-3.5 text-slate-400" />
                            <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono ml-5">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>

                      {/* GOVERNANCE ACTOR */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'size-9 rounded-lg flex items-center justify-center border shrink-0',
                              palette.bg,
                              palette.text,
                              palette.border
                            )}
                          >
                            <User className="size-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 text-xs font-mono leading-tight block">
                              {log.actorEmail || 'System Automated'}
                            </span>
                            <span className="inline-block font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 mt-1 whitespace-nowrap">
                              {log.actorRole || 'SYSTEM'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* ACTION TYPE */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap',
                            badge.bg
                          )}
                        >
                          <span className={cn('size-1.5 rounded-full', badge.dot)} />
                          <span>{log.action}</span>
                        </span>
                      </td>

                      {/* TARGET / REFERENCE */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {log.referenceId ? (
                          <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {log.referenceId.length > 16
                              ? `${log.referenceId.slice(0, 8)}...${log.referenceId.slice(-6)}`
                              : log.referenceId}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* REASON & REMARKS */}
                      <td className="px-5 py-4 text-xs text-slate-700 max-w-md">
                        <div className="font-medium text-slate-800 line-clamp-2">
                          {log.reason || 'System operational event executed successfully.'}
                        </div>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="mt-1 text-[11px] font-mono text-slate-400 truncate max-w-sm" title={JSON.stringify(log.metadata)}>
                            {JSON.stringify(log.metadata)}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Numbered Pagination Bar matching Tenant Directory */}
        {!isLoading && filteredLogs.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200 bg-[#F8FAFC] text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(startIndex + pageSize, filteredLogs.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{filteredLogs.length}</span> audit events
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={validPage <= 1}
                className="p-1 rounded border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="size-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - validPage) <= 1)
                .map((pageNum, i, arr) => {
                  const prevPage = arr[i - 1];
                  const showEllipsis = prevPage && pageNum - prevPage > 1;
                  return (
                    <React.Fragment key={pageNum}>
                      {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                      <button
                        type="button"
                        onClick={() => setPage(pageNum)}
                        className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${
                          validPage === pageNum
                            ? 'bg-[#0274BB] text-white'
                            : 'border border-slate-200 hover:bg-white text-slate-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={validPage >= totalPages}
                className="p-1 rounded border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
