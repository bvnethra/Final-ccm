// application/src/pages/lab/CalibrationDueListPage.tsx
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCalibrationDueList } from '../../hooks/useOperations';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
} from '../../components/ui/UIPrimitives';
import {
  CalendarClock,
  Search,
  Download,
  Printer,
  ChevronDown,
  ChevronRight,
  Plus,
  FileText,
  Clock,
  AlertTriangle,
  Building2,
  ExternalLink,
  ShieldAlert,
  Layers,
  Table,
} from 'lucide-react';
import type { CalibrationDueItem } from '../../types/domain';

export const CalibrationDueListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: dueItems = [], isLoading, error } = useCalibrationDueList();

  const [search, setSearch] = useState('');
  const [windowFilter, setWindowFilter] = useState<'ALL' | 'OVERDUE' | 'NEXT_7_DAYS' | 'NEXT_15_DAYS' | 'NEXT_30_DAYS'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'IN_HOUSE' | 'OUTSOURCED'>('ALL');
  const [viewMode, setViewMode] = useState<'GROUPED' | 'FLAT'>('GROUPED');
  const [collapsedClients, setCollapsedClients] = useState<Set<string>>(new Set());

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = dueItems.length;
    const overdue = dueItems.filter((i) => i.daysRemaining < 0).length;
    const due7 = dueItems.filter((i) => i.daysRemaining >= 0 && i.daysRemaining <= 7).length;
    const due30 = dueItems.filter((i) => i.daysRemaining >= 0 && i.daysRemaining <= 30).length;
    const outsourced = dueItems.filter((i) => i.isOutsourced).length;

    return { total, overdue, due7, due30, outsourced };
  }, [dueItems]);

  // Filtering
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
        const q = search.toLowerCase();
        const matchName = item.itemName.toLowerCase().includes(q);
        const matchSerial = item.serialNumber.toLowerCase().includes(q);
        const matchClient = item.clientName.toLowerCase().includes(q);
        const matchCert = item.certificateNumber?.toLowerCase().includes(q) || false;
        const matchVendor = item.vendorName?.toLowerCase().includes(q) || false;
        if (!matchName && !matchSerial && !matchClient && !matchCert && !matchVendor) return false;
      }

      return true;
    });
  }, [dueItems, windowFilter, sourceFilter, search]);

  // Group by client (FR-DUE-02)
  const clientGroups = useMemo(() => {
    const map = new Map<string, {
      clientId: string;
      clientName: string;
      clientCode: string;
      clientEmail?: string;
      clientPhone?: string;
      items: CalibrationDueItem[];
      overdueCount: number;
    }>();

    for (const item of filteredItems) {
      if (!map.has(item.clientId)) {
        map.set(item.clientId, {
          clientId: item.clientId,
          clientName: item.clientName,
          clientCode: item.clientCode,
          clientEmail: item.clientEmail,
          clientPhone: item.clientPhone,
          items: [],
          overdueCount: 0,
        });
      }
      const grp = map.get(item.clientId)!;
      grp.items.push(item);
      if (item.daysRemaining < 0) {
        grp.overdueCount += 1;
      }
    }

    return Array.from(map.values()).sort((a, b) => b.overdueCount - a.overdueCount || b.items.length - a.items.length);
  }, [filteredItems]);

  const toggleClientCollapse = (clientId: string) => {
    setCollapsedClients((prev) => {
      const copy = new Set(prev);
      if (copy.has(clientId)) {
        copy.delete(clientId);
      } else {
        copy.add(clientId);
      }
      return copy;
    });
  };

  // CSV Export (FR-DUE-05)
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

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `calibration_due_list_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getUrgencyBadge = (item: CalibrationDueItem) => {
    if (item.daysRemaining < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] bg-[#FEF2F2] text-[#DC2626] font-bold text-xs border border-[#FCA5A5]">
          <AlertTriangle className="size-3" />
          {Math.abs(item.daysRemaining)} Days OVERDUE
        </span>
      );
    }
    if (item.daysRemaining <= 7) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] bg-[#FFFBEB] text-[#D97706] font-bold text-xs border border-[#FDE68A]">
          <Clock className="size-3" />
          Due in {item.daysRemaining} Days
        </span>
      );
    }
    if (item.daysRemaining <= 15) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] bg-[#EFF6FF] text-[#2563EB] font-semibold text-xs border border-[#BFDBFE]">
          Due in {item.daysRemaining} Days
        </span>
      );
    }
    if (item.daysRemaining <= 30) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] bg-[#F3F4F6] text-[#4B5563] font-medium text-xs border border-[#E5E7EB]">
          Due in {item.daysRemaining} Days
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] bg-[#F0FDF4] text-[#16A34A] font-medium text-xs border border-[#BBF7D0]">
        Valid ({item.daysRemaining} Days)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#111827]">Calibration Due List</h1>
            <Badge variant="primary">FR-DUE-01 to 06</Badge>
          </div>
          <p className="text-sm text-[#6B7280] mt-1">
            Client-wise calibration interval monitoring, scheduled expiration alerts, and vendor cross-references.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" /> Print Due List
          </Button>
          <Button variant="primary" size="sm" onClick={handleExportCSV} disabled={filteredItems.length === 0}>
            <Download className="size-4" /> Export CSV / Excel
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-l-4 border-l-[#0274BB]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider block">
                Total Monitored
              </span>
              <span className="text-2xl font-bold text-[#111827] mt-1 block font-mono">
                {metrics.total}
              </span>
              <span className="text-xs text-[#6B7280] mt-0.5 block">Active Calibrated Fleet</span>
            </div>
            <div className="size-10 rounded-[4px] bg-[#EBF5FF] text-[#0274BB] flex items-center justify-center">
              <CalendarClock className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-[#DC2626]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#DC2626] uppercase tracking-wider block">
                Overdue Items
              </span>
              <span className="text-2xl font-bold text-[#DC2626] mt-1 block font-mono">
                {metrics.overdue}
              </span>
              <span className="text-xs text-[#DC2626] mt-0.5 block">Immediate Recall Needed</span>
            </div>
            <div className="size-10 rounded-[4px] bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
              <ShieldAlert className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-[#D97706]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#D97706] uppercase tracking-wider block">
                Due in 7 Days
              </span>
              <span className="text-2xl font-bold text-[#D97706] mt-1 block font-mono">
                {metrics.due7}
              </span>
              <span className="text-xs text-[#D97706] mt-0.5 block">High Priority Outreach</span>
            </div>
            <div className="size-10 rounded-[4px] bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
              <AlertTriangle className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-[#16A34A]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#16A34A] uppercase tracking-wider block">
                Due in 30 Days
              </span>
              <span className="text-2xl font-bold text-[#16A34A] mt-1 block font-mono">
                {metrics.due30}
              </span>
              <span className="text-xs text-[#16A34A] mt-0.5 block">Scheduled for Re-inward</span>
            </div>
            <div className="size-10 rounded-[4px] bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

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
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
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
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-[#111827]">{group.clientName}</span>
                        <span className="font-mono text-xs text-[#6B7280] px-1.5 py-0.5 bg-white rounded border border-[#E5E7EB]">
                          {group.clientCode}
                        </span>
                        {group.overdueCount > 0 && (
                          <span className="px-2 py-0.5 rounded-[4px] bg-[#FEF2F2] text-[#DC2626] font-bold text-xs border border-[#FCA5A5]">
                            {group.overdueCount} Overdue
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#6B7280]">
                        {group.clientPhone ? `${group.clientPhone} • ` : ''}
                        {group.clientEmail || 'No email registered'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs font-semibold text-[#6B7280]">
                      {group.items.length} {group.items.length === 1 ? 'Instrument' : 'Instruments'} Due
                    </span>
                    <Button
                      variant="outlineInk"
                      size="sm"
                      onClick={() => navigate(`/requests/new?clientId=${group.clientId}`)}
                    >
                      <Plus className="size-3.5" /> New Inward for Client
                    </Button>
                  </div>
                </div>

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
                              <div className="flex items-center gap-2 mt-0.5 font-mono text-xs text-[#6B7280]">
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
                              <span className="font-bold font-mono text-xs text-[#111827] block">
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
                                    <span className="text-[11px] text-[#6B7280] font-mono block">
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
                                >
                                  <Plus className="size-3" /> Inward
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => navigate(`/commercial/quotations/new?clientId=${item.clientId}`)}
                                  title="Create Quotation for Client"
                                >
                                  <FileText className="size-3" /> Quote
                                </Button>
                                <Link to={`/requests/${item.requestId}`}>
                                  <Button variant="outlineInk" size="sm" title="View historical work order">
                                    <ExternalLink className="size-3" />
                                  </Button>
                                </Link>
                              </div>
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
                      <span className="font-mono text-xs text-[#6B7280]">{item.clientCode}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#111827] block">{item.itemName}</span>
                      <span className="font-mono text-xs text-[#6B7280]">SN: {item.serialNumber}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#4B5563]">
                      {item.itemCategory || 'General Metrology'}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#4B5563]">
                      {item.lastCalibratedDate ? new Date(item.lastCalibratedDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold font-mono text-xs text-[#111827] block">
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
                        </div>
                      ) : (
                        <Badge variant="success">IN-HOUSE</Badge>
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
                        >
                          <Plus className="size-3" /> Inward
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/commercial/quotations/new?clientId=${item.clientId}`)}
                        >
                          <FileText className="size-3" /> Quote
                        </Button>
                        <Link to={`/requests/${item.requestId}`}>
                          <Button variant="outlineInk" size="sm">
                            <ExternalLink className="size-3" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CalibrationDueListPage;
