// application/src/pages/lab/EquipmentDetailPage.tsx
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  useCalibrationRequest,
  useCertificates,
  useRepairs,
  useOutsourcePOs,
} from '../../hooks/useOperations';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
} from '../../components/ui/UIPrimitives';
import {
  ArrowLeft,
  Sliders,
  ShieldCheck,
  Building2,
  FlaskConical,
  Award,
  Wrench,
  Truck,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const EquipmentDetailPage: React.FC = () => {
  const { requestId, itemId } = useParams<{ requestId: string; itemId: string }>();
  const navigate = useNavigate();

  const { data: request, isLoading } = useCalibrationRequest(requestId);
  const { data: certificates = [] } = useCertificates(requestId);
  const { data: requestRepairs = [] } = useRepairs(requestId);
  const { data: requestOutsources = [] } = useOutsourcePOs(requestId);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-sm text-[#6B7280]">
        <div className="size-8 border-3 border-[#0274BB] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading equipment specifications and dossier...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-8 bg-[#fef2f2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px] text-center space-y-3">
        <p className="font-semibold">Calibration request not found.</p>
        <Link to="/lab/queue">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="size-4 mr-1" /> Return to Lab Queue
          </Button>
        </Link>
      </div>
    );
  }

  const items = request.request_items || [];
  const itemIndex = items.findIndex((it) => it.id === itemId);
  const item = itemIndex >= 0 ? items[itemIndex] : items[0];

  if (!item) {
    return (
      <div className="p-8 bg-[#fef2f2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px] text-center space-y-3">
        <p className="font-semibold">Instrument not found in this calibration batch.</p>
        <Link to={`/lab/calibration/${requestId}`}>
          <Button variant="secondary" size="sm">
            <ArrowLeft className="size-4 mr-1" /> Back to Calibration Bench
          </Button>
        </Link>
      </div>
    );
  }

  const certificate = certificates.find((c) => c.request_id === requestId);
  const repair = requestRepairs.find((r) => r.request_item_id === item.id && r.status !== 'CANCELLED');
  const outsource = requestOutsources.find((o) => o.request_item_id === item.id);

  const getConditionBadge = (condition?: string) => {
    switch (condition?.toUpperCase()) {
      case 'GOOD':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            GOOD
          </span>
        );
      case 'DAMAGED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            DAMAGED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            {condition || 'ACCEPTABLE'}
          </span>
        );
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'CALIBRATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="size-3.5 text-emerald-600" /> Calibrated
          </span>
        );
      case 'REPAIR_IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">
            <Wrench className="size-3.5 text-orange-600" /> Repair In Progress
          </span>
        );
      case 'OUTSOURCED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
            <Truck className="size-3.5 text-purple-600" /> Outsourced
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            {status || 'IN_QUEUE'}
          </span>
        );
    }
  };

  const selectedIndexParam = itemIndex >= 0 ? itemIndex : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-[#6B7280]">
        <Link to="/lab/queue" className="hover:text-[#0274BB] transition-colors">
          Lab Queue
        </Link>
        <span>/</span>
        <Link to={`/lab/calibration/${requestId}`} className="hover:text-[#0274BB] transition-colors">
          Calibration Bench ({request.request_number})
        </Link>
        <span>/</span>
        <span className="font-semibold text-[#111827] dark:text-white">
          {item.item_masters?.item_name || 'Equipment Details'}
        </span>
      </div>

      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB] dark:border-neutral-700">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/lab/calibration/${requestId}?itemIndex=${selectedIndexParam}`)}
          >
            <ArrowLeft className="size-4 mr-1.5" /> Back to Bench
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[#111827] dark:text-white">
                {item.item_masters?.item_name || 'Standard Gauge'}
              </h1>
              {getStatusBadge(item.status)}
            </div>
            <p className="text-xs text-[#6B7280] dark:text-neutral-400 mt-1">
              Master Code: <span className="font-mono font-semibold text-[#0274BB]">{item.item_masters?.item_code || 'N/A'}</span>
              {' • '}Serial # / Tag: <span className="font-mono font-bold text-[#111827] dark:text-white">{item.serial_number || 'N/A'}</span>
              {' • '}Work Order: <span className="font-mono font-semibold text-[#111827] dark:text-white">{request.request_number}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => navigate(`/lab/calibration/${requestId}?itemIndex=${selectedIndexParam}`)}
          >
            <FlaskConical className="size-4 mr-2" />
            Load into Calibration Bench
          </Button>
        </div>
      </div>

      {/* Batch Navigation Selector (If multi-item request) */}
      {items.length > 1 && (
        <div className="bg-white dark:bg-neutral-800 p-3 rounded-lg border border-[#E5E7EB] dark:border-neutral-700 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#4B5563] dark:text-neutral-300">
            <Layers className="size-4 text-[#0274BB]" />
            <span className="font-semibold">Batch Instruments ({items.length}):</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {items.map((it, idx) => {
              const isCurrent = it.id === item.id;
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => navigate(`/lab/calibration/${requestId}/equipment/${it.id}`)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                    isCurrent
                      ? 'bg-[#0274BB] text-white border-[#0274BB] shadow-xs'
                      : 'bg-[#F8FAFC] text-[#374151] hover:bg-[#F1F5F9] border-[#E2E8F0] dark:bg-neutral-700 dark:text-neutral-200'
                  }`}
                >
                  #{idx + 1} {it.item_masters?.item_name || 'Item'}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4-Quadrant Specifications and Metrology Record */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Master Metrology Specifications */}
        <Card>
          <CardHeader className="pb-3 border-b border-[#E5E7EB] dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <Sliders className="size-4 text-[#0274BB]" />
              <CardTitle className="text-sm font-bold">1. Master Technical Specifications</CardTitle>
            </div>
            <CardDescription>
              Standard master parameters defined in Item Master
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-4 pb-3 border-b border-[#F1F5F9] dark:border-neutral-800">
              <div>
                <span className="text-[#6B7280] block text-[11px]">Item Code</span>
                <span className="font-mono font-bold text-sm text-[#0274BB]">
                  {item.item_masters?.item_code || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Category</span>
                <span className="font-semibold text-sm text-[#111827] dark:text-white">
                  {item.item_masters?.item_category || 'Dimensional / Metrology'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-3 border-b border-[#F1F5F9] dark:border-neutral-800">
              <div>
                <span className="text-[#6B7280] block text-[11px]">Measurement Range</span>
                <span className="font-semibold text-sm text-[#111827] dark:text-white">
                  {item.item_masters?.measurement_range ||
                    `${item.item_masters?.range_min ?? 0} - ${item.item_masters?.range_max ?? 100} ${item.item_masters?.range_unit || 'mm'}`}
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Least Count / Resolution</span>
                <span className="font-semibold text-sm text-[#111827] dark:text-white">
                  {item.item_masters?.least_count ?? 0.01} {item.item_masters?.least_count_unit || 'mm'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-3 border-b border-[#F1F5F9] dark:border-neutral-800">
              <div>
                <span className="text-[#6B7280] block text-[11px]">Recalibration Frequency</span>
                <span className="font-semibold text-sm text-[#111827] dark:text-white">
                  {item.item_masters?.calibration_frequency || 12} Months
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Standard Calibration Cost</span>
                <span className="font-mono font-bold text-sm text-[#111827] dark:text-white">
                  ₹{item.item_masters?.standard_cost?.toLocaleString() || '0'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[#6B7280] block text-[11px]">Manufacturer / Make</span>
                <span className="font-medium text-[#374151] dark:text-neutral-300">
                  {item.item_masters?.manufacturer || 'Standard'}
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Model</span>
                <span className="font-medium text-[#374151] dark:text-neutral-300">
                  {item.item_masters?.model || 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Physical Inward & Verification Inspection */}
        <Card>
          <CardHeader className="pb-3 border-b border-[#E5E7EB] dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[#16A34A]" />
              <CardTitle className="text-sm font-bold">2. Physical Inward Verification</CardTitle>
            </div>
            <CardDescription>
              Recorded during Step 7 inward physical verification
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-4 pb-3 border-b border-[#F1F5F9] dark:border-neutral-800">
              <div>
                <span className="text-[#6B7280] block text-[11px]">Permanent Serial # / Tag</span>
                <span className="font-mono font-bold text-sm text-[#111827] dark:text-white">
                  {item.serial_number || 'N/A (No Physical Tag)'}
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Verified Physical Condition</span>
                <div className="mt-1">{getConditionBadge(item.item_condition)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-3 border-b border-[#F1F5F9] dark:border-neutral-800">
              <div>
                <span className="text-[#6B7280] block text-[11px]">Declared Inward Count</span>
                <span className="font-mono font-semibold text-sm text-[#374151] dark:text-neutral-200">
                  {item.quantity || 1} unit(s)
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Physically Received &amp; Verified</span>
                <span className="font-mono font-bold text-sm text-[#15803D]">
                  {item.received_quantity || item.quantity || 1} unit(s)
                </span>
              </div>
            </div>

            <div className="pb-3 border-b border-[#F1F5F9] dark:border-neutral-800">
              <span className="text-[#6B7280] block text-[11px]">Accessories Received</span>
              <span className="font-medium text-[#111827] dark:text-white block mt-0.5">
                {item.accessories || 'None / Standard Box'}
              </span>
            </div>

            <div>
              <span className="text-[#6B7280] block text-[11px]">Inward Remarks &amp; Observations</span>
              <span className="text-[#374151] dark:text-neutral-300 italic block mt-0.5">
                {item.remarks || 'No physical defects or inward remarks logged during receiving.'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Commercial & Client Work Order Context */}
        <Card>
          <CardHeader className="pb-3 border-b border-[#E5E7EB] dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-[#0274BB]" />
              <CardTitle className="text-sm font-bold">3. Client &amp; Work Order Context</CardTitle>
            </div>
            <CardDescription>
              Account commercial linkages and intake reference
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="pb-3 border-b border-[#F1F5F9] dark:border-neutral-800">
              <span className="text-[#6B7280] block text-[11px]">Client Organization</span>
              <span className="font-bold text-sm text-[#111827] dark:text-white block">
                {request.clients?.client_name || 'Client Account'}
              </span>
              {request.clients?.client_code && (
                <span className="font-mono text-[11px] text-[#6B7280]">
                  Client Code: {request.clients.client_code}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pb-3 border-b border-[#F1F5F9] dark:border-neutral-800">
              <div>
                <span className="text-[#6B7280] block text-[11px]">Client PO Reference</span>
                <span className="font-mono font-semibold text-sm text-[#111827] dark:text-white">
                  {request.client_po_ref || 'No Ref'}
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Work Order / Request #</span>
                <span className="font-mono font-bold text-sm text-[#0274BB]">
                  {request.request_number}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[#6B7280] block text-[11px]">Inward Collection Date</span>
                <span className="font-medium text-[#374151] dark:text-neutral-300 flex items-center gap-1 mt-0.5">
                  <Calendar className="size-3.5 text-[#6B7280]" />
                  {request.collection_date
                    ? new Date(request.collection_date).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Priority / SLA</span>
                <span className="mt-1 inline-block">
                  <Badge variant={request.priority === 'URGENT' ? 'error' : 'secondary'}>
                    {request.priority}
                  </Badge>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Operational Status & Bench Actions */}
        <Card>
          <CardHeader className="pb-3 border-b border-[#E5E7EB] dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <FlaskConical className="size-4 text-[#EF7626]" />
              <CardTitle className="text-sm font-bold">4. Operational Status &amp; Bench Actions</CardTitle>
            </div>
            <CardDescription>
              Direct routing to test bench, repair, or outsource PO
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            {item.status === 'CALIBRATED' && (
              <div className="p-3 bg-[#ECFDF5] border border-[#10B981]/30 rounded text-[#065F46] space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Award className="size-4 text-[#10B981]" />
                  ISO Calibration Certificate Issued
                </div>
                {certificate && (
                  <p className="text-xs">
                    Cert #: <span className="font-mono font-semibold">{certificate.certificate_number}</span>
                    {' • '}Valid Until:{' '}
                    <span className="font-bold underline">{certificate.valid_until}</span>
                  </p>
                )}
              </div>
            )}

            {repair && (
              <div className="p-3 bg-[#FFF7ED] border border-[#F97316]/30 rounded text-[#9A3412] space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Wrench className="size-4 text-[#F97316]" />
                  In-Lab Repair Order Active ({repair.status})
                </div>
                <p className="text-xs">
                  Issue: {repair.defect_description || 'Standard repair'} • Est. Cost: ₹{repair.estimated_cost}
                </p>
              </div>
            )}

            {outsource && (
              <div className="p-3 bg-[#F5F3FF] border border-[#8B5CF6]/30 rounded text-[#5B21B6] space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Truck className="size-4 text-[#8B5CF6]" />
                  Outsourced to External Vendor ({outsource.status})
                </div>
                <p className="text-xs">
                  PO #: {outsource.vendor_po_number || outsource.voucher_no || 'N/A'} • Vendor: {outsource.vendor_name || outsource.vendor_id}
                </p>
              </div>
            )}

            <div className="pt-2 space-y-2">
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide block">
                Workflow Actions for this Instrument:
              </span>
              <button
                type="button"
                onClick={() => navigate(`/lab/calibration/${requestId}?itemIndex=${selectedIndexParam}&tab=IN_HOUSE`)}
                className="w-full text-left p-2.5 rounded bg-white dark:bg-neutral-800 hover:bg-[#EBF5FF] border border-[#E2E8F0] dark:border-neutral-700 text-[#0274BB] font-semibold transition-colors cursor-pointer flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <FlaskConical className="size-4" />
                  <span>1. Configure In-Lab Calibration Pass</span>
                </div>
                <ArrowRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate(`/lab/calibration/${requestId}?itemIndex=${selectedIndexParam}&tab=IN_LAB_REPAIR`)}
                className="w-full text-left p-2.5 rounded bg-white dark:bg-neutral-800 hover:bg-[#FFF7ED] border border-[#E2E8F0] dark:border-neutral-700 text-[#EF7626] font-semibold transition-colors cursor-pointer flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <Wrench className="size-4" />
                  <span>2. Log In-Lab Service &amp; Repair Order</span>
                </div>
                <ArrowRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate(`/lab/calibration/${requestId}?itemIndex=${selectedIndexParam}&tab=OUTSOURCE_PO`)}
                className="w-full text-left p-2.5 rounded bg-white dark:bg-neutral-800 hover:bg-[#F5F3FF] border border-[#E2E8F0] dark:border-neutral-700 text-[#7C3AED] font-semibold transition-colors cursor-pointer flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <Truck className="size-4" />
                  <span>3. Assign to Outsource External Vendor PO</span>
                </div>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EquipmentDetailPage;
