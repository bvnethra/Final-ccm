// application/src/pages/lab/LabQueuePage.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCalibrationRequests, useUpdateItemStatus } from '../../hooks/useOperations';
import { useAuthContext } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/UIPrimitives';
import type { RequestAttachment } from '../../types/domain';
import {
  FlaskConical,
  Paperclip,
  Zap,
  Clock,
  Eye,
  X,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Download,
  Calendar,
  Search,
  ChevronRight,
  MoreVertical,
  Building2,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Ban,
} from 'lucide-react';
import { cn } from '../../lib/utils';

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function getFileIcon(type: string, name: string) {
  const lowerName = name.toLowerCase();
  if (type.startsWith('image/') || lowerName.match(/\.(png|jpg|jpeg|webp)$/)) {
    return <ImageIcon className="size-5 text-[#0274BB] shrink-0" />;
  }
  if (type.includes('pdf') || lowerName.endsWith('.pdf')) {
    return <FileText className="size-5 text-[#DC2626] shrink-0" />;
  }
  if (type.includes('sheet') || lowerName.match(/\.(xlsx|xls|csv)$/)) {
    return <FileSpreadsheet className="size-5 text-[#16A34A] shrink-0" />;
  }
  return <FileText className="size-5 text-slate-500 shrink-0" />;
}

const AVATAR_PALETTES = [
  { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
];

export const LabQueuePage: React.FC = () => {
  const { tenantId, organizationId } = useAuthContext();
  const [activeStageTab, setActiveStageTab] = useState<string>('LAB_ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'URGENT' | 'NORMAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequestAttachments, setSelectedRequestAttachments] = useState<{
    requestNumber: string;
    clientName?: string;
    attachments: RequestAttachment[];
  } | null>(null);

  // Not Serviceable state
  const [notServiceableTarget, setNotServiceableTarget] = useState<{
    requestId: string;
    itemId: string;
    itemName: string;
  } | null>(null);
  const [notServiceableReason, setNotServiceableReason] = useState('');
  const updateItemStatusMutation = useUpdateItemStatus();

  const { data: allRequests = [], isLoading } = useCalibrationRequests();

  // Dynamic live metric calculations (zero hardcoding)
  const totalLabCount = useMemo(
    () =>
      allRequests.filter((r) =>
        [
          'CREATED',
          'VERIFIED',
          'CALIBRATING',
          'CALIBRATED',
          'FAULTY',
          'REPAIR_IN_PROGRESS',
          'OUTSOURCED',
          'OUTSOURCE_RETURNED',
          'QUOTATION',
        ].includes(r.status)
      ).length,
    [allRequests]
  );

  const calibratedCount = useMemo(
    () =>
      allRequests.filter((r) =>
        ['CALIBRATED', 'QUOTATION', 'APPROVED', 'INVOICED', 'COMPLETED'].includes(r.status)
      ).length,
    [allRequests]
  );

  const pendingVerifyCount = useMemo(
    () => allRequests.filter((r) => r.status === 'CREATED').length,
    [allRequests]
  );

  const urgentCount = useMemo(
    () =>
      allRequests.filter(
        (r) =>
          r.priority === 'URGENT' &&
          ['CREATED', 'VERIFIED', 'FAULTY', 'REPAIR_IN_PROGRESS', 'CALIBRATING'].includes(r.status)
      ).length,
    [allRequests]
  );

  // Filter by stage, priority, and search query
  const filteredLabQueue = useMemo(() => {
    let result = allRequests.filter((r) => {
      if (activeStageTab === 'LAB_ALL')
        return [
          'CREATED',
          'VERIFIED',
          'CALIBRATING',
          'CALIBRATED',
          'FAULTY',
          'REPAIR_IN_PROGRESS',
          'OUTSOURCED',
          'OUTSOURCE_RETURNED',
          'QUOTATION',
        ].includes(r.status);
      if (activeStageTab === 'PENDING_VERIFY') return r.status === 'CREATED';
      if (activeStageTab === 'PENDING_CALIBRATE') return r.status === 'VERIFIED';
      if (activeStageTab === 'IN_REPAIR')
        return r.status === 'FAULTY' || r.status === 'REPAIR_IN_PROGRESS';
      if (activeStageTab === 'OUTSOURCED')
        return r.status === 'OUTSOURCED' || r.status === 'OUTSOURCE_RETURNED';
      if (activeStageTab === 'CALIBRATED')
        return ['CALIBRATED', 'QUOTATION', 'APPROVED', 'INVOICED'].includes(r.status);
      return true;
    });

    if (priorityFilter !== 'ALL') {
      result = result.filter((r) => r.priority === priorityFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.request_number?.toLowerCase().includes(q) ||
          r.clients?.client_name?.toLowerCase().includes(q) ||
          r.status?.toLowerCase().includes(q) ||
          r.request_items?.some((it) =>
            it.item_masters?.item_name?.toLowerCase().includes(q) ||
            it.item_masters?.item_code?.toLowerCase().includes(q)
          )
      );
    }

    // Sort: URGENT first, then FIFO by collection date
    return result.sort((a, b) => {
      if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
      if (a.priority !== 'URGENT' && b.priority === 'URGENT') return 1;
      return new Date(a.collection_date).getTime() - new Date(b.collection_date).getTime();
    });
  }, [allRequests, activeStageTab, priorityFilter, searchQuery]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredLabQueue.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeStageTab, priorityFilter]);

  const pagedLabQueue = filteredLabQueue.slice(
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

  return (
    <div className="space-y-5">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-[#0274BB] flex items-center justify-center text-white shadow-sm shrink-0">
            <FlaskConical className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                Lab &amp; Calibration Queue
              </h1>
              {urgentCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                  <Zap className="size-3" /> {urgentCount} Urgent
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Step 6 &amp; 7: Metrology Testing, Inspection &amp; Calibration Workstation ({totalLabCount} in Queue)
            </p>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs font-semibold text-[#0274BB] tracking-wide">
            Verify • Test • Certify
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
            placeholder="Search by request #, client name, instrument, serial #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition-all shadow-xs"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveStageTab('LAB_ALL')}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              activeStageTab === 'LAB_ALL'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            All Orders
          </button>

          <button
            type="button"
            onClick={() => setActiveStageTab('PENDING_VERIFY')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              activeStageTab === 'PENDING_VERIFY'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                activeStageTab === 'PENDING_VERIFY' ? 'bg-white' : 'bg-cyan-500'
              )}
            />
            Verification
          </button>

          <button
            type="button"
            onClick={() => setActiveStageTab('PENDING_CALIBRATE')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              activeStageTab === 'PENDING_CALIBRATE'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                activeStageTab === 'PENDING_CALIBRATE' ? 'bg-white' : 'bg-[#0274BB]'
              )}
            />
            Calibration
          </button>

          <button
            type="button"
            onClick={() => setActiveStageTab('IN_REPAIR')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              activeStageTab === 'IN_REPAIR'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                activeStageTab === 'IN_REPAIR' ? 'bg-white' : 'bg-amber-500'
              )}
            />
            Repair
          </button>

          <button
            type="button"
            onClick={() => setActiveStageTab('OUTSOURCED')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              activeStageTab === 'OUTSOURCED'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                activeStageTab === 'OUTSOURCED' ? 'bg-white' : 'bg-purple-500'
              )}
            />
            Outsource PO
          </button>

          <button
            type="button"
            onClick={() => setPriorityFilter(priorityFilter === 'URGENT' ? 'ALL' : 'URGENT')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border',
              priorityFilter === 'URGENT'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
            )}
          >
            <Zap className="size-3" /> Urgent Only
          </button>
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Lab Queue */}
        <div
          onClick={() => {
            setActiveStageTab('LAB_ALL');
            setPriorityFilter('ALL');
          }}
          className={cn(
            'bg-[#F8F6FF] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            activeStageTab === 'LAB_ALL' && priorityFilter === 'ALL'
              ? 'border-purple-300 ring-2 ring-purple-400/20'
              : 'border-purple-100 hover:border-purple-200'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <FlaskConical className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{totalLabCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Total Lab Queue</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-purple-400" />
        </div>

        {/* Card 2: Calibrated & Passed */}
        <div
          onClick={() => { setActiveStageTab('CALIBRATED'); setPriorityFilter('ALL'); }}
          className={cn(
            'bg-[#F0FDF4] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            activeStageTab === 'CALIBRATED'
              ? 'border-emerald-300 ring-2 ring-emerald-400/20'
              : 'border-emerald-100 hover:border-emerald-200'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <span className="size-3 rounded-full bg-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{calibratedCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Calibrated / Passed</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-emerald-400" />
        </div>

        {/* Card 3: Pending Verification */}
        <div
          onClick={() => { setActiveStageTab('PENDING_VERIFY'); setPriorityFilter('ALL'); }}
          className={cn(
            'bg-[#F8FAFC] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            activeStageTab === 'PENDING_VERIFY'
              ? 'border-slate-300 ring-2 ring-slate-400/20'
              : 'border-slate-200 hover:border-slate-300'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <span className="size-3 rounded-full bg-slate-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{pendingVerifyCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Pending Verification</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-slate-400" />
        </div>

        {/* Card 4: Urgent Lab Priorities */}
        <div
          onClick={() => { setActiveStageTab('LAB_ALL'); setPriorityFilter('URGENT'); }}
          className={cn(
            'bg-[#F0F7FF] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            priorityFilter === 'URGENT'
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
              <div className="text-xs text-slate-500 font-medium mt-1">Urgent (24-48H)</div>
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
                <th className="px-5 py-3.5 whitespace-nowrap">Lab Job / Request</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Client Account</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Inward Scope</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Proof &amp; Docs</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Priority / SLA</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Current Stage</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Collection Date</th>
                <th className="px-5 py-3.5 text-right whitespace-nowrap">Lab Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <div className="size-7 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">Loading lab queue orders...</span>
                    </div>
                  </td>
                </tr>
              ) : pagedLabQueue.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <FlaskConical className="size-6" />
                      </div>
                      <h3 className="font-semibold text-base text-slate-900">No Work Orders Found</h3>
                      <p className="text-xs text-slate-500">
                        All received customer equipment in this filter has completed calibration.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedLabQueue.map((req, index) => {
                  const palette = AVATAR_PALETTES[index % AVATAR_PALETTES.length];
                  const isUrgent = req.priority === 'URGENT';
                  const hasAttachments = req.attachments && req.attachments.length > 0;
                  const totalUnits = req.request_items?.reduce((sum, it) => sum + (it.quantity || 0), 0) || 0;

                  return (
                    <tr
                      key={req.id}
                      className={cn(
                        'hover:bg-slate-50/70 transition-colors group',
                        isUrgent && 'bg-rose-50/20'
                      )}
                    >
                      {/* LAB JOB / REQUEST */}
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
                            <FlaskConical className="size-5" />
                          </div>
                          <div>
                            <Link
                              to={`/requests/${req.id}`}
                              className="font-semibold text-slate-900 text-sm hover:text-[#0274BB] transition-colors leading-tight line-clamp-1"
                              title={req.request_number}
                            >
                              {req.request_number}
                            </Link>
                            {req.client_po_ref ? (
                              <span className="inline-block text-[11px] text-slate-500 font-mono mt-0.5">
                                PO: {req.client_po_ref}
                              </span>
                            ) : (
                              <span className="inline-block font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#0274BB] border border-blue-200 mt-1 whitespace-nowrap">
                                {req.clients?.client_code || 'JOB'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* CLIENT ACCOUNT */}
                      <td className="px-5 py-4">
                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[170px]">
                            {req.clients?.client_name || 'Direct Client'}
                          </span>
                        </div>
                        {req.clients?.city && (
                          <div className="text-xs text-slate-500 ml-5 mt-0.5">
                            {req.clients.city}
                          </div>
                        )}
                      </td>

                      {/* INWARD SCOPE */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium border border-slate-200">
                          <Layers className="size-3 text-slate-500" />
                          <span>{totalUnits} {totalUnits === 1 ? 'Unit' : 'Units'}</span>
                        </span>
                        <div className="text-[11px] text-slate-500 truncate max-w-[170px] mt-1">
                          {req.request_items?.map((it) => it.item_masters?.item_name || 'Gauge').join(', ')}
                        </div>
                      </td>

                      {/* PROOF & ATTACHMENTS */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {hasAttachments ? (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedRequestAttachments({
                                requestNumber: req.request_number,
                                clientName: req.clients?.client_name,
                                attachments: req.attachments!,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-[#0274BB] transition-colors cursor-pointer border border-blue-200"
                          >
                            <Paperclip className="size-3.5" />
                            <span>{req.attachments!.length} Proof(s)</span>
                            <Eye className="size-3 text-[#0274BB]" />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No proof</span>
                        )}
                      </td>

                      {/* PRIORITY / SLA */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isUrgent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 whitespace-nowrap">
                            <Zap className="size-3 text-rose-600" /> URGENT (24H)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                            <Clock className="size-3 text-slate-400" /> NORMAL (5D)
                          </span>
                        )}
                      </td>

                      {/* CURRENT STAGE */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {req.status === 'CREATED' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0274BB] border border-blue-200 whitespace-nowrap">
                            <span className="size-1.5 rounded-full bg-[#0274BB]" /> PENDING VERIFICATION
                          </span>
                        ) : req.status === 'VERIFIED' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 whitespace-nowrap">
                            <span className="size-1.5 rounded-full bg-cyan-600" /> CALIBRATION READY
                          </span>
                        ) : req.status === 'CALIBRATED' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F8F0] text-[#16A34A] border border-[#D1F2E0] whitespace-nowrap">
                            <span className="size-1.5 rounded-full bg-[#16A34A]" /> CERTIFIED
                          </span>
                        ) : req.status === 'OUTSOURCED' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
                            <span className="size-1.5 rounded-full bg-purple-600" /> OUTSOURCED
                          </span>
                        ) : req.status === 'FAULTY' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                            <span className="size-1.5 rounded-full bg-rose-600" /> REPAIR / REJECTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                            <span className="size-1.5 rounded-full bg-slate-400" /> {req.status}
                          </span>
                        )}
                      </td>

                      {/* COLLECTION DATE */}
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3 text-slate-400 shrink-0" />
                          <span>{new Date(req.collection_date).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* LAB ACTION */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 justify-end">
                          {req.status === 'CREATED' ? (
                            <Link to={`/lab/verification/${req.id}`}>
                              <button
                                type="button"
                                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-[#0274BB] hover:bg-blue-100 border border-blue-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                Verify <ArrowRight className="size-3" />
                              </button>
                            </Link>
                          ) : req.status === 'VERIFIED' ? (
                            <Link to={`/lab/calibration/${req.id}`}>
                              <button
                                type="button"
                                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                Calibrate <ArrowRight className="size-3" />
                              </button>
                            </Link>
                          ) : req.status === 'FAULTY' || req.status === 'OUTSOURCED' ? (
                            <Link to={`/lab/routing/${req.id}`}>
                              <button
                                type="button"
                                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                Routing <ArrowRight className="size-3" />
                              </button>
                            </Link>
                          ) : (
                            <Link to={`/requests/${req.id}`}>
                              <button
                                type="button"
                                className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                              >
                                View
                              </button>
                            </Link>
                          )}

                          <div className="inline-block">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionId(openActionId === req.id ? null : req.id);
                              }}
                              className="size-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
                              title="Actions"
                            >
                              <MoreVertical className="size-4" />
                            </button>

                            {openActionId === req.id && (
                              <div
                                ref={actionMenuRef}
                                className="absolute right-5 top-12 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 text-left"
                              >
                                <Link
                                  to={`/requests/${req.id}`}
                                  onClick={() => setOpenActionId(null)}
                                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0274BB] transition-colors"
                                >
                                  <Eye className="size-3.5 text-slate-400" /> Full Work Order
                                </Link>

                                <Link
                                  to={`/lab/verification/${req.id}`}
                                  onClick={() => setOpenActionId(null)}
                                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0274BB] transition-colors"
                                >
                                  <CheckCircle2 className="size-3.5 text-cyan-600" /> Verification Form
                                </Link>

                                <Link
                                  to={`/lab/calibration/${req.id}`}
                                  onClick={() => setOpenActionId(null)}
                                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0274BB] transition-colors"
                                >
                                  <ArrowRight className="size-3.5 text-emerald-600" /> Calibration Sheet
                                </Link>

                                {/* Mark as Not Serviceable — for any item that can't be calibrated */}
                                <div className="border-t border-slate-100 my-0.5" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const firstItem = req.request_items?.[0];
                                    setNotServiceableTarget({
                                      requestId: req.id,
                                      itemId: firstItem?.id || req.id,
                                      itemName: firstItem?.item_masters?.item_name || req.request_number,
                                    });
                                    setNotServiceableReason('');
                                    setOpenActionId(null);
                                  }}
                                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors w-full text-left"
                                >
                                  <Ban className="size-3.5 text-rose-500" /> Mark as Not Serviceable
                                </button>
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
              {filteredLabQueue.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            –{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(currentPage * pageSize, filteredLabQueue.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-800">{filteredLabQueue.length}</span> work orders
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

      {/* Attachments Modal Dialog */}
      {selectedRequestAttachments && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Inspection Documents &amp; Proofs
                </h3>
                <p className="text-xs text-slate-500">
                  Request {selectedRequestAttachments.requestNumber} — {selectedRequestAttachments.clientName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequestAttachments(null)}
                className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto divide-y divide-slate-100">
              {selectedRequestAttachments.attachments.map((att) => (
                <div key={att.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {getFileIcon(att.type, att.name)}
                    <div>
                      <div className="text-xs font-semibold text-slate-800 line-clamp-1">
                        {att.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatBytes(att.size)} • {new Date(att.uploaded_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <a
                    href={att.url || att.base64Data || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#0274BB] hover:bg-blue-50 transition-colors"
                    title="Download / View Attachment"
                  >
                    <Download className="size-4" />
                  </a>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <Button
                variant="outlineInk"
                size="sm"
                onClick={() => setSelectedRequestAttachments(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Not Serviceable Confirmation Overlay */}
      {notServiceableTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-rose-200 overflow-hidden">
            <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center gap-3">
              <div className="size-9 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-rose-900 text-sm">Mark as Not Serviceable</h3>
                <p className="text-xs text-rose-600 mt-0.5">
                  {notServiceableTarget.itemName}
                </p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-600">
                This will change the item status to <strong>NOT_SERVICEABLE</strong> and record a reason. This action can be undone by a supervisor.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason / Technician Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={notServiceableReason}
                  onChange={(e) => setNotServiceableReason(e.target.value)}
                  placeholder="e.g. Instrument is beyond repair, damaged beyond calibration range..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 resize-none"
                />
              </div>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <Button
                variant="outlineInk"
                size="sm"
                onClick={() => setNotServiceableTarget(null)}
              >
                Cancel
              </Button>
              <button
                type="button"
                disabled={!notServiceableReason.trim() || updateItemStatusMutation.isPending}
                onClick={async () => {
                  if (!notServiceableReason.trim() || !tenantId || !organizationId) return;
                  await updateItemStatusMutation.mutateAsync({
                    tenantId,
                    organizationId,
                    requestId: notServiceableTarget.requestId,
                    itemId: notServiceableTarget.itemId,
                    status: 'NOT_SERVICEABLE',
                    reason: notServiceableReason.trim(),
                  });
                  setNotServiceableTarget(null);
                  setNotServiceableReason('');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <Ban className="size-3.5" />
                {updateItemStatusMutation.isPending ? 'Saving...' : 'Confirm Not Serviceable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabQueuePage;
