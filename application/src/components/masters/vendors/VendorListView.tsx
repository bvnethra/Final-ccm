// application/src/components/masters/vendors/VendorListView.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Vendor } from '../../../types/domain';
import { useAuthContext } from '../../../contexts/AuthContext';
import { Button } from '../../ui/UIPrimitives';
import {
  Search,
  Plus,
  Phone,
  Mail,
  Eye,
  Edit2,
  Clock,
  User,
  MapPin,
  ChevronRight,
  MoreVertical,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  Handshake,
  FlaskConical,
  Truck,
  Package,
  ExternalLink,
  X,
  Calendar,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import { METROLOGY_SERVICE_CATEGORIES, type VendorOutsourcedItem } from '../../../services/vendorMasterService';
import { ExcelBulkImportPanel, type FieldMapping } from '../../ui/ExcelBulkImportPanel';
import { TableBodySkeleton } from '../../ui/Skeleton';
import { cn } from '../../../lib/utils';

const VENDOR_IMPORT_FIELDS: FieldMapping[] = [
  { key: 'vendor_name', label: 'Vendor / Laboratory Name', required: true },
  { key: 'vendor_code', label: 'Vendor Code' },
  { key: 'contact_person', label: 'Contact Person' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'email', label: 'Email Address' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'pin', label: 'PIN Code' },
  { key: 'gst_tax_number', label: 'GST / Tax ID' },
  { key: 'serviced_categories', label: 'Disciplines Serviced' },
];

const SAMPLE_VENDORS = [
  {
    'Vendor / Laboratory Name': 'National Metrology Standards Lab',
    'Vendor Code': 'TCC-MAS-VC-001',
    'Contact Person': 'Technical Director',
    'Phone': '+91 98400 11223',
    'Email': 'contact@nmsl-calib.org',
    'Address': 'NABL Technology Park, Guindy',
    'City': 'Chennai',
    'State': 'Tamil Nadu',
    'PIN Code': '600032',
    'GST / Tax ID': '33AAACN9999Z1Z8',
    'Disciplines Serviced': 'Mechanical Calibration, Thermal Calibration',
  },
  {
    'Vendor / Laboratory Name': 'Apex Precision Metrology Services',
    'Vendor Code': 'TCC-MAS-VC-002',
    'Contact Person': 'Operations Manager',
    'Phone': '+91 98400 44556',
    'Email': 'support@apexmetrology.com',
    'Address': 'SIDCO Industrial Estate, Ambattur',
    'City': 'Chennai',
    'State': 'Tamil Nadu',
    'PIN Code': '600058',
    'GST / Tax ID': '33AAACN8888Z2Z1',
    'Disciplines Serviced': 'Electro-Technical Calibration, Pressure & Vacuum',
  },
];

const AVATAR_PALETTES = [
  { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
];

interface VendorListViewProps {
  vendors: Vendor[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  labCount: number;
  outsourcedCount?: number;
  outsourcedItems?: VendorOutsourcedItem[];
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

export const VendorListView: React.FC<VendorListViewProps> = ({
  vendors,
  totalCount,
  activeCount,
  inactiveCount,
  labCount,
  outsourcedCount = 0,
  outsourcedItems = [],
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
  const totalPages = Math.max(1, Math.ceil(vendors.length / pageSize));

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter]);

  const pagedVendors = vendors.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Active Dropdown Row for Actions
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  // Active Outsource Items Slide-over Drawer
  const [selectedOutsourceVendor, setSelectedOutsourceVendor] = useState<{
    vendorName: string;
    vendorCode?: string;
    items: VendorOutsourcedItem[];
  } | null>(null);

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
  const templateFileName = `${enterprisePrefix}_Vendor_Master_Template.xlsx`;

  return (
    <div className="space-y-5">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-[#0274BB] flex items-center justify-center text-white shadow-sm shrink-0">
            <Handshake className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              Vendor Master Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Authorized Calibration Laboratories &amp; Outsource Service Providers ({totalCount} Registered)
            </p>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs font-semibold text-[#0274BB] tracking-wide">
            Qualify • Partner • Comply
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
            placeholder="Search by vendor code, name, city, discipline, contact..."
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
            {METROLOGY_SERVICE_CATEGORIES.map((cat) => (
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
            <ShieldCheck
              className={cn(
                'size-4',
                statusFilter === 'ACTIVE' ? 'text-white' : 'text-emerald-500'
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
            <ShieldX
              className={cn(
                'size-4',
                statusFilter === 'INACTIVE' ? 'text-white' : 'text-slate-400'
              )}
            />
            Inactive
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange(statusFilter === 'OUTSOURCED' ? 'ALL' : 'OUTSOURCED')}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
              statusFilter === 'OUTSOURCED'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                statusFilter === 'OUTSOURCED' ? 'bg-white' : 'bg-amber-500'
              )}
            />
            Outsourced
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

              <Link to="/masters/vendors/new">
                <Button className="bg-[#0274BB] hover:bg-[#02629e] text-white font-medium px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm shadow-xs transition-all">
                  <Plus className="size-4" /> Add Vendor
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
        title="Import Vendors in Bulk"
        description="Upload your calibration vendor and subcontractor spreadsheet to register authorized partner profiles."
        fields={VENDOR_IMPORT_FIELDS}
        sampleTemplateFileName={templateFileName}
        sampleData={SAMPLE_VENDORS}
        onImport={onImportBulk}
        onSuccess={onImportSuccess}
      />

      {/* 5 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Vendors */}
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
              <Handshake className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{totalCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Total Vendors</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-purple-400" />
        </div>

        {/* Card 2: Active Vendors */}
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
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{activeCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Active Vendors</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-emerald-400" />
        </div>

        {/* Card 3: Inactive Vendors */}
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
              <ShieldX className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{inactiveCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Inactive Vendors</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-slate-400" />
        </div>

        {/* Card 4: Calibration Labs */}
        <div
          onClick={() => onStatusFilterChange('LABS')}
          className={cn(
            'bg-[#F0F7FF] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            statusFilter === 'LABS'
              ? 'border-blue-300 ring-2 ring-blue-400/20'
              : 'border-blue-100 hover:border-blue-200'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-blue-100 text-[#0274BB] flex items-center justify-center shrink-0">
              <FlaskConical className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{labCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Calibration Labs</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-[#0274BB]/60" />
        </div>

        {/* Card 5: Vendor Outsourcing */}
        <div
          onClick={() => {
            if (outsourcedItems.length > 0) {
              setSelectedOutsourceVendor({
                vendorName: 'All Outsourced Equipment',
                items: outsourcedItems,
              });
            } else {
              onStatusFilterChange(statusFilter === 'OUTSOURCED' ? 'ALL' : 'OUTSOURCED');
            }
          }}
          className={cn(
            'bg-[#FFFBEB] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            statusFilter === 'OUTSOURCED'
              ? 'border-amber-300 ring-2 ring-amber-400/20'
              : 'border-amber-100 hover:border-amber-200'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Truck className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{outsourcedCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Vendor Outsourcing</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-amber-500/60" />
        </div>
      </div>

      {/* Vendor Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">Vendor Info</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Contact Person</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Location</th>
                <th className="px-5 py-3.5 whitespace-nowrap">GST / Tax ID</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Disciplines Serviced</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Vendor Outsourcing</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Status</th>
                <th className="px-5 py-3.5 whitespace-nowrap">System Audit</th>
                <th className="px-5 py-3.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <TableBodySkeleton rows={6} columns={9} hasAvatar avatarShape="square" />
              ) : pagedVendors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <Handshake className="size-6" />
                      </div>
                      <h3 className="font-semibold text-base text-slate-900">No Vendors Found</h3>
                      <p className="text-xs text-slate-500">
                        {searchQuery || categoryFilter !== 'ALL'
                          ? 'No matching vendors found for your search/filter criteria.'
                          : 'No vendors registered yet in this enterprise directory.'}
                      </p>
                      {canCreateMaster && (
                        <Link to="/masters/vendors/new">
                          <Button variant="secondary" size="sm" className="mt-2">
                            <Plus className="size-3.5" /> Register Vendor
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                pagedVendors.map((vendor, index) => {
                  const palette = AVATAR_PALETTES[index % AVATAR_PALETTES.length];
                  const isActionMenuOpen = openActionId === vendor.id;
                  const isToggling = isTogglingId === vendor.id;

                  return (
                    <tr
                      key={vendor.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* VENDOR INFO */}
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
                            <Handshake className="size-5" />
                          </div>
                          <div>
                            <Link
                              to={`/masters/vendors/${vendor.id}`}
                              className="font-semibold text-slate-900 text-sm hover:text-[#0274BB] transition-colors leading-tight line-clamp-1"
                              title={vendor.vendor_name}
                            >
                              {vendor.vendor_name}
                            </Link>
                            <span className="inline-block font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#0274BB] border border-blue-200 mt-1">
                              {vendor.vendor_code}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* CONTACT PERSON */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                            <User className="size-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[160px]">
                              {vendor.contact_person || 'Laboratory Head'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 font-mono">
                            <Phone className="size-3 text-slate-400 shrink-0" />
                            <span>{vendor.phone}</span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5">
                            <Mail className="size-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[160px]">{vendor.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* LOCATION */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-slate-400 shrink-0" />
                          <span>{vendor.city}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono ml-5 mt-0.5">
                          {vendor.pin}
                        </div>
                      </td>

                      {/* GST / TAX ID */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 font-mono text-xs font-semibold rounded tracking-wider whitespace-nowrap">
                          {vendor.gst_tax_number || 'UNREGISTERED'}
                        </span>
                      </td>

                      {/* DISCIPLINES SERVICED */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {vendor.serviced_categories?.length ? (
                            vendor.serviced_categories.slice(0, 2).map((cat) => (
                              <span
                                key={cat}
                                className="inline-block whitespace-nowrap px-2 py-0.5 bg-[#E8F8F0] text-[#16A34A] rounded text-[11px] font-medium border border-[#D1F2E0]"
                              >
                                {cat}
                              </span>
                            ))
                          ) : (
                            <span className="inline-block whitespace-nowrap px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px]">
                              General Metrology
                            </span>
                          )}
                          {vendor.serviced_categories?.length > 2 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-semibold">
                              +{vendor.serviced_categories.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* VENDOR OUTSOURCING */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {(() => {
                          const vendorOutsourced = outsourcedItems.filter(
                            (item) =>
                              item.vendorId === vendor.id ||
                              (item.vendorName &&
                                item.vendorName.toLowerCase() === vendor.vendor_name.toLowerCase())
                          );
                          if (vendorOutsourced.length > 0) {
                            return (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedOutsourceVendor({
                                    vendorName: vendor.vendor_name,
                                    vendorCode: vendor.vendor_code,
                                    items: vendorOutsourced,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs group"
                                title="Click to view outsourced instruments"
                              >
                                <Truck className="size-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
                                <span>
                                  {vendorOutsourced.length}{' '}
                                  {vendorOutsourced.length === 1 ? 'Item' : 'Items'} Outsourced
                                </span>
                                <ExternalLink className="size-3 text-amber-500 opacity-60 group-hover:opacity-100 ml-0.5" />
                              </button>
                            );
                          }
                          return (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-slate-400 bg-slate-50 border border-slate-200/60 font-mono">
                              0 Items
                            </span>
                          );
                        })()}
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {vendor.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F8F0] text-[#16A34A] border border-[#D1F2E0] whitespace-nowrap">
                            <ShieldCheck className="size-3.5" /> ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                            <ShieldX className="size-3.5 text-slate-400" /> INACTIVE
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
                            {new Date(vendor.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-[11px] text-slate-400 ml-4">
                            By: {vendor.created_by_name || 'System'}
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
                              setOpenActionId(isActionMenuOpen ? null : vendor.id);
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
                                to={`/masters/vendors/${vendor.id}`}
                                onClick={() => setOpenActionId(null)}
                                className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0274BB] transition-colors"
                              >
                                <Eye className="size-3.5 text-slate-400" /> View Details
                              </Link>

                              {canEditMaster && (
                                <Link
                                  to={`/masters/vendors/${vendor.id}/edit`}
                                  onClick={() => setOpenActionId(null)}
                                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0274BB] transition-colors"
                                >
                                  <Edit2 className="size-3.5 text-slate-400" /> Edit Profile
                                </Link>
                              )}

                              {canEditMaster && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    onToggleStatus(vendor.id);
                                  }}
                                  disabled={isToggling}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100 cursor-pointer"
                                >
                                  {vendor.status === 'ACTIVE' ? (
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
              {vendors.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            –{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(currentPage * pageSize, vendors.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-800">{vendors.length}</span> vendors
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

      {/* Outsourced Items Slide-Over Drawer */}
      {selectedOutsourceVendor && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedOutsourceVendor(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Truck className="size-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 leading-tight">
                        Outsourced Items & Instruments
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        {selectedOutsourceVendor.items.length}{' '}
                        {selectedOutsourceVendor.items.length === 1 ? 'Item' : 'Items'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Vendor:{' '}
                      <span className="font-semibold text-slate-800">
                        {selectedOutsourceVendor.vendorName}
                      </span>
                      {selectedOutsourceVendor.vendorCode && (
                        <span className="ml-1.5 font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                          {selectedOutsourceVendor.vendorCode}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOutsourceVendor(null)}
                  className="size-8 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Close Drawer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3">
                  <Package className="size-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-900 leading-relaxed">
                    These calibration items have been routed to{' '}
                    <strong className="font-semibold">Vendor Outsource</strong>. Track real-time
                    calibration progress, inward request links, and expected return schedules directly
                    from live database records.
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedOutsourceVendor.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{item.itemName}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {item.itemCode && (
                              <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#0274BB] border border-blue-200">
                                {item.itemCode}
                              </span>
                            )}
                            {item.serialNumber && (
                              <span className="font-mono text-[11px] text-slate-600 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                                SN: {item.serialNumber}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                          {item.status || 'OUTSOURCED'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 pt-2.5 border-t border-slate-100 text-xs text-slate-600">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Request / Inward #</span>
                          <span className="font-semibold text-slate-800 font-mono">
                            {item.requestNumber || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Client / Organization</span>
                          <span className="font-medium text-slate-800 truncate block">
                            {item.clientName || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Expected Return</span>
                          <span className="font-medium text-slate-800 flex items-center gap-1 font-mono">
                            <Calendar className="size-3 text-slate-400" />
                            {item.expectedReturnDate
                              ? new Date(item.expectedReturnDate).toLocaleDateString()
                              : 'Pending schedule'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Assigned Vendor</span>
                          <span className="font-medium text-slate-800 truncate block">
                            {item.vendorName || selectedOutsourceVendor.vendorName}
                          </span>
                        </div>
                      </div>

                      {item.remarks && (
                        <div className="text-[11px] text-slate-600 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                          <span className="font-semibold text-slate-700">Remarks: </span>
                          {item.remarks}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Total {selectedOutsourceVendor.items.length} outsourced{' '}
                  {selectedOutsourceVendor.items.length === 1 ? 'item' : 'items'}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedOutsourceVendor(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
