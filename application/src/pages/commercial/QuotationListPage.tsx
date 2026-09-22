// application/src/pages/commercial/QuotationListPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuotations, useApproveQuotation, useCreateInvoice } from '../../hooks/useOperations';
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
  FileCheck,
  Check,
  CheckSquare,
  Square,
  Clock,
} from 'lucide-react';

export const QuotationListPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenantId, organizationId, isLabApprover, canPerform, getPermissionLevel, isSuperAdmin } = useAuthContext();
  const { data: quotations = [], isLoading, error } = useQuotations();
  const approveQuotationMutation = useApproveQuotation();
  const createInvoiceMutation = useCreateInvoice();

  const canApproveQuotation = isSuperAdmin || isLabApprover || getPermissionLevel('CREATE_QUOTATION') === 'APPROVE';
  const canCreateQuotation = isSuperAdmin || (!canApproveQuotation && canPerform('CREATE_QUOTATION', 'CREATE'));
  const canCreateInvoice = isSuperAdmin || canPerform('CREATE_INVOICE', 'CREATE');

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

  // Open Approval Modal
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

  // Open Invoice Generation Modal with Checkboxes (Approval Optional)
  const handleOpenInvoiceModal = (q: Quotation) => {
    setInvoiceModalQuote(q);
    setClientPoForInvoice(q.client_po_ref || '');
    setErrorMessage(undefined);
    // Pre-select all unbilled items by default
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

  // Confirm Invoice Generation (Partial or Actual)
  const handleConfirmGenerateInvoice = async () => {
    if (!invoiceModalQuote || !tenantId) return;

    const unbilledItems = (invoiceModalQuote.items || []).filter((it) => !it.invoiced);
    const chosenItems = unbilledItems.filter((it) => selectedItemIds.has(it.id));

    if (chosenItems.length === 0) {
      setErrorMessage('Please select at least one item to generate an invoice.');
      return;
    }

    // Determine Partial vs Actual
    // Total items across the whole quotation
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#111827]">Commercial Quotations &amp; Billing</h1>
            <Badge variant="primary">{quotations.length} Quotations</Badge>
          </div>
          <p className="text-sm text-[#6B7280]">
            Step 10: Issue price estimates, obtain Client PO approval, then generate Partial or Actual Tax Invoices (Step 11)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/commercial/invoices">
            <Button variant="outlineInk">
              <Receipt className="size-4" /> View Invoices (Step 11)
            </Button>
          </Link>
          {canCreateQuotation && (
            <Link to="/commercial/quotations/new">
              <Button variant="primary">
                <Plus className="size-4" /> Create Quotation
              </Button>
            </Link>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-[#fef2f2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px] text-sm">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-[#F0FDF4] border border-[#16A34A]/30 text-[#16A34A] rounded-[4px] text-sm flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Commercial Quotations Repository</CardTitle>
          <CardDescription>
            Quotations must be approved with a Client PO reference before invoicing
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-[#6B7280]">
              <div className="size-6 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading commercial quotations...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-[#DC2626]">
              <AlertCircle className="size-6 mx-auto mb-2" />
              {(error as Error).message}
            </div>
          ) : quotations.length === 0 ? (
            <div className="p-12 text-center text-[#6B7280] space-y-3">
              <FileText className="size-8 mx-auto text-[#9CA3AF]" />
              <p className="text-base font-semibold text-[#374151]">No quotations issued yet</p>
              <p className="text-xs text-[#6B7280]">
                Create a new quotation for calibrated equipment awaiting client billing.
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
                    <th className="px-4 py-3">Client PO Reference</th>
                    <th className="px-4 py-3">Subtotal</th>
                    <th className="px-4 py-3">Discount</th>
                    <th className="px-4 py-3">Tax (GST)</th>
                    <th className="px-4 py-3">Total Amount</th>
                    <th className="px-4 py-3">Billing Status</th>
                    <th className="px-5 py-3 text-right">Commercial Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {quotations.map((q) => {
                    const isApproved = q.status === 'APPROVED';
                    const isPartiallyInvoiced = q.status === 'PARTIALLY_INVOICED';
                    const isFullyInvoiced = q.status === 'INVOICED';
                    const isDraft = q.status === 'DRAFT' || q.status === 'SENT';

                    const totalItems = q.items?.length || 0;
                    const invoicedItems = q.items?.filter((it) => it.invoiced).length || 0;

                    return (
                      <tr key={q.id} className="hover:bg-[#FAFAFA]">
                        <td className="px-5 py-4 font-mono font-medium text-[#0274BB]">
                          {q.quotation_number}
                          <span className="block text-[11px] text-[#6B7280] font-sans">
                            {new Date(q.created_at).toLocaleDateString()}
                          </span>
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
                            >
                              {q.status}
                            </Badge>
                            {totalItems > 0 && (
                              <div className="text-[11px] text-[#6B7280]">
                                Invoiced: {invoicedItems}/{totalItems} items
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Invoicing allowed only when approved or partially invoiced */}
                            {(isApproved || isPartiallyInvoiced) && !isFullyInvoiced && canCreateInvoice && (
                              <Button
                                variant={isApproved ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={() => handleOpenInvoiceModal(q)}
                                disabled={createInvoiceMutation.isPending}
                              >
                                <Receipt className="size-3.5" />
                                {isPartiallyInvoiced
                                  ? 'Invoice Remaining Items'
                                  : 'Generate Tax Invoice'}
                              </Button>
                            )}

                            {/* Lab Approver Approval Action */}
                            {isDraft && canApproveQuotation && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleOpenApprovalModal(q)}
                              >
                                <FileCheck className="size-3.5" /> Approve Quotation
                              </Button>
                            )}

                            {/* Non-Approver Pending Approval Indicator */}
                            {isDraft && !canApproveQuotation && (
                              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200 flex items-center gap-1.5">
                                <Clock className="size-3.5 text-amber-600" /> Pending Lab Approver Approval
                              </span>
                            )}

                            {isFullyInvoiced && (
                              <span className="text-xs text-[#16A34A] font-semibold flex items-center justify-end gap-1">
                                <CheckCircle2 className="size-4" /> Fully Invoiced
                              </span>
                            )}
                            {q.status === 'REJECTED' && (
                              <span className="text-xs text-[#DC2626] font-semibold">Rejected</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 1. Client Approval Modal */}
      {approvalModalQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-[4px] shadow-2xl max-w-lg w-full overflow-hidden border border-[#E5E7EB]">
            <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <FileCheck className="size-5 text-[#0274BB]" />
                <h3 className="font-bold text-[#111827] text-base">Client Quotation Approval</h3>
              </div>
              <button
                type="button"
                onClick={() => setApprovalModalQuote(null)}
                className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded hover:bg-[#E2E8F0]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#1E40AF] font-semibold">Quotation Number:</span>
                  <span className="font-mono font-bold text-[#1E40AF]">
                    {approvalModalQuote.quotation_number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1E40AF] font-semibold">Total Payable:</span>
                  <span className="font-mono font-bold text-[#1E40AF]">
                    ₹{approvalModalQuote.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>

              <Field>
                <FieldLabel>
                  Client Purchase Order (PO) Reference # <span className="text-[#DC2626]">*</span>
                </FieldLabel>
                <Input
                  placeholder="e.g. PO-CLIENT-2026-442"
                  value={clientPoRef}
                  onChange={(e) => setClientPoRef(e.target.value)}
                  required
                />
                <p className="text-[11px] text-[#6B7280] mt-1">
                  Required: Enters client PO reference to authorize invoice billing.
                </p>
              </Field>

              <Field>
                <FieldLabel>Approver Authorization Notes</FieldLabel>
                <Textarea
                  placeholder="Client verbal/email confirmation details, terms agreed..."
                  value={approverNotes}
                  onChange={(e) => setApproverNotes(e.target.value)}
                  rows={2}
                />
              </Field>
            </div>

            <div className="p-4 border-t border-[#E5E7EB] bg-[#F8FAFC] flex justify-between">
              <Button
                variant="destructive"
                size="sm"
                type="button"
                onClick={() => handleConfirmApproval(false)}
                disabled={approveQuotationMutation.isPending}
              >
                Reject Quotation
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outlineInk"
                  size="sm"
                  type="button"
                  onClick={() => {
                    const q = approvalModalQuote;
                    setApprovalModalQuote(null);
                    handleOpenInvoiceModal(q);
                  }}
                >
                  <Receipt className="size-3.5" /> Skip Approval &amp; Invoice Directly
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setApprovalModalQuote(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={() => handleConfirmApproval(true)}
                  disabled={approveQuotationMutation.isPending}
                >
                  <Check className="size-3.5" /> Approve Quotation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Generate Invoice Modal: Partial vs Actual Invoicing with Checkboxes */}
      {invoiceModalQuote && (() => {
        const quoteItems = invoiceModalQuote.items || [];
        const unbilledItems = quoteItems.filter((it) => !it.invoiced);
        const previouslyInvoicedCount = quoteItems.filter((it) => it.invoiced).length;
        const selectedCount = selectedItemIds.size;

        const isActualInvoice =
          unbilledItems.length > 0 && previouslyInvoicedCount + selectedCount >= quoteItems.length;

        const selectedUnbilledItems = unbilledItems.filter((it) => selectedItemIds.has(it.id));
        const subtotalCalc = selectedUnbilledItems.reduce((sum, it) => sum + it.total_price, 0);
        const taxCalc = (subtotalCalc * 18) / 100;
        const grandTotalCalc = subtotalCalc + taxCalc;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
            <div className="bg-white rounded-[4px] shadow-2xl max-w-2xl w-full overflow-hidden border border-[#E5E7EB]">
              <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-[#F8FAFC]">
                <div className="flex items-center gap-2">
                  <Receipt className="size-5 text-[#0274BB]" />
                  <div>
                    <h3 className="font-bold text-[#111827] text-base">Generate Commercial Tax Invoice</h3>
                    <p className="text-xs text-[#6B7280]">
                      Quotation: <span className="font-mono text-[#0274BB]">{invoiceModalQuote.quotation_number}</span> (Approval &amp; PO are optional)
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
              </div>

              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Optional Client PO Field */}
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#1E293B]">Client Purchase Order Reference (Optional)</label>
                    <span className="text-[11px] text-[#64748B] bg-[#E2E8F0] px-1.5 py-0.5 rounded">Optional</span>
                  </div>
                  <Input
                    placeholder="e.g. PO-CLIENT-2026-991 (Leave blank if not needed)"
                    value={clientPoForInvoice}
                    onChange={(e) => setClientPoForInvoice(e.target.value)}
                  />
                </div>

                {/* Invoice Type Dynamic Indicator Banner */}
                {isActualInvoice ? (
                  <div className="p-3.5 bg-[#ECFDF5] border border-[#10B981]/40 rounded-[4px] flex items-center gap-3">
                    <div className="p-1.5 bg-[#10B981] text-white rounded">
                      <CheckCircle2 className="size-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#065F46] uppercase tracking-wider block">
                        Actual / Full Invoice
                      </span>
                      <p className="text-xs text-[#047857]">
                        All items in this batch are selected. This generates the final commercial tax invoice and completes billing.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-[#FFF7ED] border border-[#FDBA74] rounded-[4px] flex items-center gap-3">
                    <div className="p-1.5 bg-[#EA580C] text-white rounded">
                      <Clock className="size-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#9A3412] uppercase tracking-wider block">
                        Partial Invoice ({selectedCount} of {unbilledItems.length} unbilled items ticked)
                      </span>
                      <p className="text-xs text-[#C2410C]">
                        Selected items will be invoiced now. Unchecked items (such as outsourced instruments) can be invoiced on a subsequent invoice when received.
                      </p>
                    </div>
                  </div>
                )}

                {/* Items Checklist */}
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

                  <div className="divide-y divide-[#E5E7EB] max-h-64 overflow-y-auto">
                    {quoteItems.map((it) => {
                      const isAlreadyInvoiced = Boolean(it.invoiced);
                      const isChecked = selectedItemIds.has(it.id);

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
                                Qty: {it.quantity} • Unit: ₹{it.unit_price.toFixed(2)}
                              </span>
                            </div>
                          </label>

                          <div className="text-right shrink-0 ml-3">
                            <span className="font-mono font-bold text-[#111827] block text-sm">
                              ₹{it.total_price.toFixed(2)}
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
                      );
                    })}
                  </div>
                </div>

                {/* Calculation Summary */}
                <div className="p-4 bg-[#F8FAFC] rounded-[4px] border border-[#E5E7EB] flex flex-col items-end gap-1.5 text-xs">
                  <div className="flex justify-between w-64 text-[#64748B]">
                    <span>Selected Items Subtotal:</span>
                    <span className="font-mono text-[#1E293B] font-semibold">₹{subtotalCalc.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between w-64 text-[#64748B]">
                    <span>GST (18%):</span>
                    <span className="font-mono text-[#1E293B] font-semibold">₹{taxCalc.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between w-64 text-sm font-bold text-[#111827] border-t border-[#CBD5E1] pt-1.5 mt-1">
                    <span>Invoice Amount:</span>
                    <span className="font-mono text-[#0274BB]">₹{grandTotalCalc.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-[#E5E7EB] bg-[#F8FAFC] flex justify-between items-center">
                <Button variant="secondary" size="sm" onClick={() => setInvoiceModalQuote(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmGenerateInvoice}
                  disabled={selectedCount === 0 || createInvoiceMutation.isPending}
                >
                  <Receipt className="size-3.5" />
                  {createInvoiceMutation.isPending
                    ? 'Issuing Invoice...'
                    : isActualInvoice
                    ? `Generate Actual Invoice (₹${grandTotalCalc.toFixed(2)})`
                    : `Generate Partial Invoice (₹${grandTotalCalc.toFixed(2)})`}
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default QuotationListPage;
