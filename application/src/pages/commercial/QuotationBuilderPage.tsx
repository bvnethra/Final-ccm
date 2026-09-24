// application/src/pages/commercial/QuotationBuilderPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  useCalibrationRequests,
  useCreateQuotation,
  useClientPastServicedItems,
} from '../../hooks/useOperations';
import { useClients } from '../../hooks/useClientMaster';
import { useItemMasters } from '../../hooks/useItemMaster';
import { useAuthContext } from '../../contexts/AuthContext';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Select,
  Field,
  FieldLabel,
  Badge,
} from '../../components/ui/UIPrimitives';
import type { QuotationType, ItemMaster } from '../../types/domain';
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Building2,
  ClipboardList,
  History,
  AlertCircle,
  Check,
  Search,
  ChevronDown,
} from 'lucide-react';

interface QuotationLineState {
  description: string;
  range?: string;
  remarks?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ItemMasterComboboxProps {
  value: string;
  itemMasters: ItemMaster[];
  onChange: (description: string, itemMaster?: ItemMaster) => void;
  placeholder?: string;
}

const ItemMasterCombobox: React.FC<ItemMasterComboboxProps> = ({
  value,
  itemMasters,
  onChange,
  placeholder = 'Search or select from Item Master...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredItems = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return itemMasters;
    return itemMasters.filter(
      (it) =>
        it.item_name?.toLowerCase().includes(q) ||
        it.item_code?.toLowerCase().includes(q) ||
        it.item_category?.toLowerCase().includes(q) ||
        it.model?.toLowerCase().includes(q)
    );
  }, [itemMasters, searchQuery]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative flex items-center">
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setSearchQuery(value || '');
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className="h-8 text-xs pr-7 w-full font-medium"
          required
        />
        <button
          type="button"
          onClick={() => {
            setSearchQuery('');
            setIsOpen((prev) => !prev);
          }}
          className="absolute right-1 text-slate-400 hover:text-[#0274BB] p-1 rounded focus:outline-none"
          title="Browse Item Master (Dropdown & Search)"
        >
          <ChevronDown className={`size-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-full min-w-[320px] max-w-lg bg-white border border-[#CBD5E1] rounded shadow-xl z-50 overflow-hidden text-xs animate-in fade-in">
          <div className="p-2 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center gap-1.5 text-[11px] text-slate-600">
            <Search className="size-3 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Filter items by name, code, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-xs text-slate-800 placeholder:text-slate-400"
              autoFocus
            />
            <span className="text-[10px] text-slate-400 shrink-0 font-medium">
              {filteredItems.length} items
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <div className="p-3 text-center text-slate-500 text-xs">
                No matching item in Item Master. Custom description entered above will be preserved.
              </div>
            ) : (
              filteredItems.map((im) => {
                const rangeStr =
                  im.measurement_range ||
                  (im.range_min !== undefined && im.range_max !== undefined
                    ? `${im.range_min}-${im.range_max} ${im.range_unit || ''}`.trim()
                    : im.model || '');

                return (
                  <button
                    key={im.id}
                    type="button"
                    onClick={() => {
                      onChange(im.item_name, im);
                      setIsOpen(false);
                    }}
                    className="w-full text-left p-2.5 hover:bg-[#EFF6FF] transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 truncate">
                          {im.item_name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 font-mono">
                          {im.item_code}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {rangeStr ? `Range: ${rangeStr}` : 'Standard Instrument'}
                        {im.item_category ? ` • Cat: ${im.item_category}` : ''}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-[#0274BB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                        ₹{(im.standard_cost || 0).toFixed(2)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const QuotationBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRequestId = searchParams.get('requestId') || '';
  const initialClientId = searchParams.get('clientId') || '';
  const initialSource = searchParams.get('source') || '';

  const { tenantId, organizationId } = useAuthContext();
  const { data: requests = [] } = useCalibrationRequests();
  const { data: clients = [] } = useClients();
  const { data: itemMasters = [] } = useItemMasters();
  const createQuotationMutation = useCreateQuotation();

  const [quotationType, setQuotationType] = useState<QuotationType>(
    initialRequestId || initialSource === 'inward'
      ? 'INWARD_REQUEST'
      : initialClientId
      ? 'CLIENT_ESTIMATE'
      : 'INWARD_REQUEST'
  );

  const [selectedRequestId, setSelectedRequestId] = useState<string>(initialRequestId);
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId);

  const [kindAttn, setKindAttn] = useState<string>('');
  const [phoneNo, setPhoneNo] = useState<string>('');
  const [quotationDate, setQuotationDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [subject, setSubject] = useState<string>(
    'Quotation for Calibration Charges for Instruments and Gauges - Reg.'
  );
  const [enquiryRef, setEnquiryRef] = useState<string>(
    `verbal ${new Date().toLocaleDateString('en-GB')}`
  );

  // Synchronized discount and editable grand total states
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(18);
  const [editableGrandTotal, setEditableGrandTotal] = useState<number>(0);
  const [lastEditedField, setLastEditedField] = useState<'PERCENT' | 'AMOUNT' | 'GRAND'>('PERCENT');

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const [items, setItems] = useState<QuotationLineState[]>([
    {
      description: '',
      range: '',
      remarks: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    },
  ]);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  // Commercial calculations
  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * taxRate) / 100;
  const grandTotal = taxableAmount + taxAmount;

  // Keep grand total / discount synced when subtotal or taxRate changes
  useEffect(() => {
    if (subtotal <= 0) {
      setDiscountAmount(0);
      setDiscountPercent(0);
      setEditableGrandTotal(0);
      return;
    }
    if (lastEditedField === 'PERCENT') {
      const amt = (subtotal * discountPercent) / 100;
      setDiscountAmount(amt);
      const taxable = Math.max(0, subtotal - amt);
      setEditableGrandTotal(taxable + (taxable * taxRate) / 100);
    } else if (lastEditedField === 'AMOUNT') {
      const pct = (discountAmount / subtotal) * 100;
      setDiscountPercent(Math.min(100, Math.max(0, pct)));
      const taxable = Math.max(0, subtotal - discountAmount);
      setEditableGrandTotal(taxable + (taxable * taxRate) / 100);
    }
  }, [subtotal, taxRate]);

  const handleDiscountPercentChange = (pct: number) => {
    const validPct = Math.min(100, Math.max(0, pct));
    setDiscountPercent(validPct);
    setLastEditedField('PERCENT');
    const amt = (subtotal * validPct) / 100;
    setDiscountAmount(amt);
    const taxable = Math.max(0, subtotal - amt);
    setEditableGrandTotal(taxable + (taxable * taxRate) / 100);
  };

  const handleDiscountAmountChange = (amt: number) => {
    const validAmt = Math.min(subtotal, Math.max(0, amt));
    setDiscountAmount(validAmt);
    setLastEditedField('AMOUNT');
    const pct = subtotal > 0 ? (validAmt / subtotal) * 100 : 0;
    setDiscountPercent(pct);
    const taxable = Math.max(0, subtotal - validAmt);
    setEditableGrandTotal(taxable + (taxable * taxRate) / 100);
  };

  const handleGrandTotalChange = (targetTotal: number) => {
    setEditableGrandTotal(targetTotal);
    setLastEditedField('GRAND');
    if (subtotal <= 0) return;
    const taxMultiplier = 1 + taxRate / 100;
    const targetTaxable = Math.max(0, targetTotal / taxMultiplier);
    const targetDiscountAmt = Math.max(0, subtotal - targetTaxable);
    setDiscountAmount(targetDiscountAmt);
    const pct = (targetDiscountAmt / subtotal) * 100;
    setDiscountPercent(Math.min(100, Math.max(0, pct)));
  };

  // Fetch past serviced items for CLIENT_ESTIMATE mode when a client is selected
  const { data: pastServicedItems = [], isLoading: isLoadingPastItems } = useClientPastServicedItems(
    quotationType === 'CLIENT_ESTIMATE' && selectedClientId ? selectedClientId : undefined
  );

  // Auto-sync when selectedRequestId changes (Inward Request mode)
  useEffect(() => {
    if (quotationType === 'INWARD_REQUEST' && selectedRequestId && requests.length > 0) {
      const found = requests.find((r) => r.id === selectedRequestId);
      if (found) {
        if (found.client_id) setSelectedClientId(found.client_id);
        if (found.clients) {
          if (found.clients.contact_person) setKindAttn(found.clients.contact_person);
          if (found.clients.phone) setPhoneNo(found.clients.phone);
        }
        if (found.request_items && found.request_items.length > 0) {
          const mapped: QuotationLineState[] = found.request_items.map((it) => {
            const name = it.item_masters?.item_name || 'Standard Equipment';
            const cost = it.item_masters?.standard_cost || 0;
            const range =
              it.item_masters?.range_min !== undefined && it.item_masters?.range_max !== undefined
                ? `${it.item_masters.range_min}-${it.item_masters.range_max} ${it.item_masters.range_unit || ''}`.trim()
                : '';
            return {
              description: name,
              range,
              remarks: it.remarks || '',
              quantity: it.quantity || 1,
              unitPrice: cost,
              totalPrice: (it.quantity || 1) * cost,
            };
          });
          setItems(mapped);
        }
      }
    }
  }, [selectedRequestId, requests, quotationType]);

  // Auto-sync contact details when a client is selected from master
  useEffect(() => {
    if (selectedClientId && clients.length > 0) {
      const client = clients.find((c) => c.id === selectedClientId);
      if (client) {
        if (client.contact_person) setKindAttn(client.contact_person);
        if (client.phone) setPhoneNo(client.phone);
      }
    }
  }, [selectedClientId, clients]);

  const handleItemMasterSelect = (index: number, description: string, im?: ItemMaster) => {
    setItems((prev) => {
      const copy = [...prev];
      if (im) {
        const rangeStr =
          im.measurement_range ||
          (im.range_min !== undefined && im.range_max !== undefined
            ? `${im.range_min}-${im.range_max} ${im.range_unit || ''}`.trim()
            : im.model || '');
        const cost = Number(im.standard_cost) || 0;
        const currentQty = copy[index]?.quantity || 1;
        copy[index] = {
          ...copy[index],
          description: im.item_name,
          range: rangeStr,
          unitPrice: cost,
          totalPrice: currentQty * cost,
        };
      } else {
        copy[index] = {
          ...copy[index],
          description,
        };
      }
      return copy;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        description: '',
        range: '',
        remarks: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      },
    ]);
  };

  const handleAddPastItem = (past: { description: string; range?: string; unitPrice: number }) => {
    // If the only line item is empty, replace it
    if (items.length === 1 && !items[0].description && items[0].unitPrice === 0) {
      setItems([
        {
          description: past.description,
          range: past.range || '',
          remarks: 'Repeat calibration service',
          quantity: 1,
          unitPrice: past.unitPrice,
          totalPrice: past.unitPrice,
        },
      ]);
    } else {
      setItems((prev) => [
        ...prev,
        {
          description: past.description,
          range: past.range || '',
          remarks: 'Repeat calibration service',
          quantity: 1,
          unitPrice: past.unitPrice,
          totalPrice: past.unitPrice,
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      setItems([
        {
          description: '',
          range: '',
          remarks: '',
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
        },
      ]);
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof QuotationLineState, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = Number(field === 'quantity' ? value : copy[index].quantity) || 0;
        const rate = Number(field === 'unitPrice' ? value : copy[index].unitPrice) || 0;
        copy[index].totalPrice = qty * rate;
      }
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(undefined);

    if (!tenantId || !organizationId) {
      setErrorMessage('Tenant and organization context required.');
      return;
    }

    if (quotationType === 'INWARD_REQUEST' && !selectedRequestId) {
      setErrorMessage('Please select a target calibration request.');
      return;
    }

    if (!selectedClientId) {
      setErrorMessage('Please select a client account.');
      return;
    }

    const validItems = items.filter((it) => it.description.trim().length > 0);
    if (validItems.length === 0) {
      setErrorMessage('At least one valid line item with an instrument description is required.');
      return;
    }

    try {
      const result = await createQuotationMutation.mutateAsync({
        tenantId,
        organizationId,
        requestId: quotationType === 'INWARD_REQUEST' ? selectedRequestId : undefined,
        clientId: selectedClientId,
        quotationType,
        clientData: selectedClient,
        quotationDate,
        kindAttn: kindAttn.trim() || undefined,
        phoneNo: phoneNo.trim() || undefined,
        subject: subject.trim() || undefined,
        enquiryRef: enquiryRef.trim() || undefined,
        subtotal,
        discount: discountAmount,
        taxAmount,
        totalAmount: grandTotal,
        items: validItems,
      });

      navigate(`/commercial/quotations/${result.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create quotation.');
    }
  };

  // Pending inward requests waiting for quotation
  const requestsWaitingQuote = requests.filter(
    (r) => r.quotation_required && r.quotation_status === 'PENDING_QUOTE' && r.status !== 'QUOTATION'
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#E5E7EB] pb-4">
        <Link to="/commercial/quotations">
          <Button variant="secondary" size="sm" type="button">
            <ArrowLeft className="size-4" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">New Quotation</h1>
          <p className="text-sm text-[#6B7280]">
            Generate quotations via Inward Request or directly from the Client Master.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-[#fef2f2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px] text-sm flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Quotation Type Selector: 2 Cards — Inward Request or Client Estimate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Type 1: Inward Request */}
        <button
          type="button"
          onClick={() => {
            setQuotationType('INWARD_REQUEST');
            setErrorMessage(undefined);
          }}
          className={`p-4 rounded-lg border text-left transition-all cursor-pointer relative ${
            quotationType === 'INWARD_REQUEST'
              ? 'bg-[#EFF6FF] border-[#0274BB] ring-2 ring-[#0274BB] shadow-sm'
              : 'bg-white border-[#E2E8F0] hover:border-slate-300'
          }`}
        >
          {requestsWaitingQuote.length > 0 && (
            <span className="absolute top-3 right-3 text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
              {requestsWaitingQuote.length} Inward Waiting
            </span>
          )}
          <div className="flex items-center gap-2.5 mb-2">
            <div className={`p-2 rounded-md ${quotationType === 'INWARD_REQUEST' ? 'bg-[#0274BB] text-white' : 'bg-slate-100 text-slate-700'}`}>
              <ClipboardList className="size-4" />
            </div>
            <span className="font-bold text-sm text-[#0F172A]">1. Inward Request</span>
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Generate a quote linked to physical instruments already inwarded into the laboratory queue.
          </p>
        </button>

        {/* Type 2: Client Estimate (from Client Master) */}
        <button
          type="button"
          onClick={() => {
            setQuotationType('CLIENT_ESTIMATE');
            setSelectedRequestId('');
            setErrorMessage(undefined);
          }}
          className={`p-4 rounded-lg border text-left transition-all cursor-pointer ${
            quotationType === 'CLIENT_ESTIMATE'
              ? 'bg-[#EFF6FF] border-[#0274BB] ring-2 ring-[#0274BB] shadow-sm'
              : 'bg-white border-[#E2E8F0] hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className={`p-2 rounded-md ${quotationType === 'CLIENT_ESTIMATE' ? 'bg-[#0274BB] text-white' : 'bg-slate-100 text-slate-700'}`}>
              <Building2 className="size-4" />
            </div>
            <span className="font-bold text-sm text-[#0F172A]">2. Client Estimate</span>
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Quote directly from the Client Master — for existing customers with service history or new clients before equipment arrival.
          </p>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Customer & Source Selection */}
        <Card className="border border-[#E5E7EB]">
          <CardHeader className="bg-[#FAFAFA] border-b border-[#E5E7EB] p-4">
            <CardTitle className="text-sm font-bold text-[#111827]">
              {quotationType === 'INWARD_REQUEST'
                ? 'Target Inward Request & Account Details'
                : 'Client Estimate — Client Master Selection'}
            </CardTitle>
            <CardDescription className="text-xs text-[#6B7280]">
              {quotationType === 'INWARD_REQUEST'
                ? 'Select an active calibration request inwarded by a collection agent. Client will be auto-filled.'
                : 'Select the client from the master. Past service history will load automatically if available.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Mode 1: Target Inward Request Dropdown */}
            {quotationType === 'INWARD_REQUEST' && (
              <Field>
                <div className="flex items-center justify-between mb-1">
                  <FieldLabel>
                    Target Calibration Inward Request <span className="text-[#DC2626]">*</span>
                  </FieldLabel>
                  {requestsWaitingQuote.length > 0 && (
                    <span className="text-xs font-semibold text-amber-600">
                      ★ {requestsWaitingQuote.length} request(s) flagged "Quotation Required"
                    </span>
                  )}
                </div>
                <Select
                  value={selectedRequestId}
                  onChange={(e) => setSelectedRequestId(e.target.value)}
                  required
                >
                  <option value="">Select Inward Request...</option>
                  {requests.map((r) => {
                    const isFlagged = r.quotation_required && r.quotation_status === 'PENDING_QUOTE';
                    return (
                      <option key={r.id} value={r.id}>
                        {isFlagged ? '★ [QUOTE REQUESTED] ' : ''}
                        {r.request_number} — {r.clients?.client_name || 'Client'} ({r.status})
                      </option>
                    );
                  })}
                </Select>
              </Field>
            )}

            {/* Unified Client Selector — always shown for all 3 quotation types */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FieldLabel>
                  Client / Organization Name <span className="text-[#DC2626]">*</span>
                  {quotationType === 'INWARD_REQUEST' && (
                    <span className="ml-2 text-[10px] font-normal text-slate-500 italic">
                      (auto-filled from selected request)
                    </span>
                  )}
                </FieldLabel>
                <Link
                  to="/masters/clients/new?returnUrl=/commercial/quotations/new"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0274BB] hover:underline"
                >
                  <Plus className="size-3.5" /> + Register New Client in Master
                </Link>
              </div>
              <Select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                required
              >
                <option value="">Select Client from Master...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.client_code} — {c.client_name} ({c.city || 'No City'})
                  </option>
                ))}
              </Select>
            </div>

            {/* Selected Client Card Display */}
            {selectedClient && (
              <div className="p-3.5 bg-[#F0FDF4] rounded-md border border-[#BBF7D0] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#166534] text-sm flex items-center gap-1.5">
                      <Check className="size-4 text-[#16A34A]" /> {selectedClient.client_name}
                    </span>
                    <span className="font-mono text-xs font-semibold bg-[#DCFCE7] text-[#15803D] px-2 py-0.5 rounded border border-[#86EFAC]">
                      {selectedClient.client_code}
                    </span>
                    <Badge variant="success">Active Client Master</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#4B5563] text-[11px]">
                    <span><strong>GSTIN:</strong> {selectedClient.gst_tax_number || 'Unregistered'}</span>
                    <span>•</span>
                    <span><strong>Contact:</strong> {selectedClient.contact_person || 'N/A'}</span>
                    <span>•</span>
                    <span><strong>Phone:</strong> {selectedClient.phone || 'N/A'}</span>
                    <span>•</span>
                    <span><strong>City:</strong> {selectedClient.city || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Client Estimate: Past Service History — shown when client is selected */}
            {quotationType === 'CLIENT_ESTIMATE' && selectedClientId && (
              <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="size-4 text-[#0274BB]" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Previous Service History for this Client
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {pastServicedItems.length} instrument type(s) previously serviced
                  </span>
                </div>

                {isLoadingPastItems ? (
                  <p className="text-xs text-slate-500 italic">Loading past serviced items...</p>
                ) : pastServicedItems.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No prior calibration records for this client. Enter line items directly below.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                    {pastServicedItems.map((past, pIdx) => (
                      <div
                        key={pIdx}
                        className="bg-white p-2.5 rounded border border-slate-200 text-xs flex flex-col justify-between gap-2 shadow-2xs hover:border-[#0274BB] transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 leading-tight">
                            {past.description}
                          </div>
                          {past.range && (
                            <div className="text-[11px] text-slate-500 mt-0.5">Range: {past.range}</div>
                          )}
                          <div className="text-[11px] font-mono font-semibold text-[#0274BB] mt-1">
                            Standard Rate: ₹{past.unitPrice.toFixed(2)}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAddPastItem(past)}
                          className="w-full text-xs gap-1 cursor-pointer h-7"
                        >
                          <Plus className="size-3" /> Add to Quote
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Letterhead & Contact Information Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <Field>
                <FieldLabel>Quotation Date</FieldLabel>
                <Input
                  type="date"
                  value={quotationDate}
                  onChange={(e) => setQuotationDate(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel>Kind Attn (Contact Person)</FieldLabel>
                <Input
                  placeholder="e.g. Mr. Rajesh Kumar"
                  value={kindAttn}
                  onChange={(e) => setKindAttn(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel>Contact Phone No.</FieldLabel>
                <Input
                  placeholder="e.g. +91 98765 43210"
                  value={phoneNo}
                  onChange={(e) => setPhoneNo(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel>Enquiry Reference</FieldLabel>
                <Input
                  placeholder="e.g. verbal or email dated..."
                  value={enquiryRef}
                  onChange={(e) => setEnquiryRef(e.target.value)}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>Subject Line</FieldLabel>
              <Input
                placeholder="Quotation for Calibration Charges..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>

        {/* Section 2: Quotation Line Items Table */}
        <Card className="border border-[#E5E7EB] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between p-4 bg-[#FAFAFA] border-b border-[#E5E7EB]">
            <div>
              <CardTitle className="text-sm font-bold text-[#111827]">
                Quotation Line Items ({items.length})
              </CardTitle>
              <CardDescription className="text-xs text-[#6B7280]">
                {quotationType === 'NEW_CLIENT_ESTIMATE'
                  ? 'Approximate equipment descriptions, operating range, estimated quantities, and rates'
                  : 'Itemized instruments, operating range, unit calibration rates, and line totals'}
              </CardDescription>
            </div>
            <Button variant="secondary" size="sm" type="button" onClick={handleAddItem}>
              <Plus className="size-4" /> Add Line Item
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-3 w-[30%]">Equipment Description *</th>
                    <th className="py-2.5 px-3 w-[18%]">Range / Model</th>
                    <th className="py-2.5 px-3 w-16">Qty *</th>
                    <th className="py-2.5 px-3 w-28">Rate (₹) *</th>
                    <th className="py-2.5 px-3 w-[16%]">Remarks</th>
                    <th className="py-2.5 px-3 w-24 text-right">Total (₹)</th>
                    <th className="py-2.5 px-2 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-[#FAFAFA]">
                      <td className="p-2">
                        <ItemMasterCombobox
                          value={it.description}
                          itemMasters={itemMasters}
                          onChange={(desc, im) => handleItemMasterSelect(idx, desc, im)}
                          placeholder="Search or select from Item Master..."
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          placeholder="e.g. 0-300mm / 0.01mm"
                          value={it.range || ''}
                          onChange={(e) => handleUpdateItem(idx, 'range', e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'quantity', parseInt(e.target.value, 10) || 1)
                          }
                          className="h-8 text-xs w-16 text-center"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          step="any"
                          min={0}
                          value={it.unitPrice}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                          }
                          className="h-8 text-xs w-28 font-mono text-right"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          placeholder="Special terms/remarks"
                          value={it.remarks || ''}
                          onChange={(e) => handleUpdateItem(idx, 'remarks', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-[#111827]">
                        ₹{Number(it.totalPrice || 0).toFixed(2)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-[#DC2626] hover:text-[#b91c1c] p-1 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Commercial Calculation Summary Panel */}
            <div className="p-5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col items-end gap-2.5 text-xs">
              <div className="flex justify-between w-80 text-[#475569]">
                <span>Subtotal (₹):</span>
                <span className="font-mono font-semibold text-[#0F172A]">₹{subtotal.toFixed(2)}</span>
              </div>

              {/* Discount Controls: % or ₹ Flat */}
              <div className="flex justify-between w-80 items-center">
                <span className="text-[#475569]">Special Discount (%):</span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    step="0.1"
                    min={0}
                    max={100}
                    value={discountPercent}
                    onChange={(e) => handleDiscountPercentChange(parseFloat(e.target.value) || 0)}
                    className="w-24 text-right h-7 text-xs font-mono"
                  />
                  <span className="text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div className="flex justify-between w-80 items-center">
                <span className="text-[#475569]">Discount Amount (₹):</span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    step="any"
                    min={0}
                    value={discountAmount}
                    onChange={(e) => handleDiscountAmountChange(parseFloat(e.target.value) || 0)}
                    className="w-24 text-right h-7 text-xs font-mono"
                  />
                  <span className="text-slate-400 font-bold">₹</span>
                </div>
              </div>

              {discountAmount > 0 && (
                <div className="w-80 flex justify-end">
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Discount Applied: {discountPercent.toFixed(2)}% (-₹{discountAmount.toFixed(2)})
                  </span>
                </div>
              )}

              <div className="flex justify-between w-80 items-center">
                <span className="text-[#475569]">GST Rate (%):</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-24 text-right h-7 text-xs font-mono"
                />
              </div>

              <div className="flex justify-between w-80 text-[#475569]">
                <span>Tax Amount (₹):</span>
                <span className="font-mono text-[#0F172A]">₹{taxAmount.toFixed(2)}</span>
              </div>

              {/* Editable Grand Total */}
              <div className="flex justify-between w-80 items-center border-t border-[#CBD5E1] pt-2">
                <div>
                  <span className="font-bold text-[#0F172A] block text-sm">Invoice / Grand Total (₹):</span>
                  <span className="text-[10px] text-[#0274BB]">Editable — auto-calculates discount %</span>
                </div>
                <Input
                  type="number"
                  step="any"
                  min={0}
                  value={editableGrandTotal > 0 ? editableGrandTotal.toFixed(2) : ''}
                  placeholder={editableGrandTotal > 0 ? editableGrandTotal.toFixed(2) : '0.00'}
                  onChange={(e) => handleGrandTotalChange(parseFloat(e.target.value) || 0)}
                  className="w-32 text-right h-8 text-sm font-bold font-mono text-[#0274BB] bg-white border-[#0274BB]/50 focus:border-[#0274BB] shadow-xs"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center p-4 bg-white border-t border-[#E2E8F0]">
            <Link to="/commercial/quotations">
              <Button variant="secondary" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              variant="primary"
              type="submit"
              disabled={createQuotationMutation.isPending}
            >
              <CheckCircle2 className="size-4" />
              {createQuotationMutation.isPending ? 'Generating Quotation...' : 'Issue Quotation'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default QuotationBuilderPage;
