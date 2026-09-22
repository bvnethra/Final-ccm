// application/src/pages/requests/RequestDetailPage.tsx
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  useCalibrationRequest,
  useCertificates,
  useRepairs,
  useOutsourcePOs,
  useCreateInvoice,
  useDispatches,
  useDeliveries,
} from '../../hooks/useOperations';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Input,
} from '../../components/ui/UIPrimitives';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Calendar,
  FileText,
  Gauge,
  Paperclip,
  Image as ImageIcon,
  Award,
  Wrench,
  Truck,
  Receipt,
  CheckCircle2,
  Clock,
  X,
  CheckSquare,
  Square,
  FileCheck,
} from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';

export const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isSuperAdmin, canPerform, getPermissionLevel } = useAuthContext();
  const canCreateInvoice = isSuperAdmin || canPerform('CREATE_INVOICE', 'CREATE');
  const canCreateQuotation = isSuperAdmin || (getPermissionLevel('CREATE_QUOTATION') !== 'APPROVE' && canPerform('CREATE_QUOTATION', 'CREATE'));
  const backToQueue = !canPerform('CREATE_REQUEST', 'VIEW') && (canPerform('LAB_VERIFICATION_RECEIPT', 'VIEW') || canPerform('RECORD_CALIBRATION_FREQUENCY', 'VIEW'));
  const { data: request, isLoading, error } = useCalibrationRequest(id);
  const { data: certificates = [] } = useCertificates(id);
  const { data: repairs = [] } = useRepairs(id);
  const { data: outsources = [] } = useOutsourcePOs(id);
  const { data: dispatches = [] } = useDispatches();
  const { data: deliveries = [] } = useDeliveries();
  const createInvoiceMutation = useCreateInvoice();

  const relatedDispatch = dispatches.find((d: any) => d.request_id === request?.id);
  const relatedDelivery = deliveries.find((del: any) => del.dispatch_id === relatedDispatch?.id);

  const [showDirectInvoiceModal, setShowDirectInvoiceModal] = useState<boolean>(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [itemRatesDirect, setItemRatesDirect] = useState<Record<string, number>>({});
  const [discountTypeDirect, setDiscountTypeDirect] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [discountValueDirect, setDiscountValueDirect] = useState<number>(0);
  const [clientPoRefDirect, setClientPoRefDirect] = useState<string>('');

  if (isLoading) {
    return (
      <div className="p-12 text-center text-sm text-[#6B7280]">
        <div className="size-6 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading request details...
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="p-8 bg-[#fef2f2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px]">
        Failed to load calibration request: {(error as Error)?.message || 'Not found'}
      </div>
    );
  }

  const getConditionBadge = (cond: string) => {
    switch (cond) {
      case 'GOOD':
        return <Badge variant="success">GOOD</Badge>;
      case 'SCRATCHED':
        return <Badge variant="warning">SCRATCHED</Badge>;
      case 'DAMAGED':
      case 'FAULTY':
        return <Badge variant="error">{cond}</Badge>;
      default:
        return <Badge variant="secondary">{cond}</Badge>;
    }
  };

  const isCalibratedOrBeyond = [
    'CALIBRATED',
    'QUOTATION',
    'APPROVED',
    'PARTIALLY_INVOICED',
    'INVOICED',
    'DISPATCHED',
    'DELIVERED',
    'COMPLETED',
  ].includes(request.status);

  // Stepper steps
  const steps = [
    { key: 'CREATED', label: '1. Inward' },
    { key: 'VERIFIED', label: '2. Verification' },
    { key: 'CALIBRATED', label: '3. Calibration' },
    { key: 'CERTIFICATE', label: '4. Certificate' },
    { key: 'QUOTATION', label: '5. Quotation (Optional)' },
    { key: 'INVOICED', label: '6. Tax Invoice' },
    { key: 'DISPATCHED', label: '7. Gate Pass Dispatch' },
    { key: 'COMPLETED', label: '8. Delivery & Completed' },
  ];

  const getStepState = (stepKey: string) => {
    const s = request.status;
    if (stepKey === 'CREATED') return 'done';
    if (stepKey === 'VERIFIED') {
      return s !== 'CREATED' ? 'done' : 'current';
    }
    if (stepKey === 'CALIBRATED') {
      if (['FAULTY', 'REPAIR_IN_PROGRESS'].includes(s)) return 'warning';
      if (['OUTSOURCED', 'OUTSOURCE_RETURNED'].includes(s)) return 'info';
      if (isCalibratedOrBeyond) return 'done';
      return s === 'VERIFIED' ? 'current' : 'pending';
    }
    if (stepKey === 'CERTIFICATE') {
      return isCalibratedOrBeyond ? 'done' : 'pending';
    }
    if (stepKey === 'QUOTATION') {
      if (['APPROVED', 'INVOICED', 'DISPATCHED', 'DELIVERED', 'COMPLETED'].includes(s)) return 'done';
      return s === 'QUOTATION' ? 'current' : 'pending';
    }
    if (stepKey === 'INVOICED') {
      if (['INVOICED', 'DISPATCHED', 'DELIVERED', 'COMPLETED'].includes(s)) return 'done';
      return s === 'APPROVED' ? 'current' : 'pending';
    }
    if (stepKey === 'DISPATCHED') {
      if (['DELIVERED', 'COMPLETED'].includes(s)) return 'done';
      return s === 'DISPATCHED' ? 'current' : 'pending';
    }
    if (stepKey === 'COMPLETED') {
      if (['DELIVERED', 'COMPLETED'].includes(s)) return 'done';
      return s === 'DISPATCHED' ? 'pending' : 'pending';
    }
    return 'pending';
  };

  const handleOpenDirectInvoice = () => {
    if (!request) return;
    setClientPoRefDirect(request.client_po_ref || '');
    const unbilled = (request.request_items || []).filter((it: any) => !it.invoiced);
    setSelectedItemIds(new Set(unbilled.map((it) => it.id)));
    const rates: Record<string, number> = {};
    (request.request_items || []).forEach((it: any) => {
      rates[it.id] = it.item_masters?.standard_cost || 100;
    });
    setItemRatesDirect(rates);
    setDiscountTypeDirect('PERCENT');
    setDiscountValueDirect(0);
    setShowDirectInvoiceModal(true);
  };

  const updateItemRateDirect = (itemId: string, newRate: number) => {
    setItemRatesDirect((prev) => ({
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

  const toggleSelectAllUnbilled = (unbilledItems: any[]) => {
    if (selectedItemIds.size === unbilledItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(unbilledItems.map((it) => it.id)));
    }
  };

  const handleConfirmDirectInvoice = async () => {
    if (!request) return;
    const unbilled = (request.request_items || []).filter((it: any) => !it.invoiced);
    const chosenItems = unbilled.filter((it) => selectedItemIds.has(it.id));
    if (chosenItems.length === 0) return;

    const previouslyInvoicedCount = (request.request_items || []).filter((it: any) => it.invoiced).length;
    const isActualInvoice = previouslyInvoicedCount + chosenItems.length >= (request.request_items || []).length;
    const invoiceType = isActualInvoice ? 'ACTUAL' : 'PARTIAL';

    const subtotalCalc = chosenItems.reduce(
      (sum, it) =>
        sum + (it.received_quantity || it.quantity || 1) * (itemRatesDirect[it.id] ?? it.item_masters?.standard_cost ?? 100),
      0
    );
    const discountCalc =
      discountTypeDirect === 'PERCENT'
        ? (subtotalCalc * Math.min(100, Math.max(0, discountValueDirect))) / 100
        : Math.min(subtotalCalc, Math.max(0, discountValueDirect));
    const taxableCalc = Math.max(0, subtotalCalc - discountCalc);
    const taxCalc = (taxableCalc * 18) / 100;
    const totalCalc = taxableCalc + taxCalc;

    try {
      await createInvoiceMutation.mutateAsync({
        tenantId: request.tenant_id,
        organizationId: request.organization_id || '',
        requestId: request.id,
        clientId: request.client_id,
        clientPoRef: clientPoRefDirect.trim() || request.client_po_ref || undefined,
        invoiceType,
        selectedItemIds: Array.from(selectedItemIds),
        subtotal: subtotalCalc,
        discountAmount: discountCalc,
        taxAmount: taxCalc,
        totalAmount: totalCalc,
        items: chosenItems.map((it) => {
          const unitPrice = itemRatesDirect[it.id] ?? it.item_masters?.standard_cost ?? 100;
          const qty = it.received_quantity || it.quantity || 1;
          return {
            requestItemId: it.id,
            description: it.item_masters?.item_name || `Calibrated Metrology Unit (SN: ${it.serial_number || 'N/A'})`,
            quantity: qty,
            unitPrice,
            totalPrice: qty * unitPrice,
          };
        }),
      });

      setShowDirectInvoiceModal(false);
      navigate('/commercial/invoices');
    } catch (err: any) {
      console.error('Failed to generate direct invoice:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={backToQueue ? "/lab/queue" : "/requests"}>
            <Button variant="secondary" size="sm">
              <ArrowLeft className="size-4" /> {backToQueue ? 'Back to Lab Queue' : 'Back to Requests'}
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#111827] font-mono">
                {request.request_number}
              </h1>
              <Badge
                variant={
                  isCalibratedOrBeyond
                    ? 'success'
                    : request.status === 'FAULTY' || request.status === 'REPAIR_IN_PROGRESS'
                    ? 'warning'
                    : 'primary'
                }
              >
                {request.status}
              </Badge>
              {request.priority === 'URGENT' && (
                <Badge variant="error">URGENT (24H)</Badge>
              )}
            </div>
            <p className="text-sm text-[#6B7280]">
              Client: <span className="font-semibold text-[#111827]">{request.clients?.client_name || 'N/A'}</span> • Created on{' '}
              {new Date(request.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Dynamic Contextual Action */}
        <div className="flex items-center gap-3">
          {request.status === 'CREATED' && (
            <Link to={`/lab/verification/${request.id}`}>
              <Button variant="primary">
                Proceed to Lab Verification (Step 7) <ArrowRight className="size-4" />
              </Button>
            </Link>
          )}
          {request.status === 'VERIFIED' && (
            <Link to={`/lab/calibration/${request.id}`}>
              <Button variant="primary">
                Perform Metrology Calibration (Step 8) <ArrowRight className="size-4" />
              </Button>
            </Link>
          )}
          {(request.status === 'FAULTY' || request.status === 'REPAIR_IN_PROGRESS') && (
            <Link to={`/lab/calibration/${request.id}`}>
              <Button variant="outlineInk">
                <Wrench className="size-4" /> Manage In-Lab Repair
              </Button>
            </Link>
          )}
          {request.status === 'OUTSOURCED' && (
            <Link to={`/lab/calibration/${request.id}`}>
              <Button variant="outlineInk">
                <Truck className="size-4" /> Manage Vendor Outsource PO
              </Button>
            </Link>
          )}          {(request.status === 'CALIBRATED' || request.status === 'PARTIALLY_INVOICED') && (
            <div className="flex items-center gap-2">
              {canCreateInvoice && (
                <Button variant="primary" onClick={handleOpenDirectInvoice}>
                  <Receipt className="size-4" />
                  {request.status === 'PARTIALLY_INVOICED' ? 'Invoice Remaining Items' : 'Generate Tax Invoice Directly'}
                </Button>
              )}
              {canCreateQuotation ? (
                <Link to={`/commercial/quotations/new?requestId=${request.id}`}>
                  <Button variant="outlineInk">
                    <FileText className="size-4" /> Create Quotation (Optional)
                  </Button>
                </Link>
              ) : (
                <Link to="/commercial/quotations">
                  <Button variant="outlineInk">
                    <FileText className="size-4" /> View Quotations
                  </Button>
                </Link>
              )}
            </div>
          )}
          {request.status === 'QUOTATION' && (
            <div className="flex items-center gap-2">
              {canCreateInvoice && (
                <Button variant="primary" onClick={handleOpenDirectInvoice}>
                  <Receipt className="size-4" /> Generate Tax Invoice Directly
                </Button>
              )}
              <Link to="/commercial/quotations">
                <Button variant="outlineInk">
                  <FileText className="size-4" /> View Quotations
                </Button>
              </Link>
            </div>
          )}
          {request.status === 'APPROVED' && (
            <div className="flex items-center gap-2">
              {canCreateInvoice && (
                <Button variant="primary" onClick={handleOpenDirectInvoice}>
                  <Receipt className="size-4" /> Generate Tax Invoice
                </Button>
              )}
              <Link to="/commercial/quotations">
                <Button variant="outlineInk">
                  <FileText className="size-4" /> View Quotations
                </Button>
              </Link>
            </div>
          )}
          {request.status === 'INVOICED' && (
            <Link to="/logistics/dispatch/new">
              <Button variant="primary">
                <Truck className="size-4" /> Create Gate Pass Dispatch (Step 12)
              </Button>
            </Link>
          )}
          {request.status === 'DISPATCHED' && (
            <Link to="/logistics/dispatch">
              <Button variant="primary">
                <Truck className="size-4" /> Track Dispatch & Record Delivery (Step 13)
              </Button>
            </Link>
          )}
          {(request.status === 'DELIVERED' || request.status === 'COMPLETED') && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#ECFDF5] text-[#15803D] font-semibold text-xs border border-[#86EFAC]">
                <CheckCircle2 className="size-4 text-[#16A34A]" /> Lifecycle Completed
              </span>
              <Link to="/logistics/dispatch">
                <Button variant="outlineInk">
                  <FileCheck className="size-4" /> View Delivery & POD
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Lifecycle Stepper */}
      <Card className="bg-white p-4">
        <div className="flex items-center justify-between overflow-x-auto gap-2 text-xs">
          {steps.map((st, i) => {
            const state = getStepState(st.key);
            return (
              <div key={st.key} className="flex items-center gap-2 shrink-0">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] font-semibold border ${
                    state === 'done'
                      ? 'bg-[#F0FDF4] text-[#16A34A] border-[#86EFAC]'
                      : state === 'current'
                      ? 'bg-[#EBF5FF] text-[#0274BB] border-[#0274BB] shadow-xs'
                      : state === 'warning'
                      ? 'bg-[#FFF7ED] text-[#EA580C] border-[#FDBA74]'
                      : state === 'info'
                      ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#93C5FD]'
                      : 'bg-[#F9FAFB] text-[#9CA3AF] border-[#E5E7EB]'
                  }`}
                >
                  {state === 'done' ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <Clock className="size-3.5" />
                  )}
                  <span>{st.label}</span>
                </div>
                {i < steps.length - 1 && <span className="text-[#CBD5E1]">→</span>}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Delivery & Lifecycle Completed Banner */}
      {(request.status === 'COMPLETED' || request.status === 'DELIVERED') && (
        <div className="p-4 bg-[#F0FDF4] border border-[#16A34A]/40 rounded-[4px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#16A34A] text-white rounded-[4px]">
              <CheckCircle2 className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#166534] text-base">
                  Work Order Completed & Delivered
                </span>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-[#DCFCE7] text-[#15803D] rounded border border-[#86EFAC]">
                  PROOF OF DELIVERY SIGNED
                </span>
              </div>
              <p className="text-xs text-[#15803D] mt-0.5">
                {(relatedDelivery?.received_by || relatedDispatch?.recipient_name) ? (
                  <>
                    Received by: <strong className="underline">{relatedDelivery?.received_by || relatedDispatch?.recipient_name}</strong>
                    {(relatedDelivery?.recipient_phone || relatedDispatch?.recipient_phone) ? ` (${relatedDelivery?.recipient_phone || relatedDispatch?.recipient_phone})` : ''} • Delivered on{' '}
                    {new Date(relatedDelivery?.delivered_at || relatedDispatch?.created_at || new Date()).toLocaleDateString()}
                  </>
                ) : (
                  <>Client digital signature captured • Gate pass closed • Work order successfully completed.</>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(relatedDelivery?.signature_data_url || relatedDispatch?.client_signature) && (
              <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-[#BBF7D0]">
                <span className="text-[10px] uppercase font-bold text-[#6B7280]">Client Sign:</span>
                <img
                  src={relatedDelivery?.signature_data_url || relatedDispatch?.client_signature}
                  alt="Client Signature"
                  className="h-7 max-w-[90px] object-contain"
                />
              </div>
            )}
            <Link to="/logistics/dispatch">
              <Button variant="primary" size="sm">
                <FileCheck className="size-3.5" /> View Proof of Delivery (POD)
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Certificate & Next Due Date Notification Card */}
      {isCalibratedOrBeyond && (
        <div className="p-4 bg-[#ECFDF5] border border-[#10B981]/40 rounded-[4px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#10B981] text-white rounded-[4px]">
              <Award className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#065F46] text-base">
                  ISO Calibration Certificate Active
                </span>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-[#D1FAE5] text-[#065F46] rounded border border-[#A7F3D0]">
                  {certificates[0]?.certificate_number || 'CERT-ACTIVE-001'}
                </span>
              </div>
              <p className="text-xs text-[#047857] mt-0.5">
                Next Due Date:{' '}
                <strong className="underline">
                  {certificates[0]?.valid_until || '1 Year Standard Cycle'}
                </strong>{' '}
                • Status: {certificates[0]?.status || 'GENERATED'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canCreateInvoice && (
              <Button variant="primary" size="sm" onClick={handleOpenDirectInvoice}>
                <Receipt className="size-3.5" /> Generate Tax Invoice Directly
              </Button>
            )}
            {canCreateQuotation && (
              <Link to={`/commercial/quotations/new?requestId=${request.id}`}>
                <Button variant="secondary" size="sm">
                  Create Quotation (Optional) <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Repairs or Outsources Info Cards */}
      {repairs.length > 0 && (
        <Card className="border-l-4 border-l-[#EA580C]">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wrench className="size-5 text-[#EA580C]" />
              <div>
                <span className="font-bold text-sm text-[#111827] block">
                  In-Lab Repair Service Record ({repairs[0].status})
                </span>
                <span className="text-xs text-[#6B7280]">
                  Defect: {repairs[0].defect_description} • Cost: ₹{repairs[0].estimated_cost.toFixed(2)}
                </span>
              </div>
            </div>
            <Link to={`/lab/calibration/${request.id}`}>
              <Button variant="outlineInk" size="sm">
                View Repair Bench
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {outsources.length > 0 && (
        <Card className="border-l-4 border-l-[#0274BB]">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck className="size-5 text-[#0274BB]" />
              <div>
                <span className="font-bold text-sm text-[#111827] block">
                  Outsource Vendor PO ({outsources[0].vendor_po_number})
                </span>
                <span className="text-xs text-[#6B7280]">
                  Vendor: {outsources[0].vendor_name} • Status: {outsources[0].status}
                </span>
              </div>
            </div>
            <Link to={`/lab/calibration/${request.id}`}>
              <Button variant="outlineInk" size="sm">
                View Outsource PO
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Request Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Inward &amp; Collection Details</CardTitle>
            <CardDescription>Step 4 &amp; 5: Pickup Metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm divide-y divide-[#E5E7EB]">
            <div className="pt-1">
              <span className="text-xs text-[#6B7280] block">Priority Turnaround</span>
              <span className="font-semibold text-[#111827]">{request.priority}</span>
            </div>
            <div className="pt-3">
              <span className="text-xs text-[#6B7280] block flex items-center gap-1">
                <Calendar className="size-3 text-[#6B7280]" /> Collection Date
              </span>
              <span className="font-semibold text-[#111827]">
                {new Date(request.collection_date).toLocaleDateString()}
              </span>
            </div>
            <div className="pt-3">
              <span className="text-xs text-[#6B7280] block flex items-center gap-1">
                <User className="size-3 text-[#6B7280]" /> Collection Agent
              </span>
              <span className="font-semibold text-[#111827]">
                {request.collection_agent_name || 'Designated Collection Agent'}
              </span>
            </div>
            {request.client_po_ref && (
              <div className="pt-3">
                <span className="text-xs text-[#6B7280] block flex items-center gap-1">
                  <FileText className="size-3 text-[#6B7280]" /> Client Reference / PO #
                </span>
                <span className="font-semibold text-[#0274BB] font-mono">
                  {request.client_po_ref}
                </span>
              </div>
            )}
            <div className="pt-3">
              <span className="text-xs text-[#6B7280] block">Client Account</span>
              <span className="font-semibold text-[#111827]">
                {request.clients?.client_name || 'N/A'}
              </span>
              {request.clients?.client_code && (
                <span className="text-xs text-[#6B7280] block font-mono">
                  Code: {request.clients.client_code}
                </span>
              )}
            </div>
            <div className="pt-3">
              <span className="text-xs text-[#6B7280] block">Inward &amp; Handling Notes</span>
              <span className="text-[#374151] italic">
                {request.remarks || 'No special handling instructions provided.'}
              </span>
            </div>
          </CardContent>
        </Card>

        {request.attachments && request.attachments.length > 0 && (
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Paperclip className="size-4 text-[#0274BB]" /> Attached Proof ({request.attachments.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {request.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {att.type.startsWith('image/') ? (
                      <ImageIcon className="size-4 text-[#0274BB] shrink-0" />
                    ) : (
                      <FileText className="size-4 text-[#DC2626] shrink-0" />
                    )}
                    <span className="font-medium text-[#1E293B] truncate">{att.name}</span>
                  </div>
                  {att.base64Data && (
                    <a
                      href={att.base64Data}
                      download={att.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0274BB] hover:underline font-semibold shrink-0 ml-2"
                    >
                      View
                    </a>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Equipment Line Items ({request.request_items?.length || 0})</CardTitle>
              <CardDescription>Customer instruments in this calibration inward batch</CardDescription>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#6B7280] bg-[#F5F7FA] px-2.5 py-1 rounded-[4px] border border-[#E5E7EB]">
              <Gauge className="size-3.5 text-[#0274BB]" />
              <span>Total Units: </span>
              <span className="font-mono font-bold text-[#111827]">
                {request.request_items?.reduce((sum, it) => sum + (it.quantity || 0), 0)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F5F7FA] border-b border-[#E5E7EB] text-[#374151] font-semibold text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3">Equipment / Specs</th>
                    <th className="px-4 py-3">Serial # / Asset Tag</th>
                    <th className="px-3 py-3 w-16 text-center">Qty</th>
                    <th className="px-4 py-3">Condition</th>
                    <th className="px-4 py-3">Accessories / Notes</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {request.request_items?.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAFAFA] align-top">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-[#111827]">
                          {item.item_masters?.item_name || 'Standard Equipment'}
                        </div>
                        <div className="text-[11px] text-[#6B7280] font-mono mt-0.5">
                          {item.item_masters?.item_code || 'ITM-AUTO'}
                          {item.item_masters?.item_category && (
                            <span className="text-[#0274BB] font-sans"> • {item.item_masters.item_category}</span>
                          )}
                        </div>
                        {item.item_masters?.measurement_range && (
                          <div className="text-[11px] text-[#6B7280] mt-0.5">
                            Range: {item.item_masters.measurement_range}
                            {item.item_masters?.least_count !== undefined && (
                              <span> (LC: {item.item_masters.least_count} {item.item_masters.least_count_unit})</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {item.serial_number ? (
                          <span className="font-mono text-xs font-semibold text-[#111827] bg-[#F5F7FA] px-2 py-0.5 rounded border border-[#E5E7EB]">
                            {item.serial_number}
                          </span>
                        ) : (
                          <span className="text-xs text-[#9CA3AF] italic">Not Tagged</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 font-mono font-bold text-center text-[#111827]">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3.5">
                        {getConditionBadge(item.item_condition)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[#4B5563]">
                        {item.accessories || item.remarks || <span className="text-[#9CA3AF] italic">None</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="info">{item.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Direct Tax Invoicing Modal (Quotation Optional / Bypassed) */}
      {showDirectInvoiceModal && (() => {
        const reqItems = request.request_items || [];
        const unbilledItems = reqItems.filter((it: any) => !it.invoiced);
        const previouslyInvoicedCount = reqItems.filter((it: any) => it.invoiced).length;
        const selectedCount = selectedItemIds.size;
        const isActualInvoice =
          unbilledItems.length > 0 && previouslyInvoicedCount + selectedCount >= reqItems.length;

        const selectedUnbilledItems = unbilledItems.filter((it: any) => selectedItemIds.has(it.id));
        const subtotalCalc = selectedUnbilledItems.reduce(
          (sum, it) =>
            sum + (it.received_quantity || it.quantity || 1) * (itemRatesDirect[it.id] ?? it.item_masters?.standard_cost ?? 100),
          0
        );
        const discountCalc =
          discountTypeDirect === 'PERCENT'
            ? (subtotalCalc * Math.min(100, Math.max(0, discountValueDirect))) / 100
            : Math.min(subtotalCalc, Math.max(0, discountValueDirect));
        const taxableCalc = Math.max(0, subtotalCalc - discountCalc);
        const taxCalc = (taxableCalc * 18) / 100;
        const grandTotalCalc = taxableCalc + taxCalc;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
            <div className="bg-white rounded-[4px] shadow-2xl max-w-2xl w-full overflow-hidden border border-[#E5E7EB]">
              <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-[#F8FAFC]">
                <div className="flex items-center gap-2">
                  <Receipt className="size-5 text-[#0274BB]" />
                  <div>
                    <h3 className="font-bold text-[#111827] text-base">Generate Direct Tax Invoice</h3>
                    <p className="text-xs text-[#6B7280]">
                      Editable unit rates and client discounts for calibrated equipment without quotations
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDirectInvoiceModal(false)}
                  className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded hover:bg-[#E2E8F0]"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[4px] flex items-center gap-2.5 text-xs text-emerald-900">
                  <Receipt className="size-4 text-emerald-600 shrink-0" />
                  <span>
                    Direct Tax Invoice generated for work order <strong>{request.request_number}</strong>. Select items and configure pricing/discounts.
                  </span>
                </div>

                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] space-y-1.5">
                  <label className="text-xs font-semibold text-[#1E293B] block">Client Purchase Order Reference (Optional)</label>
                  <Input
                    placeholder="e.g. PO-CLIENT-2026-991 (Leave blank if not needed)"
                    value={clientPoRefDirect}
                    onChange={(e) => setClientPoRefDirect(e.target.value)}
                  />
                </div>

                {/* Items Checklist with Editable Rates */}
                <div className="border border-[#E5E7EB] rounded-[4px] overflow-hidden">
                  <div className="p-3 bg-[#F8FAFC] border-b border-[#E5E7EB] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleSelectAllUnbilled(unbilledItems)}
                      className="text-xs font-semibold text-[#0274BB] hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      {selectedItemIds.size === unbilledItems.length && unbilledItems.length > 0 ? (
                        <CheckSquare className="size-4 text-[#0274BB]" />
                      ) : (
                        <Square className="size-4 text-[#6B7280]" />
                      )}
                      <span>{selectedItemIds.size === unbilledItems.length ? 'Deselect All' : 'Select All Ready Items'}</span>
                    </button>
                    <span className="text-xs text-[#6B7280]">
                      {unbilledItems.length} unbilled item(s) available • Rates are editable
                    </span>
                  </div>

                  <div className="divide-y divide-[#E5E7EB] max-h-64 overflow-y-auto">
                    {reqItems.map((it: any) => {
                      const isAlreadyInvoiced = Boolean(it.invoiced);
                      const isChecked = selectedItemIds.has(it.id);
                      const rate = itemRatesDirect[it.id] ?? it.item_masters?.standard_cost ?? 100;
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
                                {it.item_masters?.item_name || 'Equipment Instrument'}
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
                                  onChange={(e) => updateItemRateDirect(it.id, parseFloat(e.target.value) || 0)}
                                  disabled={isAlreadyInvoiced}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-20 px-1.5 py-0.5 border border-slate-300 rounded text-right font-mono text-xs focus:ring-1 focus:ring-[#0274BB] bg-white"
                                />
                              </div>
                            </div>
                          </label>
                          <div className="text-right shrink-0 ml-4">
                            <span className="font-mono font-bold text-[#111827] block">
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

                {/* Client Commercial Discount Controls */}
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-[4px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">Client Commercial Discount</span>
                    <span className="text-[11px] text-slate-500">Apply negotiated client discount (percentage or flat amount)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded border border-slate-300 bg-white p-0.5">
                      <button
                        type="button"
                        onClick={() => setDiscountTypeDirect('PERCENT')}
                        className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          discountTypeDirect === 'PERCENT' ? 'bg-[#0274BB] text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        % Percent
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountTypeDirect('FLAT')}
                        className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          discountTypeDirect === 'FLAT' ? 'bg-[#0274BB] text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ₹ Flat
                      </button>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="0"
                        max={discountTypeDirect === 'PERCENT' ? 100 : subtotalCalc}
                        step={discountTypeDirect === 'PERCENT' ? '1' : '10'}
                        value={discountValueDirect}
                        onChange={(e) => setDiscountValueDirect(Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0"
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-right font-mono font-bold text-xs bg-white"
                      />
                      <span className="ml-1 text-xs font-bold text-slate-500">
                        {discountTypeDirect === 'PERCENT' ? '%' : '₹'}
                      </span>
                    </div>
                    {discountCalc > 0 && (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded text-xs border border-emerald-200 shrink-0">
                        -₹{discountCalc.toFixed(2)} off
                      </span>
                    )}
                  </div>
                </div>

                {/* Calculation Summary */}
                <div className="p-4 bg-[#F8FAFC] rounded-[4px] border border-[#E5E7EB] flex flex-col items-end gap-1.5 text-xs">
                  <div className="flex justify-between w-72 text-[#64748B]">
                    <span>Selected Items Subtotal:</span>
                    <span className="font-mono text-[#1E293B] font-semibold">₹{subtotalCalc.toFixed(2)}</span>
                  </div>
                  {discountCalc > 0 && (
                    <div className="flex justify-between w-72 text-emerald-700 font-semibold">
                      <span>Client Discount Applied:</span>
                      <span className="font-mono">-₹{discountCalc.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between w-72 text-[#64748B]">
                    <span>Net Taxable Subtotal:</span>
                    <span className="font-mono text-[#1E293B] font-semibold">₹{taxableCalc.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between w-72 text-[#64748B]">
                    <span>GST (18%):</span>
                    <span className="font-mono text-[#1E293B] font-semibold">₹{taxCalc.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between w-72 text-sm font-bold text-[#111827] border-t border-[#CBD5E1] pt-1.5 mt-1">
                    <span>Total Tax Invoice:</span>
                    <span className="font-mono text-[#0274BB]">₹{grandTotalCalc.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-[#E5E7EB] bg-[#F8FAFC] flex justify-between items-center">
                <Button variant="secondary" size="sm" onClick={() => setShowDirectInvoiceModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmDirectInvoice}
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

export default RequestDetailPage;
