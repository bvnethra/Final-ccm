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
  useRouteRequestItems,
} from '../../hooks/useOperations';
import { useVendors } from '../../hooks/useVendorMaster';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Input,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DetailViewSkeleton,
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
  Download,
  History,
  Layers,
  Building,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { OfficialSaleOrderCVView } from '../../components/commercial/OfficialSaleOrderCVView';

export const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenantId, organizationId, user, isSuperAdmin, canPerform, getPermissionLevel } = useAuthContext();
  const canRouteItems =
    isSuperAdmin ||
    canPerform('LAB_VERIFICATION_RECEIPT', 'CREATE_EDIT') ||
    canPerform('RECORD_CALIBRATION_FREQUENCY', 'CREATE') ||
    canPerform('CREATE_REQUEST', 'CREATE_EDIT');
  const routeMutation = useRouteRequestItems();
  const { data: vendors = [] } = useVendors();
  const [localItemRoutes, setLocalItemRoutes] = useState<Record<string, { destination: 'IN_HOUSE' | 'VENDOR_OUTSOURCE'; vendorId?: string }>>({});

  const handleRoutingChange = async (itemId: string, destination: 'IN_HOUSE' | 'VENDOR_OUTSOURCE') => {
    if (!tenantId || !request?.id) return;
    setLocalItemRoutes((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        destination,
        vendorId: destination === 'IN_HOUSE' ? '' : prev[itemId]?.vendorId,
      },
    }));

    const currentItem = request.request_items?.find((i: any) => i.id === itemId);
    try {
      await routeMutation.mutateAsync({
        tenantId,
        organizationId: organizationId || undefined,
        requestId: request.id,
        actorUserId: user?.id,
        actorName: user?.fullName || 'Operations Manager',
        items: [
          {
            itemId,
            destination,
            vendorId: destination === 'IN_HOUSE' ? undefined : (localItemRoutes[itemId]?.vendorId || currentItem?.vendor_id),
            vendorName: destination === 'IN_HOUSE' ? undefined : currentItem?.vendor_name,
          },
        ],
      });
    } catch (err) {
      console.error('Failed to update routing:', err);
    }
  };

  const handleVendorChange = async (itemId: string, vendorId: string) => {
    if (!tenantId || !request?.id) return;
    const vendor = vendors.find((v) => v.id === vendorId);
    setLocalItemRoutes((prev) => ({
      ...prev,
      [itemId]: {
        destination: 'VENDOR_OUTSOURCE',
        vendorId,
      },
    }));

    try {
      await routeMutation.mutateAsync({
        tenantId,
        organizationId: organizationId || undefined,
        requestId: request.id,
        actorUserId: user?.id,
        actorName: user?.fullName || 'Operations Manager',
        items: [
          {
            itemId,
            destination: 'VENDOR_OUTSOURCE',
            vendorId,
            vendorName: vendor?.vendor_name,
          },
        ],
      });
    } catch (err) {
      console.error('Failed to update vendor:', err);
    }
  };

  const canCreateInvoice = isSuperAdmin || canPerform('CREATE_INVOICE', 'CREATE');
  const canCreateQuotation = isSuperAdmin || (getPermissionLevel('CREATE_QUOTATION') !== 'APPROVE' && canPerform('CREATE_QUOTATION', 'CREATE'));
  const backToQueue = !canPerform('CREATE_REQUEST', 'VIEW') && (canPerform('LAB_VERIFICATION_RECEIPT', 'VIEW') || canPerform('RECORD_CALIBRATION_FREQUENCY', 'VIEW'));
  const { data: request, isLoading, error } = useCalibrationRequest(id);
  const { data: certificates = [] } = useCertificates(id);
  const { data: repairs = [] } = useRepairs(id);
  const { data: outsources = [] } = useOutsourcePOs(id);
  const { data: dispatches = [] } = useDispatches();
  const { data: deliveries = [] } = useDeliveries();
  const { data: auditLogs = [] } = useAuditLogs({
    entityId: request?.id,
    limit: 50,
  });
  const createInvoiceMutation = useCreateInvoice();

  const relatedDispatch = dispatches.find((d: any) => d.request_id === request?.id);
  const relatedDelivery = deliveries.find((del: any) => del.dispatch_id === relatedDispatch?.id);

  const [showDirectInvoiceModal, setShowDirectInvoiceModal] = useState<boolean>(false);
  const [showCVDocument, setShowCVDocument] = useState<boolean>(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [itemRatesDirect, setItemRatesDirect] = useState<Record<string, number>>({});
  const [discountTypeDirect, setDiscountTypeDirect] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [discountValueDirect, setDiscountValueDirect] = useState<number>(0);
  const [clientPoRefDirect, setClientPoRefDirect] = useState<string>('');

  if (isLoading) {
    return <DetailViewSkeleton columns={8} rows={5} cardsCount={4} />;
  }

  if (error || !request) {
    return (
      <div className="p-8 bg-[#fef2f2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px]">
        Failed to load calibration request: {(error as Error)?.message || 'Not found'}
      </div>
    );
  }

  if (showCVDocument) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <OfficialSaleOrderCVView
          request={request}
          client={request.clients}
          onClose={() => setShowCVDocument(false)}
          isFullPage={true}
        />
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
    { key: 'CREATED', label: 'Inward' },
    { key: 'VERIFIED', label: 'Verification' },
    { key: 'CALIBRATED', label: 'Calibration' },
    { key: 'CERTIFICATE', label: 'Certificate' },
    { key: 'QUOTATION', label: 'Quotation' },
    { key: 'INVOICED', label: 'Tax Invoice' },
    { key: 'DISPATCHED', label: 'Dispatch' },
    { key: 'COMPLETED', label: 'Completed' },
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
    if (request.client_po_ref && request.client_po_ref.trim()) {
      setClientPoRefDirect(request.client_po_ref.trim());
    } else {
      const year = new Date().getFullYear();
      const code = request.clients?.client_code ? request.clients.client_code.toUpperCase() : 'CLIENT';
      const num = request.request_number ? request.request_number.replace(/\D/g, '').slice(-3) : String(Math.floor(100 + Math.random() * 900));
      setClientPoRefDirect(`PO/${year}/${code}-${num || '001'}`);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200/80 shadow-xs">
        <div className="flex items-start gap-3.5">
          <Link to={backToQueue ? "/lab/queue" : "/requests"}>
            <Button variant="secondary" size="sm" className="mt-0.5">
              <ArrowLeft className="size-4" /> Back
            </Button>
          </Link>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
                {request.request_number}
              </h1>
              {request.voucher_no && (
                <span className="font-mono text-xs font-bold text-[#0274BB] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded shadow-2xs">
                  CV #{request.voucher_no}
                </span>
              )}
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
            <p className="text-xs sm:text-sm text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Client:</span>
              <strong className="text-slate-800">{request.clients?.client_name || 'N/A'}</strong>
              <span className="text-slate-300">•</span>
              <span>Inward Date:</span>
              <span className="text-slate-700 font-medium">
                {new Date(request.collection_date || request.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              {request.dc_number && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="font-mono text-xs text-[#0274BB] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                    DC: {request.dc_number}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Dynamic Contextual Action */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCVDocument(true)}
            className="flex items-center gap-1.5 text-xs font-semibold"
            title="View & Print Official SALE ORDER / CV matching physical document"
          >
            <FileCheck className="size-4 text-[#0274BB]" /> View / Print Sale Order (CV)
          </Button>

          <Link to={`/requests/${request.id}/routing`}>
            <Button variant="secondary" className="flex items-center gap-1.5 text-xs font-semibold border-blue-200 text-blue-700 bg-blue-50/80 hover:bg-blue-100">
              <Layers className="size-3.5" /> Routing Matrix
            </Button>
          </Link>

          {/* Contextual Secondary Actions (Primary action is highlighted in workflow tracker below) */}
          {(request.status === 'FAULTY' || request.status === 'REPAIR_IN_PROGRESS') && (
            <Link to={`/lab/calibration/${request.id}`}>
              <Button variant="outlineInk" className="text-xs font-semibold">
                <Wrench className="size-4" /> Manage In-Lab Repair
              </Button>
            </Link>
          )}
          {request.status === 'OUTSOURCED' && (
            <Link to={`/lab/calibration/${request.id}`}>
              <Button variant="outlineInk" className="text-xs font-semibold">
                <Truck className="size-4" /> Manage Outsource PO
              </Button>
            </Link>
          )}
          {(request.status === 'CALIBRATED' || request.status === 'PARTIALLY_INVOICED') && (
            <div className="flex items-center gap-2">
              {canCreateInvoice && (
                <Button variant="primary" onClick={handleOpenDirectInvoice} className="text-xs font-semibold shadow-xs">
                  <Receipt className="size-4" />
                  {request.status === 'PARTIALLY_INVOICED' ? 'Invoice Remaining Items' : 'Generate Tax Invoice Directly'}
                </Button>
              )}
              {canCreateQuotation ? (
                <Link to={`/commercial/quotations/new?requestId=${request.id}`}>
                  <Button variant="outlineInk" className="text-xs font-semibold">
                    <FileText className="size-4" /> Create Quotation (Optional)
                  </Button>
                </Link>
              ) : (
                <Link to="/commercial/quotations">
                  <Button variant="outlineInk" className="text-xs font-semibold">
                    <FileText className="size-4" /> View Quotations
                  </Button>
                </Link>
              )}
            </div>
          )}
          {request.status === 'QUOTATION' && (
            <div className="flex items-center gap-2">
              {canCreateInvoice && (
                <Button variant="primary" onClick={handleOpenDirectInvoice} className="text-xs font-semibold shadow-xs">
                  <Receipt className="size-4" /> Generate Tax Invoice Directly
                </Button>
              )}
              <Link to="/commercial/quotations">
                <Button variant="outlineInk" className="text-xs font-semibold">
                  <FileText className="size-4" /> View Quotations
                </Button>
              </Link>
            </div>
          )}
          {request.status === 'APPROVED' && (
            <div className="flex items-center gap-2">
              {canCreateInvoice && (
                <Button variant="primary" onClick={handleOpenDirectInvoice} className="text-xs font-semibold shadow-xs">
                  <Receipt className="size-4" /> Generate Tax Invoice
                </Button>
              )}
              <Link to="/commercial/quotations">
                <Button variant="outlineInk" className="text-xs font-semibold">
                  <FileText className="size-4" /> View Quotations
                </Button>
              </Link>
            </div>
          )}
          {request.status === 'INVOICED' && (
            <Link to="/logistics/dispatch/new">
              <Button variant="primary" className="text-xs font-semibold shadow-xs">
                <Truck className="size-4" /> Create Gate Pass Dispatch
              </Button>
            </Link>
          )}
          {request.status === 'DISPATCHED' && (
            <Link to="/logistics/dispatch">
              <Button variant="primary" className="text-xs font-semibold shadow-xs">
                <Truck className="size-4" /> Track Dispatch &amp; Delivery
              </Button>
            </Link>
          )}
          {(request.status === 'DELIVERED' || request.status === 'COMPLETED') && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#ECFDF5] text-[#15803D] font-semibold text-xs border border-[#86EFAC]">
                <CheckCircle2 className="size-4 text-[#16A34A]" /> Lifecycle Completed
              </span>
              <Link to="/logistics/dispatch">
                <Button variant="outlineInk" className="text-xs font-semibold">
                  <FileCheck className="size-4" /> View Delivery &amp; POD
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Lifecycle Workflow Stepper */}
      <Card className="bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between relative overflow-x-auto gap-2 py-1">
            {/* Background Connector Bar */}
            <div className="absolute left-8 right-8 top-5 h-0.5 bg-slate-200 -z-0 hidden md:block" />

            {steps.map((st, i) => {
              const state = getStepState(st.key);
              const isCompleted = state === 'done';
              const isCurrent = state === 'current';
              const isWarning = state === 'warning';
              const isInfo = state === 'info';

              return (
                <div key={st.key} className="relative z-10 flex flex-col items-center group flex-1 min-w-[70px]">
                  <div
                    className={`size-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-50 shadow-xs'
                        : isCurrent
                        ? 'bg-[#0274BB] text-white ring-4 ring-blue-50 shadow-sm scale-105'
                        : isWarning
                        ? 'bg-amber-500 text-white ring-4 ring-amber-50 shadow-xs'
                        : isInfo
                        ? 'bg-sky-500 text-white ring-4 ring-sky-50 shadow-xs'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="size-4 stroke-[2.5]" />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>
                  <span
                    className={`mt-2 text-[11px] font-semibold text-center whitespace-nowrap transition-colors ${
                      isCurrent
                        ? 'text-[#0274BB] font-bold'
                        : isCompleted
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {st.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 text-[#0274BB] bg-blue-50 rounded-full mt-0.5 border border-blue-200">
                      Active
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Integrated Contextual Next Action Bar */}
        {request.status === 'CREATED' && (
          <div className="bg-blue-50/90 border-t border-blue-200/80 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-[#0274BB] text-white text-xs font-bold shrink-0 shadow-2xs">
                2
              </span>
              <div>
                <span className="font-bold text-slate-900 text-sm">
                  Next Step: Lab Physical Verification
                </span>
                <span className="text-xs text-slate-600 ml-2 hidden md:inline">
                  Instruments received at lab. Confirm serial numbers and condition to start calibration.
                </span>
              </div>
            </div>
            <Link to={`/lab/verification/${request.id}`} className="shrink-0">
              <Button variant="primary" className="text-xs font-semibold py-2 px-4 shadow-sm w-full sm:w-auto">
                Start Lab Verification <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        )}

        {request.status === 'VERIFIED' && (
          <div className="bg-emerald-50/90 border-t border-emerald-200/80 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold shrink-0 shadow-2xs">
                3
              </span>
              <div>
                <span className="font-bold text-slate-900 text-sm">
                  Next Step: Metrology Calibration Testing
                </span>
                <span className="text-xs text-slate-600 ml-2 hidden md:inline">
                  Instruments verified. Mount on benches and record precision measurement readings.
                </span>
              </div>
            </div>
            <Link to={`/lab/calibration/${request.id}`} className="shrink-0">
              <Button variant="primary" className="text-xs font-semibold py-2 px-4 shadow-sm w-full sm:w-auto">
                Perform Calibration Test <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        )}

        {request.status === 'INVOICED' && (
          <div className="bg-amber-50/90 border-t border-amber-200/80 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-amber-600 text-white text-xs font-bold shrink-0 shadow-2xs">
                7
              </span>
              <div>
                <span className="font-bold text-slate-900 text-sm">
                  Next Step: Gate Pass Dispatch
                </span>
                <span className="text-xs text-slate-600 ml-2 hidden md:inline">
                  Invoice generated. Package instruments and issue dispatch gate pass.
                </span>
              </div>
            </div>
            <Link to="/logistics/dispatch/new" className="shrink-0">
              <Button variant="primary" className="text-xs font-semibold py-2 px-4 shadow-sm w-full sm:w-auto">
                Create Gate Pass Dispatch <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        )}

        {request.status === 'DISPATCHED' && (
          <div className="bg-purple-50/90 border-t border-purple-200/80 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-bold shrink-0 shadow-2xs">
                8
              </span>
              <div>
                <span className="font-bold text-slate-900 text-sm">
                  Next Step: Capture Client Delivery Signature (POD)
                </span>
                <span className="text-xs text-slate-600 ml-2 hidden md:inline">
                  Shipment is out for handover. Capture digital signature upon delivery.
                </span>
              </div>
            </div>
            <Link to="/logistics/dispatch" className="shrink-0">
              <Button variant="primary" className="text-xs font-semibold py-2 px-4 shadow-sm w-full sm:w-auto">
                Record Delivery Signature <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        )}
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
            <div className="flex items-center gap-2">
              <Link to={`/commercial/vendor-pos/${outsources[0].id}`}>
                <Button variant="primary" size="sm" className="flex items-center gap-1">
                  <Download className="size-3.5" /> View / Print Vendor PO
                </Button>
              </Link>
              <Link to={`/lab/calibration/${request.id}`}>
                <Button variant="outlineInk" size="sm">
                  Lab Calibration Bench
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 1: Inward Intake & Client Overview - Streamlined & Compact */}
      <Card className="border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
          {/* Left: Client info */}
          <div className="space-y-1 min-w-[240px]">
            <div className="flex items-center gap-2">
              <Building className="size-4 text-[#0274BB]" />
              <span className="font-bold text-slate-900 text-base">
                {request.clients?.client_name || 'N/A'}
              </span>
              {request.clients?.client_code && (
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0274BB] border border-blue-200 shadow-2xs">
                  {request.clients.client_code}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {[request.clients?.city, request.clients?.state].filter(Boolean).join(', ') || 'Client Facility'}
              {request.clients?.contact_person && ` • Contact: ${request.clients.contact_person}`}
              {request.clients?.phone && ` (${request.clients.phone})`}
            </p>
          </div>

          {/* Right: Key Metadata Chips in 1 row */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200/80">
              <Clock className="size-3.5 text-slate-400" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">Turnaround</span>
                <span className={`font-semibold ${request.priority === 'URGENT' ? 'text-rose-600' : 'text-slate-800'}`}>
                  {request.priority === 'URGENT' ? 'Urgent 24h' : 'Standard 5-7d'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200/80">
              <Calendar className="size-3.5 text-emerald-500" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">Collected</span>
                <span className="font-semibold text-slate-800">
                  {new Date(request.collection_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200/80">
              <User className="size-3.5 text-purple-500" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">Agent</span>
                <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                  {request.collection_agent_name || 'Designated'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200/80">
              <FileText className="size-3.5 text-sky-500" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">Client PO Ref</span>
                <span className="font-mono font-semibold text-[#0274BB] truncate max-w-[120px]">
                  {request.client_po_ref || request.dc_number || 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Handling Remarks Strip (if any) */}
        {request.remarks && (
          <div className="px-5 py-2.5 bg-amber-50/60 border-t border-amber-200/60 text-xs flex items-center gap-2 text-slate-700">
            <span className="font-bold text-amber-800 uppercase text-[10px] shrink-0">Customer Instructions:</span>
            <span className="italic truncate">{request.remarks}</span>
          </div>
        )}
      </Card>

      {/* Section 2: Attached Proof Documents (if any) */}
      {request.attachments && request.attachments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Paperclip className="size-4 text-[#0274BB]" /> Attached Proof Documents &amp; Photos ({request.attachments.length})
            </CardTitle>
            <CardDescription>
              Collection receipts, client delivery challans, and equipment photos captured at inward intake
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              {request.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] hover:border-[#CBD5E1] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
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
                      className="text-[#0274BB] hover:underline font-semibold shrink-0 ml-2 text-xs"
                    >
                      View
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 3: Equipment Line Items Matrix */}
      {/* Section 3: Equipment Line Items Matrix */}
      <Card className="border border-slate-200/80 shadow-xs overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-slate-50/60 border-b border-slate-100 py-3.5 px-5">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Gauge className="size-4 text-[#0274BB]" />
              Equipment Line Items ({request.request_items?.length || 0})
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Customer metrology instruments in this inward batch &amp; operational routing
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-2xs">
              <span className="text-slate-400">Total Units:</span>
              <span className="font-mono font-bold text-slate-900">
                {request.request_items?.reduce((sum, it) => sum + (it.quantity || 0), 0)}
              </span>
            </div>
            <Link to={`/requests/${request.id}/routing`}>
              <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-1.5 text-xs font-semibold">
                <Layers className="size-3.5 text-[#0274BB]" /> Routing Matrix
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Equipment / Specs</th>
                  <th className="px-4 py-3">Serial # / Asset Tag</th>
                  <th className="px-3 py-3 w-16 text-center">Qty</th>
                  <th className="px-4 py-3">Condition</th>
                  <th className="px-4 py-3">Routing &amp; Allocation</th>
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
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      {!canRouteItems ? (
                        item.destination === 'VENDOR_OUTSOURCE' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                              <Truck className="size-3 text-amber-700" /> Outsourced
                            </span>
                            {item.vendor_name && (
                              <div className="text-[10px] text-amber-800 font-medium truncate max-w-[140px]">
                                {item.vendor_name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                            <Building className="size-3 text-blue-600" /> In-House Lab
                          </span>
                        )
                      ) : (
                        <div className="space-y-1.5 min-w-[160px]">
                          {(() => {
                            const effectiveDestination = localItemRoutes[item.id]?.destination ?? (item.destination || 'IN_HOUSE');
                            const effectiveVendorId = localItemRoutes[item.id]?.vendorId !== undefined ? localItemRoutes[item.id]?.vendorId : (item.vendor_id || '');

                            return (
                              <>
                                <select
                                  value={effectiveDestination}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleRoutingChange(item.id, e.target.value as 'IN_HOUSE' | 'VENDOR_OUTSOURCE');
                                  }}
                                  className={`w-full text-xs font-semibold rounded-md border px-2.5 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0274BB] shadow-2xs transition-all ${
                                    effectiveDestination === 'VENDOR_OUTSOURCE'
                                      ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100/80'
                                      : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100/80'
                                  }`}
                                >
                                  <option value="IN_HOUSE">🏢 In-House Lab</option>
                                  <option value="VENDOR_OUTSOURCE">🚚 Outsourcing</option>
                                </select>

                                {effectiveDestination === 'VENDOR_OUTSOURCE' && (
                                  <select
                                    value={effectiveVendorId}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleVendorChange(item.id, e.target.value);
                                    }}
                                    className="w-full text-[11px] rounded-md border border-amber-300 bg-white px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 truncate shadow-2xs"
                                  >
                                    <option value="">Select Vendor...</option>
                                    {vendors.map((v) => (
                                      <option key={v.id} value={v.id}>
                                        {v.vendor_name} {v.vendor_code ? `(${v.vendor_code})` : ''}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
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

      {/* Activity History & Audit Trail Timeline */}
      <Card className="border border-[#E5E7EB] shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 bg-gray-50/70 border-b border-[#E5E7EB]">
          <div>
            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <History className="size-4 text-[#0274BB]" />
              Activity History &amp; Audit Trail
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Chronological log of all inward, routing, lab calibrations, and commercial events for this order
            </CardDescription>
          </div>
          <Link
            to="/logs"
            className="text-xs text-[#0274BB] hover:underline font-semibold flex items-center gap-1"
          >
            <span>Full System Logs</span> &rarr;
          </Link>
        </CardHeader>
        <CardContent className="p-6">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
            {/* Step 1: Intake Event */}
            <div className="relative flex items-start gap-4">
              <div className="absolute -left-6 mt-1 size-5 rounded-full bg-blue-600 border-2 border-white shadow-xs flex items-center justify-center text-white">
                <CheckCircle2 className="size-3" />
              </div>
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">Equipment Inward Intake</span>
                  <span className="text-gray-400 font-mono text-[11px]">
                    {new Date(request.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">
                  Inwarded {request.request_items?.length || 0} equipment line items from{' '}
                  <strong>{request.clients?.client_name || 'Client'}</strong>. Handled by{' '}
                  <strong>{request.collection_agent_name || 'Collection Agent'}</strong>.
                </p>
                {request.client_po_ref && (
                  <div className="mt-1 text-gray-500 font-mono text-[11px]">
                    Client PO Ref: {request.client_po_ref}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Routing / Segregation Event */}
            <div className="relative flex items-start gap-4">
              <div className="absolute -left-6 mt-1 size-5 rounded-full bg-indigo-600 border-2 border-white shadow-xs flex items-center justify-center text-white">
                <Layers className="size-3" />
              </div>
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">Routing &amp; Lab Allocation</span>
                  <Link
                    to={`/requests/${request.id}/routing`}
                    className="text-[#0274BB] hover:underline font-semibold text-[11px]"
                  >
                    Edit Routing Matrix &rarr;
                  </Link>
                </div>
                <p className="text-gray-600 mt-1">
                  Allocated{' '}
                  <strong className="text-blue-700">
                    {request.request_items?.filter((i) => i.destination !== 'VENDOR_OUTSOURCE').length || 0} items
                  </strong>{' '}
                  to In-House Lab and{' '}
                  <strong className="text-amber-800">
                    {request.request_items?.filter((i) => i.destination === 'VENDOR_OUTSOURCE').length || 0} items
                  </strong>{' '}
                  to External Outsource Vendors.
                </p>
              </div>
            </div>

            {/* Recorded Audit Logs from DB */}
            {auditLogs.map((log) => (
              <div key={log.id} className="relative flex items-start gap-4">
                <div className="absolute -left-6 mt-1 size-5 rounded-full bg-emerald-600 border-2 border-white shadow-xs flex items-center justify-center text-white">
                  <Clock className="size-3" />
                </div>
                <div className="flex-1 bg-white border border-gray-200 rounded p-3 text-xs shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 font-mono">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-gray-400 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">
                    {log.remarks || `Action performed on ${log.entity}`}
                  </p>
                  <div className="mt-1 text-[11px] text-gray-400">
                    By: <strong className="text-gray-700">{log.actor_name || 'System / Authorized User'}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
          <DialogOverlay onClick={() => setShowDirectInvoiceModal(false)}>
            <DialogContent size="4xl" onClick={(e) => e.stopPropagation()}>
              <DialogHeader>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Receipt className="size-5 text-[#0274BB]" />
                    <div>
                      <DialogTitle>Generate Direct Tax Invoice</DialogTitle>
                      <DialogDescription>
                        Direct invoice generation with itemized billing and client discounts for calibrated equipment
                      </DialogDescription>
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
              </DialogHeader>

              <DialogBody className="space-y-5">
                {/* Notice & Work Order Reference */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[4px] flex items-center justify-between gap-3 text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <Receipt className="size-4 text-emerald-600 shrink-0" />
                    <span>
                      Generating tax invoice for Work Order <strong>{request.request_number}</strong> ({request.clients?.client_name || 'Client'})
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    {unbilledItems.length} items ready
                  </span>
                </div>

                {/* Group 1: Purchase Order Reference */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#1E293B]">
                      Client Purchase Order Reference
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const year = new Date().getFullYear();
                        const code = request.clients?.client_code ? request.clients.client_code.toUpperCase() : 'CLIENT';
                        const randomSeq = String(Math.floor(100 + Math.random() * 900));
                        setClientPoRefDirect(`PO/${year}/${code}-${randomSeq}`);
                      }}
                      className="text-[11px] font-semibold text-[#0274BB] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="size-3" /> Auto Generate PO
                    </button>
                  </div>
                  <Input
                    placeholder="e.g. PO/2026/CLIENT-001"
                    value={clientPoRefDirect}
                    onChange={(e) => setClientPoRefDirect(e.target.value)}
                    className="bg-white"
                  />
                  <p className="text-[11px] text-[#6B7280] flex items-center gap-1">
                    <Sparkles className="size-3 text-emerald-600 shrink-0" />
                    Auto-fetched from inward request or auto-generated. Appears on tax invoice header.
                  </p>
                </div>

                {/* Group 2: Item Billing Checklist & Editable Unit Rates */}
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

                {/* Group 3: Client Commercial Discount Controls */}
                <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-[4px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
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

                {/* Group 4: Financial Calculation Summary */}
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
              </DialogBody>

              <DialogFooter>
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
              </DialogFooter>
            </DialogContent>
          </DialogOverlay>
        );
      })()}
    </div>
  );
};

export default RequestDetailPage;
