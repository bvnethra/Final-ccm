// application/src/pages/DashboardPage.tsx
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCalibrationRequests } from '../hooks/useOperations';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/UIPrimitives';
import {
  ClipboardList,
  FlaskConical,
  Plus,
  Search,
  ChevronRight,
  Zap,
  Building2,
  Calendar,
  Layers,
  Clock,
  ArrowRight,
  LayoutDashboard,
} from 'lucide-react';
import { TableBodySkeleton } from '../components/ui/Skeleton';
import { cn } from '../lib/utils';

const AVATAR_PALETTES = [
  { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
];

export const DashboardPage: React.FC = () => {
  const { user, canPerform, isSuperAdmin } = useAuthContext();
  const { data: allRequests = [], isLoading } = useCalibrationRequests();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Dynamic live metric calculations (zero hardcoding)
  const totalCount = allRequests.length;
  const verifiedCount = useMemo(
    () => allRequests.filter((r) => r.status === 'VERIFIED').length,
    [allRequests]
  );
  const pendingCount = useMemo(
    () => allRequests.filter((r) => r.status === 'CREATED').length,
    [allRequests]
  );
  const urgentCount = useMemo(
    () => allRequests.filter((r) => r.priority === 'URGENT').length,
    [allRequests]
  );

  // Client-side filtering for immediate responsiveness
  const filteredRequests = useMemo(() => {
    return allRequests.filter((req) => {
      // Filter by status/metric
      if (statusFilter === 'CREATED' && req.status !== 'CREATED') return false;
      if (statusFilter === 'VERIFIED' && req.status !== 'VERIFIED') return false;
      if (statusFilter === 'CALIBRATED' && req.status !== 'CALIBRATED') return false;
      if (statusFilter === 'URGENT' && req.priority !== 'URGENT') return false;
      if (statusFilter === 'NORMAL' && req.priority !== 'NORMAL') return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          req.request_number?.toLowerCase().includes(q) ||
          req.clients?.client_name?.toLowerCase().includes(q) ||
          req.clients?.client_code?.toLowerCase().includes(q) ||
          req.status?.toLowerCase().includes(q) ||
          req.priority?.toLowerCase().includes(q) ||
          req.request_items?.some(
            (item) =>
              item.item_masters?.item_name?.toLowerCase().includes(q) ||
              item.item_masters?.item_code?.toLowerCase().includes(q)
          );
        if (!matches) return false;
      }

      return true;
    });
  }, [allRequests, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CREATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0274BB] border border-blue-200 whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-[#0274BB]" /> INWARD CREATED
          </span>
        );
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-cyan-600" /> VERIFIED
          </span>
        );
      case 'CALIBRATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F8F0] text-[#16A34A] border border-[#D1F2E0] whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-[#16A34A]" /> CALIBRATED
          </span>
        );
      case 'QUOTATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-amber-500" /> QUOTATION
          </span>
        );
      case 'PARTIALLY_INVOICED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-amber-500" /> PARTIAL INVOICE
          </span>
        );
      case 'INVOICED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F8F0] text-[#16A34A] border border-[#D1F2E0] whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-[#16A34A]" /> INVOICED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F8F0] text-[#16A34A] border border-[#D1F2E0] whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-[#16A34A]" /> COMPLETED
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-purple-600" /> DISPATCHED
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

  return (
    <div className="space-y-6">
      {/* Top Header Banner matching Inward Request UI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-[#0274BB] flex items-center justify-center text-white shadow-sm shrink-0">
            <LayoutDashboard className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              Calibration Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Enterprise Metrology &amp; Operations Pipeline • Welcome, {user?.fullName || 'Operator'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(isSuperAdmin || canPerform('CREATE_REQUEST', 'CREATE')) && (
            <Link to="/requests/new">
              <Button className="bg-[#0274BB] hover:bg-[#02629e] text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 text-sm shadow-xs transition-all cursor-pointer">
                <Plus className="size-4" /> New Inward Request
              </Button>
            </Link>
          )}
          <Link to="/lab/queue">
            <Button
              variant="outline"
              className="border-slate-200 text-slate-700 hover:bg-slate-50 font-medium px-4 py-2 rounded-lg flex items-center gap-2 text-sm shadow-xs transition-all"
            >
              <FlaskConical className="size-4" /> Lab Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar matching Inward Request UI */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="size-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by request #, client name, item, serial #, status..."
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
            All
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('URGENT')}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
              statusFilter === 'URGENT'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                statusFilter === 'URGENT' ? 'bg-white' : 'bg-amber-500'
              )}
            />
            Urgent
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('CREATED')}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
              statusFilter === 'CREATED'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                statusFilter === 'CREATED' ? 'bg-white' : 'bg-blue-500'
              )}
            />
            Pending Verify
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('VERIFIED')}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
              statusFilter === 'VERIFIED'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                statusFilter === 'VERIFIED' ? 'bg-white' : 'bg-emerald-500'
              )}
            />
            Verified
          </button>
        </div>
      </div>

      {/* 4 Stat Metric Cards matching Inward Request UI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Inward Requests */}
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
              <ClipboardList className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">
                {isLoading ? '—' : totalCount}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">Total Requests</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-purple-400" />
        </div>

        {/* Card 2: Verified & Ready in Lab */}
        <div
          onClick={() => setStatusFilter('VERIFIED')}
          className={cn(
            'bg-[#F0FDF4] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            statusFilter === 'VERIFIED'
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
                {isLoading ? '—' : verifiedCount}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">Verified in Lab</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-emerald-400" />
        </div>

        {/* Card 3: Pending Verification */}
        <div
          onClick={() => setStatusFilter('CREATED')}
          className={cn(
            'bg-[#F8FAFC] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            statusFilter === 'CREATED'
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
              <div className="text-xs text-slate-500 font-medium mt-1">Pending Verification</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-slate-400" />
        </div>

        {/* Card 4: Urgent Requests */}
        <div
          onClick={() => setStatusFilter('URGENT')}
          className={cn(
            'bg-[#EFF6FF] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            statusFilter === 'URGENT'
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
                {isLoading ? '—' : urgentCount}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">Urgent Requests</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-blue-400" />
        </div>
      </div>

      {/* Inward Requests Pipeline Table matching Inward Request UI */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Active Calibration Pipeline
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
              {filteredRequests.length} Work Orders
            </span>
          </div>
          <Link
            to="/requests"
            className="text-xs font-semibold text-[#0274BB] hover:underline flex items-center gap-1"
          >
            View Full Inward Ledger <ArrowRight className="size-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">Request Info</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Client Account</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Collection Date</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Scope &amp; Instruments</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Priority</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Lifecycle Status</th>
                <th className="px-5 py-3.5 whitespace-nowrap">System Audit</th>
                <th className="px-5 py-3.5 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <TableBodySkeleton rows={6} columns={8} hasAvatar avatarShape="square" />
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <ClipboardList className="size-6" />
                      </div>
                      <h3 className="font-semibold text-base text-slate-900">No Inward Requests Found</h3>
                      <p className="text-xs text-slate-500">
                        {searchQuery
                          ? 'No matching requests found for your search/filter criteria.'
                          : 'No calibration intake requests registered yet.'}
                      </p>
                      {(isSuperAdmin || canPerform('CREATE_REQUEST', 'CREATE')) && (
                        <Link to="/requests/new">
                          <Button variant="secondary" size="sm" className="mt-2">
                            <Plus className="size-3.5" /> Register Inward Request
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req, index) => {
                  const palette = AVATAR_PALETTES[index % AVATAR_PALETTES.length];
                  const itemCount = req.request_items?.length || 0;

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* REQUEST INFO */}
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
                            <ClipboardList className="size-5" />
                          </div>
                          <div>
                            <Link
                              to={`/requests/${req.id}`}
                              className="font-semibold text-slate-900 text-sm hover:text-[#0274BB] transition-colors leading-tight line-clamp-1"
                              title={req.request_number}
                            >
                              {req.request_number}
                            </Link>
                            <span className="inline-block font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#0274BB] border border-blue-200 mt-1 whitespace-nowrap">
                              {req.clients?.client_code || 'CLIENT'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* CLIENT ACCOUNT */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                            <Building2 className="size-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[170px]">
                              {req.clients?.client_name || 'Direct Enterprise Client'}
                            </span>
                          </div>
                          {req.clients?.city && (
                            <div className="text-xs text-slate-500 ml-5">
                              {req.clients.city}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* COLLECTION DATE */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-slate-400 shrink-0" />
                          <span>{new Date(req.collection_date).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* SCOPE & INSTRUMENTS */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium border border-slate-200">
                          <Layers className="size-3 text-slate-500" />
                          <span>{itemCount} {itemCount === 1 ? 'Instrument' : 'Instruments'}</span>
                        </span>
                      </td>

                      {/* PRIORITY */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {req.priority === 'URGENT' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                            <Zap className="size-3 text-amber-600" /> URGENT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                            NORMAL
                          </span>
                        )}
                      </td>

                      {/* LIFECYCLE STATUS */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {getStatusBadge(req.status)}
                      </td>

                      {/* SYSTEM AUDIT */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="size-3.5 text-slate-400" />
                          <span>Created: {new Date(req.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {req.status === 'CREATED' ? (
                          <Link to={`/lab/verification/${req.id}`}>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-xs h-8 px-3 rounded-lg border-blue-200 text-[#0274BB] hover:bg-blue-50 font-medium"
                            >
                              Inspect
                            </Button>
                          </Link>
                        ) : req.status === 'VERIFIED' ? (
                          <Link to={`/lab/calibration/${req.id}`}>
                            <Button
                              variant="primary"
                              size="sm"
                              className="text-xs h-8 px-3 rounded-lg bg-[#0274BB] hover:bg-[#003B8C] text-white font-medium"
                            >
                              Calibrate
                            </Button>
                          </Link>
                        ) : (
                          <Link to={`/requests/${req.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8 px-3 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                            >
                              View
                            </Button>
                          </Link>
                        )}
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
};

export default DashboardPage;
