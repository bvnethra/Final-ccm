// application/src/pages/logistics/DispatchListPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useDispatches,
  useCalibrationRequests,
  useUpdateDispatchStatus,
  useRecordDelivery,
  useDeliveries,
  useApproveDispatch,
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
import {
  Plus,
  Truck,
  AlertCircle,
  UserCheck,
  Package,
  Receipt,
  FileText,
  Clock,
  ArrowRight,
  Eye,
  Printer,
  X,
  PenTool,
  CheckCircle2,
  Check,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { useVendorReminders } from '../../hooks/useVendorReminders';
import { SignaturePad } from '../../components/ui/SignaturePad';
import type { Dispatch, Delivery } from '../../types/domain';

export const DispatchListPage: React.FC = () => {
  const { tenantId, organizationId, user, isSuperAdmin, canPerform } = useAuthContext();
  const { data: dispatches = [], isLoading, error } = useDispatches();
  const { data: requests = [] } = useCalibrationRequests();
  const { data: deliveries = [] } = useDeliveries();
  const { reminders, count: vendorRemindersCount } = useVendorReminders();

  const updateStatusMutation = useUpdateDispatchStatus();
  const recordDeliveryMutation = useRecordDelivery();
  const approveDispatchMutation = useApproveDispatch();

  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);
  const [deliveryModalDispatch, setDeliveryModalDispatch] = useState<Dispatch | null>(null);
  const [selectedPODDelivery, setSelectedPODDelivery] = useState<{ dispatch: Dispatch; delivery?: Delivery } | null>(null);

  // DC Approval state
  const [approvalModalDispatch, setApprovalModalDispatch] = useState<Dispatch | null>(null);
  const [approverNotes, setApproverNotes] = useState<string>('');

  // Delivery form state
  const [receiverName, setReceiverName] = useState<string>('');
  const [receiverPhone, setReceiverPhone] = useState<string>('');
  const [deliverySignature, setDeliverySignature] = useState<string | undefined>();
  const [deliveryRemarks, setDeliveryRemarks] = useState<string>(
    'Received all calibrated instruments and tax invoice in satisfactory condition with seals intact.'
  );
  const [successToast, setSuccessToast] = useState<string | undefined>();
  const [deliveryError, setDeliveryError] = useState<string | undefined>();

  const handleApproveDispatch = async (approved: boolean) => {
    if (!approvalModalDispatch || !tenantId) return;
    try {
      await approveDispatchMutation.mutateAsync({
        tenantId,
        organizationId: organizationId || '',
        dispatchId: approvalModalDispatch.id,
        approved,
        actorUserId: user?.id,
        actorName: user?.fullName || user?.email || 'Logistics Incharge',
        approverNotes,
      });
      setApprovalModalDispatch(null);
      setSuccessToast(`Delivery Challan ${approvalModalDispatch.gate_pass_number} ${approved ? 'Approved' : 'Rejected'} successfully!`);
    } catch (err: any) {
      setDeliveryError(err.message || 'Failed to update DC approval.');
    }
  };

  const getRequestInfo = (requestId: string) => {
    return requests.find((r) => r.id === requestId);
  };

  const getDeliveryInfo = (dispatchId: string) => {
    return deliveries.find((d) => d.dispatch_id === dispatchId);
  };

  const handleOpenDeliveryModal = (dispatch: Dispatch) => {
    setDeliveryModalDispatch(dispatch);
    setDeliveryError(undefined);
    setReceiverName(dispatch.recipient_name || '');
    setReceiverPhone(dispatch.recipient_phone || '');
    // Pre-populate client signature if already drawn during collection agent handover
    setDeliverySignature(dispatch.client_signature || undefined);
    setDeliveryRemarks(
      'Received all calibrated instruments and tax invoice in satisfactory condition with seals intact.'
    );
  };

  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryModalDispatch || !tenantId) return;

    if (!receiverName.trim()) {
      setDeliveryError('Please enter the client receiver name.');
      return;
    }

    if (!deliverySignature) {
      setDeliveryError('Client digital signature is required for delivery receipt confirmation.');
      return;
    }

    try {
      await recordDeliveryMutation.mutateAsync({
        tenantId,
        organizationId: organizationId || '',
        dispatchId: deliveryModalDispatch.id,
        receivedBy: receiverName.trim(),
        recipientPhone: receiverPhone.trim() || undefined,
        signature: deliverySignature,
        remarks: deliveryRemarks.trim(),
      });

      const req = getRequestInfo(deliveryModalDispatch.request_id);
      setDeliveryModalDispatch(null);
      setSuccessToast(
        `Delivery confirmed! Gate Pass ${deliveryModalDispatch.gate_pass_number} is DELIVERED and Work Order ${req?.request_number || ''} status transitioned to COMPLETED.`
      );
    } catch (err: any) {
      setDeliveryError(err.message || 'Failed to record delivery.');
    }
  };

  const handleAdvanceToInTransit = async (dispatchId: string) => {
    if (!tenantId) return;
    try {
      await updateStatusMutation.mutateAsync({
        dispatchId,
        status: 'IN_TRANSIT',
      });
      setSuccessToast('Consignment tracking status updated: IN TRANSIT.');
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-[4px] flex items-center justify-between animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-600" />
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

      {/* 5-Day Vendor Collection Alert Banner */}
      {vendorRemindersCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-200/70 text-amber-900 rounded-md shrink-0 mt-0.5">
              <Clock className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-amber-900">
                  Collection Agent Reminder: {vendorRemindersCount} Vendor Outsource Return(s) Due
                </span>
                <Badge variant="warning" pill>
                  $\le$ 5 Days Alert
                </Badge>
              </div>
              <p className="text-xs text-amber-800 mt-1">
                Outsource instruments sent to third-party calibration vendors are due within 5 days (or overdue). Collect these instruments to complete calibration and raise commercial invoices.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <Link to={`/requests/${reminders[0].requestId}`}>
              <Button variant="primary" size="sm" className="bg-amber-800 hover:bg-amber-900 text-white text-xs">
                View Due Items ({reminders[0].poNumber}) <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Gate Pass Dispatch &amp; Tracking</h1>
          <p className="text-sm text-[#6B7280]">
            Track dispatches, record client delivery digital signatures, and transition work orders to COMPLETED
          </p>
        </div>

        <Link to="/logistics/dispatch/new">
          <Button variant="primary">
            <Plus className="size-4" /> Issue Gate Pass
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logistics Dispatches &amp; Delivery Tracking ({dispatches.length})</CardTitle>
          <CardDescription>
            Outward dispatches with live tracking, client delivery digital receipts, and completed work order lifecycle
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-[#6B7280]">
              <div className="size-6 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading dispatches...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-[#DC2626]">
              <AlertCircle className="size-6 mx-auto mb-2" />
              {(error as Error).message}
            </div>
          ) : dispatches.length === 0 ? (
            <div className="p-12 text-center text-[#6B7280] space-y-3">
              <Truck className="size-8 mx-auto text-[#9CA3AF]" />
              <p className="text-base font-semibold text-[#374151]">No gate passes issued</p>
              <p className="text-xs text-[#6B7280]">
                Issue a gate pass to dispatch calibrated equipment or commercial invoices to clients.
              </p>
              <Link to="/logistics/dispatch/new">
                <Button variant="secondary" size="sm" className="mt-2">
                  <Plus className="size-4" /> Generate Gate Pass
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F5F7FA] border-b border-[#E5E7EB] text-[#374151] font-semibold text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3">Gate Pass / Order #</th>
                    <th className="px-5 py-3">Dispatch Mode</th>
                    <th className="px-5 py-3">Package Content</th>
                    <th className="px-5 py-3">Logistics / Agent</th>
                    <th className="px-5 py-3">Recipient &amp; Client</th>
                    <th className="px-5 py-3">DC Approval</th>
                    <th className="px-5 py-3">Client Digital Signature</th>
                    <th className="px-5 py-3">Tracking Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {dispatches.map((d) => {
                    const req = getRequestInfo(d.request_id);
                    const delivery = getDeliveryInfo(d.id);
                    const isCollectionAgent = d.dispatch_type === 'COLLECTION_AGENT' || (!d.dispatch_type && !d.courier_partner);
                    const isInvoiceOnly = d.package_type === 'INVOICE_ONLY';
                    const hasSignature = Boolean(d.client_signature || delivery?.signature_data_url);

                    return (
                      <tr key={d.id} className="hover:bg-[#FAFAFA] transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-mono font-bold text-[#0274BB] block">
                            {d.gate_pass_number}
                          </span>
                          <span className="text-[11px] text-[#6B7280] block">
                            WO: {req?.request_number || 'N/A'}
                          </span>
                          <span className="text-[10px] text-[#9CA3AF]">
                            {new Date(d.dispatch_date).toLocaleDateString()}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {isCollectionAgent ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <UserCheck className="size-3.5" /> Collection Agent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              <Truck className="size-3.5" /> Courier
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {isInvoiceOnly ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200">
                              <Receipt className="size-3.5" /> Invoice Alone
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Package className="size-3.5" /> Items + Invoice
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {isCollectionAgent ? (
                            <div>
                              <span className="font-medium text-slate-900 block text-xs">
                                {d.collection_agent_name || d.dispatched_by || 'Field Agent'}
                              </span>
                              {d.collection_agent_phone && (
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {d.collection_agent_phone}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span className="font-medium text-slate-900 block text-xs">
                                {d.courier_partner || 'Courier Partner'}
                              </span>
                              <span className="text-[11px] text-[#0274BB] font-mono block">
                                AWB: {d.tracking_number || 'No AWB'}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-medium text-slate-800 block text-xs">
                            {d.recipient_name}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {req?.clients?.client_name || 'Client Site'}
                          </span>
                          {d.recipient_phone && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {d.recipient_phone}
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {d.approval_status === 'APPROVED' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="size-3 text-emerald-600" /> DC Approved
                            </span>
                          ) : d.approval_status === 'REJECTED' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                              <X className="size-3 text-red-600" /> DC Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <Clock className="size-3 text-amber-600" /> Pending Approval
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {hasSignature ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="size-3 text-emerald-600" /> Digitally Signed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <Clock className="size-3 text-amber-600" /> Sign on Delivery
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <Badge
                              variant={
                                d.status === 'DELIVERED'
                                  ? 'success'
                                  : d.status === 'IN_TRANSIT'
                                  ? 'warning'
                                  : 'primary'
                              }
                            >
                              {d.status === 'DELIVERED' ? 'DELIVERED & COMPLETED' : d.status}
                            </Badge>
                            {d.status === 'DELIVERED' && (
                              <span className="text-[10px] text-emerald-700 block font-semibold">
                                ✓ Work Order Completed
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {(isSuperAdmin || canPerform('CREATE_REQUEST', 'APPROVE')) && d.approval_status !== 'APPROVED' && (
                              <Button
                                variant="outlineInk"
                                size="sm"
                                onClick={() => {
                                  setApprovalModalDispatch(d);
                                  setApproverNotes('');
                                }}
                                className="text-xs h-7 px-2 border-emerald-400 text-emerald-700 hover:bg-emerald-50"
                              >
                                <ShieldCheck className="size-3" /> Approve DC
                              </Button>
                            )}

                            {d.status === 'DISPATCHED' && (
                              <Button
                                variant="outlineInk"
                                size="sm"
                                onClick={() => handleAdvanceToInTransit(d.id)}
                                title="Advance tracking to In Transit"
                                className="text-xs h-7 px-2"
                              >
                                <Send className="size-3" /> In Transit
                              </Button>
                            )}

                            {d.status !== 'DELIVERED' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleOpenDeliveryModal(d)}
                                className="text-xs h-7 px-2 bg-emerald-700 hover:bg-emerald-800"
                              >
                                <PenTool className="size-3" /> Record Delivery
                              </Button>
                            )}

                            {d.status === 'DELIVERED' && (
                              <Button
                                variant="outlineInk"
                                size="sm"
                                onClick={() => setSelectedPODDelivery({ dispatch: d, delivery })}
                                className="text-xs h-7 px-2 text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                              >
                                <ShieldCheck className="size-3 text-emerald-600" /> Proof of Delivery
                              </Button>
                            )}

                            <Button
                              variant="outlineInk"
                              size="sm"
                              onClick={() => setSelectedDispatch(d)}
                              className="text-xs h-7 px-2"
                            >
                              <Eye className="size-3" /> Gate Pass
                            </Button>
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

      {/* ==================================================================== */}
      {/* 1. Client Receipt & Delivery Signature Modal */}
      {/* ==================================================================== */}
      {deliveryModalDispatch && (
        <DialogOverlay onClick={() => setDeliveryModalDispatch(null)}>
          <DialogContent size="2xl" onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  <div>
                    <DialogTitle>Record Client Receipt &amp; Digital POD</DialogTitle>
                    <DialogDescription>
                      Capture client digital signature and complete order fulfillment
                    </DialogDescription>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeliveryModalDispatch(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="size-5" />
                </button>
              </div>
            </DialogHeader>

            <form onSubmit={handleConfirmDelivery} className="space-y-4">
              <DialogBody className="space-y-4">
                {deliveryError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded text-xs flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{deliveryError}</span>
                  </div>
                )}

                {/* Order Info Banner */}
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block font-semibold">GATE PASS #</span>
                    <span className="font-mono font-bold text-[#0274BB] text-sm">
                      {deliveryModalDispatch.gate_pass_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">PACKAGE TYPE</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {deliveryModalDispatch.package_type === 'INVOICE_ONLY'
                        ? 'Invoice Alone'
                        : 'Equipment Items + Tax Invoice'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>Client Receiver Name</FieldLabel>
                    <Input
                      placeholder="Full name of receiver"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Receiver Contact Phone</FieldLabel>
                    <Input
                      placeholder="+91 98765 43210"
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                    />
                  </Field>
                </div>

                {/* Digital Signature Pad */}
                <div className="border border-slate-200 rounded-md p-3 bg-slate-50/50">
                  <SignaturePad
                    value={deliverySignature}
                    onChange={(dataUrl) => setDeliverySignature(dataUrl)}
                    clientName={receiverName || deliveryModalDispatch.recipient_name}
                  />
                </div>

                <Field>
                  <FieldLabel>Delivery Condition / Handover Remarks</FieldLabel>
                  <Input
                    value={deliveryRemarks}
                    onChange={(e) => setDeliveryRemarks(e.target.value)}
                    placeholder="E.g. Package received with tamper-evident calibration seals intact."
                  />
                </Field>

                {/* Completion Notice */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Lifecycle Completion Trigger:</strong> Submitting this delivery receipt will mark Gate Pass as <strong>DELIVERED</strong> and permanently transition Calibration Work Order status to <strong>COMPLETED</strong>.
                  </span>
                </div>
              </DialogBody>

              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setDeliveryModalDispatch(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={recordDeliveryMutation.isPending}
                  className="bg-emerald-700 hover:bg-emerald-800"
                >
                  <Check className="size-4" />
                  {recordDeliveryMutation.isPending ? 'Completing Order...' : 'Confirm Delivery & Complete Order'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </DialogOverlay>
      )}

      {/* ==================================================================== */}
      {/* 2. Official Proof of Delivery (POD) & Receipt Modal */}
      {/* ==================================================================== */}
      {selectedPODDelivery && (
        <DialogOverlay onClick={() => setSelectedPODDelivery(null)}>
          <DialogContent size="2xl" onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-emerald-600" />
                  <div>
                    <DialogTitle>Proof of Delivery &amp; Client Receipt (POD)</DialogTitle>
                    <DialogDescription>
                      Official Handover &amp; Delivery Acknowledgment with Digital Signature
                    </DialogDescription>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPODDelivery(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="size-5" />
                </button>
              </div>
            </DialogHeader>

            <DialogBody className="space-y-4">
              <div className="border border-slate-300 rounded-lg p-5 space-y-4 bg-slate-50/50 text-xs">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="font-black text-base text-[#0274BB] uppercase tracking-wider">
                      NETHRA METROLOGY LABS
                    </h3>
                    <p className="text-[11px] text-slate-500">Accredited Calibration Facility • ISO/IEC 17025</p>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                      ✓ Official Handover &amp; Delivery Acknowledgment
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 block text-sm">
                      {selectedPODDelivery.dispatch.gate_pass_number}
                    </span>
                    <Badge variant="success" pill>
                      ORDER COMPLETED
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                      Delivery Timestamp
                    </span>
                    <span className="font-semibold text-slate-800">
                      {new Date(
                        selectedPODDelivery.delivery?.delivered_at || selectedPODDelivery.dispatch.dispatch_date
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                      Received By (Client Authorized)
                    </span>
                    <span className="font-semibold text-slate-800">
                      {selectedPODDelivery.delivery?.received_by || selectedPODDelivery.dispatch.recipient_name}
                    </span>
                    {selectedPODDelivery.dispatch.recipient_phone && (
                      <span className="text-[11px] text-slate-500 block">
                        {selectedPODDelivery.dispatch.recipient_phone}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                    Handover Remarks
                  </span>
                  <p className="text-slate-700 italic bg-white p-2 rounded border border-slate-200 mt-1">
                    "{selectedPODDelivery.delivery?.remarks || 'Received in satisfactory condition with seals intact.'}"
                  </p>
                </div>

                {/* Client Digital Signature Display */}
                <div className="border-t border-slate-200 pt-3">
                  <span className="text-slate-500 block uppercase font-semibold text-[10px] mb-2 flex items-center gap-1.5">
                    <PenTool className="size-3 text-emerald-600" /> Client Handover Digital Signature
                  </span>

                  {selectedPODDelivery.dispatch.client_signature || selectedPODDelivery.delivery?.signature_data_url ? (
                    <div className="p-3 bg-white border border-slate-200 rounded-md flex items-center justify-between">
                      <div>
                        <img
                          src={
                            selectedPODDelivery.delivery?.signature_data_url ||
                            selectedPODDelivery.dispatch.client_signature
                          }
                          alt="Client Handover Signature"
                          className="h-14 max-w-[200px] object-contain"
                        />
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Digitally verified by{' '}
                          {selectedPODDelivery.delivery?.received_by || selectedPODDelivery.dispatch.recipient_name}
                        </span>
                      </div>
                      <div className="text-right text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-semibold">
                        <CheckCircle2 className="size-4 inline mr-1 text-emerald-600" />
                        Client Verified
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-white border border-dashed border-slate-300 rounded-md text-xs text-slate-400 text-center">
                      Signed on physical paper delivery challan.
                    </div>
                  )}
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                variant="outlineInk"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-1.5"
              >
                <Printer className="size-4" /> Print POD Receipt
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedPODDelivery(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogOverlay>
      )}

      {/* ==================================================================== */}
      {/* 3. Gate Pass Print / Preview Modal */}
      {/* ==================================================================== */}
      {selectedDispatch && (
        <DialogOverlay onClick={() => setSelectedDispatch(null)}>
          <DialogContent size="3xl" onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <FileText className="size-5 text-[#0274BB]" />
                  <div>
                    <DialogTitle>Official Outward Gate Pass</DialogTitle>
                    <DialogDescription>
                      Authorized Dispatch Authorization &amp; Material Movement Pass
                    </DialogDescription>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDispatch(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="size-5" />
                </button>
              </div>
            </DialogHeader>

            <DialogBody className="space-y-4">
              {/* Printable Pass Body */}
              <div className="border border-slate-300 rounded-lg p-5 space-y-4 bg-slate-50/50">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="font-black text-lg text-[#0274BB] uppercase tracking-wider">
                      NETHRA METROLOGY LABS
                    </h3>
                    <p className="text-xs text-slate-500">ISO/IEC 17025 Accredited Calibration Facility</p>
                    <p className="text-[11px] text-slate-400">Outward Material Dispatch Authorization</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-base font-bold text-slate-900 block">
                      {selectedDispatch.gate_pass_number}
                    </span>
                    <span className="text-xs text-slate-500">
                      Date: {new Date(selectedDispatch.dispatch_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Tracking Progress Timeline */}
                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                    Dispatch &amp; Delivery Tracking Stage
                  </span>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      <span>Dispatched</span>
                    </div>
                    <div className="h-0.5 w-12 bg-emerald-500" />
                    <div
                      className={`flex items-center gap-1.5 font-semibold ${
                        selectedDispatch.status === 'IN_TRANSIT' || selectedDispatch.status === 'DELIVERED'
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                      }`}
                    >
                      <Send className="size-4" />
                      <span>In Transit</span>
                    </div>
                    <div
                      className={`h-0.5 w-12 ${
                        selectedDispatch.status === 'DELIVERED' ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                    <div
                      className={`flex items-center gap-1.5 font-semibold ${
                        selectedDispatch.status === 'DELIVERED' ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      <CheckCircle2 className="size-4" />
                      <span>Delivered &amp; Completed</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block uppercase font-semibold text-[10px]">
                      Dispatch Mode
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {selectedDispatch.dispatch_type === 'COLLECTION_AGENT' || !selectedDispatch.courier_partner
                        ? 'Collection Agent Direct Delivery'
                        : `Courier: ${selectedDispatch.courier_partner}`}
                    </span>
                    {selectedDispatch.tracking_number && (
                      <span className="block font-mono text-slate-600 mt-0.5">
                        AWB #{selectedDispatch.tracking_number}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 block uppercase font-semibold text-[10px]">
                      Package Classification
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {selectedDispatch.package_type === 'INVOICE_ONLY'
                        ? 'Invoice Alone (Commercial Billing Document)'
                        : 'Item + Invoice (Equipment with Official Tax Invoice)'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs border-t border-slate-200 pt-3">
                  <div>
                    <span className="text-slate-400 block uppercase font-semibold text-[10px]">
                      Dispatched / Delivered By
                    </span>
                    <span className="font-semibold text-slate-800">
                      {selectedDispatch.collection_agent_name || selectedDispatch.dispatched_by || 'Authorized Field Personnel'}
                    </span>
                    {selectedDispatch.collection_agent_phone && (
                      <span className="block text-slate-500">{selectedDispatch.collection_agent_phone}</span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 block uppercase font-semibold text-[10px]">
                      Receiver / Client Details
                    </span>
                    <span className="font-semibold text-slate-800">{selectedDispatch.recipient_name}</span>
                    {selectedDispatch.recipient_phone && (
                      <span className="block text-slate-500">{selectedDispatch.recipient_phone}</span>
                    )}
                  </div>
                </div>

                {/* Client Digital Signature Display */}
                <div className="border-t border-slate-200 pt-3">
                  <span className="text-slate-500 block uppercase font-semibold text-[10px] mb-2 flex items-center gap-1.5">
                    <PenTool className="size-3 text-[#0274BB]" /> Client Handover Acknowledgment &amp; Digital Signature
                  </span>

                  {selectedDispatch.client_signature ? (
                    <div className="p-3 bg-white border border-slate-200 rounded-md flex items-center justify-between">
                      <div>
                        <img
                          src={selectedDispatch.client_signature}
                          alt="Client Digital Signature"
                          className="h-14 max-w-[200px] object-contain"
                        />
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Digitally verified by {selectedDispatch.recipient_name} on{' '}
                          {new Date(selectedDispatch.dispatch_date).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                        <CheckCircle2 className="size-4 inline mr-1 text-emerald-600" />
                        Client Acknowledged
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-white border border-dashed border-slate-300 rounded-md text-xs text-slate-400 text-center">
                      {selectedDispatch.dispatch_type === 'COURIER'
                        ? 'Consignment dispatched via courier service (Signed on delivery slip).'
                        : 'No digital signature recorded on this dispatch.'}
                    </div>
                  )}
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                variant="outlineInk"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-1.5"
              >
                <Printer className="size-4" /> Print Gate Pass
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedDispatch(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogOverlay>
      )}

      {/* Formal Delivery Challan (DC) Approval Modal */}
      {approvalModalDispatch && (
        <DialogOverlay onClick={() => setApprovalModalDispatch(null)}>
          <DialogContent size="xl" onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-[#0274BB]" />
                  <div>
                    <DialogTitle>Review &amp; Approve Delivery Challan</DialogTitle>
                    <DialogDescription className="font-mono">
                      Gate Pass #{approvalModalDispatch.gate_pass_number}
                    </DialogDescription>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setApprovalModalDispatch(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded"
                >
                  <X className="size-4" />
                </button>
              </div>
            </DialogHeader>

            <DialogBody className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500 block">Dispatch Mode:</span>
                  <span className="font-bold text-gray-900 text-sm">{approvalModalDispatch.dispatch_type || 'Collection Agent'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Package Type:</span>
                  <span className="font-bold text-gray-900 text-sm">{approvalModalDispatch.package_type || 'Items & Invoice'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Recipient:</span>
                  <span className="font-semibold text-gray-900">{approvalModalDispatch.recipient_name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Dispatch Date:</span>
                  <span className="font-mono text-gray-900">{new Date(approvalModalDispatch.dispatch_date).toLocaleDateString()}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1 text-xs">DC Approver Clearance Remarks</label>
                <textarea
                  rows={3}
                  value={approverNotes}
                  onChange={(e) => setApproverNotes(e.target.value)}
                  placeholder="Enter gate pass clearance remarks or outward authorization notes..."
                  className="w-full text-xs border border-gray-300 rounded p-2.5 focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setApprovalModalDispatch(null)}
              >
                Cancel
              </Button>
              <Button
                variant="outlineInk"
                size="sm"
                onClick={() => handleApproveDispatch(false)}
                disabled={approveDispatchMutation.isPending}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Reject DC
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleApproveDispatch(true)}
                disabled={approveDispatchMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="size-3.5" /> Approve &amp; Release Gate Pass
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogOverlay>
      )}
    </div>
  );
};

export default DispatchListPage;
