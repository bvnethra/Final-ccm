// application/src/pages/lab/CalibrationPage.tsx
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useCalibrationRequest,
  useRecordCalibration,
  useRepairs,
  useRecordRepair,
  useApproveRepair,
  useCompleteRepair,
  useOutsourcePOs,
  useCreateOutsourcePO,
  useReceiveOutsourceReturn,
  useCertificates,
} from '../../hooks/useOperations';
import { useVendors } from '../../hooks/useVendorMaster';
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
import type { CalibrationResult } from '../../types/domain';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Plus,
  Trash2,
  Award,
  Wrench,
  Truck,
  FlaskConical,
  AlertTriangle,
  FileCheck,
  Check,
  Building2,
} from 'lucide-react';

interface MeasurementFormState {
  parameterName: string;
  nominalValue: number;
  measuredValue: number;
  unit: string;
  toleranceMin: number;
  toleranceMax: number;
  result: 'PASS' | 'FAIL';
}

export const CalibrationPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const { tenantId, organizationId } = useAuthContext();
  const { data: request, isLoading } = useCalibrationRequest(requestId);
  const { data: vendors = [] } = useVendors();
  const { data: requestRepairs = [] } = useRepairs(requestId);
  const { data: requestOutsources = [] } = useOutsourcePOs(requestId);
  const { data: certificates = [] } = useCertificates(requestId);

  const recordCalibrationMutation = useRecordCalibration();
  const recordRepairMutation = useRecordRepair();
  const approveRepairMutation = useApproveRepair();
  const completeRepairMutation = useCompleteRepair();
  const createOutsourceMutation = useCreateOutsourcePO();
  const receiveOutsourceMutation = useReceiveOutsourceReturn();

  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'IN_HOUSE' | 'IN_LAB_REPAIR' | 'OUTSOURCE_PO'>('IN_HOUSE');

  // In-House Calibration state
  const [temp, setTemp] = useState<number>(23.0);
  const [humidity, setHumidity] = useState<number>(50.0);
  const [nextDueDate, setNextDueDate] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [calResult, setCalResult] = useState<CalibrationResult>('PASS');
  const [calRemarks, setCalRemarks] = useState<string>('');
  const [measurements, setMeasurements] = useState<MeasurementFormState[]>([
    {
      parameterName: 'Dimensional Tolerance',
      nominalValue: 10.0,
      measuredValue: 10.002,
      unit: 'mm',
      toleranceMin: 9.995,
      toleranceMax: 10.005,
      result: 'PASS',
    },
    {
      parameterName: 'Zero Datum Offset',
      nominalValue: 0.0,
      measuredValue: 0.001,
      unit: 'mm',
      toleranceMin: -0.005,
      toleranceMax: 0.005,
      result: 'PASS',
    },
  ]);

  // In-Lab Repair state
  const [defectDescription, setDefectDescription] = useState<string>('');
  const [repairServiceRequired, setRepairServiceRequired] = useState<string>('');
  const [estimatedRepairCost, setEstimatedRepairCost] = useState<number>(120);
  const [partsRequired, setPartsRequired] = useState<string>('');
  const [clientPoForRepair, setClientPoForRepair] = useState<string>('');
  const [technicianRepairNotes, setTechnicianRepairNotes] = useState<string>('');

  // Outsource Vendor PO state
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [outsourceCost, setOutsourceCost] = useState<number>(180);
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [outsourceRemarks, setOutsourceRemarks] = useState<string>('');
  const [vendorCertNumber, setVendorCertNumber] = useState<string>('');
  const [outsourceNextDueDate, setOutsourceNextDueDate] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });

  // Feedback messages
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();

  const items = request?.request_items || [];
  const currentItem = items[selectedItemIndex];

  // Active records for current item
  const currentItemRepair = requestRepairs.find(
    (r) => r.request_item_id === currentItem?.id && r.status !== 'CANCELLED'
  );
  const currentItemOutsource = requestOutsources.find(
    (o) => o.request_item_id === currentItem?.id
  );
  const currentItemCertificate = certificates.find(
    (c) => c.request_id === requestId
  );

  const handleAddMeasurement = () => {
    setMeasurements((prev) => [
      ...prev,
      {
        parameterName: '',
        nominalValue: 0,
        measuredValue: 0,
        unit: 'mm',
        toleranceMin: -0.01,
        toleranceMax: 0.01,
        result: 'PASS',
      },
    ]);
  };

  const handleRemoveMeasurement = (index: number) => {
    setMeasurements((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateMeasurement = (
    index: number,
    field: keyof MeasurementFormState,
    value: any
  ) => {
    setMeasurements((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (
        field === 'measuredValue' ||
        field === 'nominalValue' ||
        field === 'toleranceMin' ||
        field === 'toleranceMax'
      ) {
        const item = copy[index];
        const pass =
          item.measuredValue >= item.toleranceMin && item.measuredValue <= item.toleranceMax;
        item.result = pass ? 'PASS' : 'FAIL';
      }
      return copy;
    });
  };

  // 1. Submit In-House Calibration
  const handleSubmitCalibration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(undefined);
    setSuccessMessage(undefined);

    if (!tenantId || !organizationId || !requestId || !currentItem) {
      setErrorMessage('Missing required session context or equipment item.');
      return;
    }

    try {
      await recordCalibrationMutation.mutateAsync({
        tenantId,
        organizationId,
        requestId,
        requestItemId: currentItem.id,
        nextDueDate,
        environmentalTemperature: temp,
        environmentalHumidity: humidity,
        result: calResult,
        outcome: calResult === 'PASS' ? 'CALIBRATED' : 'FAULTY',
        remarks: calRemarks,
        measurements,
      });

      if (calResult === 'PASS') {
        setSuccessMessage(
          `Calibration Passed! ISO Certificate generated with Next Calibration Due Date set to ${nextDueDate}.`
        );
      } else {
        setSuccessMessage(
          'Calibration marked as FAULTY. Please switch to In-Lab Repair to service the instrument.'
        );
        setActiveWorkflowTab('IN_LAB_REPAIR');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record calibration test.');
    }
  };

  // 2. In-Lab Repair: Record defect & service required
  const handleCreateRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(undefined);
    setSuccessMessage(undefined);

    if (!tenantId || !organizationId || !requestId || !currentItem) {
      setErrorMessage('Missing required context.');
      return;
    }

    try {
      await recordRepairMutation.mutateAsync({
        tenantId,
        organizationId,
        requestId,
        requestItemId: currentItem.id,
        defectDescription,
        repairServiceRequired,
        estimatedCost: estimatedRepairCost,
        partsRequired,
      });

      setSuccessMessage('Repair order logged. Awaiting client authorization to begin service.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to log repair order.');
    }
  };

  // 2b. In-Lab Repair: Record Client Approval
  const handleApproveRepair = async (repairId: string) => {
    try {
      await approveRepairMutation.mutateAsync({
        tenantId: tenantId!,
        repairId,
        requestId: requestId!,
        approved: true,
        clientPoRef: clientPoForRepair || request?.client_po_ref || 'VERBAL-CLIENT-APPROVAL',
      });
      setSuccessMessage('Client approval recorded! In-lab repair is now in progress.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record approval.');
    }
  };

  // 2c. In-Lab Repair: Mark Repair Completed
  const handleCompleteRepair = async (repairId: string) => {
    try {
      await completeRepairMutation.mutateAsync({
        tenantId: tenantId!,
        repairId,
        requestId: requestId!,
        technicianNotes: technicianRepairNotes || 'Internal component serviced, zero adjusted, ready for re-test.',
      });
      setSuccessMessage('Service completed! Equipment has been restored and returned to the Calibration Bench.');
      setActiveWorkflowTab('IN_HOUSE');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete repair.');
    }
  };

  // 3. Outsource to Vendor PO
  const handleCreateOutsource = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(undefined);
    setSuccessMessage(undefined);

    if (!tenantId || !organizationId || !requestId || !currentItem || !selectedVendorId) {
      setErrorMessage('Please select a calibration vendor from the Master.');
      return;
    }

    const selectedVendor = vendors.find((v) => v.id === selectedVendorId);

    try {
      await createOutsourceMutation.mutateAsync({
        tenantId,
        organizationId,
        requestId,
        requestItemId: currentItem.id,
        vendorId: selectedVendorId,
        vendorName: selectedVendor?.vendor_name,
        vendorCost: outsourceCost,
        expectedReturnDate,
        remarks: outsourceRemarks,
      });

      setSuccessMessage('Vendor Outsource PO issued and equipment dispatched to vendor laboratory.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to issue vendor PO.');
    }
  };

  // 3b. Outsource: Receive returned instrument & vendor cert
  const handleReceiveOutsourceReturn = async (outsourceId: string) => {
    if (!vendorCertNumber) {
      setErrorMessage('Please enter the vendor calibration certificate number.');
      return;
    }

    try {
      await receiveOutsourceMutation.mutateAsync({
        tenantId: tenantId!,
        organizationId: organizationId!,
        outsourceId,
        requestId: requestId!,
        vendorCertificateNumber: vendorCertNumber,
        nextDueDate: outsourceNextDueDate,
        remarks: 'Vendor calibration certified and accepted into lab.',
      });

      setSuccessMessage(
        `Returned instrument accepted! Linked Vendor Certificate ${vendorCertNumber}. Next Due Date set to ${outsourceNextDueDate}. Ready for Commercial Quotation!`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to accept returned instrument.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-sm text-[#6B7280]">
        <div className="size-6 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading metrology bench &amp; calibration workflows...
      </div>
    );
  }

  if (!request || !currentItem) {
    return (
      <div className="p-8 bg-[#fef2f2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px] text-center space-y-3">
        <AlertTriangle className="size-8 mx-auto" />
        <p className="font-semibold">Calibration request or equipment item not found.</p>
        <Link to="/lab/queue">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="size-4" /> Return to Lab Queue
          </Button>
        </Link>
      </div>
    );
  }

  const isCalibrated = request.status === 'QUOTATION' || request.status === 'APPROVED' || request.status === 'INVOICED';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/lab/queue">
            <Button variant="outlineInk" size="sm">
              <ArrowLeft className="size-4" /> Back to Lab Queue
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#111827]">
                Calibration &amp; Service Test Bench
              </h1>
              <Badge
                variant={
                  isCalibrated
                    ? 'success'
                    : request.status === 'FAULTY' || request.status === 'REPAIR_IN_PROGRESS'
                    ? 'warning'
                    : request.status === 'OUTSOURCED'
                    ? 'info'
                    : 'primary'
                }
              >
                {request.status}
              </Badge>
            </div>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Step 8: In-Lab Calibration vs Repair vs Outsource PO $\rightarrow$ Step 9: Certificate &amp; Due Date Trigger
            </p>
          </div>
        </div>

        {isCalibrated && (
          <Link to="/commercial/quotations/new">
            <Button variant="primary">
              Generate Commercial Quotation (Step 10) <ArrowRight className="size-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 bg-[#fef2f2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px] text-sm flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-[#F0FDF4] border border-[#16A34A]/30 text-[#16A34A] rounded-[4px] text-sm flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Certificate Issued Card (Step 9) */}
      {(currentItemCertificate || isCalibrated) && (
        <div className="p-4 bg-[#ECFDF5] border border-[#10B981]/40 rounded-[4px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#10B981] text-white rounded-[4px]">
              <Award className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#065F46] text-base">
                  Calibration Certificate Issued &amp; Due Date Triggered
                </span>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-[#D1FAE5] text-[#065F46] rounded border border-[#A7F3D0]">
                  {currentItemCertificate?.certificate_number || 'CERT-ACTIVE-001'}
                </span>
              </div>
              <p className="text-xs text-[#047857] mt-0.5">
                Valid Until / Next Due Date:{' '}
                <strong className="underline">
                  {currentItemCertificate?.valid_until || nextDueDate}
                </strong>{' '}
                • ISO/IEC 17025 Compliant Metrology Standard
              </p>
            </div>
          </div>
          <Link to="/commercial/quotations/new">
            <Button variant="primary" size="sm">
              Create Commercial Quotation (Step 10) <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Equipment Line Item Tabs for Batches */}
      {items.length > 1 && (
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2 overflow-x-auto">
          <span className="text-xs font-bold text-[#6B7280] uppercase mr-2 shrink-0">
            Inward Units ({items.length}):
          </span>
          {items.map((it, idx) => {
            const isSelected = idx === selectedItemIndex;
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
                <span>Item {idx + 1}: {it.item_masters?.item_name || 'Gauge'}</span>
                {it.status === 'CALIBRATED' && <Check className="size-3 text-[#16A34A] bg-white rounded-full p-0.5" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Equipment Declared Summary Header */}
      <Card className="bg-[#F8FAFC]">
        <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[#6B7280] block">Target Instrument</span>
            <span className="font-bold text-[#111827] text-sm block">
              {currentItem.item_masters?.item_name || 'Standard Gauge'}
            </span>
            <span className="font-mono text-[#0274BB]">{currentItem.item_masters?.item_code}</span>
          </div>
          <div>
            <span className="text-[#6B7280] block">Serial # / Tag</span>
            <span className="font-mono font-bold text-[#111827] text-xs">
              {currentItem.serial_number || 'N/A'}
            </span>
            {currentItem.item_masters?.measurement_range && (
              <span className="text-[11px] text-[#6B7280] block mt-0.5">
                Range: {currentItem.item_masters.measurement_range}
              </span>
            )}
          </div>
          <div>
            <span className="text-[#6B7280] block">Client Account</span>
            <span className="font-semibold text-[#111827] text-sm block">
              {request.clients?.client_name || 'Client'}
            </span>
            <span className="text-[11px] text-[#6B7280] font-mono">
              PO: {request.client_po_ref || 'No Ref'}
            </span>
          </div>
          <div>
            <span className="text-[#6B7280] block">Verified Inward Count</span>
            <span className="font-mono font-bold text-[#111827] text-sm">
              {currentItem.received_quantity || currentItem.quantity || 1} unit(s)
            </span>
            <span className="text-[11px] text-[#16A34A] font-semibold block mt-0.5">
              Verified Condition: {currentItem.item_condition}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Path Selector: Dividing After Verification */}
      <div className="flex border-b border-[#E5E7EB] gap-2">
        <button
          type="button"
          onClick={() => setActiveWorkflowTab('IN_HOUSE')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeWorkflowTab === 'IN_HOUSE'
              ? 'border-[#0274BB] text-[#0274BB] bg-[#EBF5FF]'
              : 'border-transparent text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]'
          }`}
        >
          <FlaskConical className="size-4" />
          <span>1. In-Lab Calibration (Standard Pass)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveWorkflowTab('IN_LAB_REPAIR')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeWorkflowTab === 'IN_LAB_REPAIR'
              ? 'border-[#EF7626] text-[#EF7626] bg-[#FFF7ED]'
              : 'border-transparent text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]'
          }`}
        >
          <Wrench className="size-4" />
          <span>2. In-Lab Service &amp; Repair (Faulty)</span>
          {currentItemRepair && (
            <Badge variant="warning">{currentItemRepair.status}</Badge>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveWorkflowTab('OUTSOURCE_PO')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeWorkflowTab === 'OUTSOURCE_PO'
              ? 'border-[#0274BB] text-[#0274BB] bg-[#EBF5FF]'
              : 'border-transparent text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]'
          }`}
        >
          <Truck className="size-4" />
          <span>3. Outsource / Vendor PO (External Lab)</span>
          {currentItemOutsource && (
            <Badge variant="info">{currentItemOutsource.status}</Badge>
          )}
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 1. In-House Calibration Test Bench View */}
      {/* ==================================================================== */}
      {activeWorkflowTab === 'IN_HOUSE' && (
        <form onSubmit={handleSubmitCalibration} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Environmental Conditions */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Environmental Conditions</CardTitle>
                <CardDescription>ISO/IEC 17025 standard environment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field>
                  <FieldLabel>Ambient Temperature (°C)</FieldLabel>
                  <Input
                    type="number"
                    step="0.1"
                    value={temp}
                    onChange={(e) => setTemp(parseFloat(e.target.value) || 20)}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel>Relative Humidity (% RH)</FieldLabel>
                  <Input
                    type="number"
                    step="1"
                    value={humidity}
                    onChange={(e) => setHumidity(parseFloat(e.target.value) || 50)}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel>
                    Next Calibration Due Date <span className="text-[#DC2626]">*</span>
                  </FieldLabel>
                  <Input
                    type="date"
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    required
                  />
                  <p className="text-[11px] text-[#6B7280] mt-1">
                    Auto-defaults to 1-year calibration interval.
                  </p>
                </Field>

                <Field>
                  <FieldLabel>Overall Calibration Verdict</FieldLabel>
                  <Select
                    value={calResult}
                    onChange={(e) => setCalResult(e.target.value as CalibrationResult)}
                  >
                    <option value="PASS">PASS — Complies with ISO/IEC 17025</option>
                    <option value="FAIL">FAIL — Exceeds Tolerance Limits (Needs Repair)</option>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Metrologist Observations</FieldLabel>
                  <Textarea
                    placeholder="Master gauge references, method standard..."
                    value={calRemarks}
                    onChange={(e) => setCalRemarks(e.target.value)}
                    rows={2}
                  />
                </Field>
              </CardContent>
            </Card>

            {/* Measurement Grid */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Measurement Test Matrix</CardTitle>
                  <CardDescription>
                    Nominal standard vs observed instrument readings
                  </CardDescription>
                </div>
                <Button variant="secondary" size="sm" type="button" onClick={handleAddMeasurement}>
                  <Plus className="size-4" /> Add Parameter
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#F5F7FA] border-b border-[#E5E7EB] text-[#374151] font-semibold text-xs uppercase">
                      <tr>
                        <th className="px-3 py-3">Parameter</th>
                        <th className="px-3 py-3 w-20">Nominal</th>
                        <th className="px-3 py-3 w-20">Measured</th>
                        <th className="px-3 py-3 w-16">Unit</th>
                        <th className="px-3 py-3 w-20">Tol Min</th>
                        <th className="px-3 py-3 w-20">Tol Max</th>
                        <th className="px-3 py-3 w-20">Verdict</th>
                        <th className="px-3 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {measurements.map((m, idx) => (
                        <tr key={idx} className="hover:bg-[#FAFAFA]">
                          <td className="p-2">
                            <Input
                              placeholder="Parameter"
                              value={m.parameterName}
                              onChange={(e) =>
                                handleUpdateMeasurement(idx, 'parameterName', e.target.value)
                              }
                              required
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              step="any"
                              value={m.nominalValue}
                              onChange={(e) =>
                                handleUpdateMeasurement(
                                  idx,
                                  'nominalValue',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              required
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              step="any"
                              value={m.measuredValue}
                              onChange={(e) =>
                                handleUpdateMeasurement(
                                  idx,
                                  'measuredValue',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              required
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={m.unit}
                              onChange={(e) => handleUpdateMeasurement(idx, 'unit', e.target.value)}
                              className="w-16"
                              required
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              step="any"
                              value={m.toleranceMin}
                              onChange={(e) =>
                                handleUpdateMeasurement(
                                  idx,
                                  'toleranceMin',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              required
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              step="any"
                              value={m.toleranceMax}
                              onChange={(e) =>
                                handleUpdateMeasurement(
                                  idx,
                                  'toleranceMax',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              required
                            />
                          </td>
                          <td className="p-2">
                            <Badge variant={m.result === 'PASS' ? 'success' : 'error'}>
                              {m.result}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {measurements.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMeasurement(idx)}
                                className="text-[#DC2626] hover:text-[#b91c1c] p-1 cursor-pointer"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between p-4 bg-[#F5F7FA] border-t border-[#E5E7EB]">
                <div className="flex items-center gap-2 text-xs text-[#16A34A] font-semibold">
                  <Award className="size-4" />
                  <span>Passing tests auto-issue an ISO Calibration Certificate &amp; Due Date</span>
                </div>
                <div className="flex gap-3">
                  <Link to="/lab/queue">
                    <Button variant="outlineInk" type="button">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={recordCalibrationMutation.isPending}
                  >
                    <CheckCircle2 className="size-4" />
                    {recordCalibrationMutation.isPending
                      ? 'Processing...'
                      : 'Submit & Generate Certificate'}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </form>
      )}

      {/* ==================================================================== */}
      {/* 2. In-Lab Repair / Faulty Service Flow View */}
      {/* ==================================================================== */}
      {activeWorkflowTab === 'IN_LAB_REPAIR' && (
        <div className="space-y-6">
          {/* Repair Stage Indicator */}
          <div className="p-4 bg-[#FFF7ED] border border-[#FDBA74] rounded-[4px]">
            <h3 className="font-bold text-[#9A3412] text-sm flex items-center gap-2">
              <Wrench className="size-4 text-[#EA580C]" /> In-Lab Service &amp; Repair Workflow:
            </h3>
            <p className="text-xs text-[#C2410C] mt-1">
              Faulty Instrument $\rightarrow$ Service Required Estimate $\rightarrow$ Client Approval $\rightarrow$ Service Completed $\rightarrow$ Return to Calibration Bench.
            </p>
          </div>

          {currentItemRepair ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Active Repair Service Order</CardTitle>
                    <CardDescription>
                      Order Status: <strong className="text-[#111827]">{currentItemRepair.status}</strong>
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      currentItemRepair.status === 'COMPLETED'
                        ? 'success'
                        : currentItemRepair.status === 'IN_PROGRESS'
                        ? 'info'
                        : 'warning'
                    }
                  >
                    {currentItemRepair.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#F9FAFB] rounded-[4px] border border-[#E5E7EB] text-xs">
                  <div>
                    <span className="text-[#6B7280] block">Defect Diagnosis</span>
                    <span className="font-semibold text-[#111827] text-sm">
                      {currentItemRepair.defect_description}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block">Service Required</span>
                    <span className="font-semibold text-[#111827] text-sm">
                      {currentItemRepair.repair_service_required}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block">Estimated Repair Charge</span>
                    <span className="font-mono font-bold text-[#0274BB] text-sm">
                      ${currentItemRepair.estimated_cost.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block">Client Approval Status</span>
                    <Badge
                      variant={
                        currentItemRepair.client_approval_status === 'APPROVED' ? 'success' : 'warning'
                      }
                    >
                      {currentItemRepair.client_approval_status}
                    </Badge>
                  </div>
                </div>

                {/* Sub-step A: Client Approval Action */}
                {currentItemRepair.status === 'PENDING_APPROVAL' && (
                  <div className="p-4 bg-white border border-[#CBD5E1] rounded-[4px] space-y-3">
                    <h4 className="font-bold text-sm text-[#1E293B] flex items-center gap-2">
                      <FileCheck className="size-4 text-[#0274BB]" /> Step B: Record Client Authorization
                    </h4>
                    <p className="text-xs text-[#64748B]">
                      Enter the client Purchase Order reference or written authorization confirmation:
                    </p>
                    <div className="flex gap-3">
                      <Input
                        placeholder="Client PO # / Approval Ref (e.g. PO-CLIENT-991)"
                        value={clientPoForRepair}
                        onChange={(e) => setClientPoForRepair(e.target.value)}
                        className="max-w-md"
                      />
                      <Button
                        variant="primary"
                        type="button"
                        onClick={() => handleApproveRepair(currentItemRepair.id)}
                        disabled={approveRepairMutation.isPending}
                      >
                        <Check className="size-4" /> Authorize &amp; Begin Repair
                      </Button>
                    </div>
                  </div>
                )}

                {/* Sub-step B: Mark Repair Completed Action */}
                {currentItemRepair.status === 'IN_PROGRESS' && (
                  <div className="p-4 bg-white border border-[#CBD5E1] rounded-[4px] space-y-3">
                    <h4 className="font-bold text-sm text-[#1E293B] flex items-center gap-2">
                      <Wrench className="size-4 text-[#16A34A]" /> Step C: Complete Repair &amp; Ready for Re-test
                    </h4>
                    <p className="text-xs text-[#64748B]">
                      Record technician repair notes detailing the adjustments performed:
                    </p>
                    <Textarea
                      placeholder="e.g. Cleared sensor blockage, replaced standard spring probe, zero recalibrated..."
                      value={technicianRepairNotes}
                      onChange={(e) => setTechnicianRepairNotes(e.target.value)}
                      rows={2}
                    />
                    <div className="flex justify-end">
                      <Button
                        variant="primary"
                        type="button"
                        onClick={() => handleCompleteRepair(currentItemRepair.id)}
                        disabled={completeRepairMutation.isPending}
                      >
                        <CheckCircle2 className="size-4" /> Complete Service &amp; Re-Calibrate
                      </Button>
                    </div>
                  </div>
                )}

                {currentItemRepair.status === 'COMPLETED' && (
                  <div className="p-4 bg-[#F0FDF4] border border-[#86EFAC] rounded-[4px] flex items-center justify-between">
                    <div className="text-xs text-[#166534]">
                      <strong>Service Complete!</strong> Technician Notes: {currentItemRepair.technician_notes}
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveWorkflowTab('IN_HOUSE')}
                    >
                      Return to Metrology Bench <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Log Faulty Instrument &amp; Create Repair Service Order</CardTitle>
                <CardDescription>
                  Step A: Diagnose defect, estimate service charges, and submit for client authorization
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleCreateRepair}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>
                        Defect Diagnosis / Reason for Failure <span className="text-[#DC2626]">*</span>
                      </FieldLabel>
                      <Input
                        placeholder="e.g. Probe stuck, non-linear sensor response, cracked dial lens..."
                        value={defectDescription}
                        onChange={(e) => setDefectDescription(e.target.value)}
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel>
                        Repair Service Action Required <span className="text-[#DC2626]">*</span>
                      </FieldLabel>
                      <Input
                        placeholder="e.g. Disassemble, ultrasonic cleaning, pivot calibration..."
                        value={repairServiceRequired}
                        onChange={(e) => setRepairServiceRequired(e.target.value)}
                        required
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Estimated Repair Cost ($ USD)</FieldLabel>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={estimatedRepairCost}
                        onChange={(e) => setEstimatedRepairCost(parseFloat(e.target.value) || 0)}
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Replacement Parts / Consumables</FieldLabel>
                      <Input
                        placeholder="e.g. Replacement carbide probe tip, silicone O-ring..."
                        value={partsRequired}
                        onChange={(e) => setPartsRequired(e.target.value)}
                      />
                    </Field>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-3 p-4 bg-[#F9FAFB] border-t border-[#E5E7EB]">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={recordRepairMutation.isPending}
                  >
                    <Wrench className="size-4" />
                    {recordRepairMutation.isPending ? 'Logging Repair...' : 'Log Repair Order'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. Outsource / Vendor Purchase Order (PO) Flow View */}
      {/* ==================================================================== */}
      {activeWorkflowTab === 'OUTSOURCE_PO' && (
        <div className="space-y-6">
          {/* Outsource Overview Banner */}
          <div className="p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-[4px]">
            <h3 className="font-bold text-[#1E40AF] text-sm flex items-center gap-2">
              <Truck className="size-4 text-[#0274BB]" /> Outsource Calibration Process:
            </h3>
            <p className="text-xs text-[#1D4ED8] mt-1">
              Vendor PO Generation $\rightarrow$ Send Instrument to External Lab $\rightarrow$ Vendor Calibrates $\rightarrow$ Returns with Vendor Certificate $\rightarrow$ Next Due Date Trigger.
            </p>
          </div>

          {currentItemOutsource ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Active Outsource PO Record</CardTitle>
                    <CardDescription>
                      PO Reference: <strong className="font-mono text-[#0274BB]">{currentItemOutsource.vendor_po_number}</strong>
                    </CardDescription>
                  </div>
                  <Badge variant={currentItemOutsource.status === 'ACCEPTED' ? 'success' : 'info'}>
                    {currentItemOutsource.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#F9FAFB] rounded-[4px] border border-[#E5E7EB] text-xs">
                  <div>
                    <span className="text-[#6B7280] block">Vendor Calibration Lab</span>
                    <span className="font-bold text-[#111827] text-sm flex items-center gap-1.5 mt-0.5">
                      <Building2 className="size-3.5 text-[#0274BB]" />
                      {currentItemOutsource.vendor_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block">Vendor Service Cost</span>
                    <span className="font-mono font-bold text-[#111827] text-sm mt-0.5 block">
                      ${currentItemOutsource.vendor_cost?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block">Expected Return Date</span>
                    <span className="font-semibold text-[#111827] text-sm mt-0.5 block">
                      {currentItemOutsource.expected_return_date || 'Standard SLA'}
                    </span>
                  </div>
                </div>

                {currentItemOutsource.status === 'SENT' && (
                  <div className="p-4 bg-white border border-[#CBD5E1] rounded-[4px] space-y-4">
                    <h4 className="font-bold text-sm text-[#1E293B] flex items-center gap-2">
                      <FileCheck className="size-4 text-[#16A34A]" /> Inward Receipt &amp; Vendor Certificate Acceptance
                    </h4>
                    <p className="text-xs text-[#64748B]">
                      When the instrument returns from the external laboratory, record their certificate details and calibration due date:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel>
                          Vendor Calibration Certificate # <span className="text-[#DC2626]">*</span>
                        </FieldLabel>
                        <Input
                          placeholder="e.g. VCERT-EXT-88942"
                          value={vendorCertNumber}
                          onChange={(e) => setVendorCertNumber(e.target.value)}
                          required
                        />
                      </Field>

                      <Field>
                        <FieldLabel>
                          Calibration Next Due Date <span className="text-[#DC2626]">*</span>
                        </FieldLabel>
                        <Input
                          type="date"
                          value={outsourceNextDueDate}
                          onChange={(e) => setOutsourceNextDueDate(e.target.value)}
                          required
                        />
                      </Field>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="primary"
                        type="button"
                        onClick={() => handleReceiveOutsourceReturn(currentItemOutsource.id)}
                        disabled={receiveOutsourceMutation.isPending}
                      >
                        <CheckCircle2 className="size-4" /> Accept Return &amp; Trigger Certificate
                      </Button>
                    </div>
                  </div>
                )}

                {currentItemOutsource.status === 'ACCEPTED' && (
                  <div className="p-4 bg-[#F0FDF4] border border-[#86EFAC] rounded-[4px] flex items-center justify-between">
                    <div className="text-xs text-[#166534]">
                      <strong>Returned &amp; Accepted!</strong> Vendor Certificate: {currentItemOutsource.vendor_certificate_number}
                    </div>
                    <Link to="/commercial/quotations/new">
                      <Button variant="primary" size="sm">
                        Proceed to Quotation (Step 10) <ArrowRight className="size-3.5" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Create Outsource Vendor Purchase Order (PO)</CardTitle>
                <CardDescription>
                  Delegate specialized equipment calibration to an approved accredited vendor
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleCreateOutsource}>
                <CardContent className="space-y-4">
                  <Field>
                    <FieldLabel>
                      Select Accredited Vendor Lab <span className="text-[#DC2626]">*</span>
                    </FieldLabel>
                    <Select
                      value={selectedVendorId}
                      onChange={(e) => setSelectedVendorId(e.target.value)}
                      required
                    >
                      <option value="">Select Vendor from Master</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.vendor_name} ({v.vendor_code})
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Agreed Outsource Calibration Fee ($ USD)</FieldLabel>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={outsourceCost}
                        onChange={(e) => setOutsourceCost(parseFloat(e.target.value) || 0)}
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Expected Delivery / Return Date</FieldLabel>
                      <Input
                        type="date"
                        value={expectedReturnDate}
                        onChange={(e) => setExpectedReturnDate(e.target.value)}
                        required
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel>Special Instructions / Calibration Standard</FieldLabel>
                    <Textarea
                      placeholder="e.g. Outsource to Class 1 precision laboratory; request ISO 17025 accredited certificate..."
                      value={outsourceRemarks}
                      onChange={(e) => setOutsourceRemarks(e.target.value)}
                      rows={2}
                    />
                  </Field>
                </CardContent>
                <CardFooter className="flex justify-end gap-3 p-4 bg-[#F9FAFB] border-t border-[#E5E7EB]">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={createOutsourceMutation.isPending}
                  >
                    <Truck className="size-4" />
                    {createOutsourceMutation.isPending ? 'Issuing PO...' : 'Issue Outsource Vendor PO'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default CalibrationPage;
