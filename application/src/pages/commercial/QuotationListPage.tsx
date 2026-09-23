// application/src/pages/commercial/QuotationListPage.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuotations, useApproveQuotation, useCreateInvoice } from '../../hooks/useOperations';
import { useAuthContext } from '../../contexts/AuthContext';
import {
  Button,
  Input,
  Textarea,
  Field,
  FieldLabel,
} from '../../components/ui/UIPrimitives';
import type { Quotation, QuotationItem } from '../../types/domain';
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
  Search,
  ChevronRight,
  MoreVertical,
  IndianRupee,
  Building2,
  Layers,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const AVATAR_PALETTES = [
  { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
];

export const QuotationListPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenantId, organizationId, isLabApprover, canPerform, getPermissionLevel, isSuperAdmin } = useAuthContext();
  const { data: quotations = [], isLoading } = useQuotations();
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

  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();

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
  const handleOpenApprovalModal = (q: Quotation) => {
    setApprovalModalQuote(q);
    setClientPoRef(q.client_po_ref || '');
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
    setClientPoForInvoice(q.client_po_ref || '');
    setErrorMessage(undefined);
    const unbilled = (q.items || []).filter((it) => !it.invoiced);
    setSelectedItemIds(new Set(unbilled.map((it) => it.id)));
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

    const totalItemsCount = (invoiceModalQuote.items || []).length;
    const previouslyInvoicedCount = (invoiceModalQuote.items || []).filter((it) => it.invoiced).length;
    const isActualInvoice = previouslyInvoicedCount + chosenItems.length >= totalItemsCount;
    const invoiceType = isActualInvoice ? 'ACTUAL' : 'PARTIAL';

    const invoiceSubtotal = chosenItems.reduce((sum, it) => sum + it.total_price, 0);
    const invoiceTax = (invoiceSubtotal * 18) / 100;
    const invoiceTotal = invoiceSubtotal + invoiceTax;

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
        discountAmount: 0,
        taxAmount: invoiceTax,
        totalAmount: invoiceTotal,
        items: chosenItems.map((it) => ({
          quotationItemId: it.id,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unit_price,
          totalPrice: it.total_price,
        })),
      });

      setInvoiceModalQuote(null);
      navigate('/commercial/invoices');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate invoice.');
    }
  };

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

  return (
    <div className="space-y-5">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{pendingCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Pending Client Approval</div>
            </div>
          </div>
          <ChevronRight className="size-5 text-slate-400" />
        </div>

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
                <FieldLabel>Client Purchase Order (PO) Number <span className="text-red-500">*</span></FieldLabel>
                <Input
                  placeholder="e.g. PO-2026-998812"
                  value={clientPoRef}
                  onChange={(e) => setClientPoRef(e.target.value)}
                  className="mt-1"
                />
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
              </div>
              <button
                type="button"
                onClick={() => setInvoiceModalQuote(null)}
                className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

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
