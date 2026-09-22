// application/src/pages/commercial/InvoiceListPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useInvoices,
  useCalibrationRequests,
  useQuotations,
  useCreateInvoice,
  useApproveInvoice,
} from '../../hooks/useOperations';
import { useAuthContext } from '../../contexts/AuthContext';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
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
import type { Invoice } from '../../types/domain';
import {
  FileText,
  ArrowRight,
  Printer,
  X,
  Receipt,
  CheckCircle2,
  IndianRupee,
  Split,
  Layers,
  CheckSquare,
  Square,
  Check,
  Plus,
  AlertCircle,
  ShieldCheck,
  Clock,
} from 'lucide-react';

export interface EditableInvoiceItem {
  id: string;
  sourceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  hsnSacCode: string;
  selected: boolean;
  isCustom?: boolean;
}

export const InvoiceListPage: React.FC = () => {
  const { tenantId, organizationId, canPerform, isSuperAdmin, user } = useAuthContext();
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: requests = [] } = useCalibrationRequests();
  const { data: quotations = [] } = useQuotations();
  const createInvoiceMutation = useCreateInvoice();
  const approveInvoiceMutation = useApproveInvoice();

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'PARTIAL' | 'ACTUAL'>('ALL');

  // Approval Modal State
  const [approvalModalInvoice, setApprovalModalInvoice] = useState<Invoice | null>(null);
  const [invoiceApproverNotes, setInvoiceApproverNotes] = useState<string>('');

  // Generate Invoice Modal State (Fetch from Quotation OR Direct from Request)
  const [showGenerateModal, setShowGenerateModal] = useState<boolean>(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [itemRates, setItemRates] = useState<Record<string, number>>({});
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [clientPoForInvoice, setClientPoForInvoice] = useState<string>('');
  const [modalErrorMessage, setModalErrorMessage] = useState<string | undefined>();
  const [successToast, setSuccessToast] = useState<string | undefined>();

  const handleApproveInvoice = async (approved: boolean) => {
    if (!approvalModalInvoice || !tenantId) return;
    try {
      await approveInvoiceMutation.mutateAsync({
        tenantId,
        organizationId: organizationId || '',
        invoiceId: approvalModalInvoice.id,
        approved,
        actorUserId: user?.id,
        actorName: user?.fullName || user?.email || 'Commercial Manager',
        approverNotes: invoiceApproverNotes,
      });
      setApprovalModalInvoice(null);
      setSuccessToast(`Tax Invoice ${approvalModalInvoice.invoice_number} ${approved ? 'Approved' : 'Rejected'} successfully!`);
    } catch (err: any) {
      setModalErrorMessage(err.message || 'Failed to update invoice approval.');
    }
  };

  const partialInvoices = invoices.filter((i) => i.invoice_type === 'PARTIAL');
  const actualInvoices = invoices.filter((i) => i.invoice_type === 'ACTUAL' || !i.invoice_type);

  const filteredInvoices = invoices.filter((inv) => {
    if (filterType === 'PARTIAL') return inv.invoice_type === 'PARTIAL';
    if (filterType === 'ACTUAL') return inv.invoice_type === 'ACTUAL' || !inv.invoice_type;
    return true;
  });

  const totalInvoicedValue = invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const partialInvoicedValue = partialInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const actualInvoicedValue = actualInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);

  // Eligible work orders for invoice generation (supports direct invoicing for all active requests)
  const eligibleRequests = requests.filter(
    (r) =>
      ['CREATED', 'VERIFIED', 'CALIBRATED', 'QUOTATION', 'APPROVED', 'PARTIALLY_INVOICED'].includes(r.status) ||
      (r.request_items && r.request_items.some((it: any) => !it.invoiced))
  );

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);
  const matchingQuote = selectedRequestId
    ? quotations.find((q) => q.request_id === selectedRequestId && q.status !== 'REJECTED')
    : undefined;

  const isFetchedFromQuotation = Boolean(matchingQuote && matchingQuote.items && matchingQuote.items.length > 0);

  // When opening generate modal, initialize request and selection
  const handleOpenGenerateModal = () => {
    setModalErrorMessage(undefined);
    const initialReq = eligibleRequests.length > 0 ? eligibleRequests[0] : undefined;
    if (initialReq) {
      handleSelectRequest(initialReq.id);
    } else {
      setSelectedRequestId('');
      setSelectedItemIds(new Set());
      setItemRates({});
      setDiscountType('PERCENT');
      setDiscountValue(0);
      setClientPoForInvoice('');
    }
    setShowGenerateModal(true);
  };

  const handleSelectRequest = (reqId: string) => {
    setSelectedRequestId(reqId);
    setModalErrorMessage(undefined);

    const quote = quotations.find((q) => q.request_id === reqId && q.status !== 'REJECTED');
    const req = requests.find((r) => r.id === reqId);
    const initialRates: Record<string, number> = {};

    if (quote && quote.items && quote.items.length > 0) {
      setClientPoForInvoice(quote.client_po_ref || req?.client_po_ref || '');
      const unbilled = quote.items.filter((it) => !it.invoiced);
      setSelectedItemIds(new Set(unbilled.map((it) => it.id)));
      quote.items.forEach((it) => {
        initialRates[it.id] = it.unit_price ?? 100;
      });
    } else if (req && req.request_items && req.request_items.length > 0) {
      setClientPoForInvoice(req.client_po_ref || '');
      const unbilled = req.request_items.filter((it: any) => !it.invoiced);
      setSelectedItemIds(new Set(unbilled.map((it) => it.id)));
      req.request_items.forEach((it: any) => {
        initialRates[it.id] = it.item_masters?.standard_cost || 100;
      });
    } else {
      setClientPoForInvoice(req?.client_po_ref || '');
      setSelectedItemIds(new Set());
    }
    setItemRates(initialRates);
    setDiscountType('PERCENT');
    setDiscountValue(0);
  };

  const updateItemRate = (itemId: string, newRate: number) => {
    setItemRates((prev) => ({
      ...prev,
      [itemId]: Math.max(0, newRate),
    }));
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

  const toggleSelectAllUnbilled = (unbilledIds: string[]) => {
    if (selectedItemIds.size === unbilledIds.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(unbilledIds));
    }
  };

  // Submit invoice from modal
  const handleConfirmIssueInvoice = async () => {
    if (!selectedRequest || !tenantId) return;
    setModalErrorMessage(undefined);

    if (isFetchedFromQuotation && matchingQuote) {
      const quoteItems = matchingQuote.items || [];
      const unbilled = quoteItems.filter((it) => !it.invoiced);
      const chosen = unbilled.filter((it) => selectedItemIds.has(it.id));
      if (chosen.length === 0) {
        setModalErrorMessage('Please select at least one item to invoice.');
        return;
      }

      const previouslyInvoicedCount = quoteItems.filter((it) => it.invoiced).length;
      const isActual = previouslyInvoicedCount + chosen.length >= quoteItems.length;
      const invoiceType = isActual ? 'ACTUAL' : 'PARTIAL';

      const subtotalCalc = chosen.reduce(
        (sum, it) => sum + (it.quantity || 1) * (itemRates[it.id] ?? it.unit_price ?? 100),
        0
      );
      const discountCalc =
        discountType === 'PERCENT'
          ? (subtotalCalc * Math.min(100, Math.max(0, discountValue))) / 100
          : Math.min(subtotalCalc, Math.max(0, discountValue));
      const taxableCalc = Math.max(0, subtotalCalc - discountCalc);
      const taxCalc = (taxableCalc * 18) / 100;
      const grandTotal = taxableCalc + taxCalc;

      try {
        const inv = await createInvoiceMutation.mutateAsync({
          tenantId,
          organizationId: organizationId || '',
          quotationId: matchingQuote.id,
          requestId: selectedRequest.id,
          clientId: selectedRequest.client_id,
          clientPoRef: clientPoForInvoice.trim() || matchingQuote.client_po_ref || undefined,
          invoiceType,
          selectedItemIds: Array.from(selectedItemIds),
          subtotal: subtotalCalc,
          discountAmount: discountCalc,
          taxAmount: taxCalc,
          totalAmount: grandTotal,
          items: chosen.map((it) => {
            const unitPrice = itemRates[it.id] ?? it.unit_price ?? 100;
            const qty = it.quantity || 1;
            return {
              quotationItemId: it.id,
              description: it.description,
              quantity: qty,
              unitPrice,
              totalPrice: qty * unitPrice,
            };
          }),
        });

        setShowGenerateModal(false);
        setSuccessToast(`Tax Invoice ${inv.invoice_number} successfully issued!`);
      } catch (err: any) {
        setModalErrorMessage(err.message || 'Failed to generate tax invoice.');
      }
    } else {
      // Direct invoicing from Request
      const reqItems = selectedRequest.request_items || [];
      const unbilled = reqItems.filter((it: any) => !it.invoiced);
      const chosen = unbilled.filter((it) => selectedItemIds.has(it.id));
      if (chosen.length === 0) {
        setModalErrorMessage('Please select at least one item to invoice.');
        return;
      }

      const previouslyInvoicedCount = reqItems.filter((it: any) => it.invoiced).length;
      const isActual = previouslyInvoicedCount + chosen.length >= reqItems.length;
      const invoiceType = isActual ? 'ACTUAL' : 'PARTIAL';

      const subtotalCalc = chosen.reduce(
        (sum, it) =>
          sum + (it.received_quantity || it.quantity || 1) * (itemRates[it.id] ?? it.item_masters?.standard_cost ?? 100),
        0
      );
      const discountCalc =
        discountType === 'PERCENT'
          ? (subtotalCalc * Math.min(100, Math.max(0, discountValue))) / 100
          : Math.min(subtotalCalc, Math.max(0, discountValue));
      const taxableCalc = Math.max(0, subtotalCalc - discountCalc);
      const taxCalc = (taxableCalc * 18) / 100;
      const grandTotal = taxableCalc + taxCalc;

      try {
        const inv = await createInvoiceMutation.mutateAsync({
          tenantId,
          organizationId: organizationId || '',
          requestId: selectedRequest.id,
          clientId: selectedRequest.client_id,
          clientPoRef: clientPoForInvoice.trim() || selectedRequest.client_po_ref || undefined,
          invoiceType,
          selectedItemIds: Array.from(selectedItemIds),
          subtotal: subtotalCalc,
          discountAmount: discountCalc,
          taxAmount: taxCalc,
          totalAmount: grandTotal,
          items: chosen.map((it) => {
            const unitPrice = itemRates[it.id] ?? it.item_masters?.standard_cost ?? 100;
            const qty = it.received_quantity || it.quantity || 1;
            return {
              requestItemId: it.id,
              description: it.item_masters?.item_name || `Calibrated Instrument (SN: ${it.serial_number || 'N/A'})`,
              quantity: qty,
              unitPrice,
              totalPrice: qty * unitPrice,
            };
          }),
        });

        setShowGenerateModal(false);
        setSuccessToast(`Direct Tax Invoice ${inv.invoice_number} successfully issued!`);
      } catch (err: any) {
        setModalErrorMessage(err.message || 'Failed to generate direct tax invoice.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[4px] flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="size-5 text-emerald-600" />
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#111827]">Commercial Invoices &amp; Tax Billing</h1>
            <Badge variant="success">{invoices.length} Issued</Badge>
          </div>
          <p className="text-sm text-[#6B7280]">
            Official commercial tax invoices (fetched from approved quotations or generated directly from work orders)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/commercial/quotations">
            <Button variant="outlineInk">
              View Quotations <ArrowRight className="size-3.5" />
            </Button>
          </Link>
          {(isSuperAdmin || canPerform('CREATE_INVOICE', 'CREATE')) && (
            <Button variant="primary" onClick={handleOpenGenerateModal}>
              <Receipt className="size-4" /> Generate Tax Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-[#EBF5FF] text-[#0274BB] rounded-[4px]">
              <Receipt className="size-5" />
            </div>
            <div>
              <span className="text-xs text-[#6B7280] block">Total Invoices Issued</span>
              <span className="text-xl font-bold text-[#111827]">{invoices.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-[#FEF3C7] text-[#D97706] rounded-[4px]">
              <Split className="size-5" />
            </div>
            <div>
              <span className="text-xs text-[#6B7280] block">Partial Invoices ({partialInvoices.length})</span>
              <span className="text-lg font-bold font-mono text-[#D97706]">
                ₹{partialInvoicedValue.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-[#ECFDF5] text-[#16A34A] rounded-[4px]">
              <Layers className="size-5" />
            </div>
            <div>
              <span className="text-xs text-[#6B7280] block">Actual / Final ({actualInvoices.length})</span>
              <span className="text-lg font-bold font-mono text-[#16A34A]">
                ₹{actualInvoicedValue.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-[#F3E8FF] text-[#7E22CE] rounded-[4px]">
              <IndianRupee className="size-5" />
            </div>
            <div>
              <span className="text-xs text-[#6B7280] block">Total Billed Gross</span>
              <span className="text-lg font-bold font-mono text-[#7E22CE]">
                ₹{totalInvoicedValue.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
        <button
          type="button"
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer ${
            filterType === 'ALL'
              ? 'bg-[#0274BB] text-white shadow-sm'
              : 'bg-white text-[#4B5563] border border-[#D1D5DB] hover:bg-[#F9FAFB]'
          }`}
        >
          All Invoices ({invoices.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('PARTIAL')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer ${
            filterType === 'PARTIAL'
              ? 'bg-[#D97706] text-white shadow-sm'
              : 'bg-white text-[#4B5563] border border-[#D1D5DB] hover:bg-[#F9FAFB]'
          }`}
        >
          Partial Invoices ({partialInvoices.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('ACTUAL')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer ${
            filterType === 'ACTUAL'
              ? 'bg-[#16A34A] text-white shadow-sm'
              : 'bg-white text-[#4B5563] border border-[#D1D5DB] hover:bg-[#F9FAFB]'
          }`}
        >
          Actual / Final Invoices ({actualInvoices.length})
        </button>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Issued Tax Invoices</CardTitle>
          <CardDescription>
            Legally valid commercial tax invoices (fetched from approved quotations or directly from work orders)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-[#6B7280]">
              <div className="size-6 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading tax invoices...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-12 text-center text-[#6B7280] space-y-3">
              <Receipt className="size-8 mx-auto text-[#9CA3AF]" />
              <p className="text-base font-semibold text-[#374151]">No invoices found</p>
              <p className="text-xs text-[#6B7280] max-w-md mx-auto">
                Generate tax invoices directly from calibrated work orders, or fetch line items automatically from an existing quotation.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button variant="primary" size="sm" onClick={handleOpenGenerateModal}>
                  <Receipt className="size-3.5" /> Generate Tax Invoice
                </Button>
                <Link to="/commercial/quotations">
                  <Button variant="secondary" size="sm">
                    View Quotations
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F5F7FA] border-b border-[#E5E7EB] text-[#374151] font-semibold text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">Invoice #</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Client PO Reference</th>
                    <th className="px-6 py-3">Subtotal</th>
                    <th className="px-6 py-3">Tax (GST)</th>
                    <th className="px-6 py-3">Grand Total</th>
                    <th className="px-6 py-3">Approval</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Invoice Date</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#FAFAFA]">
                      <td className="px-6 py-4 font-mono font-bold text-[#0274BB]">
                        {inv.invoice_number}
                      </td>
                      <td className="px-6 py-4">
                        {inv.invoice_type === 'PARTIAL' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                            <Split className="size-3" /> Partial Invoice
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Layers className="size-3" /> Actual Invoice
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {inv.client_po_ref ? (
                          <span className="px-2 py-0.5 bg-[#F1F5F9] rounded border border-[#E2E8F0] font-semibold text-[#334155]">
                            {inv.client_po_ref}
                          </span>
                        ) : (
                          <span className="text-[#9CA3AF] italic">Not Provided</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-[#374151]">
                        ₹{inv.subtotal.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-mono text-[#6B7280]">
                        ₹{inv.tax_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-[#111827]">
                        ₹{inv.total_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        {inv.approval_status === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="size-3 text-emerald-600" /> Approved
                          </span>
                        ) : inv.approval_status === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                            <X className="size-3 text-red-600" /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="size-3 text-amber-600" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="success">{inv.invoice_status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-[#6B7280] text-xs">
                        {new Date(inv.invoice_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(isSuperAdmin || canPerform('CREATE_INVOICE', 'APPROVE')) && inv.approval_status !== 'APPROVED' && (
                            <Button
                              variant="outlineInk"
                              size="sm"
                              onClick={() => {
                                setApprovalModalInvoice(inv);
                                setInvoiceApproverNotes('');
                              }}
                              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs"
                            >
                              <ShieldCheck className="size-3.5" /> Approve
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedInvoice(inv)}
                          >
                            <Printer className="size-3.5" /> View / Print
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ==================================================================== */}
      {/* 1. Generate Tax Invoice Modal: Fetched from Quotation OR Direct */}
      {/* ==================================================================== */}
      {showGenerateModal && (() => {
        const quoteItems = isFetchedFromQuotation ? matchingQuote?.items || [] : [];
        const reqItems = !isFetchedFromQuotation ? selectedRequest?.request_items || [] : [];

        const unbilledQuoteItems = quoteItems.filter((it) => !it.invoiced);
        const unbilledReqItems = reqItems.filter((it: any) => !it.invoiced);

        const unbilledCount = isFetchedFromQuotation ? unbilledQuoteItems.length : unbilledReqItems.length;
        const totalItemsCount = isFetchedFromQuotation ? quoteItems.length : reqItems.length;
        const previouslyInvoicedCount = totalItemsCount - unbilledCount;
        const selectedCount = selectedItemIds.size;

        const isActualInvoice =
          unbilledCount > 0 && previouslyInvoicedCount + selectedCount >= totalItemsCount;

        // Calculate Subtotal based on editable rates
        let subtotalCalc = 0;
        if (isFetchedFromQuotation) {
          const chosen = unbilledQuoteItems.filter((it) => selectedItemIds.has(it.id));
          subtotalCalc = chosen.reduce(
            (sum, it) => sum + (it.quantity || 1) * (itemRates[it.id] ?? it.unit_price ?? 100),
            0
          );
        } else {
          const chosen = unbilledReqItems.filter((it: any) => selectedItemIds.has(it.id));
          subtotalCalc = chosen.reduce(
            (sum, it) =>
              sum + (it.received_quantity || it.quantity || 1) * (itemRates[it.id] ?? it.item_masters?.standard_cost ?? 100),
            0
          );
        }

        const discountCalc =
          discountType === 'PERCENT'
            ? (subtotalCalc * Math.min(100, Math.max(0, discountValue))) / 100
            : Math.min(subtotalCalc, Math.max(0, discountValue));
        const taxableCalc = Math.max(0, subtotalCalc - discountCalc);
        const taxCalc = (taxableCalc * 18) / 100;
        const grandTotalCalc = taxableCalc + taxCalc;

        return (
          <DialogOverlay onClick={() => setShowGenerateModal(false)}>
            <DialogContent size="4xl" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <DialogHeader>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Receipt className="size-5 text-[#0274BB]" />
                    <div>
                      <DialogTitle>Generate Commercial Tax Invoice</DialogTitle>
                      <DialogDescription>
                        Editable pricing with client discounts — fetched from quotation or direct from work order
                      </DialogDescription>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded hover:bg-[#E2E8F0]"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </DialogHeader>

              <DialogBody className="space-y-5">
                {modalErrorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                    {modalErrorMessage}
                  </div>
                )}

                {eligibleRequests.length === 0 ? (
                  <div className="p-8 text-center space-y-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px]">
                    <div className="size-12 rounded-full bg-blue-50 text-[#0274BB] flex items-center justify-center mx-auto">
                      <AlertCircle className="size-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0F172A]">No Work Orders Ready for Invoicing</h4>
                      <p className="text-xs text-[#64748B] mt-1.5 max-w-md mx-auto">
                        In metrology billing, a tax invoice is issued against equipment registered under an Inward Request or an approved Quotation. No unbilled work orders were found in your current workspace.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Link to="/requests/new" onClick={() => setShowGenerateModal(false)}>
                        <Button variant="primary" size="sm">
                          <Plus className="size-3.5" /> Register Inward Request
                        </Button>
                      </Link>
                      <Link to="/commercial/quotations/new" onClick={() => setShowGenerateModal(false)}>
                        <Button variant="secondary" size="sm">
                          <FileText className="size-3.5" /> Create Quotation
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Section 1: Work Order & Commercial Context */}
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel>Select Work Order / Calibration Request</FieldLabel>
                          <Select
                            value={selectedRequestId}
                            onChange={(e) => handleSelectRequest(e.target.value)}
                            className="bg-white"
                          >
                            {eligibleRequests.map((req) => {
                              const hasQuote = quotations.some(
                                (q) => q.request_id === req.id && q.status !== 'REJECTED'
                              );
                              return (
                                <option key={req.id} value={req.id}>
                                  {req.request_number} — {req.clients?.client_name || 'Client'} ({req.status})
                                  {hasQuote ? ' [Quotation Available]' : ' [Direct Work Order]'}
                                </option>
                              );
                            })}
                          </Select>
                        </Field>

                        <Field>
                          <FieldLabel>Client Purchase Order Reference (Optional)</FieldLabel>
                          <Input
                            placeholder="E.g. PO-CLIENT-2026-9921"
                            value={clientPoForInvoice}
                            onChange={(e) => setClientPoForInvoice(e.target.value)}
                            className="bg-white"
                          />
                        </Field>
                      </div>

                      {/* Mode Indicator & Classification Badge */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 border-t border-[#E2E8F0]">
                        {isFetchedFromQuotation ? (
                          <div className="flex items-center gap-2 text-xs text-blue-900">
                            <FileText className="size-4 text-blue-600 shrink-0" />
                            <span>
                              Fetched from Quotation: <strong>{matchingQuote?.quotation_number}</strong> (rates auto-applied)
                            </span>
                          </div>
                        ) : selectedRequest ? (
                          <div className="flex items-center gap-2 text-xs text-emerald-900">
                            <Receipt className="size-4 text-emerald-600 shrink-0" />
                            <span>
                              Direct Invoicing: <strong>{selectedRequest.request_number}</strong> (rates from item master)
                            </span>
                          </div>
                        ) : null}

                        {selectedCount > 0 && (
                          <div>
                            {isActualInvoice ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="size-3" /> Actual Invoice (Full &amp; Final Billing)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                                <Split className="size-3" /> Partial Invoice (Selected Items Only)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section 2: Items Checklist & Editable Rates */}
                    <div className="border border-[#E5E7EB] rounded-[4px] overflow-hidden">
                      <div className="p-3 bg-[#F8FAFC] border-b border-[#E5E7EB] flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() =>
                            toggleSelectAllUnbilled(
                              isFetchedFromQuotation
                                ? unbilledQuoteItems.map((it) => it.id)
                                : unbilledReqItems.map((it: any) => it.id)
                            )
                          }
                          className="text-xs font-semibold text-[#0274BB] hover:underline flex items-center gap-1.5 cursor-pointer"
                        >
                          {selectedItemIds.size === unbilledCount && unbilledCount > 0 ? (
                            <CheckSquare className="size-4 text-[#0274BB]" />
                          ) : (
                            <Square className="size-4 text-[#6B7280]" />
                          )}
                          <span>
                            {selectedItemIds.size === unbilledCount ? 'Deselect All' : 'Select All Ready Items'}
                          </span>
                        </button>
                        <span className="text-xs text-[#6B7280]">
                          {unbilledCount} unbilled item(s) available • Rates are editable
                        </span>
                      </div>

                      <div className="divide-y divide-[#E5E7EB] max-h-60 overflow-y-auto">
                        {isFetchedFromQuotation
                          ? quoteItems.map((it) => {
                              const isAlreadyInvoiced = Boolean(it.invoiced);
                              const isChecked = selectedItemIds.has(it.id);
                              const rate = itemRates[it.id] ?? it.unit_price ?? 100;
                              const totalItemPrice = (it.quantity || 1) * rate;

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
                                    <div className="min-w-0 flex-1">
                                      <span
                                        className={`font-semibold block truncate ${
                                          isAlreadyInvoiced ? 'text-[#64748B] line-through' : 'text-[#1E293B]'
                                        }`}
                                      >
                                        {it.description}
                                      </span>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[11px] text-[#64748B]">Qty: {it.quantity || 1}</span>
                                        <span className="text-[11px] text-[#64748B]">• Unit Rate (₹):</span>
                                        <input
                                          type="number"
                                          min="0"
                                          step="1"
                                          value={rate}
                                          onChange={(e) => updateItemRate(it.id, parseFloat(e.target.value) || 0)}
                                          disabled={isAlreadyInvoiced}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-24 px-2 py-0.5 border border-slate-300 rounded text-right font-mono text-xs focus:ring-1 focus:ring-[#0274BB] bg-white"
                                        />
                                      </div>
                                    </div>
                                  </label>
                                  <div className="text-right shrink-0 ml-4">
                                    <span className="font-mono font-bold text-[#111827] block text-sm">
                                      ₹{totalItemPrice.toFixed(2)}
                                    </span>
                                    {isAlreadyInvoiced && (
                                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                        Invoiced
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          : reqItems.map((it: any) => {
                              const isAlreadyInvoiced = Boolean(it.invoiced);
                              const isChecked = selectedItemIds.has(it.id);
                              const rate = itemRates[it.id] ?? it.item_masters?.standard_cost ?? 100;
                              const qty = it.received_quantity || it.quantity || 1;
                              const totalItemPrice = qty * rate;

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
                                    <div className="min-w-0 flex-1">
                                      <span
                                        className={`font-semibold block truncate ${
                                          isAlreadyInvoiced ? 'text-[#64748B] line-through' : 'text-[#1E293B]'
                                        }`}
                                      >
                                        {it.item_masters?.item_name || 'Equipment Unit'}
                                      </span>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[11px] text-[#64748B]">
                                          SN: {it.serial_number || 'N/A'} • Qty: {qty}
                                        </span>
                                        <span className="text-[11px] text-[#64748B]">• Unit Rate (₹):</span>
                                        <input
                                          type="number"
                                          min="0"
                                          step="1"
                                          value={rate}
                                          onChange={(e) => updateItemRate(it.id, parseFloat(e.target.value) || 0)}
                                          disabled={isAlreadyInvoiced}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-24 px-2 py-0.5 border border-slate-300 rounded text-right font-mono text-xs focus:ring-1 focus:ring-[#0274BB] bg-white"
                                        />
                                      </div>
                                    </div>
                                  </label>
                                  <div className="text-right shrink-0 ml-4">
                                    <span className="font-mono font-bold text-[#111827] block text-sm">
                                      ₹{totalItemPrice.toFixed(2)}
                                    </span>
                                    {isAlreadyInvoiced && (
                                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                        Invoiced
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                      </div>
                    </div>

                    {/* Section 3: Commercial Discount Controls */}
                    <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-[4px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">Client Commercial Discount</span>
                        <span className="text-[11px] text-slate-500">Apply negotiated client discount (percentage or flat amount)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="inline-flex rounded border border-slate-300 bg-white p-0.5">
                          <button
                            type="button"
                            onClick={() => setDiscountType('PERCENT')}
                            className={`px-2 py-0.5 text-xs font-semibold rounded ${
                              discountType === 'PERCENT' ? 'bg-[#0274BB] text-white' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            % Percent
                          </button>
                          <button
                            type="button"
                            onClick={() => setDiscountType('FLAT')}
                            className={`px-2 py-0.5 text-xs font-semibold rounded ${
                              discountType === 'FLAT' ? 'bg-[#0274BB] text-white' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            ₹ Flat
                          </button>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="0"
                            max={discountType === 'PERCENT' ? 100 : subtotalCalc}
                            step={discountType === 'PERCENT' ? '1' : '10'}
                            value={discountValue}
                            onChange={(e) => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              setDiscountValue(discountType === 'PERCENT' ? Math.min(100, val) : val);
                            }}
                            placeholder="0"
                            className="w-20 px-2 py-1 border border-slate-300 rounded text-right font-mono font-bold text-xs bg-white"
                          />
                          <span className="ml-1 text-xs font-bold text-slate-500">
                            {discountType === 'PERCENT' ? '%' : '₹'}
                          </span>
                        </div>
                        {discountCalc > 0 && (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded text-xs border border-emerald-200 shrink-0">
                            -₹{discountCalc.toFixed(2)} off
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Section 4: Calculation Breakdown Summary */}
                    <div className="p-4 bg-[#F8FAFC] rounded-[4px] border border-[#E5E7EB] flex flex-col items-end gap-1.5 text-xs">
                      <div className="flex justify-between w-80 text-[#64748B]">
                        <span>Selected Items Subtotal:</span>
                        <span className="font-mono text-[#1E293B] font-semibold">₹{subtotalCalc.toFixed(2)}</span>
                      </div>
                      {discountCalc > 0 && (
                        <div className="flex justify-between w-80 text-emerald-700 font-semibold">
                          <span>Client Discount Applied:</span>
                          <span className="font-mono">-₹{discountCalc.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between w-80 text-[#64748B]">
                        <span>Net Taxable Subtotal:</span>
                        <span className="font-mono text-[#1E293B] font-semibold">₹{taxableCalc.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between w-80 text-[#64748B]">
                        <span>GST (18%):</span>
                        <span className="font-mono text-[#1E293B] font-semibold">₹{taxCalc.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between w-80 text-sm font-bold text-[#111827] border-t border-[#CBD5E1] pt-1.5 mt-1">
                        <span>Total Tax Invoice:</span>
                        <span className="font-mono text-[#0274BB]">₹{grandTotalCalc.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}
              </DialogBody>

              {/* Modal Footer */}
              <DialogFooter>
                <Button variant="secondary" size="sm" onClick={() => setShowGenerateModal(false)}>
                  Cancel
                </Button>
                {eligibleRequests.length > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmIssueInvoice}
                    disabled={selectedCount === 0 || grandTotalCalc <= 0 || createInvoiceMutation.isPending}
                  >
                    <Receipt className="size-3.5" />
                    {createInvoiceMutation.isPending
                      ? 'Issuing Invoice...'
                      : isActualInvoice
                      ? `Generate Actual Invoice (₹${grandTotalCalc.toFixed(2)})`
                      : `Generate Partial Invoice (₹${grandTotalCalc.toFixed(2)})`}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </DialogOverlay>
        );
      })()}

      {/* ==================================================================== */}
      {/* 2. Invoice Print & Preview Modal */}
      {/* ==================================================================== */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-[4px] shadow-2xl max-w-2xl w-full overflow-hidden border border-[#E5E7EB]">
            <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Receipt className="size-5 text-[#0274BB]" />
                <h3 className="font-bold text-[#111827] text-base">
                  {selectedInvoice.invoice_type === 'PARTIAL'
                    ? 'Partial Tax Invoice Preview'
                    : 'Actual Tax Invoice Preview'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded hover:bg-[#E2E8F0]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto font-sans text-sm">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-[#E5E7EB] pb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#111827]">NETHRA CALIBRATION LABS</h2>
                  <p className="text-xs text-[#6B7280]">
                    ISO/IEC 17025 Accredited Metrology Laboratory<br />
                    GSTIN: 29ABCDE1234F1Z5 • State: Karnataka, India
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-lg text-[#0274BB] block">
                    {selectedInvoice.invoice_number}
                  </span>
                  <span className="text-xs text-[#6B7280] block">
                    Date: {new Date(selectedInvoice.invoice_date).toLocaleDateString()}
                  </span>
                  <div className="mt-1">
                    {selectedInvoice.invoice_type === 'PARTIAL' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                        Partial Tax Invoice
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 uppercase">
                        Actual Tax Invoice (Full)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Notice */}
              {selectedInvoice.invoice_type === 'PARTIAL' ? (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-center gap-2">
                  <Split className="size-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Partial Invoice Notice:</strong> This invoice covers only the specific items checked and completed. Remaining outsourced or pending items will be billed under a separate subsequent invoice upon receipt.
                  </span>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Actual Invoice Notice:</strong> Full and final billing covering all items under this calibration service order.
                  </span>
                </div>
              )}

              {/* Billed To */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0]">
                <div>
                  <span className="text-[#64748B] block font-semibold">BILLED TO:</span>
                  <span className="font-bold text-[#1E293B] text-sm block">Client Account</span>
                  <span className="text-[#64748B]">
                    Client PO: <strong>{selectedInvoice.client_po_ref || 'N/A'}</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#64748B] block font-semibold">PAYMENT STATUS:</span>
                  <Badge variant="success">{selectedInvoice.invoice_status}</Badge>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-left text-xs border border-[#E2E8F0]">
                <thead className="bg-[#F1F5F9] text-[#334155] font-semibold uppercase">
                  <tr>
                    <th className="p-2 border-b">#</th>
                    <th className="p-2 border-b">Item Description</th>
                    <th className="p-2 border-b text-center">HSN / SAC</th>
                    <th className="p-2 border-b text-center">Qty</th>
                    <th className="p-2 border-b text-right">Unit Rate</th>
                    <th className="p-2 border-b text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                    selectedInvoice.items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="p-2 text-center text-[#64748B] font-mono">{idx + 1}</td>
                        <td className="p-2 font-medium text-[#1E293B]">
                          {item.description}
                        </td>
                        <td className="p-2 text-center font-mono text-[#64748B]">
                          {item.hsn_sac_code || '998719'}
                        </td>
                        <td className="p-2 text-center font-mono">{item.quantity}</td>
                        <td className="p-2 text-right font-mono">₹{(item.unit_price ?? item.unit_rate ?? 0).toFixed(2)}</td>
                        <td className="p-2 text-right font-mono font-semibold text-[#111827]">
                          ₹{item.total_price.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-2 text-center font-mono">1</td>
                      <td className="p-2">Precision Metrology Calibration &amp; Certificate Services</td>
                      <td className="p-2 text-center font-mono">998719</td>
                      <td className="p-2 text-center font-mono">1</td>
                      <td className="p-2 text-right font-mono">₹{selectedInvoice.subtotal.toFixed(2)}</td>
                      <td className="p-2 text-right font-mono font-semibold">₹{selectedInvoice.subtotal.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Total Calculation */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1 text-xs">
                  <div className="flex justify-between text-[#64748B]">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span className="font-mono">-₹{selectedInvoice.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#64748B]">
                    <span>GST Tax (18%):</span>
                    <span className="font-mono">₹{selectedInvoice.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[#111827] border-t border-[#CBD5E1] pt-1.5">
                    <span>Total Payable:</span>
                    <span className="font-mono text-[#0274BB]">₹{selectedInvoice.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#E5E7EB] bg-[#F8FAFC] flex justify-between items-center">
              <Link to="/logistics/dispatch/new">
                <Button variant="primary" size="sm">
                  Proceed to Gate Pass Dispatch (Step 12) <ArrowRight className="size-3.5" />
                </Button>
              </Link>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => window.print()}>
                  <Printer className="size-3.5" /> Print Invoice
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setSelectedInvoice(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Invoice Formal Approval Modal */}
      {approvalModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-[#0274BB]" />
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Review &amp; Approve Commercial Invoice</h3>
                  <p className="text-xs text-gray-500 font-mono">#{approvalModalInvoice.invoice_number}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovalModalInvoice(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded border border-gray-200">
                <div>
                  <span className="text-gray-500 block">Invoice Type:</span>
                  <span className="font-bold text-gray-900">{approvalModalInvoice.invoice_type}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Client PO Ref:</span>
                  <span className="font-mono font-bold text-gray-900">{approvalModalInvoice.client_po_ref || 'None'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Subtotal:</span>
                  <span className="font-mono font-semibold text-gray-900">₹{approvalModalInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Grand Total:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">₹{approvalModalInvoice.total_amount.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Approver Review Comments</label>
                <textarea
                  rows={3}
                  value={invoiceApproverNotes}
                  onChange={(e) => setInvoiceApproverNotes(e.target.value)}
                  placeholder="Enter verification notes or approval authorization remarks..."
                  className="w-full text-xs border border-gray-300 rounded p-2 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setApprovalModalInvoice(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="outlineInk"
                  size="sm"
                  onClick={() => handleApproveInvoice(false)}
                  disabled={approveInvoiceMutation.isPending}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  Reject
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleApproveInvoice(true)}
                  disabled={approveInvoiceMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="size-3.5" /> Approve &amp; Authorize
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceListPage;
