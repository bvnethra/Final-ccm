// application/src/pages/logistics/DispatchListPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useDispatches,
  useCalibrationRequests,
  useUpdateDispatchStatus,
  useRecordDelivery,
  useDeliveries,
  useApproveDispatch,
} from '../../hooks/useOperations';
import { useAuthContext } from '../../contexts/AuthContext';
import {
  Button,
  Badge,
  Input,
  Field,
  FieldLabel,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '../../components/ui/UIPrimitives';
import { TableBodySkeleton } from '../../components/ui/Skeleton';
import {
  Plus,
  Truck,
  AlertCircle,
  UserCheck,
  Package,
  Receipt,
  FileText,
  Clock,
  ArrowRight,
  Eye,
  Printer,
  X,
  PenTool,
  CheckCircle2,
  Check,
  Send,
  ShieldCheck,
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { useVendorReminders } from '../../hooks/useVendorReminders';
import { SignaturePad } from '../../components/ui/SignaturePad';
import type { Dispatch, Delivery } from '../../types/domain';
import { cn } from '../../lib/utils';

const AVATAR_PALETTES = [
  { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
];

export const DispatchListPage: React.FC = () => {
  const { tenantId, organizationId, user, isSuperAdmin, canPerform } = useAuthContext();
  const { data: dispatches = [], isLoading, error } = useDispatches();
  const { data: requests = [] } = useCalibrationRequests();
  const { data: deliveries = [] } = useDeliveries();
  const { reminders, count: vendorRemindersCount } = useVendorReminders();

  const updateStatusMutation = useUpdateDispatchStatus();
  const recordDeliveryMutation = useRecordDelivery();
  const approveDispatchMutation = useApproveDispatch();

  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);
  const [deliveryModalDispatch, setDeliveryModalDispatch] = useState<Dispatch | null>(null);
  const [selectedPODDelivery, setSelectedPODDelivery] = useState<{ dispatch: Dispatch; delivery?: Delivery } | null>(null);

  // DC Approval state
  const [approvalModalDispatch, setApprovalModalDispatch] = useState<Dispatch | null>(null);
  const [approverNotes, setApproverNotes] = useState<string>('');

  // Delivery form state
  const [receiverName, setReceiverName] = useState<string>('');
  const [receiverPhone, setReceiverPhone] = useState<string>('');
  const [deliverySignature, setDeliverySignature] = useState<string | undefined>();
  const [deliveryRemarks, setDeliveryRemarks] = useState<string>(
    'Received all calibrated instruments and tax invoice in satisfactory condition with seals intact.'
  );
  const [successToast, setSuccessToast] = useState<string | undefined>();
  const [deliveryError, setDeliveryError] = useState<string | undefined>();

  // Filter, search & pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DELIVERED' | 'IN_TRANSIT' | 'DISPATCHED' | 'APPROVED' | 'PENDING'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  const deliveredDispatches = dispatches.filter((d) => d.status === 'DELIVERED');
  const inTransitDispatches = dispatches.filter((d) => d.status === 'IN_TRANSIT');
  const dispatchedOnly = dispatches.filter((d) => d.status === 'DISPATCHED');
  const activeMovementCount = inTransitDispatches.length + dispatchedOnly.length;

  const getRequestInfo = (requestId: string) => {
    return requests.find((r) => r.id === requestId);
  };

  const getDeliveryInfo = (dispatchId: string) => {
    return deliveries.find((d) => d.dispatch_id === dispatchId);
  };

  const filteredDispatches = dispatches.filter((d) => {
    if (filterType === 'DELIVERED' && d.status !== 'DELIVERED') return false;
    if (filterType === 'IN_TRANSIT' && d.status !== 'IN_TRANSIT') return false;
    if (filterType === 'DISPATCHED' && d.status !== 'DISPATCHED') return false;
    if (filterType === 'APPROVED' && d.approval_status !== 'APPROVED') return false;
    if (filterType === 'PENDING' && d.approval_status === 'APPROVED') return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const req = getRequestInfo(d.request_id);
    const clientName = req?.clients?.client_name?.toLowerCase() || '';
    const reqNum = req?.request_number?.toLowerCase() || '';

    return (
      d.gate_pass_number.toLowerCase().includes(query) ||
      (d.tracking_number && d.tracking_number.toLowerCase().includes(query)) ||
      (d.recipient_name && d.recipient_name.toLowerCase().includes(query)) ||
      (d.courier_partner && d.courier_partner.toLowerCase().includes(query)) ||
      (d.collection_agent_name && d.collection_agent_name.toLowerCase().includes(query)) ||
      clientName.includes(query) ||
      reqNum.includes(query)
    );
  });

  const totalItems = filteredDispatches.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * itemsPerPage;
  const paginatedDispatches = filteredDispatches.slice(startIndex, startIndex + itemsPerPage);

  const handleApproveDispatch = async (approved: boolean) => {
    if (!approvalModalDispatch || !tenantId) return;
    try {
      await approveDispatchMutation.mutateAsync({
        tenantId,
        organizationId: organizationId || '',
        dispatchId: approvalModalDispatch.id,
        approved,
        actorUserId: user?.id,
        actorName: user?.fullName || user?.email || 'Logistics Incharge',
        approverNotes,
      });
      setApprovalModalDispatch(null);
      setSuccessToast(`Delivery Challan ${approvalModalDispatch.gate_pass_number} ${approved ? 'Approved' : 'Rejected'} successfully!`);
    } catch (err: any) {
      setDeliveryError(err.message || 'Failed to update DC approval.');
    }
  };

  const handleOpenDeliveryModal = (dispatch: Dispatch) => {
    setDeliveryModalDispatch(dispatch);
    setDeliveryError(undefined);
    setReceiverName(dispatch.recipient_name || '');
    setReceiverPhone(dispatch.recipient_phone || '');
    // Pre-populate client signature if already drawn during collection agent handover
    setDeliverySignature(dispatch.client_signature || undefined);
    setDeliveryRemarks(
      'Received all calibrated instruments and tax invoice in satisfactory condition with seals intact.'
    );
  };

  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryModalDispatch || !tenantId) return;

    if (!receiverName.trim()) {
      setDeliveryError('Please enter the client receiver name.');
      return;
    }

    if (!deliverySignature) {
      setDeliveryError('Client digital signature is required for delivery receipt confirmation.');
      return;
    }

    try {
      await recordDeliveryMutation.mutateAsync({
        tenantId,
        organizationId: organizationId || '',
        dispatchId: deliveryModalDispatch.id,
        receivedBy: receiverName.trim(),
        recipientPhone: receiverPhone.trim() || undefined,
        signature: deliverySignature,
        remarks: deliveryRemarks.trim(),
      });

      const req = getRequestInfo(deliveryModalDispatch.request_id);
      setDeliveryModalDispatch(null);
      setSuccessToast(
        `Delivery confirmed! Gate Pass ${deliveryModalDispatch.gate_pass_number} is DELIVERED and Work Order ${req?.request_number || ''} status transitioned to COMPLETED.`
      );
    } catch (err: any) {
      setDeliveryError(err.message || 'Failed to record delivery.');
    }
  };

  const handleAdvanceToInTransit = async (dispatchId: string) => {
    if (!tenantId) return;
    try {
      await updateStatusMutation.mutateAsync({
        dispatchId,
        status: 'IN_TRANSIT',
      });
      setSuccessToast('Consignment tracking status updated: IN TRANSIT.');
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-[4px] flex items-center justify-between animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-600" />
            <span className="font-semibold text-sm">{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(undefined)}
            className="text-emerald-700 hover:text-emerald-950 p-1"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* 5-Day Vendor Collection Alert Banner */}
      {vendorRemindersCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-200/70 text-amber-900 rounded-lg shrink-0 mt-0.5">
              <Clock className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-amber-900">
                  Collection Agent Reminder: {vendorRemindersCount} Vendor Outsource Return(s) Due
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-200 text-amber-900">
                  ≤ 5 Days Alert
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1">
                Outsource instruments sent to third-party calibration vendors are due within 5 days (or overdue). Collect these instruments to complete calibration and raise commercial invoices.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <Link to={`/requests/${reminders[0].requestId}`}>
              <Button variant="primary" size="sm" className="bg-amber-800 hover:bg-amber-900 text-white text-xs rounded-lg">
                View Due Items ({reminders[0].poNumber}) <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Top Header Banner matching Inward Request UI Command Center */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-[#0274BB] flex items-center justify-center text-white shadow-sm shrink-0">
            <Truck className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                Logistics &amp; Dispatch Registry
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#16A34A] border border-[#D1F2E0]">
                {dispatches.length} Gate Passes
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Lifecycle Process 5: Outward Material Dispatches, Courier Tracking &amp; Digital POD ({dispatches.length} Registered)
            </p>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs font-semibold text-[#0274BB] tracking-wide">
            Pack • Ship • Deliver
          </span>
          <div className="h-0.5 w-7 bg-[#0274BB] mt-1 rounded-full" />
        </div>
      </div>

      {/* Logistics & Material Movement Category Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <div className="px-4 py-2.5 text-sm font-bold text-[#0274BB] border-b-2 border-[#0274BB] flex items-center gap-2 cursor-pointer">
          <Truck className="size-4" />
          Outward Dispatches (Gate Passes)
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0274BB] border border-blue-200">
            {dispatches.length}
          </span>
        </div>
        <Link
          to="/requests"
          className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-900 border-b-2 border-transparent hover:border-slate-300 flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Package className="size-4 text-slate-400" />
          Equipment Inward Requests
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            {requests.length}
          </span>
        </Link>
      </div>

      {/* Filter and Search Bar matching Inward Request UI */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="size-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by gate pass #, AWB, recipient, courier, client..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition-all shadow-xs"
          />
        </div>

        {/* Filter Buttons & Primary Action matching Inward Request UI */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFilterType('ALL');
              setCurrentPage(1);
            }}
            className={cn(
              'px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
              filterType === 'ALL'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterType('DELIVERED');
              setCurrentPage(1);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
              filterType === 'DELIVERED'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <ShieldCheck
              className={cn(
                'size-4',
                filterType === 'DELIVERED' ? 'text-white' : 'text-emerald-500'
              )}
            />
            Delivered
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterType('IN_TRANSIT');
              setCurrentPage(1);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
              filterType === 'IN_TRANSIT'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <Send
              className={cn(
                'size-4',
                filterType === 'IN_TRANSIT' ? 'text-white' : 'text-amber-500'
              )}
            />
            In Transit
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterType('DISPATCHED');
              setCurrentPage(1);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
              filterType === 'DISPATCHED'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <Truck
              className={cn(
                'size-4',
                filterType === 'DISPATCHED' ? 'text-white' : 'text-blue-500'
              )}
            />
            Dispatched
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterType('APPROVED');
              setCurrentPage(1);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
              filterType === 'APPROVED'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <CheckCircle2
              className={cn(
                'size-4',
                filterType === 'APPROVED' ? 'text-white' : 'text-teal-500'
              )}
            />
            DC Approved
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterType('PENDING');
              setCurrentPage(1);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
              filterType === 'PENDING'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <Clock
              className={cn(
                'size-4',
                filterType === 'PENDING' ? 'text-white' : 'text-slate-400'
              )}
            />
            Pending
          </button>

          {(isSuperAdmin || canPerform('CREATE_REQUEST', 'CREATE')) && (
            <Link to="/logistics/dispatch/new">
              <Button className="bg-[#0274BB] hover:bg-[#02629e] text-white font-medium px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm shadow-xs transition-all cursor-pointer ml-1">
                <Plus className="size-4" /> Issue Gate Pass
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 4 Stat Metric Cards matching Inward Request UI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Gate Passes */}
        <div
          onClick={() => {
            setFilterType('ALL');
            setCurrentPage(1);
          }}
          className={cn(
            'bg-[#F8F6FF] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            filterType === 'ALL'
              ? 'border-purple-300 ring-2 ring-purple-400/20'
              : 'border-purple-100 hover:border-purple-200'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Truck className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">
                {isLoading ? '—' : dispatches.length}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">Total Gate Passes</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-purple-400" />
        </div>

        {/* Card 2: Delivered & Completed */}
        <div
          onClick={() => {
            setFilterType('DELIVERED');
            setCurrentPage(1);
          }}
          className={cn(
            'bg-[#F0FDF4] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            filterType === 'DELIVERED'
              ? 'border-emerald-300 ring-2 ring-emerald-400/20'
              : 'border-emerald-100 hover:border-emerald-200'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">
                {isLoading ? '—' : deliveredDispatches.length}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">Delivered &amp; Completed</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-emerald-400" />
        </div>

        {/* Card 3: In Transit / Active */}
        <div
          onClick={() => {
            setFilterType('IN_TRANSIT');
            setCurrentPage(1);
          }}
          className={cn(
            'bg-[#FFFBEB] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            filterType === 'IN_TRANSIT'
              ? 'border-amber-300 ring-2 ring-amber-400/20'
              : 'border-amber-100 hover:border-amber-200'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Send className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">
                {isLoading ? '—' : activeMovementCount}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">In Transit / Active</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-amber-500/60" />
        </div>

        {/* Card 4: Vendor Returns Due */}
        <div
          onClick={() => {
            setFilterType('ALL');
            setCurrentPage(1);
          }}
          className={cn(
            'bg-[#F0F7FF] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            'border-blue-100 hover:border-blue-200'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-blue-100 text-[#0274BB] flex items-center justify-center shrink-0">
              <Clock className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">
                {isLoading ? '—' : vendorRemindersCount}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">Vendor Returns Due</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-[#0274BB]/60" />
        </div>
      </div>
      {/* Dispatches Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">Gate Pass &amp; Order #</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Dispatch Mode</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Package Content</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Logistics / Agent</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Recipient &amp; Client</th>
                <th className="px-4 py-3.5 whitespace-nowrap">DC Approval</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Client Digital POD</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Tracking Status</th>
                <th className="px-5 py-3.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <TableBodySkeleton rows={6} columns={9} hasAvatar avatarShape="square" />
              ) : error ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center text-rose-600">
                    <AlertCircle className="size-6 mx-auto mb-2" />
                    {(error as Error).message}
                  </td>
                </tr>
              ) : filteredDispatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <Truck className="size-6" />
                      </div>
                      <h3 className="font-semibold text-base text-slate-900">No Gate Passes Found</h3>
                      <p className="text-xs text-slate-500">
                        {searchQuery
                          ? `No dispatches match "${searchQuery}". Try adjusting your search query.`
                          : 'Issue a gate pass to dispatch calibrated equipment or commercial invoices to clients.'}
                      </p>
                      <Link to="/logistics/dispatch/new">
                        <Button variant="secondary" size="sm" className="mt-2">
                          <Plus className="size-3.5 mr-1" /> Issue Gate Pass
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDispatches.map((d, idx) => {
                  const req = getRequestInfo(d.request_id);
                  const delivery = getDeliveryInfo(d.id);
                  const isCollectionAgent = d.dispatch_type === 'COLLECTION_AGENT' || (!d.dispatch_type && !d.courier_partner);
                  const isInvoiceOnly = d.package_type === 'INVOICE_ONLY';
                  const hasSignature = Boolean(d.client_signature || delivery?.signature_data_url);
                  const palette = AVATAR_PALETTES[idx % AVATAR_PALETTES.length];

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={cn('size-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border', palette.bg, palette.text, palette.border)}>
                            <Truck className="size-4" />
                          </div>
                            <div className="min-w-0">
                              <span
                                className="font-mono font-bold text-[#0274BB] block text-xs hover:underline cursor-pointer"
                                onClick={() => setSelectedDispatch(d)}
                              >
                                {d.gate_pass_number}
                              </span>
                              <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                                <span className="font-mono text-[10px] text-slate-500">
                                  WO: {req?.request_number || 'N/A'}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(d.dispatch_date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {isCollectionAgent ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <UserCheck className="size-3" /> Collection Agent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              <Truck className="size-3" /> Courier
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {isInvoiceOnly ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                              <Receipt className="size-3" /> Invoice Alone
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Package className="size-3" /> Items + Invoice
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {isCollectionAgent ? (
                            <div>
                              <span className="font-medium text-slate-800 block text-xs">
                                {d.collection_agent_name || d.dispatched_by || 'Field Personnel'}
                              </span>
                              {d.collection_agent_phone && (
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  {d.collection_agent_phone}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span className="font-medium text-slate-800 block text-xs">
                                {d.courier_partner || 'Courier Partner'}
                              </span>
                              <span className="text-[10px] text-[#0274BB] font-mono block">
                                AWB: {d.tracking_number || 'No AWB'}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-medium text-slate-800 block text-xs">
                            {d.recipient_name}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Building2 className="size-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[130px]" title={req?.clients?.client_name || 'Client Site'}>
                              {req?.clients?.client_name || 'Client Site'}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {d.approval_status === 'APPROVED' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="size-3 text-emerald-600" /> DC Approved
                            </span>
                          ) : d.approval_status === 'REJECTED' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <X className="size-3 text-rose-600" /> DC Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <Clock className="size-3 text-amber-600" /> Pending DC
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {hasSignature ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="size-3 text-emerald-600" /> Digitally Signed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <Clock className="size-3 text-amber-600" /> Sign on Delivery
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <Badge
                            variant={
                              d.status === 'DELIVERED'
                                ? 'success'
                                : d.status === 'IN_TRANSIT'
                                ? 'warning'
                                : 'primary'
                            }
                            pill
                            className="text-[10px]"
                          >
                            {d.status === 'DELIVERED' ? 'DELIVERED & COMPLETED' : d.status}
                          </Badge>
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {d.status !== 'DELIVERED' ? (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleOpenDeliveryModal(d)}
                                className="h-7 text-xs px-2.5 bg-emerald-700 hover:bg-emerald-800"
                              >
                                <PenTool className="size-3 mr-1" /> Record Delivery
                              </Button>
                            ) : (
                              <Button
                                variant="outlineInk"
                                size="sm"
                                onClick={() => setSelectedPODDelivery({ dispatch: d, delivery })}
                                className="h-7 text-xs px-2 text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                              >
                                <ShieldCheck className="size-3 mr-1 text-emerald-600" /> View POD
                              </Button>
                            )}

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setSelectedDispatch(d)}
                              className="h-7 text-xs px-2"
                            >
                              <Eye className="size-3 mr-1" /> Gate Pass
                            </Button>

                            {/* 3-dots Action Menu */}
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={() => setActiveActionMenuId(activeActionMenuId === d.id ? null : d.id)}
                                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                              >
                                <MoreVertical className="size-4" />
                              </button>

                              {activeActionMenuId === d.id && (
                                <div
                                  className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-slate-200 z-30 py-1 animate-in fade-in"
                                  onMouseLeave={() => setActiveActionMenuId(null)}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDispatch(d);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <FileText className="size-3.5 text-slate-400" /> View / Print Gate Pass
                                  </button>

                                  {d.status === 'DISPATCHED' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleAdvanceToInTransit(d.id);
                                        setActiveActionMenuId(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-xs text-[#0274BB] hover:bg-blue-50 flex items-center gap-2"
                                    >
                                      <Send className="size-3.5" /> Advance to In Transit
                                    </button>
                                  )}

                                  {d.status !== 'DELIVERED' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleOpenDeliveryModal(d);
                                        setActiveActionMenuId(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                                    >
                                      <PenTool className="size-3.5" /> Capture Client Signature
                                    </button>
                                  )}

                                  {d.status === 'DELIVERED' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedPODDelivery({ dispatch: d, delivery });
                                        setActiveActionMenuId(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                                    >
                                      <ShieldCheck className="size-3.5" /> Official Proof of Delivery
                                    </button>
                                  )}

                                  {(isSuperAdmin || canPerform('CREATE_REQUEST', 'APPROVE')) && d.approval_status !== 'APPROVED' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setApprovalModalDispatch(d);
                                        setApproverNotes('');
                                        setActiveActionMenuId(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-xs text-teal-700 hover:bg-teal-50 flex items-center gap-2"
                                    >
                                      <ShieldCheck className="size-3.5" /> Review &amp; Approve DC
                                    </button>
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

          {/* Numbered Pagination */}
          {!isLoading && filteredDispatches.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200 bg-[#F8FAFC] text-xs text-slate-500">
              <div>
                Showing <span className="font-semibold text-slate-800">{startIndex + 1}</span> to{' '}
                <span className="font-semibold text-slate-800">
                  {Math.min(startIndex + itemsPerPage, totalItems)}
                </span>{' '}
                of <span className="font-semibold text-slate-800">{totalItems}</span> gate passes
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validPage <= 1}
                  className="p-1 rounded border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="size-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - validPage) <= 1)
                  .map((page, i, arr) => {
                    const prevPage = arr[i - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${
                            validPage === page
                              ? 'bg-[#0274BB] text-white'
                              : 'border border-slate-200 hover:bg-white text-slate-700'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validPage >= totalPages}
                  className="p-1 rounded border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      {/* ==================================================================== */}
      {/* 1. Client Receipt & Delivery Signature Modal */}
      {/* ==================================================================== */}
      {deliveryModalDispatch && (
        <DialogOverlay onClick={() => setDeliveryModalDispatch(null)}>
          <DialogContent size="2xl" onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  <div>
                    <DialogTitle>Record Client Receipt &amp; Digital POD</DialogTitle>
                    <DialogDescription>
                      Capture client digital signature and complete order fulfillment
                    </DialogDescription>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeliveryModalDispatch(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="size-5" />
                </button>
              </div>
            </DialogHeader>

            <form onSubmit={handleConfirmDelivery} className="space-y-4">
              <DialogBody className="space-y-4">
                {deliveryError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded text-xs flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{deliveryError}</span>
                  </div>
                )}

                {/* Order Info Banner */}
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block font-semibold">GATE PASS #</span>
                    <span className="font-mono font-bold text-[#0274BB] text-sm">
                      {deliveryModalDispatch.gate_pass_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">PACKAGE TYPE</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {deliveryModalDispatch.package_type === 'INVOICE_ONLY'
                        ? 'Invoice Alone'
                        : 'Equipment Items + Tax Invoice'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>Client Receiver Name</FieldLabel>
                    <Input
                      placeholder="Full name of receiver"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Receiver Contact Phone</FieldLabel>
                    <Input
                      placeholder="+91 98765 43210"
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                    />
                  </Field>
                </div>

                {/* Digital Signature Pad */}
                <div className="border border-slate-200 rounded-md p-3 bg-slate-50/50">
                  <SignaturePad
                    value={deliverySignature}
                    onChange={(dataUrl) => setDeliverySignature(dataUrl)}
                    clientName={receiverName || deliveryModalDispatch.recipient_name}
                  />
                </div>

                <Field>
                  <FieldLabel>Delivery Condition / Handover Remarks</FieldLabel>
                  <Input
                    value={deliveryRemarks}
                    onChange={(e) => setDeliveryRemarks(e.target.value)}
                    placeholder="E.g. Package received with tamper-evident calibration seals intact."
                  />
                </Field>

                {/* Completion Notice */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Lifecycle Completion Trigger:</strong> Submitting this delivery receipt will mark Gate Pass as <strong>DELIVERED</strong> and permanently transition Calibration Work Order status to <strong>COMPLETED</strong>.
                  </span>
                </div>
              </DialogBody>

              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setDeliveryModalDispatch(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={recordDeliveryMutation.isPending}
                  className="bg-emerald-700 hover:bg-emerald-800"
                >
                  <Check className="size-4" />
                  {recordDeliveryMutation.isPending ? 'Completing Order...' : 'Confirm Delivery & Complete Order'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </DialogOverlay>
      )}

      {/* ==================================================================== */}
      {/* 2. Official Proof of Delivery (POD) & Receipt Modal */}
      {/* ==================================================================== */}
      {selectedPODDelivery && (
        <DialogOverlay onClick={() => setSelectedPODDelivery(null)}>
          <DialogContent size="2xl" onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-emerald-600" />
                  <div>
                    <DialogTitle>Proof of Delivery &amp; Client Receipt (POD)</DialogTitle>
                    <DialogDescription>
                      Official Handover &amp; Delivery Acknowledgment with Digital Signature
                    </DialogDescription>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPODDelivery(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="size-5" />
                </button>
              </div>
            </DialogHeader>

            <DialogBody className="space-y-4">
              <div className="border border-slate-300 rounded-lg p-5 space-y-4 bg-slate-50/50 text-xs">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="font-black text-base text-[#0274BB] uppercase tracking-wider">
                      NETHRA METROLOGY LABS
                    </h3>
                    <p className="text-[11px] text-slate-500">Accredited Calibration Facility • ISO/IEC 17025</p>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                      ✓ Official Handover &amp; Delivery Acknowledgment
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 block text-sm">
                      {selectedPODDelivery.dispatch.gate_pass_number}
                    </span>
                    <Badge variant="success" pill>
                      ORDER COMPLETED
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                      Delivery Timestamp
                    </span>
                    <span className="font-semibold text-slate-800">
                      {new Date(
                        selectedPODDelivery.delivery?.delivered_at || selectedPODDelivery.dispatch.dispatch_date
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                      Received By (Client Authorized)
                    </span>
                    <span className="font-semibold text-slate-800">
                      {selectedPODDelivery.delivery?.received_by || selectedPODDelivery.dispatch.recipient_name}
                    </span>
                    {selectedPODDelivery.dispatch.recipient_phone && (
                      <span className="text-[11px] text-slate-500 block">
                        {selectedPODDelivery.dispatch.recipient_phone}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                    Handover Remarks
                  </span>
                  <p className="text-slate-700 italic bg-white p-2 rounded border border-slate-200 mt-1">
                    "{selectedPODDelivery.delivery?.remarks || 'Received in satisfactory condition with seals intact.'}"
                  </p>
                </div>

                {/* Client Digital Signature Display */}
                <div className="border-t border-slate-200 pt-3">
                  <span className="text-slate-500 block uppercase font-semibold text-[10px] mb-2 flex items-center gap-1.5">
                    <PenTool className="size-3 text-emerald-600" /> Client Handover Digital Signature
                  </span>

                  {selectedPODDelivery.dispatch.client_signature || selectedPODDelivery.delivery?.signature_data_url ? (
                    <div className="p-3 bg-white border border-slate-200 rounded-md flex items-center justify-between">
                      <div>
                        <img
                          src={
                            selectedPODDelivery.delivery?.signature_data_url ||
                            selectedPODDelivery.dispatch.client_signature
                          }
                          alt="Client Handover Signature"
                          className="h-14 max-w-[200px] object-contain"
                        />
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Digitally verified by{' '}
                          {selectedPODDelivery.delivery?.received_by || selectedPODDelivery.dispatch.recipient_name}
                        </span>
                      </div>
                      <div className="text-right text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-semibold">
                        <CheckCircle2 className="size-4 inline mr-1 text-emerald-600" />
                        Client Verified
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-white border border-dashed border-slate-300 rounded-md text-xs text-slate-400 text-center">
                      Signed on physical paper delivery challan.
                    </div>
                  )}
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                variant="outlineInk"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-1.5"
              >
                <Printer className="size-4" /> Print POD Receipt
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedPODDelivery(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogOverlay>
      )}

      {/* ==================================================================== */}
      {/* 3. Gate Pass Print / Preview Modal */}
      {/* ==================================================================== */}
      {selectedDispatch && (
        <DialogOverlay onClick={() => setSelectedDispatch(null)}>
          <DialogContent size="3xl" onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <FileText className="size-5 text-[#0274BB]" />
                  <div>
                    <DialogTitle>Official Outward Gate Pass</DialogTitle>
                    <DialogDescription>
                      Authorized Dispatch Authorization &amp; Material Movement Pass
                    </DialogDescription>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDispatch(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="size-5" />
                </button>
              </div>
            </DialogHeader>

            <DialogBody className="space-y-4">
              {/* Printable Pass Body */}
              <div className="border border-slate-300 rounded-lg p-5 space-y-4 bg-slate-50/50">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="font-black text-lg text-[#0274BB] uppercase tracking-wider">
                      NETHRA METROLOGY LABS
                    </h3>
                    <p className="text-xs text-slate-500">ISO/IEC 17025 Accredited Calibration Facility</p>
                    <p className="text-[11px] text-slate-400">Outward Material Dispatch Authorization</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-base font-bold text-slate-900 block">
                      {selectedDispatch.gate_pass_number}
                    </span>
                    <span className="text-xs text-slate-500">
                      Date: {new Date(selectedDispatch.dispatch_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Tracking Progress Timeline */}
                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                    Dispatch &amp; Delivery Tracking Stage
                  </span>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      <span>Dispatched</span>
                    </div>
                    <div className="h-0.5 w-12 bg-emerald-500" />
                    <div
                      className={`flex items-center gap-1.5 font-semibold ${
                        selectedDispatch.status === 'IN_TRANSIT' || selectedDispatch.status === 'DELIVERED'
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                      }`}
                    >
                      <Send className="size-4" />
                      <span>In Transit</span>
                    </div>
                    <div
                      className={`h-0.5 w-12 ${
                        selectedDispatch.status === 'DELIVERED' ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                    <div
                      className={`flex items-center gap-1.5 font-semibold ${
                        selectedDispatch.status === 'DELIVERED' ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      <CheckCircle2 className="size-4" />
                      <span>Delivered &amp; Completed</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block uppercase font-semibold text-[10px]">
                      Dispatch Mode
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {selectedDispatch.dispatch_type === 'COLLECTION_AGENT' || !selectedDispatch.courier_partner
                        ? 'Collection Agent Direct Delivery'
                        : `Courier: ${selectedDispatch.courier_partner}`}
                    </span>
                    {selectedDispatch.tracking_number && (
                      <span className="block font-mono text-slate-600 mt-0.5">
                        AWB #{selectedDispatch.tracking_number}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 block uppercase font-semibold text-[10px]">
                      Package Classification
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {selectedDispatch.package_type === 'INVOICE_ONLY'
                        ? 'Invoice Alone (Commercial Billing Document)'
                        : 'Item + Invoice (Equipment with Official Tax Invoice)'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs border-t border-slate-200 pt-3">
                  <div>
                    <span className="text-slate-400 block uppercase font-semibold text-[10px]">
                      Dispatched / Delivered By
                    </span>
                    <span className="font-semibold text-slate-800">
                      {selectedDispatch.collection_agent_name || selectedDispatch.dispatched_by || 'Authorized Field Personnel'}
                    </span>
                    {selectedDispatch.collection_agent_phone && (
                      <span className="block text-slate-500">{selectedDispatch.collection_agent_phone}</span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 block uppercase font-semibold text-[10px]">
                      Receiver / Client Details
                    </span>
                    <span className="font-semibold text-slate-800">{selectedDispatch.recipient_name}</span>
                    {selectedDispatch.recipient_phone && (
                      <span className="block text-slate-500">{selectedDispatch.recipient_phone}</span>
                    )}
                  </div>
                </div>

                {/* Client Digital Signature Display */}
                <div className="border-t border-slate-200 pt-3">
                  <span className="text-slate-500 block uppercase font-semibold text-[10px] mb-2 flex items-center gap-1.5">
                    <PenTool className="size-3 text-[#0274BB]" /> Client Handover Acknowledgment &amp; Digital Signature
                  </span>

                  {selectedDispatch.client_signature ? (
                    <div className="p-3 bg-white border border-slate-200 rounded-md flex items-center justify-between">
                      <div>
                        <img
                          src={selectedDispatch.client_signature}
                          alt="Client Digital Signature"
                          className="h-14 max-w-[200px] object-contain"
                        />
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Digitally verified by {selectedDispatch.recipient_name} on{' '}
                          {new Date(selectedDispatch.dispatch_date).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                        <CheckCircle2 className="size-4 inline mr-1 text-emerald-600" />
                        Client Acknowledged
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-white border border-dashed border-slate-300 rounded-md text-xs text-slate-400 text-center">
                      {selectedDispatch.dispatch_type === 'COURIER'
                        ? 'Consignment dispatched via courier service (Signed on delivery slip).'
                        : 'No digital signature recorded on this dispatch.'}
                    </div>
                  )}
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                variant="outlineInk"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-1.5"
              >
                <Printer className="size-4" /> Print Gate Pass
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedDispatch(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogOverlay>
      )}

      {/* Formal Delivery Challan (DC) Approval Modal */}
      {approvalModalDispatch && (
        <DialogOverlay onClick={() => setApprovalModalDispatch(null)}>
          <DialogContent size="xl" onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-[#0274BB]" />
                  <div>
                    <DialogTitle>Review &amp; Approve Delivery Challan</DialogTitle>
                    <DialogDescription className="font-mono">
                      Gate Pass #{approvalModalDispatch.gate_pass_number}
                    </DialogDescription>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setApprovalModalDispatch(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded"
                >
                  <X className="size-4" />
                </button>
              </div>
            </DialogHeader>

            <DialogBody className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500 block">Dispatch Mode:</span>
                  <span className="font-bold text-gray-900 text-sm">{approvalModalDispatch.dispatch_type || 'Collection Agent'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Package Type:</span>
                  <span className="font-bold text-gray-900 text-sm">{approvalModalDispatch.package_type || 'Items & Invoice'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Recipient:</span>
                  <span className="font-semibold text-gray-900">{approvalModalDispatch.recipient_name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Dispatch Date:</span>
                  <span className="font-mono text-gray-900">{new Date(approvalModalDispatch.dispatch_date).toLocaleDateString()}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1 text-xs">DC Approver Clearance Remarks</label>
                <textarea
                  rows={3}
                  value={approverNotes}
                  onChange={(e) => setApproverNotes(e.target.value)}
                  placeholder="Enter gate pass clearance remarks or outward authorization notes..."
                  className="w-full text-xs border border-gray-300 rounded p-2.5 focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setApprovalModalDispatch(null)}
              >
                Cancel
              </Button>
              <Button
                variant="outlineInk"
                size="sm"
                onClick={() => handleApproveDispatch(false)}
                disabled={approveDispatchMutation.isPending}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Reject DC
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleApproveDispatch(true)}
                disabled={approveDispatchMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="size-3.5" /> Approve &amp; Release Gate Pass
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogOverlay>
      )}
    </div>
  );
};

export default DispatchListPage;
