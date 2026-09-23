// application/src/pages/commercial/QuotationListPage.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  useQuotations,
  useApproveQuotation,
  useCreateInvoice,
  useCalibrationRequests,
} from '../../hooks/useOperations';
import { useClients } from '../../hooks/useClientMaster';
import { useAuthContext } from '../../contexts/AuthContext';
import {
  Button,
  Input,
  Textarea,
  Field,
  FieldLabel,
} from '../../components/ui/UIPrimitives';
import type { Quotation, QuotationItem, CalibrationRequest } from '../../types/domain';
import {
  Plus,
  FileText,
  AlertCircle,
  CheckCircle2,
  Receipt,
  X,
  Check,
  CheckSquare,
  Square,
  Clock,
  Eye,
<<<<<<< Updated upstream
  Search,
  ChevronRight,
  MoreVertical,
  IndianRupee,
  Building2,
  Layers,
=======
  RefreshCw,
  Sparkles,
>>>>>>> Stashed changes
} from 'lucide-react';
import { cn } from '../../lib/utils';

const AVATAR_PALETTES = [
  { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
];

const getOrGenerateClientPoRef = (
  quote: Quotation,
  requestsList: CalibrationRequest[],
  clientsList: any[]
): string => {
  // 1. Direct quote PO ref if already stored
  if (quote.client_po_ref && quote.client_po_ref.trim()) {
    return quote.client_po_ref.trim();
  }

  // 2. Auto-fetch from linked Inward Calibration Request
  const linkedReq = requestsList.find((r) => r.id === quote.request_id) || quote.calibration_requests;
  if (linkedReq?.client_po_ref && linkedReq.client_po_ref.trim()) {
    return linkedReq.client_po_ref.trim();
  }

  // 3. Auto-generate dynamically using Client code + Year + sequence
  const client =
    clientsList.find((c) => c.id === quote.client_id || c.id === linkedReq?.client_id) ||
    linkedReq?.clients;
  const year = new Date().getFullYear();
  const clientCode = client?.client_code ? client.client_code.toUpperCase() : 'CLIENT';
  const numSeq = quote.quotation_number
    ? quote.quotation_number.replace(/\D/g, '').slice(-3) || '001'
    : String(Math.floor(100 + Math.random() * 900));

  return `PO/${year}/${clientCode}-${numSeq}`;
};

export const QuotationListPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenantId, organizationId, isLabApprover, canPerform, getPermissionLevel, isSuperAdmin } = useAuthContext();
<<<<<<< Updated upstream
  const { data: quotations = [], isLoading } = useQuotations();
=======
  const { data: quotations = [], isLoading, error } = useQuotations();
  const { data: requests = [] } = useCalibrationRequests();
  const { data: clients = [] } = useClients();
>>>>>>> Stashed changes
  const approveQuotationMutation = useApproveQuotation();
  const createInvoiceMutation = useCreateInvoice();

  const canApproveQuotation = isSuperAdmin || isLabApprover || getPermissionLevel('CREATE_QUOTATION') === 'APPROVE';
  const canCreateQuotation = isSuperAdmin || (!canApproveQuotation && canPerform('CREATE_QUOTATION', 'CREATE'));
  const canCreateInvoice = isSuperAdmin || canPerform('CREATE_INVOICE', 'CREATE');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'INVOICED' | 'REJECTED'>('ALL');

  // Approval Modal State
  const [approvalModalQuote, setApprovalModalQuote] = useState<Quotation | null>(null);
  const [clientPoRef, setClientPoRef] = useState<string>('');
  const [approverNotes, setApproverNotes] = useState<string>('');

  // Invoice Generation Modal State (Partial vs Actual)
  const [invoiceModalQuote, setInvoiceModalQuote] = useState<Quotation | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [clientPoForInvoice, setClientPoForInvoice] = useState<string>('');
  const [invoiceItemRates, setInvoiceItemRates] = useState<Record<string, number>>({});
  const [invoiceDiscountPercent, setInvoiceDiscountPercent] = useState<number>(0);
  const [invoiceDiscountAmount, setInvoiceDiscountAmount] = useState<number>(0);
  const [editableInvoiceTotal, setEditableInvoiceTotal] = useState<number>(0);
  const [invoiceLastEdited, setInvoiceLastEdited] = useState<'PERCENT' | 'AMOUNT' | 'TOTAL'>('PERCENT');

  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();

<<<<<<< Updated upstream
  // Dynamic live metrics (zero hardcoding)
  const totalCount = quotations.length;
  const approvedCount = useMemo(
    () => quotations.filter((q) => q.status === 'APPROVED' || q.status === 'INVOICED' || q.status === 'PARTIALLY_INVOICED').length,
    [quotations]
  );
  const pendingCount = useMemo(
    () => quotations.filter((q) => q.status === 'DRAFT' || q.status === 'SENT').length,
    [quotations]
  );
  const totalCommercialValue = useMemo(
    () => quotations.reduce((sum, q) => sum + (Number(q.total_amount) || 0), 0),
    [quotations]
  );

  // Client-side filtering
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      // Filter by status
      if (statusFilter === 'APPROVED' && !['APPROVED', 'INVOICED', 'PARTIALLY_INVOICED'].includes(q.status)) return false;
      if (statusFilter === 'PENDING' && !['DRAFT', 'SENT'].includes(q.status)) return false;
      if (statusFilter === 'INVOICED' && q.status !== 'INVOICED') return false;
      if (statusFilter === 'REJECTED' && q.status !== 'REJECTED') return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const clientName = q.calibration_requests?.clients?.client_name?.toLowerCase();
        const matches =
          q.quotation_number?.toLowerCase().includes(query) ||
          q.client_po_ref?.toLowerCase().includes(query) ||
          clientName?.includes(query) ||
          q.request_id?.toLowerCase().includes(query) ||
          q.items?.some((it) => it.description?.toLowerCase().includes(query));
        if (!matches) return false;
      }

      return true;
    });
  }, [quotations, searchQuery, statusFilter]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredQuotations.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const pagedQuotations = filteredQuotations.slice(
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

  // Modal Handlers
=======
  // Open Approval Modal - Auto-fetches or auto-generates Client PO Reference
>>>>>>> Stashed changes
  const handleOpenApprovalModal = (q: Quotation) => {
    setApprovalModalQuote(q);
    const po = getOrGenerateClientPoRef(q, requests, clients);
    setClientPoRef(po);
    setApproverNotes(q.approver_notes || '');
    setErrorMessage(undefined);
  };

  const handleConfirmApproval = async (approved: boolean) => {
    if (!approvalModalQuote || !tenantId) return;

    if (approved && !clientPoRef.trim()) {
      setErrorMessage('Please provide a Client Purchase Order (PO) reference for approval.');
      return;
    }

    try {
      await approveQuotationMutation.mutateAsync({
        tenantId,
        quotationId: approvalModalQuote.id,
        requestId: approvalModalQuote.request_id,
        approved,
        clientPoRef: clientPoRef.trim() || undefined,
        approverNotes: approverNotes.trim() || undefined,
      });

      setSuccessMessage(
        approved
          ? `Quotation ${approvalModalQuote.quotation_number} approved! PO Ref linked: ${clientPoRef}. You can now generate the Tax Invoice.`
          : `Quotation ${approvalModalQuote.quotation_number} marked as Rejected.`
      );
      setApprovalModalQuote(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update quotation approval status.');
    }
  };

  const handleOpenInvoiceModal = (q: Quotation) => {
    setInvoiceModalQuote(q);
    const po = getOrGenerateClientPoRef(q, requests, clients);
    setClientPoForInvoice(po);
    setErrorMessage(undefined);
    const unbilled = (q.items || []).filter((it) => !it.invoiced);
    setSelectedItemIds(new Set(unbilled.map((it) => it.id)));

    const rates: Record<string, number> = {};
    unbilled.forEach((it) => {
      rates[it.id] = it.unit_price;
    });
    setInvoiceItemRates(rates);
    setInvoiceDiscountPercent(0);
    setInvoiceDiscountAmount(0);
    setEditableInvoiceTotal(0);
    setInvoiceLastEdited('PERCENT');
  };

  const toggleItemCheck = (itemId: string) => {
    setSelectedItemIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(itemId)) {
        copy.delete(itemId);
      } else {
        copy.add(itemId);
      }
      return copy;
    });
  };

  const toggleSelectAllUnbilled = (unbilledItems: QuotationItem[]) => {
    if (selectedItemIds.size === unbilledItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(unbilledItems.map((it) => it.id)));
    }
  };

  const handleConfirmGenerateInvoice = async () => {
    if (!invoiceModalQuote || !tenantId) return;

    const unbilledItems = (invoiceModalQuote.items || []).filter((it) => !it.invoiced);
    const chosenItems = unbilledItems.filter((it) => selectedItemIds.has(it.id));

    if (chosenItems.length === 0) {
      setErrorMessage('Please select at least one item to generate an invoice.');
      return;
    }

<<<<<<< Updated upstream
=======
    // Determine Partial vs Actual
>>>>>>> Stashed changes
    const totalItemsCount = (invoiceModalQuote.items || []).length;
    const previouslyInvoicedCount = (invoiceModalQuote.items || []).filter((it) => it.invoiced).length;
    const isActualInvoice = previouslyInvoicedCount + chosenItems.length >= totalItemsCount;
    const invoiceType = isActualInvoice ? 'ACTUAL' : 'PARTIAL';

    const invoiceSubtotal = chosenItems.reduce(
      (sum, it) => sum + it.quantity * (invoiceItemRates[it.id] ?? it.unit_price),
      0
    );

    let activeDiscount = 0;
    if (invoiceLastEdited === 'TOTAL' && editableInvoiceTotal > 0) {
      const netTaxable = editableInvoiceTotal / 1.18;
      activeDiscount = Math.max(0, invoiceSubtotal - netTaxable);
    } else if (invoiceLastEdited === 'AMOUNT') {
      activeDiscount = Math.min(invoiceSubtotal, Math.max(0, invoiceDiscountAmount));
    } else {
      activeDiscount = (invoiceSubtotal * Math.min(100, Math.max(0, invoiceDiscountPercent))) / 100;
    }

    const taxable = Math.max(0, invoiceSubtotal - activeDiscount);
    const invoiceTax = (taxable * 18) / 100;
    const finalTotal = taxable + invoiceTax;

    try {
      await createInvoiceMutation.mutateAsync({
        tenantId,
        organizationId: organizationId || '',
        quotationId: invoiceModalQuote.id,
        requestId: invoiceModalQuote.request_id,
        clientId: 'CLIENT-ACTIVE',
        clientPoRef: clientPoForInvoice.trim() || invoiceModalQuote.client_po_ref || undefined,
        invoiceType,
        selectedItemIds: Array.from(selectedItemIds),
        subtotal: invoiceSubtotal,
        discountAmount: activeDiscount,
        taxAmount: invoiceTax,
        totalAmount: finalTotal,
        items: chosenItems.map((it) => {
          const unitRate = invoiceItemRates[it.id] ?? it.unit_price;
          return {
            quotationItemId: it.id,
            description: it.description,
            quantity: it.quantity,
            unitPrice: unitRate,
            totalPrice: it.quantity * unitRate,
          };
        }),
      });

      setInvoiceModalQuote(null);
      navigate('/commercial/invoices');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate invoice.');
    }
  };

<<<<<<< Updated upstream
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F8F0] text-[#16A34A] border border-[#D1F2E0] whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-[#16A34A]" /> APPROVED
          </span>
        );
      case 'INVOICED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-emerald-600" /> INVOICED
          </span>
        );
      case 'PARTIALLY_INVOICED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-amber-500" /> PARTIALLY INVOICED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-rose-600" /> REJECTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0274BB] border border-blue-200 whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-[#0274BB]" /> PENDING APPROVAL
          </span>
        );
    }
  };
=======
  // Type filter state
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | 'INWARD_REQUEST' | 'EXISTING_CUSTOMER' | 'NEW_CLIENT_ESTIMATE'>('ALL');

  // Filtered quotations
  const filteredQuotations = quotations.filter((q) => {
    if (selectedTypeFilter === 'ALL') return true;
    return (q.quotation_type || 'INWARD_REQUEST') === selectedTypeFilter;
  });
>>>>>>> Stashed changes

  return (
    <div className="space-y-5">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
<<<<<<< Updated upstream
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-[#0274BB] flex items-center justify-center text-white shadow-sm shrink-0">
            <FileText className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              Commercial Quotations
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Process 4: Metrology Commercial Pricing, Client PO Approvals &amp; Quotations ({totalCount} Registered)
            </p>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs font-semibold text-[#0274BB] tracking-wide">
            Price • Approve • Bill
          </span>
          <div className="h-0.5 w-7 bg-[#0274BB] mt-1 rounded-full" />
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(undefined)} className="text-emerald-500 hover:text-emerald-800">
            <X className="size-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(undefined)} className="text-rose-500 hover:text-rose-800">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="size-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by quotation #, request #, client name, PO ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition-all shadow-xs"
          />
        </div>

        {/* Filter Buttons & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              statusFilter === 'ALL'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            All Quotes
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('APPROVED')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              statusFilter === 'APPROVED'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                statusFilter === 'APPROVED' ? 'bg-white' : 'bg-emerald-500'
              )}
            />
            Approved ({approvedCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('PENDING')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              statusFilter === 'PENDING'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                statusFilter === 'PENDING' ? 'bg-white' : 'bg-blue-500'
              )}
            />
            Pending ({pendingCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('INVOICED')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              statusFilter === 'INVOICED'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                statusFilter === 'INVOICED' ? 'bg-white' : 'bg-cyan-500'
              )}
            />
            Invoiced
          </button>

=======
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#111827]">Quotations</h1>
            <Badge variant="primary">{quotations.length} Total</Badge>
          </div>
          <p className="text-sm text-[#6B7280]">
            Manage all 3 quotation modes: Inward Collection Requests, Existing Customer repeat quotes, and New Client Estimates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/commercial/invoices">
            <Button variant="outlineInk">
              <Receipt className="size-4" /> View Invoices
            </Button>
          </Link>
>>>>>>> Stashed changes
          {canCreateQuotation && (
            <Link to="/commercial/quotations/new">
              <Button className="bg-[#0274BB] hover:bg-[#02629e] text-white font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 text-xs shadow-xs transition-all cursor-pointer">
                <Plus className="size-3.5" /> New Quotation
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Quotations */}
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
              <FileText className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{totalCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Total Quotations</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-purple-400" />
        </div>

        {/* Card 2: Approved & PO Linked */}
        <div
          onClick={() => setStatusFilter('APPROVED')}
          className={cn(
            'bg-[#F0FDF4] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            statusFilter === 'APPROVED'
              ? 'border-emerald-300 ring-2 ring-emerald-400/20'
              : 'border-emerald-100 hover:border-emerald-200'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <span className="size-3 rounded-full bg-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{approvedCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Approved &amp; PO Linked</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-emerald-400" />
        </div>

<<<<<<< Updated upstream
        {/* Card 3: Pending Approvals */}
        <div
          onClick={() => setStatusFilter('PENDING')}
          className={cn(
            'bg-[#F8FAFC] border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-sm',
            statusFilter === 'PENDING'
              ? 'border-slate-300 ring-2 ring-slate-400/20'
              : 'border-slate-200 hover:border-slate-300'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <span className="size-3 rounded-full bg-slate-400" />
=======
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setSelectedTypeFilter('ALL')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t transition-colors ${
            selectedTypeFilter === 'ALL'
              ? 'bg-[#0274BB] text-white'
              : 'bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]'
          }`}
        >
          All ({quotations.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedTypeFilter('INWARD_REQUEST')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t transition-colors ${
            selectedTypeFilter === 'INWARD_REQUEST'
              ? 'bg-[#0274BB] text-white'
              : 'bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]'
          }`}
        >
          Inward Requests ({quotations.filter((q) => (q.quotation_type || 'INWARD_REQUEST') === 'INWARD_REQUEST').length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedTypeFilter('EXISTING_CUSTOMER')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t transition-colors ${
            selectedTypeFilter === 'EXISTING_CUSTOMER'
              ? 'bg-[#0274BB] text-white'
              : 'bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]'
          }`}
        >
          Existing Customer ({quotations.filter((q) => q.quotation_type === 'EXISTING_CUSTOMER').length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedTypeFilter('NEW_CLIENT_ESTIMATE')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t transition-colors ${
            selectedTypeFilter === 'NEW_CLIENT_ESTIMATE'
              ? 'bg-[#0274BB] text-white'
              : 'bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]'
          }`}
        >
          New Client Estimates ({quotations.filter((q) => q.quotation_type === 'NEW_CLIENT_ESTIMATE').length})
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quotations Repository</CardTitle>
          <CardDescription>
            Quotations can be created directly from Inward Requests, Existing Customer service records, or New Client registration estimates.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-[#6B7280]">
              <div className="size-6 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading quotations...
>>>>>>> Stashed changes
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{pendingCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Pending Client Approval</div>
            </div>
<<<<<<< Updated upstream
          </div>
          <ChevronRight className="size-5 text-slate-400" />
        </div>
=======
          ) : filteredQuotations.length === 0 ? (
            <div className="p-12 text-center text-[#6B7280] space-y-3">
              <FileText className="size-8 mx-auto text-[#9CA3AF]" />
              <p className="text-base font-semibold text-[#374151]">No quotations found</p>
              <p className="text-xs text-[#6B7280]">
                {selectedTypeFilter === 'ALL'
                  ? 'Create a new quotation from an inward request, existing customer, or new client estimate.'
                  : `No quotations found under category: ${selectedTypeFilter.replace(/_/g, ' ')}`}
              </p>
              {canCreateQuotation && (
                <Link to="/commercial/quotations/new">
                  <Button variant="secondary" size="sm" className="mt-2">
                    <Plus className="size-4" /> Generate New Quotation
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F5F7FA] border-b border-[#E5E7EB] text-[#374151] font-semibold text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3">Quotation #</th>
                    <th className="px-4 py-3">Quotation Type</th>
                    <th className="px-4 py-3">Client / Organization</th>
                    <th className="px-4 py-3">Client PO Reference</th>
                    <th className="px-4 py-3">Subtotal (₹)</th>
                    <th className="px-4 py-3">Discount (₹)</th>
                    <th className="px-4 py-3">Tax GST (₹)</th>
                    <th className="px-4 py-3">Total Amount (₹)</th>
                    <th className="px-4 py-3">Billing Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredQuotations.map((q) => {
                    const isApproved = q.status === 'APPROVED';
                    const isPartiallyInvoiced = q.status === 'PARTIALLY_INVOICED';
                    const isFullyInvoiced = q.status === 'INVOICED';
                    const isDraft = q.status === 'DRAFT' || q.status === 'SENT';
>>>>>>> Stashed changes

        {/* Card 4: Total Commercial Value */}
        <div
          className="bg-[#F0F7FF] border border-blue-100 rounded-xl p-4 flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-blue-100 text-[#0274BB] flex items-center justify-center shrink-0">
              <IndianRupee className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none font-mono">
                ₹{totalCommercialValue.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">Total Commercial Value</div>
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
                <th className="px-5 py-3.5 whitespace-nowrap">Quotation Info</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Client Account</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Scope &amp; Items</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Commercial Amount</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Client PO Ref</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Approval Status</th>
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
                      <span className="text-sm font-medium">Loading commercial quotations...</span>
                    </div>
                  </td>
                </tr>
              ) : pagedQuotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <FileText className="size-6" />
                      </div>
                      <h3 className="font-semibold text-base text-slate-900">No Quotations Found</h3>
                      <p className="text-xs text-slate-500">
                        No commercial quotations match your search or filter criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedQuotations.map((q, index) => {
                  const palette = AVATAR_PALETTES[index % AVATAR_PALETTES.length];
                  const unbilledCount = (q.items || []).filter((it) => !it.invoiced).length;

                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* QUOTATION INFO */}
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
                            <FileText className="size-5" />
                          </div>
                          <div>
                            <Link
                              to={`/commercial/quotations/${q.id}`}
                              className="font-semibold text-slate-900 text-sm hover:text-[#0274BB] transition-colors leading-tight line-clamp-1"
                              title={q.quotation_number}
=======
                    const quoteType = q.quotation_type || (q.request_id ? 'INWARD_REQUEST' : 'EXISTING_CUSTOMER');

                    return (
                      <tr key={q.id} className="hover:bg-[#FAFAFA]">
                        <td className="px-5 py-4 font-mono font-medium text-[#0274BB]">
                          <Link
                            to={`/commercial/quotations/${q.id}`}
                            className="hover:underline flex items-center gap-1 font-semibold"
                            title="Click to view printable official quotation"
                          >
                            {q.quotation_number}
                          </Link>
                          <span className="block text-[11px] text-[#6B7280] font-sans">
                            {new Date(q.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {quoteType === 'INWARD_REQUEST' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              Inward Request
                            </span>
                          )}
                          {quoteType === 'EXISTING_CUSTOMER' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              Existing Customer
                            </span>
                          )}
                          {quoteType === 'NEW_CLIENT_ESTIMATE' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              New Client Estimate
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs">
                          <span className="font-semibold text-[#111827] block">
                            {q.clients?.client_name || (q.client_id ? `Client: ${q.client_id.slice(0, 8)}...` : 'Standard Client')}
                          </span>
                          {q.request_id && (
                            <span className="text-[10px] text-[#6B7280] font-mono">
                              Req: {q.request_id.slice(0, 8)}...
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 font-mono text-xs">
                          {q.client_po_ref ? (
                            <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#1E40AF] rounded border border-[#BFDBFE] font-semibold">
                              {q.client_po_ref}
                            </span>
                          ) : (
                            <span className="text-[#9CA3AF] italic text-xs">Awaiting PO</span>
                          )}
                        </td>
                        <td className="px-4 py-4 font-mono text-[#374151]">
                          ₹{q.subtotal.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 font-mono text-[#6B7280]">
                          -₹{q.discount.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 font-mono text-[#6B7280]">
                          ₹{q.tax_amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 font-mono font-bold text-[#111827]">
                          ₹{q.total_amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <Badge
                              variant={
                                isFullyInvoiced
                                  ? 'success'
                                  : isPartiallyInvoiced
                                  ? 'warning'
                                  : isApproved
                                  ? 'primary'
                                  : q.status === 'REJECTED'
                                  ? 'error'
                                  : 'secondary'
                              }
>>>>>>> Stashed changes
                            >
                              {q.quotation_number}
                            </Link>
                            <span className="inline-block font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#0274BB] border border-blue-200 mt-1 whitespace-nowrap">
                              Ref: {q.request_id ? `REQ-${q.request_id.slice(0, 8)}` : 'DIRECT'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* CLIENT ACCOUNT */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                            <Building2 className="size-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[170px]">{q.calibration_requests?.clients?.client_name || 'Enterprise Client'}</span>
                          </div>
                          <div className="text-xs text-slate-500 ml-5 font-mono">
                            {q.calibration_requests?.clients?.city || 'Facility'}
                          </div>
                        </div>
                      </td>

                      {/* SCOPE & ITEMS */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium border border-slate-200">
                          <Layers className="size-3 text-slate-500" />
                          <span>{q.items?.length || 0} Item(s)</span>
                        </span>
                        {unbilledCount > 0 && (
                          <div className="text-[11px] text-[#0274BB] font-semibold mt-1">
                            {unbilledCount} Unbilled
                          </div>
                        )}
                      </td>

                      {/* COMMERCIAL AMOUNT */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-0.5 px-3 py-1 bg-[#E8F8F0] text-[#16A34A] rounded-md text-xs font-bold border border-[#D1F2E0]">
                          <IndianRupee className="size-3" />
                          <span>{Number(q.total_amount).toLocaleString('en-IN')}</span>
                        </div>
                        {q.tax_amount > 0 && (
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            (incl. 18% GST)
                          </div>
                        )}
                      </td>

                      {/* CLIENT PO REF */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {q.client_po_ref ? (
                          <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 font-mono text-xs font-semibold rounded tracking-wider whitespace-nowrap border border-slate-200">
                            {q.client_po_ref}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Pending PO</span>
                        )}
                      </td>

                      {/* APPROVAL STATUS */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {getStatusBadge(q.status)}
                      </td>

                      {/* SYSTEM AUDIT */}
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3 text-slate-400 shrink-0" />
                            <span>Date:</span>
                          </div>
                          <div className="text-slate-600 ml-4 font-mono text-[11px]">
                            {new Date(q.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 justify-end">
                          {canApproveQuotation && q.status === 'DRAFT' && (
                            <button
                              type="button"
                              onClick={() => handleOpenApprovalModal(q)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="size-3" /> Approve PO
                            </button>
                          )}

                          {canCreateInvoice && unbilledCount > 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenInvoiceModal(q)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-[#0274BB] hover:bg-blue-100 border border-blue-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Generate Tax Invoice from Quotation"
                            >
                              <Receipt className="size-3" /> Bill Items
                            </button>
                          )}

                          <div className="inline-block">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionId(openActionId === q.id ? null : q.id);
                              }}
                              className="size-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
                              title="Actions"
                            >
                              <MoreVertical className="size-4" />
                            </button>

                            {openActionId === q.id && (
                              <div
                                ref={actionMenuRef}
                                className="absolute right-5 top-12 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 text-left"
                              >
                                <Link
                                  to={`/commercial/quotations/${q.id}`}
                                  onClick={() => setOpenActionId(null)}
                                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0274BB] transition-colors"
                                >
                                  <Eye className="size-3.5 text-slate-400" /> View Formal Quotation
                                </Link>

                                {canApproveQuotation && q.status === 'DRAFT' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionId(null);
                                      handleOpenApprovalModal(q);
                                    }}
                                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                  >
                                    <Check className="size-3.5 text-emerald-600" /> Enter PO &amp; Approve
                                  </button>
                                )}

                                {canCreateInvoice && unbilledCount > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionId(null);
                                      handleOpenInvoiceModal(q);
                                    }}
                                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#0274BB] hover:bg-blue-50 transition-colors border-t border-slate-100 cursor-pointer"
                                  >
                                    <Receipt className="size-3.5 text-[#0274BB]" /> Raise Tax Invoice
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

        {/* Pagination Bar */}
        <div className="bg-white border-t border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-800">
              {filteredQuotations.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            –{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(currentPage * pageSize, filteredQuotations.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-800">{filteredQuotations.length}</span> quotations
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

      {/* Approval Modal */}
      {approvalModalQuote && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Approve Quotation &amp; Link Client PO
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {approvalModalQuote.quotation_number}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setApprovalModalQuote(null)}
                className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <Field>
<<<<<<< Updated upstream
                <FieldLabel>Client Purchase Order (PO) Number <span className="text-red-500">*</span></FieldLabel>
                <Input
                  placeholder="e.g. PO-2026-998812"
=======
                <div className="flex items-center justify-between mb-1">
                  <FieldLabel className="mb-0">
                    Client Purchase Order (PO) Reference # <span className="text-[#DC2626]">*</span>
                  </FieldLabel>
                  <button
                    type="button"
                    onClick={() => {
                      const year = new Date().getFullYear();
                      const linkedReq = requests.find((r) => r.id === approvalModalQuote.request_id);
                      const client = clients.find((c) => c.id === approvalModalQuote.client_id || c.id === linkedReq?.client_id);
                      const code = client?.client_code ? client.client_code.toUpperCase() : 'CLIENT';
                      const randomSeq = String(Math.floor(100 + Math.random() * 900));
                      setClientPoRef(`PO/${year}/${code}-${randomSeq}`);
                    }}
                    className="text-[11px] font-semibold text-[#0274BB] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="size-3" /> Auto Generate PO
                  </button>
                </div>
                <Input
                  placeholder="e.g. PO/2026/CLIENT-001"
>>>>>>> Stashed changes
                  value={clientPoRef}
                  onChange={(e) => setClientPoRef(e.target.value)}
                  className="mt-1"
                />
<<<<<<< Updated upstream
=======
                <p className="text-[11px] text-[#6B7280] mt-1 flex items-center gap-1">
                  <Sparkles className="size-3 text-emerald-600 shrink-0" />
                  Auto-fetched from inward request or auto-generated. You may edit directly.
                </p>
>>>>>>> Stashed changes
              </Field>

              <Field>
                <FieldLabel>Approver Notes (Optional)</FieldLabel>
                <Textarea
                  placeholder="Commercial terms verified, payment terms agreed..."
                  value={approverNotes}
                  onChange={(e) => setApproverNotes(e.target.value)}
                  rows={2}
                  className="mt-1"
                />
              </Field>
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleConfirmApproval(false)}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
              >
                Reject Quotation
              </button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outlineInk"
                  size="sm"
                  onClick={() => setApprovalModalQuote(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleConfirmApproval(true)}
                  disabled={!clientPoRef.trim()}
                >
                  Confirm Approval
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

<<<<<<< Updated upstream
      {/* Invoice Generation Modal */}
      {invoiceModalQuote && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Generate Tax Invoice (Partial or Full)
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Quotation: {invoiceModalQuote.quotation_number}
                </p>
=======
      {/* 2. Generate Invoice Modal: Partial vs Actual Invoicing with Checkboxes */}
      {invoiceModalQuote && (() => {
        const quoteItems = invoiceModalQuote.items || [];
        const unbilledItems = quoteItems.filter((it) => !it.invoiced);
        const previouslyInvoicedCount = quoteItems.filter((it) => it.invoiced).length;
        const selectedCount = selectedItemIds.size;

        const isActualInvoice =
          unbilledItems.length > 0 && previouslyInvoicedCount + selectedCount >= quoteItems.length;

        const selectedUnbilledItems = unbilledItems.filter((it) => selectedItemIds.has(it.id));
        const subtotalCalc = selectedUnbilledItems.reduce(
          (sum, it) => sum + it.quantity * (invoiceItemRates[it.id] ?? it.unit_price),
          0
        );

        let activeDiscount = 0;
        let activePercent = 0;
        let grandTotalCalc = 0;

        if (invoiceLastEdited === 'TOTAL' && editableInvoiceTotal > 0) {
          const netTaxable = editableInvoiceTotal / 1.18;
          activeDiscount = Math.max(0, subtotalCalc - netTaxable);
          activePercent = subtotalCalc > 0 ? (activeDiscount / subtotalCalc) * 100 : 0;
          grandTotalCalc = editableInvoiceTotal;
        } else if (invoiceLastEdited === 'AMOUNT') {
          activeDiscount = Math.min(subtotalCalc, Math.max(0, invoiceDiscountAmount));
          activePercent = subtotalCalc > 0 ? (activeDiscount / subtotalCalc) * 100 : 0;
          const taxable = Math.max(0, subtotalCalc - activeDiscount);
          const taxCalc = (taxable * 18) / 100;
          grandTotalCalc = taxable + taxCalc;
        } else {
          activePercent = Math.min(100, Math.max(0, invoiceDiscountPercent));
          activeDiscount = (subtotalCalc * activePercent) / 100;
          const taxable = Math.max(0, subtotalCalc - activeDiscount);
          const taxCalc = (taxable * 18) / 100;
          grandTotalCalc = taxable + taxCalc;
        }

        const taxCalc = ((Math.max(0, subtotalCalc - activeDiscount)) * 18) / 100;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
            <div className="bg-white rounded-[4px] shadow-2xl max-w-2xl w-full overflow-hidden border border-[#E5E7EB]">
              <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-[#F8FAFC]">
                <div className="flex items-center gap-2">
                  <Receipt className="size-5 text-[#0274BB]" />
                  <div>
                    <h3 className="font-bold text-[#111827] text-base">Generate Commercial Tax Invoice</h3>
                    <p className="text-xs text-[#6B7280]">
                      Quotation: <span className="font-mono text-[#0274BB]">{invoiceModalQuote.quotation_number}</span> (Editable pricing &amp; client discount)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInvoiceModalQuote(null)}
                  className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded hover:bg-[#E2E8F0]"
                >
                  <X className="size-4" />
                </button>
>>>>>>> Stashed changes
              </div>
              <button
                type="button"
                onClick={() => setInvoiceModalQuote(null)}
                className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

<<<<<<< Updated upstream
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <Field>
                <FieldLabel>Confirmed Client Purchase Order (PO)</FieldLabel>
                <Input
                  placeholder="PO Reference number"
                  value={clientPoForInvoice}
                  onChange={(e) => setClientPoForInvoice(e.target.value)}
                  className="mt-1"
                />
              </Field>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Select Line Items to Invoice
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      toggleSelectAllUnbilled(
                        (invoiceModalQuote.items || []).filter((it) => !it.invoiced)
                      )
                    }
                    className="text-xs text-[#0274BB] hover:underline font-semibold cursor-pointer"
                  >
                    Select All
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {(invoiceModalQuote.items || [])
                    .filter((it) => !it.invoiced)
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleItemCheck(item.id)}
                        className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          {selectedItemIds.has(item.id) ? (
                            <CheckSquare className="size-4 text-[#0274BB]" />
                          ) : (
                            <Square className="size-4 text-slate-300" />
                          )}
                          <div>
                            <div className="text-xs font-semibold text-slate-800">
                              {item.description}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Qty: {item.quantity} × ₹{item.unit_price}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs font-bold text-slate-900 font-mono">
                          ₹{item.total_price}
                        </div>
                      </div>
                    ))}
=======
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Client PO Field */}
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#1E293B]">Client Purchase Order Reference</label>
                    <button
                      type="button"
                      onClick={() => {
                        const year = new Date().getFullYear();
                        const linkedReq = requests.find((r) => r.id === invoiceModalQuote.request_id);
                        const client = clients.find((c) => c.id === invoiceModalQuote.client_id || c.id === linkedReq?.client_id);
                        const code = client?.client_code ? client.client_code.toUpperCase() : 'CLIENT';
                        const randomSeq = String(Math.floor(100 + Math.random() * 900));
                        setClientPoForInvoice(`PO/${year}/${code}-${randomSeq}`);
                      }}
                      className="text-[11px] font-semibold text-[#0274BB] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="size-3" /> Auto Generate PO
                    </button>
                  </div>
                  <Input
                    placeholder="e.g. PO/2026/CLIENT-001"
                    value={clientPoForInvoice}
                    onChange={(e) => setClientPoForInvoice(e.target.value)}
                  />
                  <p className="text-[11px] text-[#6B7280] flex items-center gap-1">
                    <Sparkles className="size-3 text-emerald-600 shrink-0" />
                    Auto-fetched from quotation/request or auto-generated.
                  </p>
                </div>

                {/* Items Checklist with Editable Unit Rates */}
                <div className="border border-[#E5E7EB] rounded-[4px] overflow-hidden">
                  <div className="p-3 bg-[#F8FAFC] border-b border-[#E5E7EB] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSelectAllUnbilled(unbilledItems)}
                        className="text-xs font-semibold text-[#0274BB] hover:underline flex items-center gap-1.5"
                      >
                        {selectedItemIds.size === unbilledItems.length && unbilledItems.length > 0 ? (
                          <CheckSquare className="size-4 text-[#0274BB]" />
                        ) : (
                          <Square className="size-4 text-[#6B7280]" />
                        )}
                        <span>{selectedItemIds.size === unbilledItems.length ? 'Deselect All' : 'Select All Ready Items'}</span>
                      </button>
                    </div>
                    <span className="text-xs text-[#6B7280]">
                      {unbilledItems.length} unbilled item(s) available
                    </span>
                  </div>

                  <div className="divide-y divide-[#E5E7EB] max-h-60 overflow-y-auto">
                    {quoteItems.map((it) => {
                      const isAlreadyInvoiced = Boolean(it.invoiced);
                      const isChecked = selectedItemIds.has(it.id);
                      const currentUnitRate = invoiceItemRates[it.id] ?? it.unit_price;
                      const lineTotal = it.quantity * currentUnitRate;

                      return (
                        <div
                          key={it.id}
                          className={`p-3 flex items-center justify-between text-xs transition-colors ${
                            isAlreadyInvoiced
                              ? 'bg-[#F9FAFB] opacity-75'
                              : isChecked
                              ? 'bg-[#F0FDF4]'
                              : 'hover:bg-[#FAFAFA]'
                          }`}
                        >
                          <label className="flex items-center gap-3 cursor-pointer min-w-0 flex-1">
                            <input
                              type="checkbox"
                              disabled={isAlreadyInvoiced}
                              checked={isAlreadyInvoiced || isChecked}
                              onChange={() => toggleItemCheck(it.id)}
                              className="size-4 text-[#0274BB] rounded border-[#CBD5E1] cursor-pointer"
                            />
                            <div className="min-w-0">
                              <span
                                className={`font-semibold block truncate ${
                                  isAlreadyInvoiced ? 'text-[#64748B] line-through' : 'text-[#1E293B]'
                                }`}
                              >
                                {it.description}
                              </span>
                              <span className="text-[#64748B]">
                                Qty: {it.quantity}
                              </span>
                            </div>
                          </label>

                          <div className="flex items-center gap-3 shrink-0 ml-3">
                            {!isAlreadyInvoiced && isChecked && (
                              <div className="flex items-center gap-1">
                                <span className="text-[11px] text-slate-400">Rate: ₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={currentUnitRate}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                                    setInvoiceItemRates((prev) => ({ ...prev, [it.id]: val }));
                                  }}
                                  className="w-20 px-1.5 py-0.5 border border-slate-300 rounded text-right font-mono font-semibold text-xs"
                                  title="Editable item rate for invoice"
                                />
                              </div>
                            )}

                            <div className="text-right w-24">
                              <span className="font-mono font-bold text-[#111827] block text-sm">
                                ₹{lineTotal.toFixed(2)}
                              </span>
                              {isAlreadyInvoiced ? (
                                <Badge variant="success">
                                  Invoiced: {it.invoice_number || 'INV-PARTIAL'}
                                </Badge>
                              ) : isChecked ? (
                                <Badge variant="primary">To Invoice</Badge>
                              ) : (
                                <span className="text-[10px] text-[#EA580C] italic">Pending</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Calculation & Editable Discount Controls */}
                <div className="p-4 bg-[#F8FAFC] rounded-[4px] border border-[#E5E7EB] flex flex-col items-end gap-2 text-xs">
                  <div className="flex justify-between w-80 text-[#64748B]">
                    <span>Selected Items Subtotal:</span>
                    <span className="font-mono text-[#1E293B] font-semibold">₹{subtotalCalc.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between w-80 items-center">
                    <span className="text-[#64748B]">Special Discount (%):</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={invoiceDiscountPercent}
                        onChange={(e) => {
                          setInvoiceLastEdited('PERCENT');
                          const pct = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                          setInvoiceDiscountPercent(pct);
                          setInvoiceDiscountAmount((subtotalCalc * pct) / 100);
                        }}
                        className="w-20 px-1.5 py-0.5 border border-slate-300 rounded text-right font-mono text-xs"
                      />
                      <span className="text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  <div className="flex justify-between w-80 items-center">
                    <span className="text-[#64748B]">Discount Amount (₹):</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={invoiceDiscountAmount}
                        onChange={(e) => {
                          setInvoiceLastEdited('AMOUNT');
                          const amt = Math.min(subtotalCalc, Math.max(0, parseFloat(e.target.value) || 0));
                          setInvoiceDiscountAmount(amt);
                          setInvoiceDiscountPercent(subtotalCalc > 0 ? (amt / subtotalCalc) * 100 : 0);
                        }}
                        className="w-24 px-1.5 py-0.5 border border-slate-300 rounded text-right font-mono text-xs"
                      />
                      <span className="text-slate-400 font-bold">₹</span>
                    </div>
                  </div>

                  {activeDiscount > 0 && (
                    <div className="w-80 flex justify-end">
                      <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        CV / Voucher Adjustment: {activePercent.toFixed(2)}% (-₹{activeDiscount.toFixed(2)})
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between w-80 text-[#64748B]">
                    <span>GST (18%):</span>
                    <span className="font-mono text-[#1E293B] font-semibold">₹{taxCalc.toFixed(2)}</span>
                  </div>

                  {/* Editable Invoice Total */}
                  <div className="flex justify-between w-80 items-center border-t border-[#CBD5E1] pt-2 mt-1">
                    <div>
                      <span className="text-sm font-bold text-[#111827] block">Amount Paid (₹):</span>
                      <span className="text-[10px] text-[#0274BB]">Editable — discount recorded in CV</span>
                    </div>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={grandTotalCalc > 0 ? grandTotalCalc.toFixed(2) : ''}
                      placeholder={grandTotalCalc.toFixed(2)}
                      onChange={(e) => {
                        setInvoiceLastEdited('TOTAL');
                        const target = Math.max(0, parseFloat(e.target.value) || 0);
                        setEditableInvoiceTotal(target);
                        const netTaxable = target / 1.18;
                        const disc = Math.max(0, subtotalCalc - netTaxable);
                        setInvoiceDiscountAmount(disc);
                        setInvoiceDiscountPercent(subtotalCalc > 0 ? (disc / subtotalCalc) * 100 : 0);
                      }}
                      className="w-32 px-2 py-1 border border-[#0274BB]/60 rounded text-right font-mono font-bold text-sm text-[#0274BB] bg-white focus:outline-none focus:ring-1 focus:ring-[#0274BB]"
                    />
                  </div>
>>>>>>> Stashed changes
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Selected: <span className="font-bold text-slate-800">{selectedItemIds.size}</span> item(s)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outlineInk"
                  size="sm"
                  onClick={() => setInvoiceModalQuote(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmGenerateInvoice}
                  disabled={selectedItemIds.size === 0}
                >
                  Generate Tax Invoice
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationListPage;
