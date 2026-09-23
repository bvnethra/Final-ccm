// application/src/pages/lab/CalibrationDueListPage.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCalibrationDueList } from '../../hooks/useOperations';
import { useAuthContext } from '../../contexts/AuthContext';
import {
  CalendarClock,
  Search,
  Download,
  ChevronRight,
  Plus,
  FileText,
  Clock,
  AlertTriangle,
  Building2,
  ShieldAlert,
  MoreVertical,
  Gauge,
} from 'lucide-react';
import type { CalibrationDueItem } from '../../types/domain';
import { cn } from '../../lib/utils';

const AVATAR_PALETTES = [
  { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
];

export const CalibrationDueListPage: React.FC = () => {
  const { tenantName, organizationName } = useAuthContext();
  const { data: dueItems = [], isLoading } = useCalibrationDueList();

  const [search, setSearch] = useState('');
  const [windowFilter, setWindowFilter] = useState<'ALL' | 'OVERDUE' | 'NEXT_7_DAYS' | 'NEXT_15_DAYS' | 'NEXT_30_DAYS'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'IN_HOUSE' | 'OUTSOURCED'>('ALL');

  // Dynamic live metrics (zero hardcoding)
  const metrics = useMemo(() => {
    const total = dueItems.length;
    const overdue = dueItems.filter((i) => i.daysRemaining < 0).length;
    const due7 = dueItems.filter((i) => i.daysRemaining >= 0 && i.daysRemaining <= 7).length;
    const due30 = dueItems.filter((i) => i.daysRemaining >= 0 && i.daysRemaining <= 30).length;
    const outsourced = dueItems.filter((i) => i.isOutsourced).length;

    return { total, overdue, due7, due30, outsourced };
  }, [dueItems]);

  // Client-side filtering
  const filteredItems = useMemo(() => {
    return dueItems.filter((item) => {
      // Due window filter
      if (windowFilter === 'OVERDUE' && item.daysRemaining >= 0) return false;
      if (windowFilter === 'NEXT_7_DAYS' && (item.daysRemaining < 0 || item.daysRemaining > 7)) return false;
      if (windowFilter === 'NEXT_15_DAYS' && (item.daysRemaining < 0 || item.daysRemaining > 15)) return false;
      if (windowFilter === 'NEXT_30_DAYS' && (item.daysRemaining < 0 || item.daysRemaining > 30)) return false;

      // Source filter
      if (sourceFilter === 'IN_HOUSE' && item.isOutsourced) return false;
      if (sourceFilter === 'OUTSOURCED' && !item.isOutsourced) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = item.itemName?.toLowerCase().includes(q);
        const matchSerial = item.serialNumber?.toLowerCase().includes(q);
        const matchClient = item.clientName?.toLowerCase().includes(q);
        const matchCert = item.certificateNumber?.toLowerCase().includes(q) || false;
        const matchVendor = item.vendorName?.toLowerCase().includes(q) || false;
        if (!matchName && !matchSerial && !matchClient && !matchCert && !matchVendor) return false;
      }

      return true;
    });
  }, [dueItems, windowFilter, sourceFilter, search]);


  // Pagination State (for FLAT view)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, windowFilter, sourceFilter]);

  const pagedItems = filteredItems.slice(
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

  // CSV Export with dynamic naming rule
  const handleExportCSV = () => {
    if (filteredItems.length === 0) return;

    const headers = [
      'Client Name',
      'Client Code',
      'Client Email',
      'Client Phone',
      'Instrument Name',
      'Serial Number',
      'Category',
      'Last Calibrated Date',
      'Next Calibration Due Date',
      'Days Remaining',
      'Urgency Status',
      'Sourcing',
      'Vendor Name',
      'Vendor Certificate #',
      'Work Order Ref',
    ];

    const rows = filteredItems.map((it) => [
      `"${it.clientName.replace(/"/g, '""')}"`,
      `"${it.clientCode}"`,
      `"${it.clientEmail || ''}"`,
      `"${it.clientPhone || ''}"`,
      `"${it.itemName.replace(/"/g, '""')}"`,
      `"${it.serialNumber}"`,
      `"${it.itemCategory || ''}"`,
      it.lastCalibratedDate ? it.lastCalibratedDate.slice(0, 10) : '',
      it.nextDueDate ? it.nextDueDate.slice(0, 10) : '',
      it.daysRemaining,
      it.urgencyStatus,
      it.isOutsourced ? 'Outsourced (Vendor)' : 'In-House Lab',
      `"${(it.vendorName || '').replace(/"/g, '""')}"`,
      `"${it.vendorCertificateNumber || ''}"`,
      `"${it.requestNumber}"`,
    ]);

    const enterprisePrefix = (tenantName || organizationName || 'Nethra').replace(/\s+/g, '_');
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${enterprisePrefix}_Calibration_Due_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getUrgencyBadge = (item: CalibrationDueItem) => {
    if (item.daysRemaining < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 whitespace-nowrap">
          <AlertTriangle className="size-3 text-rose-600" /> Overdue ({Math.abs(item.daysRemaining)}d)
        </span>
      );
    }
    if (item.daysRemaining <= 7) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
          <Clock className="size-3 text-amber-600" /> Due in {item.daysRemaining}d
        </span>
      );
    }
    if (item.daysRemaining <= 30) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 whitespace-nowrap">
          <Clock className="size-3 text-blue-600" /> Due in {item.daysRemaining}d
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8F8F0] text-[#16A34A] border border-[#D1F2E0] whitespace-nowrap">
        Active ({item.daysRemaining}d)
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-[#0274BB] flex items-center justify-center text-white shadow-sm shrink-0">
            <CalendarClock className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              Calibration Due Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Annual Cycle Metrology Traceability &amp; Upcoming Expiry Tracking ({metrics.total} Tracked Instruments)
            </p>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs font-semibold text-[#0274BB] tracking-wide">
            Monitor • Recall • Comply
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
            placeholder="Search by instrument, serial #, client, certificate #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition-all shadow-xs"
          />
        </div>

        {/* Filter Buttons & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sourcing Selector */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:border-[#0274BB] focus:outline-none shadow-xs transition-colors cursor-pointer"
          >
            <option value="ALL">All Sourcing</option>
            <option value="IN_HOUSE">In-House Lab</option>
            <option value="OUTSOURCED">Outsource Vendor</option>
          </select>

          <button
            type="button"
            onClick={() => setWindowFilter('ALL')}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              windowFilter === 'ALL'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            All Instruments
          </button>

          <button
            type="button"
            onClick={() => setWindowFilter('OVERDUE')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              windowFilter === 'OVERDUE'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                windowFilter === 'OVERDUE' ? 'bg-white' : 'bg-rose-500'
              )}
            />
            Overdue ({metrics.overdue})
          </button>

          <button
            type="button"
            onClick={() => setWindowFilter('NEXT_7_DAYS')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              windowFilter === 'NEXT_7_DAYS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                windowFilter === 'NEXT_7_DAYS' ? 'bg-white' : 'bg-amber-500'
              )}
            />
            Next 7 Days ({metrics.due7})
          </button>

          <button
            type="button"
            onClick={() => setWindowFilter('NEXT_30_DAYS')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              windowFilter === 'NEXT_30_DAYS'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                windowFilter === 'NEXT_30_DAYS' ? 'bg-white' : 'bg-blue-500'
              )}
            />
            Next 30 Days ({metrics.due30})
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            title="Export CSV"
          >
            <Download className="size-3.5 text-[#0274BB]" />
            <span className="hidden xl:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
<<<<<<< Updated upstream
        {/* Card 1: Total Tracked */}
        <div
          onClick={() => {
            setWindowFilter('ALL');
            setSourceFilter('ALL');
          }}
          className={cn(
            'bg-[#F8F6FF] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            windowFilter === 'ALL' && sourceFilter === 'ALL'
              ? 'border-purple-300 ring-2 ring-purple-400/20'
              : 'border-purple-100 hover:border-purple-200'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
=======
        <Card className="bg-white border-l-4 border-l-[#0274BB]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider block">
                Total Monitored
              </span>
              <span className="text-2xl font-bold text-[#111827] mt-1 block">
                {metrics.total}
              </span>
              <span className="text-xs text-[#6B7280] mt-0.5 block">Active Calibrated Fleet</span>
            </div>
            <div className="size-10 rounded-[4px] bg-[#EBF5FF] text-[#0274BB] flex items-center justify-center">
>>>>>>> Stashed changes
              <CalendarClock className="size-5" />
            </div>
            <div>
<<<<<<< Updated upstream
              <div className="text-2xl font-bold text-slate-900 leading-none">{metrics.total}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Tracked Instruments</div>
=======
              <span className="text-xs font-semibold text-[#DC2626] uppercase tracking-wider block">
                Overdue Items
              </span>
              <span className="text-2xl font-bold text-[#DC2626] mt-1 block">
                {metrics.overdue}
              </span>
              <span className="text-xs text-[#DC2626] mt-0.5 block">Immediate Recall Needed</span>
>>>>>>> Stashed changes
            </div>
          </div>
          <ChevronRight className="size-5 text-purple-400" />
        </div>

<<<<<<< Updated upstream
        {/* Card 2: Critical Overdue */}
        <div
          onClick={() => setWindowFilter('OVERDUE')}
          className={cn(
            'bg-[#FFF5F5] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            windowFilter === 'OVERDUE'
              ? 'border-rose-300 ring-2 ring-rose-400/20'
              : 'border-rose-100 hover:border-rose-200'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
=======
        <Card className="bg-white border-l-4 border-l-[#D97706]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#D97706] uppercase tracking-wider block">
                Due in 7 Days
              </span>
              <span className="text-2xl font-bold text-[#D97706] mt-1 block">
                {metrics.due7}
              </span>
              <span className="text-xs text-[#D97706] mt-0.5 block">High Priority Outreach</span>
            </div>
            <div className="size-10 rounded-[4px] bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
>>>>>>> Stashed changes
              <AlertTriangle className="size-5" />
            </div>
            <div>
<<<<<<< Updated upstream
              <div className="text-2xl font-bold text-slate-900 leading-none">{metrics.overdue}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Critical Overdue</div>
=======
              <span className="text-xs font-semibold text-[#16A34A] uppercase tracking-wider block">
                Due in 30 Days
              </span>
              <span className="text-2xl font-bold text-[#16A34A] mt-1 block">
                {metrics.due30}
              </span>
              <span className="text-xs text-[#16A34A] mt-0.5 block">Scheduled for Re-inward</span>
>>>>>>> Stashed changes
            </div>
          </div>
          <ChevronRight className="size-5 text-rose-400" />
        </div>

        {/* Card 3: Due in 7 Days */}
        <div
          onClick={() => setWindowFilter('NEXT_7_DAYS')}
          className={cn(
            'bg-[#FFFBF0] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            windowFilter === 'NEXT_7_DAYS'
              ? 'border-amber-300 ring-2 ring-amber-400/20'
              : 'border-amber-100 hover:border-amber-200'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{metrics.due7}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Due in 7 Days</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-amber-400" />
        </div>

        {/* Card 4: Due in 30 Days */}
        <div
          onClick={() => setWindowFilter('NEXT_30_DAYS')}
          className={cn(
            'bg-[#F0F7FF] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            windowFilter === 'NEXT_30_DAYS'
              ? 'border-blue-300 ring-2 ring-blue-400/20'
              : 'border-blue-100 hover:border-blue-200'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-blue-100 text-[#0274BB] flex items-center justify-center shrink-0">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{metrics.due30}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Due in 30 Days</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-[#0274BB]/60" />
        </div>
      </div>

<<<<<<< Updated upstream
      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">Equipment / Gauge</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Client Facility</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Last Certificate</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Next Due Date</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Service Source</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Compliance Status</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Audit Traceability</th>
                <th className="px-5 py-3.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <div className="size-7 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">Loading calibration due directory...</span>
=======
      {/* Toolbar Filters (Due Windows & Grouping) */}
      <Card className="bg-white p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#9CA3AF]" />
            <Input
              type="text"
              placeholder="Search instrument, serial #, client, or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* View Mode & Sourcing Toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-[4px] border border-[#E5E7EB] p-0.5 bg-[#F9FAFB]">
              <button
                type="button"
                onClick={() => setViewMode('GROUPED')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[3px] transition-colors cursor-pointer ${
                  viewMode === 'GROUPED' ? 'bg-white text-[#0274BB] shadow-xs' : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                <Layers className="size-3.5" /> Group by Client (FR-DUE-02)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('FLAT')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[3px] transition-colors cursor-pointer ${
                  viewMode === 'FLAT' ? 'bg-white text-[#0274BB] shadow-xs' : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                <Table className="size-3.5" /> Flat Table
              </button>
            </div>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="h-8 px-2.5 text-xs font-semibold rounded-[4px] border border-[#E5E7EB] bg-white text-[#374151] focus:outline-none focus:border-[#0274BB]"
            >
              <option value="ALL">All Sources</option>
              <option value="IN_HOUSE">In-House Calibration</option>
              <option value="OUTSOURCED">Vendor Outsourced Only</option>
            </select>
          </div>
        </div>

        {/* Due Window Pills (FR-DUE-04) */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-[#F3F4F6] text-xs font-semibold">
          <span className="text-[#6B7280] shrink-0">Due Window:</span>
          {(
            [
              { key: 'ALL' as const, label: 'All Tracked', count: dueItems.length, alert: false },
              { key: 'OVERDUE' as const, label: 'Overdue (<0 Days)', count: metrics.overdue, alert: true },
              { key: 'NEXT_7_DAYS' as const, label: 'Due in 7 Days', count: metrics.due7, alert: false },
              { key: 'NEXT_15_DAYS' as const, label: 'Due in 15 Days', count: dueItems.filter((i) => i.daysRemaining >= 0 && i.daysRemaining <= 15).length, alert: false },
              { key: 'NEXT_30_DAYS' as const, label: 'Due in 30 Days', count: metrics.due30, alert: false },
            ]
          ).map((w) => (
            <button
              key={w.key}
              type="button"
              onClick={() => setWindowFilter(w.key)}
              className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                windowFilter === w.key
                  ? w.alert
                    ? 'bg-[#DC2626] text-white font-bold'
                    : 'bg-[#0274BB] text-white font-bold'
                  : 'bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]'
              }`}
            >
              <span>{w.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  windowFilter === w.key ? 'bg-black/20 text-white' : 'bg-white text-[#6B7280] border border-[#E5E7EB]'
                }`}
              >
                {w.count}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="p-12 text-center text-sm text-[#6B7280]">
          <div className="size-6 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading calibration due schedule...
        </div>
      )}

      {error && (
        <div className="p-6 bg-[#FEF2F2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px]">
          Failed to load calibration due list: {(error as Error)?.message}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredItems.length === 0 && (
        <Card className="p-12 text-center">
          <CalendarClock className="size-12 text-[#9CA3AF] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#111827]">No Calibration Due Items Found</h3>
          <p className="text-sm text-[#6B7280] mt-1 max-w-md mx-auto">
            {search || windowFilter !== 'ALL' || sourceFilter !== 'ALL'
              ? 'No instruments match your current search and window filters. Try adjusting the filter criteria.'
              : 'All calibrated instruments are currently within their active validity intervals.'}
          </p>
          {(search || windowFilter !== 'ALL' || sourceFilter !== 'ALL') && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearch('');
                setWindowFilter('ALL');
                setSourceFilter('ALL');
              }}
            >
              Clear All Filters
            </Button>
          )}
        </Card>
      )}

      {/* VIEW MODE 1: Client-wise Grouping (FR-DUE-02) */}
      {!isLoading && !error && viewMode === 'GROUPED' && clientGroups.length > 0 && (
        <div className="space-y-4">
          {clientGroups.map((group) => {
            const isCollapsed = collapsedClients.has(group.clientId);
            return (
              <Card key={group.clientId} className="bg-white overflow-hidden border border-[#E5E7EB]">
                {/* Client Group Header */}
                <div
                  onClick={() => toggleClientCollapse(group.clientId)}
                  className="p-4 bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer border-b border-[#E5E7EB]"
                >
                  <div className="flex items-center gap-3">
                    <button type="button" className="text-[#6B7280]">
                      {isCollapsed ? <ChevronRight className="size-5" /> : <ChevronDown className="size-5" />}
                    </button>
                    <div className="size-9 rounded-[4px] bg-[#0274BB]/10 text-[#0274BB] flex items-center justify-center font-bold">
                      <Building2 className="size-5" />
>>>>>>> Stashed changes
                    </div>
                  </td>
                </tr>
              ) : pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <CalendarClock className="size-6" />
                      </div>
                      <h3 className="font-semibold text-base text-slate-900">No Due Items Found</h3>
                      <p className="text-xs text-slate-500">
                        All instruments are compliant with calibration certificates in order.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedItems.map((item, index) => {
                  const palette = AVATAR_PALETTES[index % AVATAR_PALETTES.length];
                  const itemId = item.id || item.itemMasterId;
                  const isActionMenuOpen = openActionId === itemId;

                  return (
                    <tr
                      key={itemId || index}
                      className={cn(
                        'hover:bg-slate-50/70 transition-colors group',
                        item.daysRemaining < 0 && 'bg-rose-50/20'
                      )}
                    >
                      {/* EQUIPMENT / GAUGE */}
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
                            <Gauge className="size-5" />
                          </div>
                          <div>
                            <Link
                              to={`/masters/items/${item.itemMasterId}`}
                              className="font-semibold text-slate-900 text-sm hover:text-[#0274BB] transition-colors leading-tight line-clamp-1"
                              title={item.itemName}
                            >
                              {item.itemName}
                            </Link>
                            <span className="inline-block font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#0274BB] border border-blue-200 mt-1 whitespace-nowrap">
                              SN: {item.serialNumber || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* CLIENT FACILITY */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                            <Building2 className="size-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[170px]">{item.clientName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 ml-5 font-mono">
                            {item.clientCode}
                          </div>
                        </div>
                      </td>

                      {/* LAST CERTIFICATE */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-slate-800 font-mono">
                          {item.certificateNumber || item.vendorCertificateNumber || 'CERT-ACTIVE'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Cal: {item.lastCalibratedDate ? new Date(item.lastCalibratedDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>

                      {/* NEXT DUE DATE */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-xs font-bold text-slate-900 font-mono">
                          {item.nextDueDate ? new Date(item.nextDueDate).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="mt-1">{getUrgencyBadge(item)}</div>
                      </td>

                      {/* SERVICE SOURCE */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {item.isOutsourced ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            Vendor: {item.vendorName || 'Outsource'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-[#0274BB] border border-blue-200">
                            In-House Lab
                          </span>
                        )}
                      </td>

                      {/* COMPLIANCE STATUS */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {item.daysRemaining < 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 whitespace-nowrap">
                            <span className="size-1.5 rounded-full bg-rose-600" /> NON-COMPLIANT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F8F0] text-[#16A34A] border border-[#D1F2E0] whitespace-nowrap">
                            <span className="size-1.5 rounded-full bg-[#16A34A]" /> ISO COMPLIANT
                          </span>
                        )}
                      </td>

<<<<<<< Updated upstream
                      {/* AUDIT TRACEABILITY */}
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="font-mono text-[11px] text-slate-700">
                            Ref: {item.requestNumber}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Freq: 365d
                          </div>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <Link to="/requests/new">
                            <button
                              type="button"
                              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-[#0274BB] hover:bg-blue-100 border border-blue-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Register Inward Intake for Calibration"
                            >
                              <Plus className="size-3" /> Re-Calibrate
                            </button>
                          </Link>

                          <div className="inline-block">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionId(isActionMenuOpen ? null : itemId);
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
                                  to={`/requests/${item.requestId}`}
                                  onClick={() => setOpenActionId(null)}
                                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0274BB] transition-colors"
=======
                {/* Instruments Table under Client */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#FAFAFA] text-[11px] font-bold text-[#4B5563] uppercase tracking-wider border-b border-[#E5E7EB]">
                        <tr>
                          <th className="py-2.5 px-4">Instrument / Serial</th>
                          <th className="py-2.5 px-4">Category</th>
                          <th className="py-2.5 px-4">Last Calibration</th>
                          <th className="py-2.5 px-4">Next Due Date</th>
                          <th className="py-2.5 px-4">Urgency</th>
                          <th className="py-2.5 px-4">Sourcing / Vendor (FR-DUE-03)</th>
                          <th className="py-2.5 px-4 text-right">Direct Action (FR-DUE-06)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {group.items.map((item) => (
                          <tr key={item.id} className="hover:bg-[#F9FAFB] transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-bold text-[#111827] block">{item.itemName}</span>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-[#6B7280]">
                                <span>SN: <strong className="text-[#374151]">{item.serialNumber}</strong></span>
                                {item.itemCode && <span>• Code: {item.itemCode}</span>}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs text-[#4B5563]">
                              {item.itemCategory || 'General Metrology'}
                            </td>
                            <td className="py-3 px-4 text-xs text-[#4B5563]">
                              {item.lastCalibratedDate ? new Date(item.lastCalibratedDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-xs text-[#111827] block">
                                {new Date(item.nextDueDate).toLocaleDateString()}
                              </span>
                              <span className="text-[11px] text-[#6B7280]">
                                Cert: {item.certificateNumber || 'ACTIVE'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {getUrgencyBadge(item)}
                            </td>
                            <td className="py-3 px-4">
                              {item.isOutsourced ? (
                                <div className="space-y-0.5">
                                  <Badge variant="warning">VENDOR OUTSOURCED</Badge>
                                  <span className="text-xs font-semibold text-[#111827] block">
                                    {item.vendorName || 'External Vendor Lab'}
                                  </span>
                                  {item.vendorCertificateNumber && (
                                    <span className="text-[11px] text-[#6B7280] block">
                                      Vendor Cert: {item.vendorCertificateNumber}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="success">IN-HOUSE LAB</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() =>
                                    navigate(
                                      `/requests/new?clientId=${item.clientId}&itemId=${item.itemMasterId}&serial=${encodeURIComponent(
                                        item.serialNumber
                                      )}`
                                    )
                                  }
                                  title="Create New Inward Request for this item"
>>>>>>> Stashed changes
                                >
                                  <FileText className="size-3.5 text-slate-400" /> Prior Work Order
                                </Link>

                                <Link
                                  to="/requests/new"
                                  onClick={() => setOpenActionId(null)}
                                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0274BB] transition-colors"
                                >
                                  <Plus className="size-3.5 text-[#0274BB]" /> Book New Intake
                                </Link>
                              </div>
<<<<<<< Updated upstream
                            )}
                          </div>
=======
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: Flat Table View */}
      {!isLoading && !error && viewMode === 'FLAT' && filteredItems.length > 0 && (
        <Card className="bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAFAFA] text-[11px] font-bold text-[#4B5563] uppercase tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Instrument / Serial</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Last Calibration</th>
                  <th className="py-3 px-4">Next Due Date</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4">Sourcing / Vendor</th>
                  <th className="py-3 px-4 text-right">Direct Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#111827] block">{item.clientName}</span>
                      <span className="text-xs text-[#6B7280]">{item.clientCode}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#111827] block">{item.itemName}</span>
                      <span className="text-xs text-[#6B7280]">SN: {item.serialNumber}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#4B5563]">
                      {item.itemCategory || 'General Metrology'}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#4B5563]">
                      {item.lastCalibratedDate ? new Date(item.lastCalibratedDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-xs text-[#111827] block">
                        {new Date(item.nextDueDate).toLocaleDateString()}
                      </span>
                      <span className="text-[11px] text-[#6B7280]">
                        Cert: {item.certificateNumber || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getUrgencyBadge(item)}
                    </td>
                    <td className="py-3 px-4">
                      {item.isOutsourced ? (
                        <div>
                          <Badge variant="warning">OUTSOURCED</Badge>
                          <span className="text-xs text-[#111827] block font-semibold mt-0.5">
                            {item.vendorName || 'External Vendor'}
                          </span>
>>>>>>> Stashed changes
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
              {filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            –{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(currentPage * pageSize, filteredItems.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-800">{filteredItems.length}</span> gauges
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

export default CalibrationDueListPage;
