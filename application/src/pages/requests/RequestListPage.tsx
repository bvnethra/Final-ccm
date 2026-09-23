// application/src/pages/requests/RequestListPage.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCalibrationRequests } from '../../hooks/useOperations';
import { Button } from '../../components/ui/UIPrimitives';
import {
  Plus,
  ArrowRight,
  Clock,
  ClipboardList,
  Search,
  ChevronRight,
  MoreVertical,
  Zap,
  Building2,
  Calendar,
  Layers,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

const AVATAR_PALETTES = [
  { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
];

export const RequestListPage: React.FC = () => {
  const { canPerform, isSuperAdmin } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { data: allRequests = [], isLoading } = useCalibrationRequests();

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
          req.status?.toLowerCase().includes(q) ||
          req.priority?.toLowerCase().includes(q) ||
          req.request_items?.some((item) =>
            item.item_masters?.item_name?.toLowerCase().includes(q) ||
            item.item_masters?.item_code?.toLowerCase().includes(q)
          );
        if (!matches) return false;
      }

      return true;
    });
  }, [allRequests, searchQuery, statusFilter]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const pagedRequests = filteredRequests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 3-dots action menu handler
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setOpenActionId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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
    <div className="space-y-5">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-[#0274BB] flex items-center justify-center text-white shadow-sm shrink-0">
            <ClipboardList className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              Equipment Inward Requests
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Lifecycle Process 1: Equipment Inward &amp; Inspection Registration ({totalCount} Registered)
            </p>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs font-semibold text-[#0274BB] tracking-wide">
            Intake • Inspect • Track
          </span>
          <div className="h-0.5 w-7 bg-[#0274BB] mt-1 rounded-full" />
        </div>
      </div>

      {/* Filter and Search Bar */}
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

        {/* Filter Buttons & Actions */}
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

          {(isSuperAdmin || canPerform('CREATE_REQUEST', 'CREATE')) && (
            <Link to="/requests/new">
              <Button className="bg-[#0274BB] hover:bg-[#02629e] text-white font-medium px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm shadow-xs transition-all cursor-pointer">
                <Plus className="size-4" /> New Inward Request
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
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
              <div className="text-2xl font-bold text-slate-900 leading-none">{totalCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Total Requests</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-purple-400" />
        </div>

        {/* Card 2: Verified & Ready */}
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
              <div className="text-2xl font-bold text-slate-900 leading-none">{verifiedCount}</div>
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
              <div className="text-2xl font-bold text-slate-900 leading-none">{pendingCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Pending Verification</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-slate-400" />
        </div>

        {/* Card 4: Urgent Priorities */}
        <div
          onClick={() => setStatusFilter('URGENT')}
          className={cn(
            'bg-[#F0F7FF] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
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
              <div className="text-2xl font-bold text-slate-900 leading-none">{urgentCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Urgent Requests</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-[#0274BB]/60" />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
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
                <th className="px-5 py-3.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <div className="size-7 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">Loading inward requests...</span>
                    </div>
                  </td>
                </tr>
              ) : pagedRequests.length === 0 ? (
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
                pagedRequests.map((req, index) => {
                  const palette = AVATAR_PALETTES[index % AVATAR_PALETTES.length];
                  const isActionMenuOpen = openActionId === req.id;
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
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3 text-slate-400 shrink-0" />
                            <span>Created:</span>
                          </div>
                          <div className="text-slate-600 ml-4 font-mono text-[11px]">
                            {new Date(req.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4 text-right relative whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 justify-end">
                          {req.status === 'CREATED' ? (
                            <Link to={`/lab/verification/${req.id}`}>
                              <button
                                type="button"
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-[#0274BB] hover:bg-blue-100 border border-blue-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                Inspect <ArrowRight className="size-3" />
                              </button>
                            </Link>
                          ) : req.status === 'VERIFIED' ? (
                            <Link to={`/lab/calibration/${req.id}`}>
                              <button
                                type="button"
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                Calibrate <ArrowRight className="size-3" />
                              </button>
                            </Link>
                          ) : null}

                          <div className="inline-block">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionId(isActionMenuOpen ? null : req.id);
                              }}
                              className="size-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
                              title="Actions"
                            >
                              <MoreVertical className="size-4" />
                            </button>

                            {isActionMenuOpen && (
                              <div
                                ref={actionMenuRef}
                                className="absolute right-5 top-12 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 text-left"
                              >
                                <Link
                                  to={`/requests/${req.id}`}
                                  onClick={() => setOpenActionId(null)}
                                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0274BB] transition-colors"
                                >
                                  <Eye className="size-3.5 text-slate-400" /> View Full Request
                                </Link>

                                {req.status === 'CREATED' && (
                                  <Link
                                    to={`/lab/verification/${req.id}`}
                                    onClick={() => setOpenActionId(null)}
                                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0274BB] transition-colors"
                                  >
                                    <CheckCircle2 className="size-3.5 text-cyan-600" /> Lab Verification
                                  </Link>
                                )}

                                {req.status === 'VERIFIED' && (
                                  <Link
                                    to={`/lab/calibration/${req.id}`}
                                    onClick={() => setOpenActionId(null)}
                                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0274BB] transition-colors"
                                  >
                                    <ArrowRight className="size-3.5 text-emerald-600" /> Perform Calibration
                                  </Link>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-white border-t border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-800">
              {filteredRequests.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            –{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(currentPage * pageSize, filteredRequests.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-800">{filteredRequests.length}</span> requests
          </div>

          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="size-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              ‹
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    'size-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer',
                    currentPage === pageNum
                      ? 'bg-[#0274BB] text-white shadow-xs'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {pageNum}
                </button>
              );
            })}

            {totalPages > 5 && (
              <>
                <span className="px-1 text-slate-400">…</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  className={cn(
                    'size-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer',
                    currentPage === totalPages
                      ? 'bg-[#0274BB] text-white shadow-xs'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="size-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestListPage;
