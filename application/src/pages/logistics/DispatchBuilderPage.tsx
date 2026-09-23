// application/src/pages/logistics/DispatchBuilderPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCalibrationRequests, useCreateDispatch, useInvoices } from '../../hooks/useOperations';
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
import {
  ArrowLeft,
  CheckCircle2,
  Truck,
  UserCheck,
  Package,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import { SignaturePad } from '../../components/ui/SignaturePad';
import type { DispatchType, DispatchPackageType } from '../../types/domain';

export const DispatchBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenantId, organizationId, user } = useAuthContext();
  const { data: requests = [] } = useCalibrationRequests();
  const { data: invoices = [] } = useInvoices();
  const createDispatchMutation = useCreateDispatch();

  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [dispatchType, setDispatchType] = useState<DispatchType>('COLLECTION_AGENT');
  const [packageType, setPackageType] = useState<DispatchPackageType>('ITEMS_AND_INVOICE');

  // Courier state
  const [courierPartner, setCourierPartner] = useState<string>('Blue Dart Express');
  const [trackingNumber, setTrackingNumber] = useState<string>('');

  // Collection Agent state
  const [collectionAgentName, setCollectionAgentName] = useState<string>(
    user?.fullName || user?.email || 'Collection Agent'
  );
  const [collectionAgentPhone, setCollectionAgentPhone] = useState<string>('+91 98765 43210');
  const [clientSignature, setClientSignature] = useState<string | undefined>();

  // Recipient info
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  // Find selected request
  const selectedRequest = requests.find((r) => r.id === selectedRequestId);

  // Auto-fill recipient from client master if available
  useEffect(() => {
    if (selectedRequest?.clients) {
      setRecipientName(selectedRequest.clients.contact_person || selectedRequest.clients.client_name || '');
      setRecipientPhone(selectedRequest.clients.phone || '');
    }
  }, [selectedRequest]);

  // Find linked invoice for this request
  const matchingInvoice = invoices.find((inv) => inv.request_id === selectedRequestId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(undefined);

    if (!tenantId || !organizationId || !selectedRequestId) {
      setErrorMessage('Please select a calibration request to dispatch.');
      return;
    }

    if (!recipientName.trim()) {
      setErrorMessage('Please provide the client recipient name.');
      return;
    }

    if (dispatchType === 'COLLECTION_AGENT' && !clientSignature) {
      setErrorMessage('Client digital signature is required when dispatching via Collection Agent.');
      return;
    }

    if (dispatchType === 'COURIER' && !trackingNumber.trim()) {
      setErrorMessage('Please enter the Consignment Tracking / AWB number for courier dispatch.');
      return;
    }

    try {
      await createDispatchMutation.mutateAsync({
        tenantId,
        organizationId,
        requestId: selectedRequestId,
        dispatchType,
        packageType,
        courierPartner: dispatchType === 'COURIER' ? courierPartner : undefined,
        trackingNumber: dispatchType === 'COURIER' ? trackingNumber.trim() : undefined,
        collectionAgentName: dispatchType === 'COLLECTION_AGENT' ? collectionAgentName.trim() : undefined,
        collectionAgentPhone: dispatchType === 'COLLECTION_AGENT' ? collectionAgentPhone.trim() : undefined,
        clientSignature: dispatchType === 'COLLECTION_AGENT' ? clientSignature : undefined,
        invoiceId: matchingInvoice?.id,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim() || undefined,
      });

      navigate('/logistics/dispatches');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to issue gate pass dispatch.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Link to="/logistics/dispatches">
          <Button variant="outlineInk" size="sm">
            <ArrowLeft className="size-4" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Issue Gate Pass &amp; Dispatch</h1>
          <p className="text-sm text-[#6B7280]">
            Generate official outward gate pass with digital client signature or courier tracking
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-[#fef2f2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px] text-sm flex items-center gap-2">
          <AlertCircle className="size-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Select Work Order &amp; Package Contents</CardTitle>
            <CardDescription>
              Select the calibration request and specify whether dispatching items + invoice or invoice alone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Field>
              <FieldLabel>Select Calibration Work Order</FieldLabel>
              <Select
                value={selectedRequestId}
                onChange={(e) => setSelectedRequestId(e.target.value)}
                required
              >
                <option value="">-- Choose Calibrated Work Order --</option>
                {requests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.request_number} — {r.clients?.client_name || 'Client'} ({r.status})
                  </option>
                ))}
              </Select>
            </Field>

            {/* Linked Invoice Detection */}
            {selectedRequestId && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="size-4 text-[#0274BB]" />
                  <span>
                    Linked Commercial Tax Invoice:{' '}
                    {matchingInvoice ? (
                      <span className="font-mono font-bold text-slate-900">
                        {matchingInvoice.invoice_number} (₹{matchingInvoice.total_amount.toLocaleString()})
                      </span>
                    ) : (
                      <span className="text-amber-700 italic">No invoice generated yet for this work order</span>
                    )}
                  </span>
                </div>
                {matchingInvoice && (
                  <Badge variant="success" pill>
                    {matchingInvoice.invoice_type} INVOICE
                  </Badge>
                )}
              </div>
            )}

            {/* Package Type Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] uppercase mb-2">
                Package Content to Dispatch
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setPackageType('ITEMS_AND_INVOICE')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all flex items-start gap-3 ${
                    packageType === 'ITEMS_AND_INVOICE'
                      ? 'border-[#0274BB] bg-[#E6F2FF]/40 ring-1 ring-[#0274BB]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`p-2 rounded-md ${
                      packageType === 'ITEMS_AND_INVOICE'
                        ? 'bg-[#0274BB] text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Package className="size-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">Item + Invoice</div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Dispatch calibrated physical equipment accompanied by the official printed tax invoice.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setPackageType('INVOICE_ONLY')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all flex items-start gap-3 ${
                    packageType === 'INVOICE_ONLY'
                      ? 'border-[#0274BB] bg-[#E6F2FF]/40 ring-1 ring-[#0274BB]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`p-2 rounded-md ${
                      packageType === 'INVOICE_ONLY'
                        ? 'bg-[#0274BB] text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Receipt className="size-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">Invoice Alone</div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Dispatch official tax invoice copy alone (e.g. instruments previously collected or billing delivery).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dispatch Method Card */}
        <Card>
          <CardHeader>
            <CardTitle>2. Dispatch Method &amp; Digital Handover</CardTitle>
            <CardDescription>
              Select logistics courier delivery or direct collection agent delivery with client digital signature
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Dispatch Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] uppercase mb-2">
                Dispatch Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setDispatchType('COLLECTION_AGENT')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all flex items-start gap-3 ${
                    dispatchType === 'COLLECTION_AGENT'
                      ? 'border-[#0274BB] bg-[#E6F2FF]/40 ring-1 ring-[#0274BB]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`p-2 rounded-md ${
                      dispatchType === 'COLLECTION_AGENT'
                        ? 'bg-[#0274BB] text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <UserCheck className="size-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">Collection Agent</div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Direct handover by field collection agent with real-time digital signature from client.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setDispatchType('COURIER')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all flex items-start gap-3 ${
                    dispatchType === 'COURIER'
                      ? 'border-[#0274BB] bg-[#E6F2FF]/40 ring-1 ring-[#0274BB]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`p-2 rounded-md ${
                      dispatchType === 'COURIER'
                        ? 'bg-[#0274BB] text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Truck className="size-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">Courier Service</div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Third-party logistics partner with consignment waybill / tracking number.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Courier specific fields */}
            {dispatchType === 'COURIER' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-md">
                <Field>
                  <FieldLabel>Courier Logistics Partner</FieldLabel>
                  <Select
                    value={courierPartner}
                    onChange={(e) => setCourierPartner(e.target.value)}
                  >
                    <option value="Blue Dart Express">Blue Dart Express</option>
                    <option value="DTDC Express">DTDC Express</option>
                    <option value="FedEx Logistics">FedEx Logistics</option>
                    <option value="DHL Express">DHL Express</option>
                    <option value="Professional Couriers">The Professional Couriers</option>
                    <option value="Internal Facility Fleet">Internal Facility Fleet</option>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Consignment Tracking / Waybill # (AWB)</FieldLabel>
                  <Input
                    placeholder="E.g. AWB-98234710IN"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    required={dispatchType === 'COURIER'}
                  />
                </Field>
              </div>
            )}

            {/* Collection Agent specific fields */}
            {dispatchType === 'COLLECTION_AGENT' && (
              <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Collection Agent Name</FieldLabel>
                    <Input
                      placeholder="Agent full name"
                      value={collectionAgentName}
                      onChange={(e) => setCollectionAgentName(e.target.value)}
                      required={dispatchType === 'COLLECTION_AGENT'}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Agent Phone / Contact</FieldLabel>
                    <Input
                      placeholder="+91 98765 43210"
                      value={collectionAgentPhone}
                      onChange={(e) => setCollectionAgentPhone(e.target.value)}
                    />
                  </Field>
                </div>

                {/* Digital Signature Pad */}
                <div className="bg-white p-4 rounded-md border border-slate-200">
                  <SignaturePad
                    value={clientSignature}
                    onChange={(dataUrl) => setClientSignature(dataUrl)}
                    clientName={recipientName || selectedRequest?.clients?.client_name}
                  />
                </div>
              </div>
            )}

            {/* Recipient Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Recipient / Contact Person at Client Site</FieldLabel>
                <Input
                  placeholder="Full name of receiver"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel>Recipient Phone Number</FieldLabel>
                <Input
                  placeholder="+91 (555) 000-0000"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                />
              </Field>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3 p-4 border-t border-slate-200">
            <Link to="/logistics/dispatches">
              <Button variant="outlineInk" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              variant="primary"
              type="submit"
              disabled={createDispatchMutation.isPending}
            >
              <CheckCircle2 className="size-4" />
              {createDispatchMutation.isPending ? 'Generating Gate Pass...' : 'Issue Gate Pass & Dispatch'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default DispatchBuilderPage;
