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

    const enterprisePrefix = (tenantName || organizationName || 'Enterprise').replace(/\s+/g, '_');
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
              <CalendarClock className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{metrics.total}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Tracked Instruments</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-purple-400" />
        </div>

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
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{metrics.overdue}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Critical Overdue</div>
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
