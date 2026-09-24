// application/src/components/masters/items/ItemMasterListView.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { ItemMaster } from '../../../types/domain';
import { useAuthContext } from '../../../contexts/AuthContext';
import { Button } from '../../ui/UIPrimitives';
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Clock,
  ChevronRight,
  MoreVertical,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  Box,
  Ruler,
  IndianRupee,
} from 'lucide-react';
import { ITEM_METROLOGY_CATEGORIES } from '../../../services/itemMasterService';
import { ExcelBulkImportPanel, type FieldMapping } from '../../ui/ExcelBulkImportPanel';
import { cn } from '../../../lib/utils';

const ITEM_IMPORT_FIELDS: FieldMapping[] = [
  { key: 'item_name', label: 'Item / Instrument Name', required: true },
  { key: 'item_code', label: 'Item Code' },
  { key: 'item_type', label: 'Category / Type' },
  { key: 'manufacturer', label: 'Manufacturer / Brand' },
  { key: 'model', label: 'Model' },
  { key: 'serial_number', label: 'Serial Number' },
  { key: 'measurement_range', label: 'Measurement Range' },
  { key: 'least_count', label: 'Least Count' },
  { key: 'standard_cost', label: 'Standard Cost (INR)' },
  { key: 'calibration_frequency', label: 'Calibration Frequency (Days)' },
];

const SAMPLE_ITEMS = [
  {
    'Item / Instrument Name': 'SLIP GAUGE BLOCK (0.5-100mm)',
    'Item Code': 'SGB-100',
    'Category / Type': 'Dimensional Metrology',
    'Manufacturer / Brand': 'Mitutoyo',
    'Model': 'Grade 0',
    'Serial Number': 'SGB-2026-001',
    'Measurement Range': '0.5-100mm',
    'Least Count': '0.001 mm',
    'Standard Cost (INR)': 700,
    'Calibration Frequency (Days)': 365,
  },
  {
    'Item / Instrument Name': 'DIGITAL VERNIER CALIPER (0-150mm)',
    'Item Code': 'VC-150',
    'Category / Type': 'Dimensional Metrology',
    'Manufacturer / Brand': 'Mitutoyo',
    'Model': 'CD-6" CSX',
    'Serial Number': 'VC-2026-002',
    'Measurement Range': '0-150mm',
    'Least Count': '0.01 mm',
    'Standard Cost (INR)': 250,
    'Calibration Frequency (Days)': 365,
  },
];

const AVATAR_PALETTES = [
  { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
];

interface ItemMasterListViewProps {
  items: ItemMaster[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  standardCount: number;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (cat: string) => void;
  onToggleStatus: (id: string) => void;
  isTogglingId?: string;
  isImportOpen: boolean;
  onToggleImport: () => void;
  onCloseImport: () => void;
  onImportBulk: (rows: any[]) => Promise<{ count: number }>;
  onImportSuccess: () => void;
}

export const ItemMasterListView: React.FC<ItemMasterListViewProps> = ({
  items,
  totalCount,
  activeCount,
  inactiveCount,
  standardCount,
  isLoading,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  onToggleStatus,
  isTogglingId,
  isImportOpen,
  onToggleImport,
  onCloseImport,
  onImportBulk,
  onImportSuccess,
}) => {
  const { canPerform, isSuperAdmin, tenantName, organizationName } = useAuthContext();
  const canCreateMaster = isSuperAdmin || canPerform('CLIENT_VENDOR_ITEM_MASTER', 'CREATE');
  const canEditMaster =
    isSuperAdmin || canPerform('CLIENT_VENDOR_ITEM_MASTER', 'CREATE_EDIT') || canCreateMaster;

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter]);

  const pagedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Active Dropdown Row for Actions
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

  const enterprisePrefix = (tenantName || organizationName || 'Enterprise').replace(/\s+/g, '_');
  const templateFileName = `${enterprisePrefix}_Item_Master_Template.xlsx`;

  return (
    <div className="space-y-5">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-[#0274BB] flex items-center justify-center text-white shadow-sm shrink-0">
            <Box className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              Item Master Catalog
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Metrology Instruments, Gauges &amp; Measurement Standards ({totalCount} Registered)
            </p>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs font-semibold text-[#0274BB] tracking-wide">
            Calibrate • Standardize • Trace
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
            placeholder="Search by item code, name, category, manufacturer, model..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition-all shadow-xs"
          />
        </div>

        {/* Filter Buttons & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:border-[#0274BB] focus:outline-none shadow-xs transition-colors cursor-pointer"
          >
            <option value="ALL">All Disciplines</option>
            {ITEM_METROLOGY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onStatusFilterChange('ALL')}
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
            onClick={() => onStatusFilterChange('ACTIVE')}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
              statusFilter === 'ACTIVE'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                statusFilter === 'ACTIVE' ? 'bg-white' : 'bg-emerald-500'
              )}
            />
            Active
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange('INACTIVE')}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
              statusFilter === 'INACTIVE'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                statusFilter === 'INACTIVE' ? 'bg-white' : 'bg-slate-400'
              )}
            />
            Inactive
          </button>

          {canCreateMaster && (
            <>
              <button
                type="button"
                onClick={onToggleImport}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                title="Bulk Import Excel Sheet"
              >
                <FileSpreadsheet className="size-4 text-[#0274BB]" />
                <span className="hidden xl:inline">Import</span>
              </button>

              <Link to="/masters/items/new">
                <Button className="bg-[#0274BB] hover:bg-[#02629e] text-white font-medium px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm shadow-xs transition-all">
                  <Plus className="size-4" /> Add Item
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Excel Bulk Import Accordion Panel */}
      <ExcelBulkImportPanel
        isOpen={isImportOpen}
        onClose={onCloseImport}
        title="Import Items in Bulk"
        description="Upload your gauges, instruments and metrology equipment master spreadsheet to populate the standard catalog."
        fields={ITEM_IMPORT_FIELDS}
        sampleTemplateFileName={templateFileName}
        sampleData={SAMPLE_ITEMS}
        onImport={onImportBulk}
        onSuccess={onImportSuccess}
      />

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Items */}
        <div
          onClick={() => onStatusFilterChange('ALL')}
          className={cn(
            'bg-[#F8F6FF] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            statusFilter === 'ALL'
              ? 'border-purple-300 ring-2 ring-purple-400/20'
              : 'border-purple-100 hover:border-purple-200'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Box className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{totalCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Total Instruments</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-purple-400" />
        </div>

        {/* Card 2: Active Items */}
        <div
          onClick={() => onStatusFilterChange('ACTIVE')}
          className={cn(
            'bg-[#F0FDF4] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            statusFilter === 'ACTIVE'
              ? 'border-emerald-300 ring-2 ring-emerald-400/20'
              : 'border-emerald-100 hover:border-emerald-200'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <span className="size-3 rounded-full bg-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{activeCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Active Gauges</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-emerald-400" />
        </div>

        {/* Card 3: Inactive Items */}
        <div
          onClick={() => onStatusFilterChange('INACTIVE')}
          className={cn(
            'bg-[#F8FAFC] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            statusFilter === 'INACTIVE'
              ? 'border-slate-300 ring-2 ring-slate-400/20'
              : 'border-slate-200 hover:border-slate-300'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <span className="size-3 rounded-full bg-slate-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{inactiveCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Inactive Items</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-slate-400" />
        </div>

        {/* Card 4: Precision Standards */}
        <div
          onClick={() => onStatusFilterChange('STANDARDS')}
          className={cn(
            'bg-[#F0F7FF] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            statusFilter === 'STANDARDS'
              ? 'border-blue-300 ring-2 ring-blue-400/20'
              : 'border-blue-100 hover:border-blue-200'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-blue-100 text-[#0274BB] flex items-center justify-center shrink-0">
              <Ruler className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{standardCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Calibrated Standards</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-[#0274BB]/60" />
        </div>
      </div>

      {/* Item Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">Item / Instrument</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Specifications</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Measurement Range</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Calibration Freq</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Standard Rate</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Status</th>
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
                      <span className="text-sm font-medium">Loading instrument catalog...</span>
                    </div>
                  </td>
                </tr>
              ) : pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <Box className="size-6" />
                      </div>
                      <h3 className="font-semibold text-base text-slate-900">No Instruments Found</h3>
                      <p className="text-xs text-slate-500">
                        {searchQuery || categoryFilter !== 'ALL'
                          ? 'No matching instruments found for your search/filter criteria.'
                          : 'No equipment or instruments registered yet in this enterprise catalog.'}
                      </p>
                      {canCreateMaster && (
                        <Link to="/masters/items/new">
                          <Button variant="secondary" size="sm" className="mt-2">
                            <Plus className="size-3.5" /> Register Item
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                pagedItems.map((item, index) => {
                  const palette = AVATAR_PALETTES[index % AVATAR_PALETTES.length];
                  const isActionMenuOpen = openActionId === item.id;
                  const isToggling = isTogglingId === item.id;

                  const rangeDisplay =
                    item.measurement_range ||
                    (item.range_min !== undefined && item.range_max !== undefined
                      ? `${item.range_min} - ${item.range_max} ${item.range_unit || ''}`
                      : 'Standard Range');

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* ITEM / INSTRUMENT */}
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
                            <Box className="size-5" />
                          </div>
                          <div>
                            <Link
                              to={`/masters/items/${item.id}`}
                              className="font-semibold text-slate-900 text-sm hover:text-[#0274BB] transition-colors leading-tight line-clamp-1"
                              title={item.item_name}
                            >
                              {item.item_name}
                            </Link>
                            <span className="inline-block font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#0274BB] border border-blue-200 mt-1">
                              {item.item_code}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* SPECIFICATIONS */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                            <span className="truncate max-w-[160px]">
                              {item.item_category || item.item_type || 'General Instrument'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5">
                            <span>{item.manufacturer || 'Standard Brand'}</span>
                            {item.model && <span className="text-slate-400">· {item.model}</span>}
                          </div>
                          {item.serial_number && (
                            <div className="text-[11px] text-slate-400 font-mono">
                              SN: {item.serial_number}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* MEASUREMENT RANGE */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-slate-800 font-mono">
                          {rangeDisplay}
                        </div>
                        {item.least_count !== undefined && (
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            LC: {item.least_count} {item.least_count_unit || ''}
                          </div>
                        )}
                      </td>

                      {/* CALIBRATION FREQUENCY */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-block whitespace-nowrap px-3 py-1 bg-blue-50 text-[#0274BB] rounded-md text-xs font-medium border border-blue-200">
                          {item.calibration_frequency ? `${item.calibration_frequency} Days` : '365 Days'}
                        </span>
                      </td>

                      {/* STANDARD RATE */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-0.5 whitespace-nowrap px-3 py-1 bg-[#E8F8F0] text-[#16A34A] rounded-md text-xs font-medium border border-[#D1F2E0]">
                          <IndianRupee className="size-3" />
                          <span>{Number(item.standard_cost || 0).toLocaleString('en-IN')}</span>
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {item.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F8F0] text-[#16A34A] border border-[#D1F2E0] whitespace-nowrap">
                            <span className="size-1.5 rounded-full bg-[#16A34A]" /> ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                            <span className="size-1.5 rounded-full bg-slate-400" /> INACTIVE
                          </span>
                        )}
                      </td>

                      {/* SYSTEM AUDIT */}
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3 text-slate-400 shrink-0" />
                            <span>Created:</span>
                          </div>
                          <div className="text-slate-600 ml-4 font-mono text-[11px]">
                            {new Date(item.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-[11px] text-slate-400 ml-4">
                            By: {item.created_by_name || 'System'}
                          </div>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4 text-right relative">
                        <div className="inline-block">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionId(isActionMenuOpen ? null : item.id);
                            }}
                            className="size-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
                            title="Actions"
                          >
                            <MoreVertical className="size-4" />
                          </button>

                          {isActionMenuOpen && (
                            <div
                              ref={actionMenuRef}
                              className="absolute right-5 top-12 w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 text-left"
                            >
                              <Link
                                to={`/masters/items/${item.id}`}
                                onClick={() => setOpenActionId(null)}
                                className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0274BB] transition-colors"
                              >
                                <Eye className="size-3.5 text-slate-400" /> View Details
                              </Link>

                              {canEditMaster && (
                                <Link
                                  to={`/masters/items/${item.id}/edit`}
                                  onClick={() => setOpenActionId(null)}
                                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0274BB] transition-colors"
                                >
                                  <Edit2 className="size-3.5 text-slate-400" /> Edit Item
                                </Link>
                              )}

                              {canEditMaster && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    onToggleStatus(item.id);
                                  }}
                                  disabled={isToggling}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100 cursor-pointer"
                                >
                                  {item.status === 'ACTIVE' ? (
                                    <>
                                      <ToggleLeft className="size-3.5 text-slate-400" /> Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <ToggleRight className="size-3.5 text-emerald-600" /> Activate
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          )}
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
              {items.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            –{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(currentPage * pageSize, items.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-800">{items.length}</span> items
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
