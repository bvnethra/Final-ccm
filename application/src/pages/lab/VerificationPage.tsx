import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCalibrationRequest, useRecordVerification, useRouteRequestItems } from '../../hooks/useOperations';
import { useVendors } from '../../hooks/useVendorMaster';
import { useAuthContext } from '../../contexts/AuthContext';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Select,
  Field,
  FieldLabel,
  Badge,
  DetailViewSkeleton,
} from '../../components/ui/UIPrimitives';
import type { VerificationResult, RequestAttachment } from '../../types/domain';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Paperclip,
  Download,
  FileText,
  Image as ImageIcon,
  Zap,
  AlertTriangle,
  Eye,
  Check,
  Clock,
  X,
  Gauge,
  Truck,
  Building,
  CheckCheck,
  Edit2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const VerificationPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const { tenantId, organizationId, user, isSuperAdmin, canPerform } = useAuthContext();
  const canEditVerification =
    isSuperAdmin ||
    canPerform('LAB_VERIFICATION_RECEIPT', 'CREATE_EDIT') ||
    canPerform('LAB_VERIFICATION_RECEIPT', 'CREATE');
  const isViewOnly = !canEditVerification;

  const { data: request, isLoading } = useCalibrationRequest(requestId);
  const recordVerificationMutation = useRecordVerification();
  const routeMutation = useRouteRequestItems();
  const { data: vendors = [] } = useVendors();
  const [localItemRoutes, setLocalItemRoutes] = useState<Record<string, { destination: 'IN_HOUSE' | 'VENDOR_OUTSOURCE'; vendorId?: string }>>({});

  const handleRoutingChange = async (itemId: string, destination: 'IN_HOUSE' | 'VENDOR_OUTSOURCE') => {
    if (!tenantId || !requestId) return;
    setLocalItemRoutes((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        destination,
        vendorId: destination === 'IN_HOUSE' ? '' : prev[itemId]?.vendorId,
      },
    }));

    const currentItem = items.find((i: any) => i.id === itemId);
    try {
      await routeMutation.mutateAsync({
        tenantId,
        organizationId: organizationId || undefined,
        requestId,
        actorUserId: user?.id,
        actorName: user?.fullName || 'Lab Supervisor',
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
    if (!tenantId || !requestId) return;
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
        requestId,
        actorUserId: user?.id,
        actorName: user?.fullName || 'Lab Supervisor',
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

  // Active item ID currently being verified/edited inline
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  // Per-item verification form state
  const [verifiedQty, setVerifiedQty] = useState<number>(1);
  const [observedCondition, setObservedCondition] = useState<string>('GOOD');
  const [observedSerialNumber, setObservedSerialNumber] = useState<string>('');
  const [result, setResult] = useState<VerificationResult>('VERIFIED');
  const [discrepancyReason, setDiscrepancyReason] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [activeProofModal, setActiveProofModal] = useState<RequestAttachment | null>(null);
  const [isBatchVerifying, setIsBatchVerifying] = useState(false);

  const items = request?.request_items || [];

  // Initialize or open inspection for a specific item
  const openItemVerification = (item: any) => {
    setActiveItemId(item.id);
    setVerifiedQty(item.received_quantity || item.quantity || 1);
    setObservedCondition(item.item_condition || 'GOOD');
    setObservedSerialNumber(item.serial_number || '');
    setResult((item.status === 'DISCREPANCY' ? 'DISCREPANCY' : 'VERIFIED') as VerificationResult);
    setDiscrepancyReason('');
    setRemarks(item.remarks || '');
    setErrorMessage(undefined);
  };

  const closeItemVerification = () => {
    setActiveItemId(null);
    setErrorMessage(undefined);
  };

  // Quick verify a single item as GOOD matching declared
  const handleQuickVerifyItem = async (item: any) => {
    if (!tenantId || !organizationId || !requestId) return;

    try {
      await recordVerificationMutation.mutateAsync({
        tenantId,
        organizationId,
        requestId,
        requestItemId: item.id,
        verifiedQuantity: item.quantity || 1,
        expectedQuantity: item.quantity || 1,
        observedItemCondition: item.item_condition || 'GOOD',
        result: 'VERIFIED',
        remarks: item.serial_number ? `Serial Verified: ${item.serial_number}` : 'Physical receipt confirmed',
        inspector: {
          id: user?.id,
          name: user?.fullName || user?.email || 'Lab Verification Tech',
        },
      });
      if (activeItemId === item.id) {
        setActiveItemId(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to verify item.');
    }
  };

  // Batch Quick Verify all unverified items
  const handleBatchVerifyAll = async () => {
    if (!tenantId || !organizationId || !requestId || items.length === 0) return;

    const unverifiedItems = items.filter((it) => it.status !== 'VERIFIED');
    if (unverifiedItems.length === 0) return;

    setIsBatchVerifying(true);
    setErrorMessage(undefined);

    try {
      for (const it of unverifiedItems) {
        await recordVerificationMutation.mutateAsync({
          tenantId,
          organizationId,
          requestId,
          requestItemId: it.id,
          verifiedQuantity: it.quantity || 1,
          expectedQuantity: it.quantity || 1,
          observedItemCondition: it.item_condition || 'GOOD',
          result: 'VERIFIED',
          remarks: it.serial_number ? `Serial Verified: ${it.serial_number}` : 'Batch quick-verified as declared',
          inspector: {
            id: user?.id,
            name: user?.fullName || user?.email || 'Lab Verification Tech',
          },
        });
      }
      setActiveItemId(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Batch verification failed.');
    } finally {
      setIsBatchVerifying(false);
    }
  };

  // Submit inline verification form for active item
  const handleSubmitItemVerification = async (e: React.FormEvent, item: any) => {
    e.preventDefault();
    setErrorMessage(undefined);

    if (!tenantId || !organizationId || !requestId || !item) {
      setErrorMessage('Missing required session context or item.');
      return;
    }

    try {
      await recordVerificationMutation.mutateAsync({
        tenantId,
        organizationId,
        requestId,
        requestItemId: item.id,
        verifiedQuantity: verifiedQty,
        expectedQuantity: item.quantity,
        observedItemCondition: observedCondition,
        result,
        discrepancyReason,
        remarks: [
          observedSerialNumber ? `Serial Verified: ${observedSerialNumber}` : '',
          remarks,
        ]
          .filter(Boolean)
          .join(' | '),
        inspector: {
          id: user?.id,
          name: user?.fullName || user?.email || 'Lab Verification Tech',
        },
      });

      setActiveItemId(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record verification.');
    }
  };

  const getConditionBadge = (condition?: string) => {
    switch (condition?.toUpperCase()) {
      case 'GOOD':
        return <Badge variant="success">GOOD</Badge>;
      case 'SCRATCHED':
        return <Badge variant="warning">SCRATCHED</Badge>;
      case 'DAMAGED':
        return <Badge variant="error">DAMAGED</Badge>;
      case 'FAULTY':
        return <Badge variant="error">FAULTY</Badge>;
      default:
        return <Badge variant="secondary">{condition || 'GOOD'}</Badge>;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'VERIFIED':
        return <Badge variant="success">VERIFIED</Badge>;
      case 'DISCREPANCY':
        return <Badge variant="error">DISCREPANCY</Badge>;
      case 'ADDED':
        return <Badge variant="info">ADDED</Badge>;
      default:
        return <Badge variant="secondary">{status || 'PENDING'}</Badge>;
    }
  };

  if (isLoading) {
    return <DetailViewSkeleton columns={7} rows={5} cardsCount={4} />;
  }

  if (!request || items.length === 0) {
    return (
      <div className="p-8 bg-[#fef2f2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px] text-center space-y-3">
        <AlertTriangle className="size-8 mx-auto" />
        <p className="font-semibold">Calibration request or equipment items not found.</p>
        <Link to="/lab/queue">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="size-4" /> Return to Lab Queue
          </Button>
        </Link>
      </div>
    );
  }

  const allVerified = items.every((it) => it.status === 'VERIFIED');
  const verifiedCount = items.filter((i) => i.status === 'VERIFIED').length;
  const isUrgent = request.priority === 'URGENT';
  const totalUnits = items.reduce((sum, it) => sum + (it.quantity || 0), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/lab/queue">
            <Button variant="secondary" size="sm" type="button">
              <ArrowLeft className="size-4" /> Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#111827]">
                Inward Inspection &amp; Physical Verification
              </h1>
              {isUrgent ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-xs font-bold bg-[#DC2626] text-white animate-pulse">
                  <Zap className="size-3" /> URGENT (24H)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-xs font-medium bg-[#E5E7EB] text-[#374151]">
                  <Clock className="size-3 text-[#6B7280]" /> NORMAL (5D)
                </span>
              )}
            </div>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Lifecycle Step 7: Inspect physical equipment condition, verify serial numbers against client proof, and confirm receipt count
            </p>
          </div>
        </div>

        {allVerified && (
          <Link to={`/lab/calibration/${request.id}`}>
            <Button variant="primary">
              Proceed to Calibration Bench (Step 8) <ArrowRight className="size-4" />
            </Button>
          </Link>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 bg-[#fef2f2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px] text-sm flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Section 1: Work Order & Client Context Overview */}
      <Card className="bg-[#FAFAFA] border border-[#E5E7EB]">
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-xs">
            <div>
              <span className="text-[#6B7280] block font-medium">Request Number</span>
              <span className="font-mono font-bold text-[#0274BB] text-sm">
                {request.request_number}
              </span>
            </div>
            <div>
              <span className="text-[#6B7280] block font-medium">Client Legal Name</span>
              <span className="font-bold text-[#111827] text-sm truncate block" title={request.clients?.client_name}>
                {request.clients?.client_name || 'N/A'}
              </span>
              {request.clients?.client_code && (
                <span className="text-[#6B7280] font-mono text-[11px] block">{request.clients.client_code}</span>
              )}
            </div>
            <div>
              <span className="text-[#6B7280] block font-medium">Collection Date</span>
              <span className="font-semibold text-[#111827]">
                {new Date(request.collection_date).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-[#6B7280] block font-medium">Priority</span>
              <span className="font-semibold text-[#111827]">
                {request.priority === 'URGENT' ? '⚡ URGENT (24-48h)' : 'NORMAL (5 Days)'}
              </span>
            </div>
            <div>
              <span className="text-[#6B7280] block font-medium">Client PO / Gate Pass</span>
              <span className="font-mono font-semibold text-[#111827]">
                {request.client_po_ref || '—'}
              </span>
            </div>
            <div>
              <span className="text-[#6B7280] block font-medium">Verification Status</span>
              <span className={`font-bold ${allVerified ? 'text-green-600' : 'text-[#0274BB]'}`}>
                {verifiedCount} of {items.length} Verified
              </span>
            </div>
          </div>
          {request.remarks && (
            <div className="mt-3 pt-3 border-t border-[#E5E7EB] text-xs text-[#4B5563]">
              <strong className="text-[#111827]">Collection Notes:</strong> <span className="italic">{request.remarks}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Equipment Line Items Matrix Table (Default Template as in Image 2) */}
      <Card className="border border-[#E5E7EB] shadow-xs overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] bg-white">
          <div>
            <CardTitle className="text-base font-bold text-[#111827]">
              Equipment Line Items ({items.length})
            </CardTitle>
            <CardDescription className="text-xs text-[#6B7280]">
              Customer instruments in this calibration inward batch — Inspect physical equipment and verify condition
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[#6B7280] bg-[#F5F7FA] px-2.5 py-1 rounded-[4px] border border-[#E5E7EB]">
              <Gauge className="size-3.5 text-[#0274BB]" />
              <span>Total Units: </span>
              <span className="font-mono font-bold text-[#111827]">{totalUnits}</span>
            </div>

            {!isViewOnly && !allVerified && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleBatchVerifyAll}
                disabled={isBatchVerifying || recordVerificationMutation.isPending}
                className="gap-1.5 bg-[#0274BB] hover:bg-[#005a92] text-xs cursor-pointer"
              >
                <CheckCheck className="size-3.5" />
                {isBatchVerifying ? 'Verifying All...' : '✓ Verify All (Matching Declared)'}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[#F5F7FA] border-b border-[#E5E7EB] text-[#374151] font-semibold text-xs uppercase">
                <tr>
                  <th className="px-5 py-3">Equipment / Specs</th>
                  <th className="px-4 py-3">Serial # / Asset Tag</th>
                  <th className="px-3 py-3 w-16 text-center">Qty</th>
                  <th className="px-4 py-3">Condition</th>
                  <th className="px-4 py-3">Routing (Step 2)</th>
                  <th className="px-4 py-3">Accessories / Notes</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {items.map((item, idx) => {
                  const isItemVerified = item.status === 'VERIFIED';
                  const isExpanded = activeItemId === item.id;

                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        className={`hover:bg-[#FAFAFA] transition-colors align-top ${
                          isExpanded ? 'bg-[#F0F9FF]' : ''
                        }`}
                      >
                        {/* Equipment / Specs */}
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-[#111827]">
                            {item.item_masters?.item_name || 'Standard Equipment'}
                          </div>
                          <div className="text-[11px] text-[#6B7280] font-mono mt-0.5">
                            {item.item_masters?.item_code || `ITM-${idx + 1}`}
                            {item.item_masters?.item_category && (
                              <span className="text-[#0274BB] font-sans">
                                {' '}
                                • {item.item_masters.item_category}
                              </span>
                            )}
                          </div>
                          {item.item_masters?.measurement_range ? (
                            <div className="text-[11px] text-[#6B7280] mt-0.5">
                              Range: {item.item_masters.measurement_range}
                              {item.item_masters?.least_count !== undefined && (
                                <span>
                                  {' '}
                                  (LC: {item.item_masters.least_count}{' '}
                                  {item.item_masters.least_count_unit})
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-[11px] text-[#9CA3AF] mt-0.5">
                              Range: Standard
                            </div>
                          )}
                        </td>

                        {/* Serial # / Asset Tag */}
                        <td className="px-4 py-3.5">
                          {item.serial_number ? (
                            <span className="font-mono text-xs font-semibold text-[#111827] bg-[#F5F7FA] px-2 py-0.5 rounded border border-[#E5E7EB]">
                              {item.serial_number}
                            </span>
                          ) : (
                            <span className="text-xs text-[#9CA3AF] italic">Not Tagged</span>
                          )}
                        </td>

                        {/* Qty */}
                        <td className="px-3 py-3.5 font-mono font-bold text-center text-[#111827]">
                          {item.received_quantity || item.quantity}
                        </td>

                        {/* Condition */}
                        <td className="px-4 py-3.5">
                          {getConditionBadge(item.item_condition)}
                        </td>

                        {/* Routing */}
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          {isViewOnly ? (
                            item.destination === 'VENDOR_OUTSOURCE' ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                                  <Truck className="size-3 text-amber-700" /> Outsourcing
                                </span>
                                {item.vendor_name && (
                                  <div className="text-[10px] text-amber-800 font-medium truncate max-w-[130px]">
                                    {item.vendor_name}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                                <Building className="size-3 text-blue-600" /> In-House
                              </span>
                            )
                          ) : (
                            <div className="space-y-1.5 min-w-[145px]">
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
                                      className={`w-full text-xs font-semibold rounded-md border px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary shadow-xs transition-colors ${
                                        effectiveDestination === 'VENDOR_OUTSOURCE'
                                          ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                          : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                                      }`}
                                    >
                                      <option value="IN_HOUSE">🏢 In-House</option>
                                      <option value="VENDOR_OUTSOURCE">🚚 Outsourcing</option>
                                    </select>

                                    {effectiveDestination === 'VENDOR_OUTSOURCE' && (
                                      <select
                                        value={effectiveVendorId}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          handleVendorChange(item.id, e.target.value);
                                        }}
                                        className="w-full text-[11px] rounded-md border border-amber-300 bg-white px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-amber-500 truncate"
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

                        {/* Accessories / Notes */}
                        <td className="px-4 py-3.5 text-xs text-[#4B5563]">
                          {item.accessories || item.remarks || (
                            <span className="text-[#9CA3AF] italic">None</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          {getStatusBadge(item.status)}
                        </td>

                        {/* Verification Action */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          {isViewOnly ? (
                            <span className="text-xs text-gray-400">View Only</span>
                          ) : isItemVerified ? (
                            <div className="inline-flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-xs text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded border border-green-200">
                                <Check className="size-3" /> Verified
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  isExpanded ? closeItemVerification() : openItemVerification(item)
                                }
                                className="h-7 px-2 text-gray-500 hover:text-gray-800 cursor-pointer"
                                title="Edit verification details"
                              >
                                <Edit2 className="size-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => handleQuickVerifyItem(item)}
                                disabled={recordVerificationMutation.isPending}
                                className="h-7 px-2.5 text-xs text-green-700 hover:bg-green-50 border border-green-200 cursor-pointer font-medium"
                                title="Accept item as matching declared condition"
                              >
                                <Check className="size-3 mr-1" /> Quick Verify
                              </Button>
                              <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                onClick={() =>
                                  isExpanded ? closeItemVerification() : openItemVerification(item)
                                }
                                className="h-7 px-2 text-xs bg-[#0274BB] hover:bg-[#005a92] cursor-pointer"
                              >
                                Inspect {isExpanded ? <ChevronUp className="size-3 ml-1" /> : <ChevronDown className="size-3 ml-1" />}
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* Inline Expanded Physical Verification Form */}
                      {isExpanded && !isViewOnly && (
                        <tr>
                          <td colSpan={8} className="p-0 bg-[#F0F9FF] border-b-2 border-[#0274BB]">
                            <form
                              onSubmit={(e) => handleSubmitItemVerification(e, item)}
                              className="p-6 space-y-5"
                            >
                              <div className="flex items-center justify-between border-b border-[#BAE6FD] pb-3">
                                <div className="flex items-center gap-2">
                                  <div className="size-7 rounded bg-[#0274BB] text-white flex items-center justify-center font-bold text-xs">
                                    #{idx + 1}
                                  </div>
                                  <h4 className="font-bold text-[#0F172A] text-sm">
                                    Physical Verification Form — {item.item_masters?.item_name || 'Instrument'}
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  onClick={closeItemVerification}
                                  className="text-gray-400 hover:text-gray-700 cursor-pointer p-1"
                                >
                                  <X className="size-4" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                <Field>
                                  <FieldLabel className="text-gray-700 font-semibold">
                                    Verified Count Received <span className="text-[#DC2626]">*</span>
                                  </FieldLabel>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={verifiedQty}
                                    onChange={(e) => setVerifiedQty(parseInt(e.target.value, 10) || 0)}
                                    required
                                    className="bg-white"
                                  />
                                  {verifiedQty !== item.quantity && (
                                    <p className="mt-1 text-[11px] text-[#DC2626] font-medium flex items-center gap-1">
                                      <AlertTriangle className="size-3" /> Discrepancy! Declared: {item.quantity}
                                    </p>
                                  )}
                                </Field>

                                <Field>
                                  <FieldLabel className="text-gray-700 font-semibold">
                                    Observed Condition <span className="text-[#DC2626]">*</span>
                                  </FieldLabel>
                                  <Select
                                    value={observedCondition}
                                    onChange={(e) => setObservedCondition(e.target.value)}
                                    className="bg-white"
                                  >
                                    <option value="GOOD">GOOD — Pristine / Ready</option>
                                    <option value="SCRATCHED">SCRATCHED — Minor Wear</option>
                                    <option value="DAMAGED">DAMAGED — Broken Casing</option>
                                    <option value="FAULTY">FAULTY — Non-functional</option>
                                  </Select>
                                </Field>

                                <Field>
                                  <FieldLabel className="text-gray-700 font-semibold">
                                    Verified Serial # / Asset Tag
                                  </FieldLabel>
                                  <Input
                                    type="text"
                                    placeholder="Confirm etched serial #..."
                                    value={observedSerialNumber}
                                    onChange={(e) => setObservedSerialNumber(e.target.value)}
                                    className="bg-white font-mono"
                                  />
                                </Field>

                                <Field>
                                  <FieldLabel className="text-gray-700 font-semibold">
                                    Inspection Verdict <span className="text-[#DC2626]">*</span>
                                  </FieldLabel>
                                  <Select
                                    value={result}
                                    onChange={(e) => setResult(e.target.value as VerificationResult)}
                                    className="bg-white"
                                  >
                                    <option value="VERIFIED">VERIFIED — Accept for Metrology</option>
                                    <option value="DISCREPANCY">DISCREPANCY — Mismatch / Damage</option>
                                    <option value="REJECTED">REJECTED — Cannot Calibrate</option>
                                  </Select>
                                </Field>
                              </div>

                              {result !== 'VERIFIED' && (
                                <Field>
                                  <FieldLabel className="text-gray-700 font-semibold">
                                    Discrepancy / Rejection Reason <span className="text-[#DC2626]">*</span>
                                  </FieldLabel>
                                  <Input
                                    placeholder="Specify details for client discrepancy report..."
                                    value={discrepancyReason}
                                    onChange={(e) => setDiscrepancyReason(e.target.value)}
                                    required
                                    className="bg-white"
                                  />
                                </Field>
                              )}

                              <Field>
                                <FieldLabel className="text-gray-700 font-semibold">
                                  Lab Inspector Notes &amp; Observations
                                </FieldLabel>
                                <Input
                                  placeholder="Notes on zero offset, probe condition, or accessories checked..."
                                  value={remarks}
                                  onChange={(e) => setRemarks(e.target.value)}
                                  className="bg-white"
                                />
                              </Field>

                              <div className="flex items-center justify-end gap-3 pt-2">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={closeItemVerification}
                                  className="cursor-pointer"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  variant="primary"
                                  size="sm"
                                  disabled={recordVerificationMutation.isPending}
                                  className="bg-[#0274BB] hover:bg-[#005a92] cursor-pointer"
                                >
                                  <CheckCircle2 className="size-4 mr-1" />
                                  {recordVerificationMutation.isPending
                                    ? 'Saving...'
                                    : 'Save & Confirm Verification'}
                                </Button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Client Inward Proof Documents & Photos */}
      <Card>
        <CardHeader className="bg-[#FAFAFA] border-b border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip className="size-4 text-[#0274BB]" />
              <CardTitle className="text-sm font-bold text-[#111827]">
                Client Proof &amp; Inward Attachments
              </CardTitle>
            </div>
            {request.attachments && request.attachments.length > 0 && (
              <span className="text-xs font-mono font-semibold bg-[#E6F2FF] text-[#0274BB] px-2 py-0.5 rounded-full">
                {request.attachments.length} Document(s)
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {request.attachments && request.attachments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {request.attachments.map((att) => {
                const isImage =
                  att.type.startsWith('image/') || att.name.match(/\.(png|jpg|jpeg|webp)$/i);
                return (
                  <div
                    key={att.id}
                    className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-2 text-xs hover:border-[#0274BB] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        {isImage ? (
                          <ImageIcon className="size-4 text-[#0274BB] shrink-0" />
                        ) : (
                          <FileText className="size-4 text-[#DC2626] shrink-0" />
                        )}
                        <span className="font-semibold text-[#1E293B] truncate" title={att.name}>
                          {att.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#64748B] shrink-0">
                        {formatBytes(att.size)}
                      </span>
                    </div>

                    {/* Image Thumbnail Preview */}
                    {isImage && att.base64Data && (
                      <div
                        onClick={() => setActiveProofModal(att)}
                        className="relative group cursor-pointer overflow-hidden rounded border border-[#CBD5E1] bg-black/5 aspect-video flex items-center justify-center"
                      >
                        <img
                          src={att.base64Data}
                          alt={att.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-semibold text-xs gap-1">
                          <Eye className="size-4" /> Click to Zoom
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      {att.base64Data ? (
                        <a
                          href={att.base64Data}
                          download={att.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0274BB] hover:underline"
                        >
                          <Download className="size-3" /> View / Download
                        </a>
                      ) : (
                        <span className="text-[10px] text-[#94A3B8]">Saved</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-[#94A3B8] text-xs bg-[#F8FAFC] rounded-md border border-dashed border-[#CBD5E1]">
              No proof documents attached during collection.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proof Zoom Modal */}
      {activeProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in">
          <div className="bg-white rounded-[4px] shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-[#E5E7EB] bg-[#F8FAFC]">
              <span className="text-xs font-bold text-[#1E293B] truncate">
                {activeProofModal.name}
              </span>
              <button
                type="button"
                onClick={() => setActiveProofModal(null)}
                className="text-[#64748B] hover:text-[#0F172A] p-1 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img
                src={activeProofModal.base64Data}
                alt={activeProofModal.name}
                className="max-h-[60vh] object-contain rounded border border-[#E2E8F0]"
              />
            </div>
            <div className="p-3 bg-[#F8FAFC] border-t border-[#E5E7EB] flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setActiveProofModal(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationPage;
