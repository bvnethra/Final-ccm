// application/src/pages/commercial/InvoiceListPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useInvoices,
  useCalibrationRequests,
  useQuotations,
  useCreateInvoice,
  useUpdateInvoice,
} from '../../hooks/useOperations';
import { useClients } from '../../hooks/useClientMaster';
import { OfficialTaxInvoiceView } from '../../components/commercial/OfficialTaxInvoiceView';
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
} from '../../components/ui/UIPrimitives';
import type { Invoice } from '../../types/domain';
import {
  FileText,
  ArrowRight,
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
  Eye,
  Download,
  Edit,
  Trash2,
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
  const { tenantId, organizationId, isLabApprover, isAdmin } = useAuthContext();
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: clients = [] } = useClients();
  const { data: requests = [] } = useCalibrationRequests();
  const { data: quotations = [] } = useQuotations();
  const createInvoiceMutation = useCreateInvoice();
  const updateInvoiceMutation = useUpdateInvoice();

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'PARTIAL' | 'ACTUAL'>('ALL');

  // Generate Invoice Modal State
  const [showGenerateModal, setShowGenerateModal] = useState<boolean>(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [generateItems, setGenerateItems] = useState<EditableInvoiceItem[]>([]);
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [clientPoForInvoice, setClientPoForInvoice] = useState<string>('');
  const [modalErrorMessage, setModalErrorMessage] = useState<string | undefined>();
  const [successToast, setSuccessToast] = useState<string | undefined>();

  // Edit Issued Invoice (Price Variation) State
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editItems, setEditItems] = useState<EditableInvoiceItem[]>([]);
  const [editDiscountType, setEditDiscountType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [editDiscountValue, setEditDiscountValue] = useState<number>(0);
  const [editClientPo, setEditClientPo] = useState<string>('');
  const [editErrorMessage, setEditErrorMessage] = useState<string | undefined>();

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

  // Eligible work orders for invoice generation
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
      setGenerateItems([]);
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

    if (quote && quote.items && quote.items.length > 0) {
      setClientPoForInvoice(quote.client_po_ref || req?.client_po_ref || '');
      const unbilled = quote.items.filter((it) => !it.invoiced);
      setGenerateItems(
        unbilled.map((it) => ({
          id: it.id,
          sourceId: it.id,
          description: it.description,
          quantity: it.quantity || 1,
          unitPrice: it.unit_price ?? 100,
          hsnSacCode: it.hsn_sac_code || '998346',
          selected: true,
          isCustom: false,
        }))
      );
    } else if (req && req.request_items && req.request_items.length > 0) {
      setClientPoForInvoice(req.client_po_ref || '');
      const unbilled = req.request_items.filter((it: any) => !it.invoiced);
      setGenerateItems(
        unbilled.map((it: any) => ({
          id: it.id,
          sourceId: it.id,
          description: it.item_masters?.item_name || `Calibrated Instrument (SN: ${it.serial_number || 'N/A'})`,
          quantity: it.received_quantity || it.quantity || 1,
          unitPrice: it.item_masters?.standard_cost || 100,
          hsnSacCode: '998346',
          selected: true,
          isCustom: false,
        }))
      );
    } else {
      setClientPoForInvoice(req?.client_po_ref || '');
      setGenerateItems([]);
    }
    setDiscountType('PERCENT');
    setDiscountValue(0);
  };

  const handleAddGenerateCustomLine = () => {
    setGenerateItems((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        description: 'Special Handling / Surcharge',
        quantity: 1,
        unitPrice: 0,
        hsnSacCode: '998346',
        selected: true,
        isCustom: true,
      },
    ]);
  };

  const handleRemoveGenerateLine = (itemId: string) => {
    setGenerateItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const handleUpdateGenerateItem = (itemId: string, field: keyof EditableInvoiceItem, value: any) => {
    setGenerateItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, [field]: value } : it))
    );
  };

  const toggleSelectAllGenerate = () => {
    const allSelected = generateItems.every((it) => it.selected);
    setGenerateItems((prev) => prev.map((it) => ({ ...it, selected: !allSelected })));
  };

  // Submit invoice from modal
  const handleConfirmIssueInvoice = async () => {
    if (!selectedRequest || !tenantId) return;
    setModalErrorMessage(undefined);

    const chosen = generateItems.filter((it) => it.selected);
    if (chosen.length === 0) {
      setModalErrorMessage('Please select or add at least one line item to invoice.');
      return;
    }

    const subtotalCalc = chosen.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
    const discountCalc =
      discountType === 'PERCENT'
        ? (subtotalCalc * Math.min(100, Math.max(0, discountValue))) / 100
        : Math.min(subtotalCalc, Math.max(0, discountValue));
    const taxableCalc = Math.max(0, subtotalCalc - discountCalc);
    const taxCalc = (taxableCalc * 18) / 100;
    const grandTotal = taxableCalc + taxCalc;

    if (isFetchedFromQuotation && matchingQuote) {
      const quoteItems = matchingQuote.items || [];
      const previouslyInvoicedCount = quoteItems.filter((it) => it.invoiced).length;
      const originalChosenCount = chosen.filter((it) => !it.isCustom).length;
      const isActual = previouslyInvoicedCount + originalChosenCount >= quoteItems.length;
      const invoiceType = isActual ? 'ACTUAL' : 'PARTIAL';

      try {
        const inv = await createInvoiceMutation.mutateAsync({
          tenantId,
          organizationId: organizationId || '',
          quotationId: matchingQuote.id,
          requestId: selectedRequest.id,
          clientId: selectedRequest.client_id,
          clientPoRef: clientPoForInvoice.trim() || matchingQuote.client_po_ref || undefined,
          invoiceType,
          selectedItemIds: chosen.map((it) => it.sourceId || it.id),
          subtotal: subtotalCalc,
          discountAmount: discountCalc,
          taxAmount: taxCalc,
          totalAmount: grandTotal,
          items: chosen.map((it) => ({
            quotationItemId: it.sourceId,
            description: it.description,
            hsnSacCode: it.hsnSacCode,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            totalPrice: it.quantity * it.unitPrice,
          })),
        });

        setShowGenerateModal(false);
        setSuccessToast(`Tax Invoice ${inv.invoice_number} successfully issued in INR (₹)!`);
      } catch (err: any) {
        setModalErrorMessage(err.message || 'Failed to generate tax invoice.');
      }
    } else {
      // Direct invoicing from Request
      const reqItems = selectedRequest.request_items || [];
      const previouslyInvoicedCount = reqItems.filter((it: any) => it.invoiced).length;
      const originalChosenCount = chosen.filter((it) => !it.isCustom).length;
      const isActual = previouslyInvoicedCount + originalChosenCount >= reqItems.length;
      const invoiceType = isActual ? 'ACTUAL' : 'PARTIAL';

      try {
        const inv = await createInvoiceMutation.mutateAsync({
          tenantId,
          organizationId: organizationId || '',
          requestId: selectedRequest.id,
          clientId: selectedRequest.client_id,
          clientPoRef: clientPoForInvoice.trim() || selectedRequest.client_po_ref || undefined,
          invoiceType,
          selectedItemIds: chosen.map((it) => it.sourceId || it.id),
          subtotal: subtotalCalc,
          discountAmount: discountCalc,
          taxAmount: taxCalc,
          totalAmount: grandTotal,
          items: chosen.map((it) => ({
            requestItemId: it.sourceId,
            description: it.description,
            hsnSacCode: it.hsnSacCode,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            totalPrice: it.quantity * it.unitPrice,
          })),
        });

        setShowGenerateModal(false);
        setSuccessToast(`Direct Tax Invoice ${inv.invoice_number} successfully issued in INR (₹)!`);
      } catch (err: any) {
        setModalErrorMessage(err.message || 'Failed to generate direct tax invoice.');
      }
    }
  };

  // Open Edit / Price Variation for already issued invoice
  const handleOpenEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setEditErrorMessage(undefined);
    setEditClientPo(inv.client_po_ref || '');
    const items = (inv.items && inv.items.length > 0 ? inv.items : []).map((it, idx) => ({
      id: it.id || `inv-item-${idx}`,
      sourceId: it.quotation_item_id,
      description: it.description,
      quantity: it.quantity || 1,
      unitPrice: it.unit_price ?? it.unit_rate ?? 0,
      hsnSacCode: it.hsn_sac_code || '998346',
      selected: true,
      isCustom: !it.quotation_item_id,
    }));
    setEditItems(items);

    if (inv.discount_amount && inv.discount_amount > 0) {
      setEditDiscountType('FLAT');
      setEditDiscountValue(inv.discount_amount);
    } else {
      setEditDiscountType('PERCENT');
      setEditDiscountValue(0);
    }
  };

  const handleAddEditCustomLine = () => {
    setEditItems((prev) => [
      ...prev,
      {
        id: `custom-edit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        description: 'Price Variation / Extra Charge',
        quantity: 1,
        unitPrice: 0,
        hsnSacCode: '998346',
        selected: true,
        isCustom: true,
      },
    ]);
  };

  const handleRemoveEditLine = (itemId: string) => {
    setEditItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const handleUpdateEditItem = (itemId: string, field: keyof EditableInvoiceItem, value: any) => {
    setEditItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, [field]: value } : it))
    );
  };

  // Save changes to issued invoice
  const handleSaveEditInvoice = async () => {
    if (!editingInvoice || !tenantId) return;
    setEditErrorMessage(undefined);

    const chosen = editItems.filter((it) => it.selected);
    if (chosen.length === 0) {
      setEditErrorMessage('Invoice must contain at least one active item.');
      return;
    }

    const subtotalCalc = chosen.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
    const discountCalc =
      editDiscountType === 'PERCENT'
        ? (subtotalCalc * Math.min(100, Math.max(0, editDiscountValue))) / 100
        : Math.min(subtotalCalc, Math.max(0, editDiscountValue));
    const taxableCalc = Math.max(0, subtotalCalc - discountCalc);
    const taxCalc = (taxableCalc * 18) / 100;
    const grandTotal = taxableCalc + taxCalc;

    try {
      await updateInvoiceMutation.mutateAsync({
        id: editingInvoice.id,
        tenantId,
        clientPoRef: editClientPo.trim() || undefined,
        subtotal: subtotalCalc,
        discountAmount: discountCalc,
        taxAmount: taxCalc,
        totalAmount: grandTotal,
        items: chosen.map((it) => ({
          id: it.id,
          invoice_id: editingInvoice.id,
          quotation_item_id: it.sourceId,
          description: it.description,
          hsn_sac_code: it.hsnSacCode,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          unit_rate: it.unitPrice,
          total_price: it.quantity * it.unitPrice,
        })),
      });

      setEditingInvoice(null);
      setSuccessToast(`Invoice ${editingInvoice.invoice_number} successfully updated with price variations!`);
    } catch (err: any) {
      setEditErrorMessage(err.message || 'Failed to update invoice.');
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
            className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
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
            Official commercial GST tax invoices in Indian Rupees (₹) with full price variation editing
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/commercial/quotations">
            <Button variant="outlineInk">
              View Quotations <ArrowRight className="size-3.5" />
            </Button>
          </Link>
          {!isLabApprover && !isAdmin && (
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
              <span className="text-xs text-[#6B7280] block">Total Billed Gross (₹)</span>
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
            Legally valid commercial GST tax invoices in Indian Rupees (₹) with price variation controls
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
                    <th className="px-5 py-3">Invoice #</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Client PO Reference</th>
                    <th className="px-4 py-3">Subtotal (₹)</th>
                    <th className="px-4 py-3">Tax GST (₹)</th>
                    <th className="px-4 py-3">Grand Total (₹)</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Invoice Date</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#FAFAFA]">
                      <td className="px-5 py-4">
                        <Link
                          to={`/commercial/invoices/${inv.id}`}
                          className="font-mono font-bold text-[#0274BB] hover:underline flex items-center gap-1"
                          title="Click to open full Tax Invoice format"
                        >
                          <Receipt className="size-3.5" />
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
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
                      <td className="px-4 py-4 font-mono text-xs">
                        {inv.client_po_ref ? (
                          <span className="px-2 py-0.5 bg-[#F1F5F9] rounded border border-[#E2E8F0] font-semibold text-[#334155]">
                            {inv.client_po_ref}
                          </span>
                        ) : (
                          <span className="text-[#9CA3AF] italic">Not Provided</span>
                        )}
                      </td>
                      <td className="px-4 py-4 font-mono text-[#374151]">
                        ₹{inv.subtotal.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 font-mono text-[#6B7280]">
                        ₹{inv.tax_amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 font-mono font-bold text-[#111827]">
                        ₹{inv.total_amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="success">{inv.invoice_status}</Badge>
                      </td>
                      <td className="px-4 py-4 text-[#6B7280] text-xs">
                        {new Date(inv.invoice_date).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenEditInvoice(inv)}
                            className="flex items-center gap-1 text-[#0274BB] hover:text-[#025a92]"
                            title="Edit Unit Rates, Quantities, or Add Price Variation"
                          >
                            <Edit className="size-3.5" /> Price Variation
                          </Button>
                          <Link to={`/commercial/invoices/${inv.id}`}>
                            <Button variant="primary" size="sm" className="flex items-center gap-1">
                              <Download className="size-3.5" /> Export PDF
                            </Button>
                          </Link>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedInvoice(inv)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="size-3.5" /> Preview
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
      {/* 1. Generate Tax Invoice Modal (Full Inline Editing & Variations)     */}
      {/* ==================================================================== */}
      {showGenerateModal && (() => {
        const chosenItems = generateItems.filter((it) => it.selected);
        const selectedCount = chosenItems.length;
        const totalItemsCount = generateItems.length;

        // Subtotal based on live editable items
        const subtotalCalc = chosenItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
        const discountCalc =
          discountType === 'PERCENT'
            ? (subtotalCalc * Math.min(100, Math.max(0, discountValue))) / 100
            : Math.min(subtotalCalc, Math.max(0, discountValue));
        const taxableCalc = Math.max(0, subtotalCalc - discountCalc);
        const taxCalc = (taxableCalc * 18) / 100;
        const grandTotalCalc = taxableCalc + taxCalc;

        const isActualInvoice =
          totalItemsCount > 0 && selectedCount >= totalItemsCount;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
            <div className="bg-white rounded-[4px] shadow-2xl max-w-3xl w-full overflow-hidden border border-[#E5E7EB]">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-[#F8FAFC]">
                <div className="flex items-center gap-2">
                  <Receipt className="size-5 text-[#0274BB]" />
                  <div>
                    <h3 className="font-bold text-[#111827] text-base">Generate Commercial Tax Invoice (₹ INR)</h3>
                    <p className="text-xs text-[#6B7280]">
                      All item rates, quantities, descriptions, and extra charges are fully editable for price variations
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded hover:bg-[#E2E8F0] cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
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
                    {/* Work Order Selection */}
                    <Field>
                      <FieldLabel>Select Work Order / Calibration Request</FieldLabel>
                      <Select
                        value={selectedRequestId}
                        onChange={(e) => handleSelectRequest(e.target.value)}
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

                    {/* Mode Indicator: Fetched from Quotation vs Direct Invoicing */}
                    {isFetchedFromQuotation ? (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-[4px] flex items-center gap-2.5 text-xs text-blue-900">
                        <FileText className="size-4 text-blue-600 shrink-0" />
                        <div>
                          <span className="font-semibold block">
                            Fetched from Quotation: {matchingQuote?.quotation_number}
                          </span>
                          <span>
                            Line items and agreed rates loaded. You can freely edit unit rates, quantities, or add price variations below.
                          </span>
                        </div>
                      </div>
                    ) : selectedRequest ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[4px] flex items-center gap-2.5 text-xs text-emerald-900">
                        <Receipt className="size-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-semibold block">
                            Direct Invoicing (Work Order: {selectedRequest.request_number})
                          </span>
                          <span>
                            Equipment items loaded. All rates and fees are editable in Indian Rupees (₹).
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {/* Optional Client PO Reference Field */}
                    <Field>
                      <FieldLabel>Client Purchase Order Reference (Optional)</FieldLabel>
                      <Input
                        placeholder="E.g. PO-CLIENT-2026-9921"
                        value={clientPoForInvoice}
                        onChange={(e) => setClientPoForInvoice(e.target.value)}
                      />
                    </Field>

                    {/* Classification Notice (Partial vs Actual) */}
                    {selectedCount > 0 && (
                      <div
                        className={`p-3 rounded-[4px] border flex items-start gap-2.5 ${
                          isActualInvoice
                            ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534]'
                            : 'bg-[#FFF7ED] border-[#FDBA74] text-[#9A3412]'
                        }`}
                      >
                        {isActualInvoice ? (
                          <CheckCircle2 className="size-4 text-[#16A34A] shrink-0 mt-0.5" />
                        ) : (
                          <Split className="size-4 text-[#EA580C] shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="font-bold text-xs block">
                            {isActualInvoice
                              ? 'Actual Tax Invoice (Full & Final Billing)'
                              : 'Partial Tax Invoice (Selected Items Only)'}
                          </span>
                          <p className="text-xs text-[#C2410C]">
                            Prices and descriptions below can be adjusted to match client quotation agreements or special variations.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Editable Line Items Table */}
                    <div className="border border-[#E5E7EB] rounded-[4px] overflow-hidden">
                      <div className="p-3 bg-[#F8FAFC] border-b border-[#E5E7EB] flex items-center justify-between">
                        <button
                          type="button"
                          onClick={toggleSelectAllGenerate}
                          className="text-xs font-semibold text-[#0274BB] hover:underline flex items-center gap-1.5 cursor-pointer"
                        >
                          {generateItems.every((it) => it.selected) && generateItems.length > 0 ? (
                            <CheckSquare className="size-4 text-[#0274BB]" />
                          ) : (
                            <Square className="size-4 text-[#6B7280]" />
                          )}
                          <span>
                            {generateItems.every((it) => it.selected) ? 'Deselect All' : 'Select All Ready Items'}
                          </span>
                        </button>
                        <Button
                          type="button"
                          variant="outlineInk"
                          size="sm"
                          onClick={handleAddGenerateCustomLine}
                          className="flex items-center gap-1 text-xs py-1 h-7"
                        >
                          <Plus className="size-3" /> Add Price Variation Line
                        </Button>
                      </div>

                      <div className="divide-y divide-[#E5E7EB] max-h-64 overflow-y-auto">
                        {generateItems.map((it) => {
                          const lineTotal = it.quantity * it.unitPrice;

                          return (
                            <div
                              key={it.id}
                              className={`p-3 text-xs transition-colors space-y-2 ${
                                it.selected ? 'bg-[#F0FDF4]/50' : 'bg-white opacity-70'
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={it.selected}
                                  onChange={(e) =>
                                    handleUpdateGenerateItem(it.id, 'selected', e.target.checked)
                                  }
                                  className="size-4 text-[#0274BB] rounded border-[#CBD5E1] cursor-pointer mt-1"
                                />

                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2">
                                  {/* Description */}
                                  <div className="sm:col-span-6">
                                    <label className="text-[10px] text-gray-500 font-semibold block mb-0.5">
                                      Description of Services
                                    </label>
                                    <input
                                      type="text"
                                      value={it.description}
                                      onChange={(e) =>
                                        handleUpdateGenerateItem(it.id, 'description', e.target.value)
                                      }
                                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#0274BB] bg-white font-medium"
                                      placeholder="Service or fee description..."
                                    />
                                  </div>

                                  {/* SAC Code */}
                                  <div className="sm:col-span-2">
                                    <label className="text-[10px] text-gray-500 font-semibold block mb-0.5">
                                      HSN/SAC
                                    </label>
                                    <input
                                      type="text"
                                      value={it.hsnSacCode}
                                      onChange={(e) =>
                                        handleUpdateGenerateItem(it.id, 'hsnSacCode', e.target.value)
                                      }
                                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono text-center bg-white"
                                    />
                                  </div>

                                  {/* Quantity */}
                                  <div className="sm:col-span-2">
                                    <label className="text-[10px] text-gray-500 font-semibold block mb-0.5">
                                      Qty (NOS)
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={it.quantity}
                                      onChange={(e) =>
                                        handleUpdateGenerateItem(
                                          it.id,
                                          'quantity',
                                          Math.max(1, parseInt(e.target.value, 10) || 1)
                                        )
                                      }
                                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono text-right bg-white"
                                    />
                                  </div>

                                  {/* Unit Rate in INR */}
                                  <div className="sm:col-span-2">
                                    <label className="text-[10px] text-gray-500 font-semibold block mb-0.5">
                                      Rate (₹)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={it.unitPrice}
                                      onChange={(e) =>
                                        handleUpdateGenerateItem(
                                          it.id,
                                          'unitPrice',
                                          Math.max(0, parseFloat(e.target.value) || 0)
                                        )
                                      }
                                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono text-right bg-white font-bold text-[#0274BB]"
                                    />
                                  </div>
                                </div>

                                <div className="text-right shrink-0 min-w-[70px] pt-4">
                                  <span className="font-mono font-bold text-[#111827] block text-xs">
                                    ₹{lineTotal.toFixed(2)}
                                  </span>
                                  {it.isCustom && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveGenerateLine(it.id)}
                                      className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer mt-1"
                                      title="Remove Custom Line"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Client Commercial Discount Controls in INR */}
                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-[4px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">Client Commercial Discount</span>
                        <span className="text-[11px] text-slate-500">
                          Apply negotiated client discount (% percentage or ₹ Flat in Rupees)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="inline-flex rounded border border-slate-300 bg-white p-0.5">
                          <button
                            type="button"
                            onClick={() => setDiscountType('PERCENT')}
                            className={`px-2 py-0.5 text-xs font-semibold rounded cursor-pointer ${
                              discountType === 'PERCENT'
                                ? 'bg-[#0274BB] text-white'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            % Percent
                          </button>
                          <button
                            type="button"
                            onClick={() => setDiscountType('FLAT')}
                            className={`px-2 py-0.5 text-xs font-semibold rounded cursor-pointer ${
                              discountType === 'FLAT'
                                ? 'bg-[#0274BB] text-white'
                                : 'text-slate-600 hover:text-slate-900'
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
                            step={discountType === 'PERCENT' ? '1' : '50'}
                            value={discountValue}
                            onChange={(e) => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              setDiscountValue(discountType === 'PERCENT' ? Math.min(100, val) : val);
                            }}
                            placeholder="0"
                            className="w-20 px-2 py-1 border border-slate-300 rounded text-right font-mono font-bold text-xs bg-white"
                          />
                          <span className="ml-1 text-xs font-bold text-slate-600">
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

                    {/* Calculation Summary in INR */}
                    <div className="p-4 bg-[#F8FAFC] rounded-[4px] border border-[#E5E7EB] flex flex-col items-end gap-1.5 text-xs">
                      <div className="flex justify-between w-72 text-[#64748B]">
                        <span>Selected Items Subtotal:</span>
                        <span className="font-mono text-[#1E293B] font-semibold">
                          ₹{subtotalCalc.toFixed(2)}
                        </span>
                      </div>
                      {discountCalc > 0 && (
                        <div className="flex justify-between w-72 text-emerald-700 font-semibold">
                          <span>Client Discount Applied:</span>
                          <span className="font-mono">-₹{discountCalc.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between w-72 text-[#64748B]">
                        <span>Net Taxable Subtotal:</span>
                        <span className="font-mono text-[#1E293B] font-semibold">
                          ₹{taxableCalc.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between w-72 text-[#64748B]">
                        <span>GST (18%):</span>
                        <span className="font-mono text-[#1E293B] font-semibold">
                          ₹{taxCalc.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between w-72 text-sm font-bold text-[#111827] border-t border-[#CBD5E1] pt-1.5 mt-1">
                        <span>Total Tax Invoice (₹):</span>
                        <span className="font-mono text-[#0274BB]">
                          ₹{grandTotalCalc.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[#E5E7EB] bg-[#F8FAFC] flex justify-between items-center">
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
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================================================================== */}
      {/* 2. Edit Issued Invoice / Price Variation Modal                       */}
      {/* ==================================================================== */}
      {editingInvoice && (() => {
        const chosenItems = editItems.filter((it) => it.selected);
        const subtotalCalc = chosenItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
        const discountCalc =
          editDiscountType === 'PERCENT'
            ? (subtotalCalc * Math.min(100, Math.max(0, editDiscountValue))) / 100
            : Math.min(subtotalCalc, Math.max(0, editDiscountValue));
        const taxableCalc = Math.max(0, subtotalCalc - discountCalc);
        const taxCalc = (taxableCalc * 18) / 100;
        const grandTotalCalc = taxableCalc + taxCalc;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
            <div className="bg-white rounded-[4px] shadow-2xl max-w-3xl w-full overflow-hidden border border-[#E5E7EB]">
              <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-[#F8FAFC]">
                <div className="flex items-center gap-2">
                  <Edit className="size-5 text-[#0274BB]" />
                  <div>
                    <h3 className="font-bold text-[#111827] text-base">
                      Price Variation &amp; Invoice Editing — {editingInvoice.invoice_number}
                    </h3>
                    <p className="text-xs text-[#6B7280]">
                      Adjust item rates, quantities, descriptions, and custom variation fees in INR (₹)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded hover:bg-[#E2E8F0] cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
                {editErrorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                    {editErrorMessage}
                  </div>
                )}

                <Field>
                  <FieldLabel>Client Purchase Order Reference</FieldLabel>
                  <Input
                    placeholder="E.g. PO-CLIENT-2026-9921"
                    value={editClientPo}
                    onChange={(e) => setEditClientPo(e.target.value)}
                  />
                </Field>

                {/* Line Items Table */}
                <div className="border border-[#E5E7EB] rounded-[4px] overflow-hidden">
                  <div className="p-3 bg-[#F8FAFC] border-b border-[#E5E7EB] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#111827]">
                      Invoice Line Items ({editItems.length})
                    </span>
                    <Button
                      type="button"
                      variant="outlineInk"
                      size="sm"
                      onClick={handleAddEditCustomLine}
                      className="flex items-center gap-1 text-xs py-1 h-7"
                    >
                      <Plus className="size-3" /> Add Price Variation Line
                    </Button>
                  </div>

                  <div className="divide-y divide-[#E5E7EB] max-h-64 overflow-y-auto">
                    {editItems.map((it) => {
                      const lineTotal = it.quantity * it.unitPrice;

                      return (
                        <div
                          key={it.id}
                          className={`p-3 text-xs transition-colors space-y-2 ${
                            it.selected ? 'bg-[#F0FDF4]/50' : 'bg-white opacity-70'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              checked={it.selected}
                              onChange={(e) =>
                                handleUpdateEditItem(it.id, 'selected', e.target.checked)
                              }
                              className="size-4 text-[#0274BB] rounded border-[#CBD5E1] cursor-pointer mt-1"
                            />

                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2">
                              <div className="sm:col-span-6">
                                <label className="text-[10px] text-gray-500 font-semibold block mb-0.5">
                                  Description of Services
                                </label>
                                <input
                                  type="text"
                                  value={it.description}
                                  onChange={(e) =>
                                    handleUpdateEditItem(it.id, 'description', e.target.value)
                                  }
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#0274BB] bg-white font-medium"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="text-[10px] text-gray-500 font-semibold block mb-0.5">
                                  HSN/SAC
                                </label>
                                <input
                                  type="text"
                                  value={it.hsnSacCode}
                                  onChange={(e) =>
                                    handleUpdateEditItem(it.id, 'hsnSacCode', e.target.value)
                                  }
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono text-center bg-white"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="text-[10px] text-gray-500 font-semibold block mb-0.5">
                                  Qty (NOS)
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={it.quantity}
                                  onChange={(e) =>
                                    handleUpdateEditItem(
                                      it.id,
                                      'quantity',
                                      Math.max(1, parseInt(e.target.value, 10) || 1)
                                    )
                                  }
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono text-right bg-white"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="text-[10px] text-gray-500 font-semibold block mb-0.5">
                                  Rate (₹)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={it.unitPrice}
                                  onChange={(e) =>
                                    handleUpdateEditItem(
                                      it.id,
                                      'unitPrice',
                                      Math.max(0, parseFloat(e.target.value) || 0)
                                    )
                                  }
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono text-right bg-white font-bold text-[#0274BB]"
                                />
                              </div>
                            </div>

                            <div className="text-right shrink-0 min-w-[70px] pt-4">
                              <span className="font-mono font-bold text-[#111827] block text-xs">
                                ₹{lineTotal.toFixed(2)}
                              </span>
                              {it.isCustom && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEditLine(it.id)}
                                  className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer mt-1"
                                  title="Remove Line"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Discount in INR */}
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-[4px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">Commercial Discount</span>
                    <span className="text-[11px] text-slate-500">Apply discount (% or ₹ Flat)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded border border-slate-300 bg-white p-0.5">
                      <button
                        type="button"
                        onClick={() => setEditDiscountType('PERCENT')}
                        className={`px-2 py-0.5 text-xs font-semibold rounded cursor-pointer ${
                          editDiscountType === 'PERCENT'
                            ? 'bg-[#0274BB] text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        % Percent
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditDiscountType('FLAT')}
                        className={`px-2 py-0.5 text-xs font-semibold rounded cursor-pointer ${
                          editDiscountType === 'FLAT'
                            ? 'bg-[#0274BB] text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ₹ Flat
                      </button>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="0"
                        max={editDiscountType === 'PERCENT' ? 100 : subtotalCalc}
                        step={editDiscountType === 'PERCENT' ? '1' : '50'}
                        value={editDiscountValue}
                        onChange={(e) => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          setEditDiscountValue(editDiscountType === 'PERCENT' ? Math.min(100, val) : val);
                        }}
                        placeholder="0"
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-right font-mono font-bold text-xs bg-white"
                      />
                      <span className="ml-1 text-xs font-bold text-slate-600">
                        {editDiscountType === 'PERCENT' ? '%' : '₹'}
                      </span>
                    </div>
                    {discountCalc > 0 && (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded text-xs border border-emerald-200 shrink-0">
                        -₹{discountCalc.toFixed(2)} off
                      </span>
                    )}
                  </div>
                </div>

                {/* Calculation Summary in INR */}
                <div className="p-4 bg-[#F8FAFC] rounded-[4px] border border-[#E5E7EB] flex flex-col items-end gap-1.5 text-xs">
                  <div className="flex justify-between w-72 text-[#64748B]">
                    <span>Items Subtotal:</span>
                    <span className="font-mono text-[#1E293B] font-semibold">
                      ₹{subtotalCalc.toFixed(2)}
                    </span>
                  </div>
                  {discountCalc > 0 && (
                    <div className="flex justify-between w-72 text-emerald-700 font-semibold">
                      <span>Discount Applied:</span>
                      <span className="font-mono">-₹{discountCalc.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between w-72 text-[#64748B]">
                    <span>Net Taxable Subtotal:</span>
                    <span className="font-mono text-[#1E293B] font-semibold">
                      ₹{taxableCalc.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between w-72 text-[#64748B]">
                    <span>GST (18%):</span>
                    <span className="font-mono text-[#1E293B] font-semibold">
                      ₹{taxCalc.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between w-72 text-sm font-bold text-[#111827] border-t border-[#CBD5E1] pt-1.5 mt-1">
                    <span>Updated Grand Total (₹):</span>
                    <span className="font-mono text-[#0274BB]">
                      ₹{grandTotalCalc.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-[#E5E7EB] bg-[#F8FAFC] flex justify-between items-center">
                <Button variant="secondary" size="sm" onClick={() => setEditingInvoice(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveEditInvoice}
                  disabled={chosenItems.length === 0 || grandTotalCalc <= 0 || updateInvoiceMutation.isPending}
                >
                  <Check className="size-3.5" />
                  {updateInvoiceMutation.isPending
                    ? 'Saving Variations...'
                    : `Save Price Variations (₹${grandTotalCalc.toFixed(2)})`}
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================================================================== */}
      {/* 3. Authentic Tax Invoice Preview & PDF Export Modal                  */}
      {/* ==================================================================== */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-[4px] shadow-2xl max-w-5xl w-full max-h-[94vh] overflow-y-auto border border-[#E5E7EB] flex flex-col">
            <div className="sticky top-0 z-20 flex items-center justify-between p-3 border-b border-[#E5E7EB] bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Receipt className="size-5 text-[#0274BB]" />
                <h3 className="font-bold text-[#111827] text-base">
                  Official GST Tax Invoice — {selectedInvoice.invoice_number}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outlineInk"
                  size="sm"
                  onClick={() => {
                    const inv = selectedInvoice;
                    setSelectedInvoice(null);
                    handleOpenEditInvoice(inv);
                  }}
                  className="flex items-center gap-1 text-[#0274BB]"
                >
                  <Edit className="size-3.5" /> Price Variation
                </Button>
                <Link to={`/commercial/invoices/${selectedInvoice.id}`}>
                  <Button variant="secondary" size="sm">
                    Open Full Page
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded hover:bg-[#E2E8F0] cursor-pointer"
                  title="Close Preview"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="p-3 sm:p-6 bg-[#474B4E] overflow-y-auto flex-1">
              <OfficialTaxInvoiceView
                invoice={selectedInvoice}
                client={clients.find((c) => c.id === selectedInvoice.client_id)}
                request={requests.find((r) => r.id === selectedInvoice.request_id)}
                onClose={() => setSelectedInvoice(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceListPage;
