// application/src/pages/lab/CalibrationPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
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
import type { CalibrationResult, OutsourcePO } from '../../types/domain';
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
  Download,
  X,
  Layers,
  Eye,
  Clock,
} from 'lucide-react';
import { OfficialVendorPOView } from '../../components/commercial/OfficialVendorPOView';

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
  const [searchParams] = useSearchParams();
  const initialItemIndex = Number(searchParams.get('itemIndex')) || 0;
  const initialTab = (searchParams.get('tab') as 'IN_HOUSE' | 'IN_LAB_REPAIR' | 'OUTSOURCE_PO') || 'IN_HOUSE';

  const { tenantId, organizationId, isLabApprover, isSuperAdmin, canPerform } = useAuthContext();
  const canRecordCalibration = isSuperAdmin || canPerform('RECORD_CALIBRATION_FREQUENCY', 'CREATE_EDIT') || canPerform('RECORD_CALIBRATION_FREQUENCY', 'CREATE');
  const canRaiseServiceFlag = isSuperAdmin || canPerform('RAISE_SERVICE_FLAG', 'CREATE');
  const canApproveServiceFlag = isSuperAdmin || isLabApprover || canPerform('RAISE_SERVICE_FLAG', 'APPROVE');
  const canManageOutsource = isSuperAdmin || canPerform('RAISE_PO_VENDOR_OUTSOURCING', 'CREATE_EDIT') || canPerform('RAISE_PO_VENDOR_OUTSOURCING', 'CREATE');
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

  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(initialItemIndex);
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'IN_HOUSE' | 'IN_LAB_REPAIR' | 'OUTSOURCE_PO'>(initialTab);
  const [viewingOutsourcePO, setViewingOutsourcePO] = useState<OutsourcePO | null>(null);

  useEffect(() => {
    const idx = searchParams.get('itemIndex');
    if (idx !== null && !isNaN(Number(idx))) {
      setSelectedItemIndex(Number(idx));
    }
    const tab = searchParams.get('tab');
    if (tab && ['IN_HOUSE', 'IN_LAB_REPAIR', 'OUTSOURCE_PO'].includes(tab)) {
      setActiveWorkflowTab(tab as any);
    }
  }, [searchParams]);

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
  const [measurements, setMeasurements] = useState<MeasurementFormState[]>([]);

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

    const validMeasurements = measurements.filter(
      (m) => m.parameterName && m.parameterName.trim() !== ''
    );

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
        measurements: validMeasurements,
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
              <ArrowLeft className="size-4" /> Back
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
              Step 8: Lab Operational Bench (Calibration, Repair &amp; Outsource) → Step 9: Certificate &amp; Due Date Generation
            </p>
          </div>
        </div>

        {isCalibrated && (
          <Link to={`/commercial/quotations/new?requestId=${requestId}`}>
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
          <Link to={`/commercial/quotations/new?requestId=${requestId}`}>
            <Button variant="primary" size="sm">
              Create Commercial Quotation (Step 10) <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Inward Equipment Units Batch Table */}
      <Card className="overflow-hidden border border-[#E5E7EB] dark:border-neutral-700 shadow-sm">
        <CardHeader className="py-3.5 px-5 bg-[#F8FAFC] dark:bg-neutral-800/60 border-b border-[#E5E7EB] dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-md bg-[#0274BB]/10 text-[#0274BB] flex items-center justify-center font-bold">
              <Layers className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <CardTitle className="text-base font-bold text-[#111827] dark:text-white">
                  Inward Batch Equipment Units
                </CardTitle>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EBF5FF] text-[#0274BB] border border-[#BFDBFE]">
                  {items.length} {items.length === 1 ? 'Unit' : 'Units'}
                </span>
              </div>
              <CardDescription className="text-xs text-[#6B7280] dark:text-neutral-400 mt-0.5">
                Click any row or &quot;Select&quot; to load instrument onto calibration bench, or click &quot;View Details&quot; for full specifications
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F1F5F9] dark:bg-neutral-800 text-[#475569] dark:text-neutral-300 font-semibold uppercase tracking-wider border-b border-[#E5E7EB] dark:border-neutral-700">
                <tr>
                  <th className="px-4 py-3 w-12 text-center">#</th>
                  <th className="px-4 py-3">Target Instrument &amp; Code</th>
                  <th className="px-4 py-3">Serial # / Tag</th>
                  <th className="px-4 py-3">Range / Spec</th>
                  <th className="px-4 py-3">Client PO Ref</th>
                  <th className="px-4 py-3 text-center">Declared</th>
                  <th className="px-4 py-3 text-center">Verified</th>
                  <th className="px-4 py-3 text-center">Condition</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-neutral-700">
                {items.map((it, idx) => {
                  const isSelected = idx === selectedItemIndex;
                  const conditionUpper = it.item_condition?.toUpperCase();
                  const isGood = conditionUpper === 'GOOD';
                  const isDamaged = conditionUpper === 'DAMAGED';

                  return (
                    <tr
                      key={it.id}
                      onClick={() => setSelectedItemIndex(idx)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#EFF6FF] dark:bg-blue-950/30 border-l-4 border-l-[#0274BB] font-medium'
                          : 'hover:bg-[#F8FAFC] dark:hover:bg-neutral-800/40 border-l-4 border-l-transparent'
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-[#6B7280]">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-[#111827] dark:text-white text-xs">
                          {it.item_masters?.item_name || 'Standard Gauge'}
                        </div>
                        <div className="font-mono text-[11px] text-[#0274BB] font-semibold mt-0.5">
                          {it.item_masters?.item_code || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-semibold text-[#111827] dark:text-neutral-200">
                        {it.serial_number || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-[#4B5563] dark:text-neutral-400">
                        {it.item_masters?.measurement_range || 'Standard'}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[#6B7280] dark:text-neutral-400">
                        {request.client_po_ref || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono text-[#4B5563] dark:text-neutral-300">
                        {it.quantity || 1}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-[#111827] dark:text-white">
                        {it.received_quantity || it.quantity || 1}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            isGood
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : isDamaged
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}
                        >
                          {it.item_condition || 'GOOD'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {it.status === 'CALIBRATED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Check className="size-3 text-emerald-600" /> Calibrated
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {it.status || 'IN_QUEUE'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/lab/calibration/${requestId}/equipment/${it.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold bg-white hover:bg-[#EBF5FF] text-[#0274BB] border border-[#BFDBFE] transition-colors cursor-pointer shadow-2xs"
                            title="Open dedicated equipment specifications page"
                          >
                            <Eye className="size-3.5" />
                            <span>View Details</span>
                            <ArrowRight className="size-3" />
                          </Link>
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold bg-[#0274BB] text-white shadow-2xs">
                              <Check className="size-3.5" /> Active
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedItemIndex(idx)}
                              className="px-3 py-1.5 rounded text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
                            >
                              Select
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Active Equipment Bench Station Banner */}
      <div className="bg-white dark:bg-neutral-800 border border-[#E2E8F0] dark:border-neutral-700 border-l-4 border-l-[#0274BB] rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="size-9 rounded-md bg-[#0274BB] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
            #{selectedItemIndex + 1}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0274BB] bg-[#EBF5FF] px-2 py-0.5 rounded">
                Active on Test Bench
              </span>
              <h3 className="font-bold text-sm text-[#111827] dark:text-white">
                {currentItem.item_masters?.item_name || 'Standard Gauge'}
              </h3>
              <span className="font-mono text-xs text-[#0274BB] font-semibold">
                ({currentItem.item_masters?.item_code || 'N/A'})
              </span>
            </div>
            <div className="text-[#64748B] dark:text-neutral-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span>Serial #: <strong className="font-mono text-[#111827] dark:text-white">{currentItem.serial_number || '—'}</strong></span>
              <span>•</span>
              <span>Verified Inward: <strong className="text-[#111827] dark:text-white">{currentItem.received_quantity || currentItem.quantity || 1} unit(s)</strong></span>
              <span>•</span>
              <span>Condition: <strong className="text-[#111827] dark:text-white">{currentItem.item_condition || 'GOOD'}</strong></span>
              <span>•</span>
              <span>Client: <strong className="text-[#111827] dark:text-white">{request.clients?.client_name || 'Client Account'}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <Badge variant={currentItem.status === 'CALIBRATED' ? 'success' : 'secondary'}>
            {currentItem.status === 'CALIBRATED' ? 'Calibrated' : 'Awaiting Clearance'}
          </Badge>
          <Link to={`/lab/calibration/${requestId}/equipment/${currentItem.id}`}>
            <Button variant="outline" size="sm">
              <Eye className="size-3.5 mr-1.5" /> View Full Specs Page
            </Button>
          </Link>
        </div>
      </div>

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
          {/* Section 1: Environmental Test Conditions & Due Date Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FlaskConical className="size-4 text-[#0274BB]" />
                    Environmental Test Conditions &amp; Calibration Verdict
                  </CardTitle>
                  <CardDescription>
                    ISO/IEC 17025 standard test environment parameters and overall test result
                  </CardDescription>
                </div>
                <Badge variant={calResult === 'PASS' ? 'success' : 'error'}>
                  Verdict: {calResult}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Field>
                  <FieldLabel>
                    Ambient Temperature (°C) <span className="text-[#DC2626]">*</span>
                  </FieldLabel>
                  <Input
                    type="number"
                    step="0.1"
                    value={temp}
                    onChange={(e) => setTemp(parseFloat(e.target.value) || 20)}
                    required
                  />
                  <p className="text-[11px] text-[#6B7280] mt-1">Standard: 20.0 ± 2°C</p>
                </Field>

                <Field>
                  <FieldLabel>
                    Relative Humidity (% RH) <span className="text-[#DC2626]">*</span>
                  </FieldLabel>
                  <Input
                    type="number"
                    step="1"
                    value={humidity}
                    onChange={(e) => setHumidity(parseFloat(e.target.value) || 50)}
                    required
                  />
                  <p className="text-[11px] text-[#6B7280] mt-1">Standard: 50 ± 10% RH</p>
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
                  <p className="text-[11px] text-[#6B7280] mt-1">Auto-defaults to 1-year interval.</p>
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
                  <p className="text-[11px] text-[#6B7280] mt-1">Determines certificate issuance.</p>
                </Field>
              </div>

              <Field>
                <FieldLabel>Metrologist Observations &amp; Master References</FieldLabel>
                <Textarea
                  placeholder="Master gauge references, traceability certificate numbers, standard methods applied..."
                  value={calRemarks}
                  onChange={(e) => setCalRemarks(e.target.value)}
                  rows={2}
                />
              </Field>
            </CardContent>
          </Card>

          {/* Section 2: Measurement Test Parameters Matrix */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle>Measurement Test Matrix</CardTitle>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#F3F4F6] text-[#6B7280] dark:bg-neutral-800 dark:text-neutral-400 border border-[#E5E7EB] dark:border-neutral-700">
                    Optional
                  </span>
                </div>
                <CardDescription>
                  Nominal standard vs observed instrument readings (optional for calibration clearance)
                </CardDescription>
              </div>
              <Button variant="secondary" size="sm" type="button" onClick={handleAddMeasurement}>
                <Plus className="size-4" /> Add Parameter
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {measurements.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#6B7280] dark:text-neutral-400">
                  <p className="mb-1 font-medium text-sm text-[#374151] dark:text-neutral-300">
                    No measurement test parameters added (Optional)
                  </p>
                  <p className="text-[11px] text-[#9CA3AF] mb-3">
                    You can proceed with calibration clearance without matrix parameters, or click below to record readings.
                  </p>
                  <Button variant="secondary" size="sm" type="button" onClick={handleAddMeasurement}>
                    <Plus className="size-3.5 mr-1" /> Add Test Parameter
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#F5F7FA] border-b border-[#E5E7EB] text-[#374151] font-semibold text-xs uppercase">
                      <tr>
                        <th className="px-3 py-3">Parameter</th>
                        <th className="px-3 py-3 w-32">Nominal</th>
                        <th className="px-3 py-3 w-32">Measured</th>
                        <th className="px-3 py-3 w-24">Unit</th>
                        <th className="px-3 py-3 w-28">Tol Min</th>
                        <th className="px-3 py-3 w-28">Tol Max</th>
                        <th className="px-3 py-3 w-24 text-center">Verdict</th>
                        <th className="px-3 py-3 w-12 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {measurements.map((m, idx) => (
                        <tr key={idx} className="hover:bg-[#FAFAFA]">
                          <td className="p-2">
                            <Input
                              placeholder="Parameter (optional)"
                              value={m.parameterName}
                              onChange={(e) =>
                                handleUpdateMeasurement(idx, 'parameterName', e.target.value)
                              }
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
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={m.unit}
                              onChange={(e) => handleUpdateMeasurement(idx, 'unit', e.target.value)}
                              className="w-20"
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
                            />
                          </td>
                          <td className="p-2 text-center">
                            <Badge variant={m.result === 'PASS' ? 'success' : 'error'}>
                              {m.result}
                            </Badge>
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveMeasurement(idx)}
                              className="text-[#DC2626] hover:text-[#b91c1c] p-1 cursor-pointer"
                              title="Remove parameter"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
                {canRecordCalibration ? (
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
                ) : (
                  <span className="text-xs text-[#6B7280] self-center">
                    Read-Only View Mode (Calibration Records Read-Only)
                  </span>
                )}
              </div>
            </CardFooter>
          </Card>
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
                      ₹{currentItemRepair.estimated_cost.toFixed(2)}
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

                {/* Sub-step A: Service Flag Lab Approver Authorization Action */}
                {currentItemRepair.status === 'PENDING_APPROVAL' && (
                  <div className="p-4 bg-white border border-[#CBD5E1] rounded-[4px] space-y-3">
                    <h4 className="font-bold text-sm text-[#1E293B] flex items-center gap-2">
                      <FileCheck className="size-4 text-[#0274BB]" /> Step B: Lab Approver Service Flag Authorization
                    </h4>
                    <p className="text-xs text-[#64748B]">
                      Review defect diagnosis, estimated charges, and authorize service execution:
                    </p>
                    {canApproveServiceFlag ? (
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
                          <Check className="size-4" /> Approve Service Flag &amp; Begin Repair
                        </Button>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-center gap-2">
                        <Clock className="size-4 text-amber-600 shrink-0" />
                        <span>
                          <strong>Service Flag Raised:</strong> Awaiting approval from <strong>Lab Technical Approver</strong> before repair work can commence.
                        </span>
                      </div>
                    )}
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
                    {canRecordCalibration && (
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
                    )}
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
                      <FieldLabel>Estimated Repair Cost (₹ INR)</FieldLabel>
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
                  {canRaiseServiceFlag && (
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={recordRepairMutation.isPending}
                    >
                      <Wrench className="size-4" />
                      {recordRepairMutation.isPending ? 'Logging Repair...' : 'Log Repair Order'}
                    </Button>
                  )}
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setViewingOutsourcePO(currentItemOutsource)}
                      className="flex items-center gap-1.5 text-xs shadow-sm"
                    >
                      <Download className="size-3.5" /> View / Export Vendor PO
                    </Button>
                    <Link to={`/commercial/vendor-pos/${currentItemOutsource.id}`}>
                      <Button variant="outlineInk" size="sm" className="text-xs">
                        Full Page
                      </Button>
                    </Link>
                    <Badge variant={currentItemOutsource.status === 'ACCEPTED' ? 'success' : 'info'}>
                      {currentItemOutsource.status}
                    </Badge>
                  </div>
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
                      ₹{currentItemOutsource.vendor_cost?.toFixed(2) || '0.00'}
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

                    {canManageOutsource && (
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
                    )}
                  </div>
                )}

                {currentItemOutsource.status === 'ACCEPTED' && (
                  <div className="p-4 bg-[#F0FDF4] border border-[#86EFAC] rounded-[4px] flex items-center justify-between">
                    <div className="text-xs text-[#166534]">
                      <strong>Returned &amp; Accepted!</strong> Vendor Certificate: {currentItemOutsource.vendor_certificate_number}
                    </div>
                    <Link to={`/commercial/quotations/new?requestId=${requestId}`}>
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
                      <FieldLabel>Agreed Outsource Calibration Fee (₹ INR)</FieldLabel>
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
                  {canManageOutsource && (
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={createOutsourceMutation.isPending}
                    >
                      <Truck className="size-4" />
                      {createOutsourceMutation.isPending ? 'Issuing PO...' : 'Issue Outsource Vendor PO'}
                    </Button>
                  )}
                </CardFooter>
              </form>
            </Card>
          )}
        </div>
      )}
      {/* Outsource Vendor Purchase Order Preview & PDF Export Modal */}
      {viewingOutsourcePO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-[4px] shadow-2xl max-w-5xl w-full max-h-[94vh] overflow-y-auto border border-[#E5E7EB] flex flex-col">
            <div className="sticky top-0 z-20 flex items-center justify-between p-3 border-b border-[#E5E7EB] bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Truck className="size-5 text-[#0274BB]" />
                <h3 className="font-bold text-[#111827] text-base">
                  Official Vendor Purchase Order — {viewingOutsourcePO.vendor_po_number}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/commercial/vendor-pos/${viewingOutsourcePO.id}`}>
                  <Button variant="secondary" size="sm">
                    Open Full Page
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => setViewingOutsourcePO(null)}
                  className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded hover:bg-[#E2E8F0] cursor-pointer"
                  title="Close Preview"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>
            <div className="p-3 sm:p-6 bg-[#474B4E] overflow-y-auto flex-1">
              <OfficialVendorPOView
                outsourcePO={viewingOutsourcePO}
                vendor={vendors.find((v) => v.id === viewingOutsourcePO.vendor_id)}
                request={request}
                onClose={() => setViewingOutsourcePO(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalibrationPage;
