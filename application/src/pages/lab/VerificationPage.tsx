// application/src/pages/lab/VerificationPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCalibrationRequest, useRecordVerification } from '../../hooks/useOperations';
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
  Textarea,
  Field,
  FieldLabel,
  Badge,
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
  const navigate = useNavigate();
  const { tenantId, organizationId, user } = useAuthContext();
  const { data: request, isLoading } = useCalibrationRequest(requestId);
  const recordVerificationMutation = useRecordVerification();

  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
  const [verifiedQty, setVerifiedQty] = useState<number>(1);
  const [observedCondition, setObservedCondition] = useState<string>('GOOD');
  const [observedSerialNumber, setObservedSerialNumber] = useState<string>('');
  const [result, setResult] = useState<VerificationResult>('VERIFIED');
  const [discrepancyReason, setDiscrepancyReason] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [activeProofModal, setActiveProofModal] = useState<RequestAttachment | null>(null);

  const items = request?.request_items || [];
  const currentItem = items[selectedItemIndex];

  // Sync state whenever selected item changes
  useEffect(() => {
    if (currentItem) {
      setVerifiedQty(currentItem.received_quantity || currentItem.quantity || 1);
      setObservedCondition(currentItem.item_condition || 'GOOD');
      setObservedSerialNumber(currentItem.serial_number || '');
      setResult((currentItem.status === 'DISCREPANCY' ? 'DISCREPANCY' : 'VERIFIED') as VerificationResult);
      setDiscrepancyReason('');
      setRemarks(currentItem.remarks || '');
    }
  }, [currentItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(undefined);

    if (!tenantId || !organizationId || !requestId || !currentItem) {
      setErrorMessage('Missing required session context or request item.');
      return;
    }

    try {
      await recordVerificationMutation.mutateAsync({
        tenantId,
        organizationId,
        requestId,
        requestItemId: currentItem.id,
        verifiedQuantity: verifiedQty,
        expectedQuantity: currentItem.quantity,
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

      // If there are more items to verify, advance to next item
      if (selectedItemIndex < items.length - 1) {
        setSelectedItemIndex(selectedItemIndex + 1);
      } else {
        // Completed all items, redirect back to queue or let user proceed to calibration
        navigate('/lab/queue');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record verification.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-sm text-[#6B7280]">
        <div className="size-6 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading verification workspace...
      </div>
    );
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
  const isUrgent = request.priority === 'URGENT';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/lab/queue">
            <Button variant="secondary" size="sm" type="button">
              <ArrowLeft className="size-4" /> Back to Lab Queue
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

      {/* Item Tabs for Multi-Item Requests */}
      {items.length > 1 && (
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2 overflow-x-auto">
          <span className="text-xs font-bold text-[#6B7280] uppercase mr-2 shrink-0">
            Batch Items ({items.length}):
          </span>
          {items.map((it, idx) => {
            const isSelected = idx === selectedItemIndex;
            const isItemVerified = it.status === 'VERIFIED';
            const isItemDiscrepancy = it.status === 'DISCREPANCY';

            return (
              <button
                key={it.id}
                type="button"
                onClick={() => setSelectedItemIndex(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-[#0274BB] text-white border-[#0274BB]'
                    : 'bg-[#F5F7FA] text-[#374151] hover:bg-[#E5E7EB] border-[#E5E7EB]'
                }`}
              >
                <span>Item {idx + 1}: {it.item_masters?.item_name || 'Instrument'}</span>
                {isItemVerified && <Check className="size-3 text-[#16A34A] bg-white rounded-full p-0.5" />}
                {isItemDiscrepancy && <AlertTriangle className="size-3 text-[#DC2626] bg-white rounded-full p-0.5" />}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client Proof & Attached Files (Step 5) */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Paperclip className="size-4 text-[#0274BB]" /> Client Proof &amp; Attachments
              </CardTitle>
              <CardDescription>
                Cross-verify delivery challan &amp; client photos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {request.attachments && request.attachments.length > 0 ? (
                <div className="space-y-2">
                  {request.attachments.map((att) => {
                    const isImage = att.type.startsWith('image/') || att.name.match(/\.(png|jpg|jpeg|webp)$/i);
                    return (
                      <div
                        key={att.id}
                        className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            {isImage ? (
                              <ImageIcon className="size-4 text-[#0274BB] shrink-0" />
                            ) : (
                              <FileText className="size-4 text-[#DC2626] shrink-0" />
                            )}
                            <span className="font-semibold text-[#1E293B] truncate">{att.name}</span>
                          </div>
                          <span className="text-[10px] text-[#64748B] shrink-0">{formatBytes(att.size)}</span>
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
                              <Download className="size-3" /> View / Download Document
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
                <div className="p-6 text-center text-[#94A3B8] text-xs bg-[#F8FAFC] rounded-[4px] border border-dashed border-[#CBD5E1]">
                  No proof documents attached during collection.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Request Header Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Inward Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs divide-y divide-[#E5E7EB]">
              <div className="pt-1">
                <span className="text-[#6B7280] block">Request Number</span>
                <span className="font-mono font-bold text-[#0274BB] text-sm">
                  {request.request_number}
                </span>
              </div>
              <div className="pt-2">
                <span className="text-[#6B7280] block">Client Company</span>
                <span className="font-semibold text-[#111827] text-sm">
                  {request.clients?.client_name || 'N/A'}
                </span>
                {request.clients?.client_code && (
                  <span className="text-[#6B7280] font-mono block">{request.clients.client_code}</span>
                )}
              </div>
              {request.client_po_ref && (
                <div className="pt-2">
                  <span className="text-[#6B7280] block">Client PO / Gate Pass Ref</span>
                  <span className="font-mono font-semibold text-[#111827]">{request.client_po_ref}</span>
                </div>
              )}
              <div className="pt-2">
                <span className="text-[#6B7280] block">Collection Date</span>
                <span className="font-semibold text-[#111827]">
                  {new Date(request.collection_date).toLocaleDateString()}
                </span>
              </div>
              {request.remarks && (
                <div className="pt-2">
                  <span className="text-[#6B7280] block">Pickup Notes</span>
                  <span className="italic text-[#374151]">{request.remarks}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Physical Inward Inspection Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      Physical Verification — Unit {selectedItemIndex + 1} of {items.length}
                    </CardTitle>
                    <CardDescription>
                      Compare received instrument against client inward declaration
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      currentItem.status === 'VERIFIED'
                        ? 'success'
                        : currentItem.status === 'DISCREPANCY'
                        ? 'error'
                        : 'primary'
                    }
                  >
                    {currentItem.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Declared Context Card */}
                <div className="p-4 bg-[#F5F7FA] rounded-[4px] border border-[#E5E7EB] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[#6B7280] block">Instrument Declared</span>
                    <span className="font-bold text-[#111827] text-sm block">
                      {currentItem.item_masters?.item_name || 'Equipment'}
                    </span>
                    <span className="font-mono text-[#0274BB]">{currentItem.item_masters?.item_code}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block">Inward Serial # / Tag</span>
                    <span className="font-mono font-bold text-[#111827] text-xs">
                      {currentItem.serial_number || <span className="text-[#9CA3AF] italic">Not Recorded</span>}
                    </span>
                    {currentItem.accessories && (
                      <span className="text-[11px] text-[#4B5563] block mt-0.5 truncate">
                        Acc: {currentItem.accessories}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[#6B7280] block">Declared Inward Qty</span>
                    <span className="font-mono font-bold text-[#111827] text-sm">
                      {currentItem.quantity} unit(s)
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block">Inward Condition</span>
                    <Badge variant="secondary">{currentItem.item_condition}</Badge>
                  </div>
                </div>

                {/* Verification Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field>
                    <FieldLabel>
                      Verified Physical Count Received <span className="text-[#DC2626]">*</span>
                    </FieldLabel>
                    <Input
                      type="number"
                      min={0}
                      value={verifiedQty}
                      onChange={(e) => setVerifiedQty(parseInt(e.target.value, 10) || 0)}
                      required
                    />
                    {verifiedQty !== currentItem.quantity && (
                      <p className="mt-1 text-xs text-[#DC2626] font-medium flex items-center gap-1">
                        <AlertTriangle className="size-3" /> Quantity discrepancy detected!
                      </p>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel>
                      Observed Physical Condition <span className="text-[#DC2626]">*</span>
                    </FieldLabel>
                    <Select
                      value={observedCondition}
                      onChange={(e) => setObservedCondition(e.target.value)}
                    >
                      <option value="GOOD">GOOD — Pristine / Ready for Metrology Bench</option>
                      <option value="SCRATCHED">SCRATCHED — Minor Cosmetic Surface Wear</option>
                      <option value="DAMAGED">DAMAGED — Broken casing, damaged dials, or loose probe</option>
                      <option value="FAULTY">FAULTY — Non-functional, fails zero-check</option>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field>
                    <FieldLabel>Verified Serial # / Physical Etched Asset Tag</FieldLabel>
                    <Input
                      type="text"
                      placeholder="Confirm etched serial number on instrument casing..."
                      value={observedSerialNumber}
                      onChange={(e) => setObservedSerialNumber(e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>
                      Inspection Verdict / Result <span className="text-[#DC2626]">*</span>
                    </FieldLabel>
                    <Select
                      value={result}
                      onChange={(e) => setResult(e.target.value as VerificationResult)}
                    >
                      <option value="VERIFIED">VERIFIED — Accepted for Metrology Bench (Step 8)</option>
                      <option value="DISCREPANCY">DISCREPANCY — Quantity / Serial / Damage Mismatch</option>
                      <option value="REJECTED">REJECTED — Item Cannot Be Calibrated (Faulty / Unsafe)</option>
                    </Select>
                  </Field>
                </div>

                {result !== 'VERIFIED' && (
                  <Field>
                    <FieldLabel>
                      Discrepancy / Rejection Reason <span className="text-[#DC2626]">*</span>
                    </FieldLabel>
                    <Input
                      placeholder="Specify discrepancy details for customer notification..."
                      value={discrepancyReason}
                      onChange={(e) => setDiscrepancyReason(e.target.value)}
                      required
                    />
                  </Field>
                )}

                <Field>
                  <FieldLabel>Lab Inspector Notes &amp; Observations</FieldLabel>
                  <Textarea
                    placeholder="Notes on probe integrity, zero offset observation, accessories verified..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                  />
                </Field>
              </CardContent>
              <CardFooter className="flex items-center justify-between p-6 bg-[#F9FAFB] border-t border-[#E5E7EB]">
                <span className="text-xs text-[#6B7280]">
                  {selectedItemIndex < items.length - 1
                    ? `Item ${selectedItemIndex + 1} of ${items.length}. Submitting will advance to next item.`
                    : 'Final item in batch. Submitting completes request verification.'}
                </span>
                <div className="flex gap-3">
                  <Link to="/lab/queue">
                    <Button variant="secondary" type="button">
                      Back to Queue
                    </Button>
                  </Link>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={recordVerificationMutation.isPending}
                  >
                    <CheckCircle2 className="size-4" />
                    {recordVerificationMutation.isPending
                      ? 'Saving...'
                      : selectedItemIndex < items.length - 1
                      ? 'Verify & Next Item'
                      : 'Confirm & Complete Verification'}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>

      {/* Proof Zoom Modal */}
      {activeProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in">
          <div className="bg-white rounded-[4px] shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-[#E5E7EB] bg-[#F8FAFC]">
              <span className="text-xs font-bold text-[#1E293B] truncate">{activeProofModal.name}</span>
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
