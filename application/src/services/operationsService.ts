// application/src/services/operationsService.ts
import { supabase } from '../lib/supabaseClient';
import type {
  CalibrationRequest,
  RequestAttachment,
  Verification,
  Calibration,
  Certificate,
  Quotation,
  Dispatch,
  DispatchType,
  DispatchPackageType,
  Delivery,
  RequestPriority,
  ItemCondition,
  VerificationResult,
  CalibrationResult,
  CalibrationOutcome,
  RepairOrder,
  OutsourcePO,
  Invoice,
  InvoiceType,
  InvoiceItem,
  CalibrationDueItem,
} from '../types/domain';

// ============================================================================
// Process 1: Equipment Inward Requests
// ============================================================================

const REQUESTS_STORAGE_PREFIX = 'ccm_tenant_requests_';
const REPAIRS_STORAGE_PREFIX = 'ccm_tenant_repairs_';
const OUTSOURCE_STORAGE_PREFIX = 'ccm_tenant_outsource_';
const CERTIFICATES_STORAGE_PREFIX = 'ccm_tenant_certificates_';
const QUOTATIONS_STORAGE_PREFIX = 'ccm_tenant_quotations_';
const INVOICES_STORAGE_PREFIX = 'ccm_tenant_invoices_';
const DISPATCHES_STORAGE_PREFIX = 'ccm_tenant_dispatches_';
const DELIVERIES_STORAGE_PREFIX = 'ccm_tenant_deliveries_';

export function generateRequestNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `REQ-${dateStr}-${randomSuffix}`;
}

function getLocalRequests(tenantId: string): CalibrationRequest[] {
  try {
    const raw = localStorage.getItem(`${REQUESTS_STORAGE_PREFIX}${tenantId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalRequests(tenantId: string, requests: CalibrationRequest[]): void {
  try {
    localStorage.setItem(`${REQUESTS_STORAGE_PREFIX}${tenantId}`, JSON.stringify(requests));
  } catch (err) {
    console.error('Failed to save requests locally:', err);
  }
}

function getLocalItems<T>(prefix: string, tenantId: string): T[] {
  try {
    const raw = localStorage.getItem(`${prefix}${tenantId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalItems<T>(prefix: string, tenantId: string, items: T[]): void {
  try {
    localStorage.setItem(`${prefix}${tenantId}`, JSON.stringify(items));
  } catch (err) {
    console.error(`Failed to save items to ${prefix}:`, err);
  }
}

export async function getCalibrationRequests(
  tenantId: string,
  organizationId?: string,
  statusFilter?: string
): Promise<CalibrationRequest[]> {
  if (!tenantId) throw new Error('tenantId is required for data isolation');

  try {
    let query = supabase
      .from('calibration_requests')
      .select('*, clients(*), request_items(*, item_masters(*))')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (organizationId) {
      query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
    }

    if (statusFilter && statusFilter !== 'ALL') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (!error && data) {
      return data as CalibrationRequest[];
    }
  } catch (_err) {
    // Fallback to local
  }

  const local = getLocalRequests(tenantId);
  return local.filter((r) => {
    const matchesOrg = !organizationId || !r.organization_id || r.organization_id === organizationId;
    const matchesStatus = !statusFilter || statusFilter === 'ALL' || r.status === statusFilter;
    return matchesOrg && matchesStatus;
  });
}

export async function getCalibrationRequestById(
  requestId: string,
  tenantId: string
): Promise<CalibrationRequest> {
  if (!tenantId || !requestId) throw new Error('tenantId and requestId are required');

  try {
    const { data, error } = await supabase
      .from('calibration_requests')
      .select('*, clients(*), request_items(*, item_masters(*))')
      .eq('id', requestId)
      .eq('tenant_id', tenantId)
      .single();

    if (!error && data) {
      return data as CalibrationRequest;
    }
  } catch (_err) {
    // Fallback
  }

  const local = getLocalRequests(tenantId);
  const found = local.find((r) => r.id === requestId);
  if (!found) {
    throw new Error('Calibration request not found');
  }
  return found;
}

export interface CreateRequestPayload {
  tenantId: string;
  organizationId: string;
  clientId: string;
  collectionDate: string;
  priority: RequestPriority;
  clientPoRef?: string;
  remarks?: string;
  attachments?: RequestAttachment[];
  collector?: { id?: string; name?: string };
  clientData?: any;
  items: {
    itemMasterId: string;
    itemMasterData?: any;
    quantity: number;
    serialNumber?: string;
    accessories?: string;
    itemCondition: ItemCondition;
    remarks?: string;
  }[];
}

export async function getLabQueueRequests(
  tenantId: string,
  organizationId?: string,
  priorityFilter?: string
): Promise<CalibrationRequest[]> {
  const allRequests = await getCalibrationRequests(tenantId, organizationId);

  // Filter for active lab process statuses (Step 6/7/8: Verification, Calibration, In-Lab Repair, Outsource PO)
  const labStatuses = [
    'CREATED',
    'VERIFIED',
    'CALIBRATING',
    'CALIBRATED',
    'FAULTY',
    'REPAIR_IN_PROGRESS',
    'OUTSOURCED',
    'OUTSOURCE_RETURNED',
  ];
  let filtered = allRequests.filter((r) => labStatuses.includes(r.status));

  if (priorityFilter && priorityFilter !== 'ALL') {
    filtered = filtered.filter((r) => r.priority === priorityFilter);
  }

  // Priority-Based Scheduling:
  // 1. URGENT priority work orders must be placed first at the top of the queue
  // 2. Secondary order: FIFO by collection_date ascending (earliest inward first)
  return filtered.sort((a, b) => {
    if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
    if (a.priority !== 'URGENT' && b.priority === 'URGENT') return 1;
    return new Date(a.collection_date).getTime() - new Date(b.collection_date).getTime();
  });
}

export async function createCalibrationRequest(
  payload: CreateRequestPayload
): Promise<CalibrationRequest> {
  if (!payload.tenantId || !payload.organizationId) {
    throw new Error('Triple-Key violation: tenantId and organizationId are required');
  }

  if (!payload.clientId) {
    throw new Error('Client account selection is required');
  }

  if (!payload.collectionDate) {
    throw new Error('Collection date is required');
  }

  if (!payload.items || payload.items.length === 0) {
    throw new Error('At least one equipment line item is required');
  }

  for (let i = 0; i < payload.items.length; i++) {
    const it = payload.items[i];
    if (!it.itemMasterId) {
      throw new Error(`Equipment item at line ${i + 1} is required`);
    }
    if (isNaN(it.quantity) || it.quantity < 1) {
      throw new Error(`Quantity for line ${i + 1} must be at least 1`);
    }
  }

  const { data: user } = await supabase.auth.getUser();
  const requestId = crypto.randomUUID();
  const requestNumber = generateRequestNumber();
  const now = new Date().toISOString();

  const fullItems = payload.items.map((it) => ({
    id: crypto.randomUUID(),
    tenant_id: payload.tenantId,
    organization_id: payload.organizationId,
    request_id: requestId,
    item_master_id: it.itemMasterId,
    serial_number: it.serialNumber?.trim() || undefined,
    accessories: it.accessories?.trim() || undefined,
    quantity: Number(it.quantity),
    received_quantity: 0,
    item_condition: it.itemCondition,
    remarks: it.remarks?.trim() || undefined,
    status: 'ADDED',
    created_at: now,
    item_masters: it.itemMasterData || undefined,
  }));

  const newRequest: CalibrationRequest = {
    id: requestId,
    tenant_id: payload.tenantId,
    organization_id: payload.organizationId,
    request_number: requestNumber,
    client_id: payload.clientId,
    collection_agent_id: payload.collector?.id || user?.user?.id || undefined,
    collection_agent_name: payload.collector?.name || user?.user?.user_metadata?.full_name || 'Collection Executive',
    collection_date: payload.collectionDate,
    priority: payload.priority,
    client_po_ref: payload.clientPoRef?.trim() || undefined,
    remarks: payload.remarks?.trim() || undefined,
    attachments: payload.attachments || [],
    status: 'CREATED',
    created_at: now,
    updated_at: now,
    clients: payload.clientData || undefined,
    request_items: fullItems,
  };

  try {
    // 1. Insert Request
    const { data: req, error: reqError } = await supabase
      .from('calibration_requests')
      .insert({
        id: newRequest.id,
        tenant_id: newRequest.tenant_id,
        organization_id: newRequest.organization_id,
        request_number: newRequest.request_number,
        client_id: newRequest.client_id,
        collection_agent_id: newRequest.collection_agent_id || null,
        collection_date: newRequest.collection_date,
        priority: newRequest.priority,
        remarks: newRequest.remarks || null,
        status: newRequest.status,
      })
      .select()
      .single();

    if (!reqError && req) {
      // 2. Insert Request Items
      const itemRows = fullItems.map((it) => ({
        id: it.id,
        tenant_id: it.tenant_id,
        organization_id: it.organization_id,
        request_id: req.id,
        item_master_id: it.item_master_id,
        quantity: it.quantity,
        received_quantity: 0,
        item_condition: it.item_condition,
        remarks: it.remarks || null,
        status: 'ADDED',
      }));

      await supabase.from('request_items').insert(itemRows);
      return { ...newRequest, ...req };
    }
  } catch (_remoteErr) {
    // Local store fallback
  }

  const existing = getLocalRequests(payload.tenantId);
  saveLocalRequests(payload.tenantId, [newRequest, ...existing]);
  return newRequest;
}

// ============================================================================
// Process 2: Lab Equipment Inspection & Verification
// ============================================================================

export interface RecordVerificationPayload {
  tenantId: string;
  organizationId: string;
  requestId: string;
  requestItemId: string;
  verifiedQuantity: number;
  expectedQuantity: number;
  observedItemCondition: string;
  result: VerificationResult;
  discrepancyReason?: string;
  remarks?: string;
  inspector?: { id?: string; name?: string };
}

export async function recordVerification(payload: RecordVerificationPayload): Promise<Verification> {
  if (!payload.tenantId || !payload.organizationId || !payload.requestId) {
    throw new Error('Triple-Key violation: tenantId, organizationId, and requestId required');
  }

  const { data: user } = await supabase.auth.getUser();
  const verificationId = crypto.randomUUID();
  const now = new Date().toISOString();

  const newVerification: Verification = {
    id: verificationId,
    tenant_id: payload.tenantId,
    organization_id: payload.organizationId,
    request_id: payload.requestId,
    request_item_id: payload.requestItemId,
    verified_by: payload.inspector?.id || user?.user?.id || undefined,
    verified_at: now,
    verified_quantity: payload.verifiedQuantity,
    expected_quantity: payload.expectedQuantity,
    observed_item_condition: payload.observedItemCondition,
    result: payload.result,
    discrepancy_reason: payload.discrepancyReason || undefined,
    remarks: payload.remarks || undefined,
    created_at: now,
  };

  try {
    const { data, error } = await supabase
      .from('verifications')
      .insert({
        id: newVerification.id,
        tenant_id: newVerification.tenant_id,
        organization_id: newVerification.organization_id,
        request_id: newVerification.request_id,
        request_item_id: newVerification.request_item_id,
        verified_by: newVerification.verified_by || null,
        verified_quantity: newVerification.verified_quantity,
        expected_quantity: newVerification.expected_quantity,
        observed_item_condition: newVerification.observed_item_condition,
        result: newVerification.result,
        discrepancy_reason: newVerification.discrepancy_reason || null,
        remarks: newVerification.remarks || null,
      })
      .select()
      .single();

    if (!error && data) {
      // Update request item received quantity and status
      await supabase
        .from('request_items')
        .update({
          received_quantity: payload.verifiedQuantity,
          status: payload.result === 'VERIFIED' ? 'VERIFIED' : 'DISCREPANCY',
        })
        .eq('id', payload.requestItemId);

      // Update calibration request overall status
      const nextStatus = payload.result === 'VERIFIED' ? 'VERIFIED' : 'DISCREPANCY';
      await supabase
        .from('calibration_requests')
        .update({ status: nextStatus })
        .eq('id', payload.requestId);

      return data as Verification;
    }
  } catch (_remoteErr) {
    // Local store fallback
  }

  // Local storage update fallback
  const localRequests = getLocalRequests(payload.tenantId);
  const targetReqIndex = localRequests.findIndex((r) => r.id === payload.requestId);

  if (targetReqIndex !== -1) {
    const targetReq = { ...localRequests[targetReqIndex] };
    const items = targetReq.request_items ? [...targetReq.request_items] : [];
    const itemIndex = items.findIndex((it) => it.id === payload.requestItemId);

    if (itemIndex !== -1) {
      items[itemIndex] = {
        ...items[itemIndex],
        received_quantity: payload.verifiedQuantity,
        item_condition: payload.observedItemCondition as any,
        status: payload.result === 'VERIFIED' ? 'VERIFIED' : 'DISCREPANCY',
      };
    }

    // Determine overall request status
    const allItemsVerified = items.every((it) => it.status === 'VERIFIED');
    const hasDiscrepancy = items.some((it) => it.status === 'DISCREPANCY');

    targetReq.status = hasDiscrepancy ? 'DISCREPANCY' : allItemsVerified ? 'VERIFIED' : 'CREATED';
    targetReq.request_items = items;
    targetReq.updated_at = now;

    localRequests[targetReqIndex] = targetReq;
    saveLocalRequests(payload.tenantId, localRequests);
  }

  return newVerification;
}

// ============================================================================
// Process 3: Metrology Calibration & Certificate Auto-Generation
// ============================================================================

export interface RecordCalibrationPayload {
  tenantId: string;
  organizationId: string;
  requestId: string;
  requestItemId: string;
  nextDueDate: string;
  environmentalTemperature?: number;
  environmentalHumidity?: number;
  result: CalibrationResult;
  outcome?: CalibrationOutcome;
  remarks?: string;
  measurements: {
    parameterName: string;
    nominalValue: number;
    measuredValue: number;
    unit: string;
    toleranceMin: number;
    toleranceMax: number;
    result: 'PASS' | 'FAIL';
  }[];
}

export async function recordCalibration(payload: RecordCalibrationPayload): Promise<Calibration> {
  if (!payload.tenantId || !payload.organizationId || !payload.requestId) {
    throw new Error('Triple-Key violation: tenantId, organizationId, and requestId required');
  }

  const { data: user } = await supabase.auth.getUser();
  const calibrationId = crypto.randomUUID();
  const now = new Date().toISOString();
  const outcome = payload.outcome || (payload.result === 'PASS' ? 'CALIBRATED' : 'FAULTY');

  const newCal: Calibration = {
    id: calibrationId,
    tenant_id: payload.tenantId,
    organization_id: payload.organizationId,
    request_id: payload.requestId,
    request_item_id: payload.requestItemId,
    calibrated_by: user?.user?.id || undefined,
    calibration_date: now,
    next_due_date: payload.nextDueDate,
    environmental_temperature: payload.environmentalTemperature,
    environmental_humidity: payload.environmentalHumidity,
    result: payload.result,
    remarks: payload.remarks,
    created_at: now,
    measurements: payload.measurements.map((m) => ({
      id: crypto.randomUUID(),
      tenant_id: payload.tenantId,
      organization_id: payload.organizationId,
      calibration_id: calibrationId,
      parameter_name: m.parameterName,
      nominal_value: m.nominalValue,
      measured_value: m.measuredValue,
      unit: m.unit,
      tolerance_min: m.toleranceMin,
      tolerance_max: m.toleranceMax,
      result: m.result,
    })),
  };

  try {
    // 1. Remote Supabase Insertion
    const { data: cal, error: calError } = await supabase
      .from('calibrations')
      .insert({
        id: newCal.id,
        tenant_id: payload.tenantId,
        organization_id: payload.organizationId,
        request_id: payload.requestId,
        request_item_id: payload.requestItemId,
        calibrated_by: user?.user?.id || null,
        next_due_date: payload.nextDueDate,
        environmental_temperature: payload.environmentalTemperature || null,
        environmental_humidity: payload.environmentalHumidity || null,
        result: payload.result,
        outcome: outcome,
        remarks: payload.remarks || null,
      })
      .select()
      .single();

    if (!calError && cal) {
      if (payload.measurements.length > 0) {
        const measurementRows = payload.measurements.map((m) => ({
          tenant_id: payload.tenantId,
          organization_id: payload.organizationId,
          calibration_id: cal.id,
          parameter_name: m.parameterName,
          nominal_value: m.nominalValue,
          measured_value: m.measuredValue,
          unit: m.unit,
          tolerance_min: m.toleranceMin,
          tolerance_max: m.toleranceMax,
          result: m.result,
        }));
        await supabase.from('calibration_measurements').insert(measurementRows);
      }

      if (payload.result === 'PASS' || outcome === 'CALIBRATED') {
        const certNum = `CERT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
        await supabase.from('certificates').insert({
          tenant_id: payload.tenantId,
          organization_id: payload.organizationId,
          request_id: payload.requestId,
          calibration_id: cal.id,
          certificate_number: certNum,
          issued_at: now,
          valid_until: payload.nextDueDate,
          status: 'GENERATED',
        });

        await supabase
          .from('calibration_requests')
          .update({ status: 'CALIBRATED' })
          .eq('id', payload.requestId);
      } else if (outcome === 'FAULTY' || payload.result === 'FAIL') {
        await supabase
          .from('calibration_requests')
          .update({ status: 'FAULTY' })
          .eq('id', payload.requestId);
      } else if (outcome === 'OUTSOURCED') {
        await supabase
          .from('calibration_requests')
          .update({ status: 'OUTSOURCED' })
          .eq('id', payload.requestId);
      }

      return cal;
    }
  } catch (_remoteErr) {
    // Fallback to local storage below
  }

  // Local Storage Fallback
  const localRequests = getLocalRequests(payload.tenantId);
  const targetIndex = localRequests.findIndex((r) => r.id === payload.requestId);
  const nextReqStatus =
    payload.result === 'PASS' || outcome === 'CALIBRATED'
      ? 'CALIBRATED'
      : outcome === 'OUTSOURCED'
      ? 'OUTSOURCED'
      : 'FAULTY';

  if (targetIndex !== -1) {
    localRequests[targetIndex].status = nextReqStatus;
    localRequests[targetIndex].updated_at = now;
    if (localRequests[targetIndex].request_items) {
      const itemIdx = localRequests[targetIndex].request_items!.findIndex(
        (it) => it.id === payload.requestItemId
      );
      if (itemIdx !== -1) {
        localRequests[targetIndex].request_items![itemIdx].status =
          payload.result === 'PASS' ? 'CALIBRATED' : outcome;
      }
    }
    saveLocalRequests(payload.tenantId, localRequests);
  }

  // Auto-generate Certificate locally if PASS
  if (payload.result === 'PASS' || outcome === 'CALIBRATED') {
    const certNum = `CERT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const newCert: Certificate = {
      id: crypto.randomUUID(),
      tenant_id: payload.tenantId,
      organization_id: payload.organizationId,
      request_id: payload.requestId,
      calibration_id: newCal.id,
      certificate_number: certNum,
      issued_at: now,
      valid_until: payload.nextDueDate,
      status: 'GENERATED',
      created_at: now,
    };
    const localCerts = getLocalItems<Certificate>(CERTIFICATES_STORAGE_PREFIX, payload.tenantId);
    saveLocalItems(CERTIFICATES_STORAGE_PREFIX, payload.tenantId, [newCert, ...localCerts]);
  }

  return newCal;
}

// ----------------------------------------------------------------------------
// Certificates & Next Due Date Trigger
// ----------------------------------------------------------------------------

export async function getCertificates(tenantId: string, requestId?: string): Promise<Certificate[]> {
  if (!tenantId) throw new Error('tenantId is required');

  try {
    let query = supabase.from('certificates').select('*').eq('tenant_id', tenantId);
    if (requestId) {
      query = query.eq('request_id', requestId);
    }
    const { data, error } = await query;
    if (!error && data) {
      return data as Certificate[];
    }
  } catch (_err) {
    // Fallback
  }

  const local = getLocalItems<Certificate>(CERTIFICATES_STORAGE_PREFIX, tenantId);
  return requestId ? local.filter((c) => c.request_id === requestId) : local;
}

// ----------------------------------------------------------------------------
// Branch 1: In-Lab (Inside) Repair & Faulty Service Operations
// ----------------------------------------------------------------------------

export interface RecordRepairPayload {
  tenantId: string;
  organizationId: string;
  requestId: string;
  requestItemId: string;
  defectDescription: string;
  repairServiceRequired: string;
  estimatedCost: number;
  partsRequired?: string;
  technicianNotes?: string;
}

export async function recordRepairOrder(payload: RecordRepairPayload): Promise<RepairOrder> {
  const now = new Date().toISOString();
  const repairId = crypto.randomUUID();

  const newRepair: RepairOrder = {
    id: repairId,
    tenant_id: payload.tenantId,
    organization_id: payload.organizationId,
    request_id: payload.requestId,
    request_item_id: payload.requestItemId,
    defect_description: payload.defectDescription,
    repair_service_required: payload.repairServiceRequired,
    estimated_cost: payload.estimatedCost,
    parts_required: payload.partsRequired,
    client_approval_status: 'PENDING',
    technician_notes: payload.technicianNotes,
    status: 'PENDING_APPROVAL',
    created_at: now,
  };

  // Update request status to FAULTY / REPAIR
  const localReqs = getLocalRequests(payload.tenantId);
  const rIdx = localReqs.findIndex((r) => r.id === payload.requestId);
  if (rIdx !== -1) {
    localReqs[rIdx].status = 'FAULTY';
    localReqs[rIdx].updated_at = now;
    saveLocalRequests(payload.tenantId, localReqs);
  }

  const existing = getLocalItems<RepairOrder>(REPAIRS_STORAGE_PREFIX, payload.tenantId);
  saveLocalItems(REPAIRS_STORAGE_PREFIX, payload.tenantId, [newRepair, ...existing]);

  try {
    await supabase.from('calibration_requests').update({ status: 'FAULTY' }).eq('id', payload.requestId);
  } catch {
    // local fallback already handled
  }

  return newRepair;
}

export interface ApproveRepairPayload {
  tenantId: string;
  repairId: string;
  requestId: string;
  approved: boolean;
  clientPoRef?: string;
}

export async function approveRepairOrder(payload: ApproveRepairPayload): Promise<RepairOrder> {
  const now = new Date().toISOString();
  const existing = getLocalItems<RepairOrder>(REPAIRS_STORAGE_PREFIX, payload.tenantId);
  const idx = existing.findIndex((r) => r.id === payload.repairId);

  if (idx === -1) {
    throw new Error('Repair order not found');
  }

  const updated: RepairOrder = {
    ...existing[idx],
    client_approval_status: payload.approved ? 'APPROVED' : 'REJECTED',
    client_approved_at: now,
    client_po_ref: payload.clientPoRef || existing[idx].client_po_ref,
    status: payload.approved ? 'IN_PROGRESS' : 'CANCELLED',
  };

  existing[idx] = updated;
  saveLocalItems(REPAIRS_STORAGE_PREFIX, payload.tenantId, existing);

  // Update request status to REPAIR_IN_PROGRESS
  const localReqs = getLocalRequests(payload.tenantId);
  const rIdx = localReqs.findIndex((r) => r.id === payload.requestId);
  if (rIdx !== -1) {
    localReqs[rIdx].status = payload.approved ? 'REPAIR_IN_PROGRESS' : 'FAULTY';
    localReqs[rIdx].updated_at = now;
    saveLocalRequests(payload.tenantId, localReqs);
  }

  return updated;
}

export interface CompleteRepairPayload {
  tenantId: string;
  repairId: string;
  requestId: string;
  technicianNotes?: string;
}

export async function completeRepairOrder(payload: CompleteRepairPayload): Promise<RepairOrder> {
  const now = new Date().toISOString();
  const existing = getLocalItems<RepairOrder>(REPAIRS_STORAGE_PREFIX, payload.tenantId);
  const idx = existing.findIndex((r) => r.id === payload.repairId);

  if (idx === -1) {
    throw new Error('Repair order not found');
  }

  const updated: RepairOrder = {
    ...existing[idx],
    status: 'COMPLETED',
    completed_at: now,
    technician_notes: payload.technicianNotes || existing[idx].technician_notes,
  };

  existing[idx] = updated;
  saveLocalItems(REPAIRS_STORAGE_PREFIX, payload.tenantId, existing);

  // Ready to re-calibrate! Set status back to VERIFIED
  const localReqs = getLocalRequests(payload.tenantId);
  const rIdx = localReqs.findIndex((r) => r.id === payload.requestId);
  if (rIdx !== -1) {
    localReqs[rIdx].status = 'VERIFIED';
    localReqs[rIdx].updated_at = now;
    saveLocalRequests(payload.tenantId, localReqs);
  }

  return updated;
}

export async function getRepairs(tenantId: string, requestId?: string): Promise<RepairOrder[]> {
  const local = getLocalItems<RepairOrder>(REPAIRS_STORAGE_PREFIX, tenantId);
  return requestId ? local.filter((r) => r.request_id === requestId) : local;
}

// ----------------------------------------------------------------------------
// Branch 2: Outsource / Vendor Purchase Order (PO) Operations
// ----------------------------------------------------------------------------

export interface CreateOutsourcePOPayload {
  tenantId: string;
  organizationId: string;
  requestId: string;
  requestItemId: string;
  vendorId: string;
  vendorName?: string;
  vendorCost?: number;
  expectedReturnDate?: string;
  remarks?: string;
  paymentTerms?: string;
  dispatchedThrough?: string;
  destination?: string;
  termsOfDelivery?: string;
  items?: Array<{
    id?: string;
    description: string;
    dueOn?: string;
    quantity: number;
    unitRate: number;
    per?: string;
    totalPrice: number;
  }>;
}

export async function createOutsourcePO(payload: CreateOutsourcePOPayload): Promise<OutsourcePO> {
  const now = new Date().toISOString();
  const poId = crypto.randomUUID();
  const randomVoucher = String(Math.floor(200000 + Math.random() * 800000));
  const poNumber = `VPO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const items = payload.items?.map((it) => ({
    id: it.id || crypto.randomUUID(),
    description: it.description,
    due_on: it.dueOn || payload.expectedReturnDate,
    quantity: it.quantity || 1,
    unit_rate: it.unitRate,
    per: it.per || 'NOS',
    total_price: it.totalPrice,
  }));

  const subtotal = items && items.length > 0
    ? items.reduce((sum, it) => sum + it.total_price, 0)
    : payload.vendorCost || 0;
  const cgstAmount = Math.round(subtotal * 0.09 * 100) / 100;
  const sgstAmount = Math.round(subtotal * 0.09 * 100) / 100;
  const totalAmount = Math.round(subtotal + cgstAmount + sgstAmount);

  const newOutsource: OutsourcePO = {
    id: poId,
    tenant_id: payload.tenantId,
    organization_id: payload.organizationId,
    request_id: payload.requestId,
    request_item_id: payload.requestItemId,
    vendor_id: payload.vendorId,
    vendor_name: payload.vendorName || 'Outsource Calibration Lab',
    vendor_po_number: poNumber,
    voucher_no: randomVoucher,
    sent_date: now,
    expected_return_date: payload.expectedReturnDate,
    vendor_cost: payload.vendorCost || subtotal,
    remarks: payload.remarks,
    status: 'SENT',
    created_at: now,
    payment_terms: payload.paymentTerms || '30 Days',
    dispatched_through: payload.dispatchedThrough || 'By Hand',
    destination: payload.destination || 'Chennai',
    terms_of_delivery: payload.termsOfDelivery,
    items,
    subtotal,
    cgst_amount: cgstAmount,
    sgst_amount: sgstAmount,
    total_amount: totalAmount,
  };

  const existing = getLocalItems<OutsourcePO>(OUTSOURCE_STORAGE_PREFIX, payload.tenantId);
  saveLocalItems(OUTSOURCE_STORAGE_PREFIX, payload.tenantId, [newOutsource, ...existing]);

  // Update request status to OUTSOURCED
  const localReqs = getLocalRequests(payload.tenantId);
  const rIdx = localReqs.findIndex((r) => r.id === payload.requestId);
  if (rIdx !== -1) {
    localReqs[rIdx].status = 'OUTSOURCED';
    localReqs[rIdx].updated_at = now;
    saveLocalRequests(payload.tenantId, localReqs);
  }

  return newOutsource;
}

export interface ReceiveOutsourceReturnPayload {
  tenantId: string;
  organizationId: string;
  outsourceId: string;
  requestId: string;
  vendorCertificateNumber: string;
  nextDueDate: string;
  remarks?: string;
}

export async function receiveOutsourceReturn(payload: ReceiveOutsourceReturnPayload): Promise<OutsourcePO> {
  const now = new Date().toISOString();
  const existing = getLocalItems<OutsourcePO>(OUTSOURCE_STORAGE_PREFIX, payload.tenantId);
  const idx = existing.findIndex((o) => o.id === payload.outsourceId);

  if (idx === -1) {
    throw new Error('Outsource PO record not found');
  }

  const updated: OutsourcePO = {
    ...existing[idx],
    status: 'ACCEPTED',
    received_date: now,
    vendor_certificate_number: payload.vendorCertificateNumber,
    remarks: payload.remarks || existing[idx].remarks,
  };

  existing[idx] = updated;
  saveLocalItems(OUTSOURCE_STORAGE_PREFIX, payload.tenantId, existing);

  // Auto-generate Certificate & Next Due Date trigger
  const certNum = `CERT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const newCert: Certificate = {
    id: crypto.randomUUID(),
    tenant_id: payload.tenantId,
    organization_id: payload.organizationId,
    request_id: payload.requestId,
    calibration_id: existing[idx].id,
    certificate_number: certNum,
    issued_at: now,
    valid_until: payload.nextDueDate,
    status: 'GENERATED',
    created_at: now,
  };
  const localCerts = getLocalItems<Certificate>(CERTIFICATES_STORAGE_PREFIX, payload.tenantId);
  saveLocalItems(CERTIFICATES_STORAGE_PREFIX, payload.tenantId, [newCert, ...localCerts]);

  // Advance request to CALIBRATED
  const localReqs = getLocalRequests(payload.tenantId);
  const rIdx = localReqs.findIndex((r) => r.id === payload.requestId);
  if (rIdx !== -1) {
    localReqs[rIdx].status = 'CALIBRATED';
    localReqs[rIdx].updated_at = now;
    saveLocalRequests(payload.tenantId, localReqs);
  }

  return updated;
}

export async function getOutsourcePOs(tenantId: string, requestId?: string): Promise<OutsourcePO[]> {
  let local = getLocalItems<OutsourcePO>(OUTSOURCE_STORAGE_PREFIX, tenantId);
  if (!local || local.length === 0) {
    const samplePO: OutsourcePO = {
      id: 'po-262742',
      tenant_id: tenantId,
      organization_id: 'default-org',
      request_id: 'req-sample-1',
      request_item_id: 'item-sample-1',
      vendor_id: 'vendor-hitech',
      vendor_name: 'Hi Tech Calibration Services - Unit I',
      vendor_po_number: 'PO-2024-262742',
      voucher_no: '262742',
      sent_date: '2024-03-22',
      expected_return_date: '2024-04-05',
      vendor_cost: 6400,
      payment_terms: '30 Days',
      dispatched_through: 'By Hand',
      destination: 'Chennai',
      terms_of_delivery: 'Door Delivery',
      status: 'SENT',
      created_at: '2024-03-22T10:00:00.000Z',
      items: [
        {
          id: 'item-1',
          description: 'Calibration Charges - Hydrometer (Aviation)',
          due_on: '17-Aug-26',
          quantity: 4,
          unit_rate: 1200,
          per: 'NOS',
          total_price: 4800,
        },
        {
          id: 'item-2',
          description: 'Calibration Charges - Spirit Level (Met Auto)',
          due_on: '17-Aug-26',
          quantity: 2,
          unit_rate: 800,
          per: 'NOS',
          total_price: 1600,
        },
      ],
      subtotal: 6400,
      cgst_amount: 576,
      sgst_amount: 576,
      total_amount: 7552,
    };
    local = [samplePO];
    saveLocalItems(OUTSOURCE_STORAGE_PREFIX, tenantId, local);
  }
  return requestId ? local.filter((o) => o.request_id === requestId) : local;
}

// ============================================================================
// Process 4: Commercial Quotations, Approvals & Invoicing
// ============================================================================

export async function getQuotations(tenantId: string, organizationId?: string): Promise<Quotation[]> {
  if (!tenantId) throw new Error('tenantId is required');

  try {
    let query = supabase
      .from('quotations')
      .select('*, quotation_items(*)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data as Quotation[];
    }
  } catch (_err) {
    // Fallback
  }

  let local = getLocalItems<Quotation>(QUOTATIONS_STORAGE_PREFIX, tenantId);
  if (!local || local.length === 0) {
    const sampleQuote: Quotation = {
      id: 'quot-tcc-1557',
      tenant_id: tenantId,
      organization_id: organizationId || 'default-org',
      request_id: 'req-sample-spirax',
      quotation_number: 'QT-2026-1557',
      reference_no: 'TCC/CQ/26-27/1557',
      quotation_date: '09.03.2026',
      kind_attn: 'Mr. TAMILANTHI',
      phone_no: '6379891153',
      subject: 'Quotation for Calibration Charges for Instruments and Gauges - Reg.',
      enquiry_ref: 'verbal 31.08.2026',
      subtotal: 53250,
      discount: 0,
      tax_amount: 9585,
      total_amount: 62835,
      status: 'APPROVED',
      client_po_ref: 'PO/2026/SP-091',
      created_at: '2026-03-09T10:30:00.000Z',
      items: [
        {
          id: 'q-item-1',
          quotation_id: 'quot-tcc-1557',
          description: 'Pressure Gauge',
          range: '0-16bar',
          quantity: 45,
          unit_price: 200,
          total_price: 9000,
        },
        {
          id: 'q-item-2',
          quotation_id: 'quot-tcc-1557',
          description: 'Pressure Gauge',
          range: '16-200bar',
          quantity: 55,
          unit_price: 250,
          total_price: 13750,
        },
        {
          id: 'q-item-3',
          quotation_id: 'quot-tcc-1557',
          description: 'Pressure Gauge',
          range: 'Above 200bar',
          quantity: 30,
          unit_price: 300,
          total_price: 9000,
        },
        {
          id: 'q-item-4',
          quotation_id: 'quot-tcc-1557',
          description: 'Pressure Transducer',
          range: 'Upto 16bar',
          quantity: 10,
          unit_price: 200,
          total_price: 2000,
        },
        {
          id: 'q-item-5',
          quotation_id: 'quot-tcc-1557',
          description: 'Pressure Transducer',
          range: '16-200bar',
          quantity: 20,
          unit_price: 250,
          total_price: 5000,
        },
        {
          id: 'q-item-6',
          quotation_id: 'quot-tcc-1557',
          description: 'Pressure Transducer',
          range: '200bar',
          quantity: 15,
          unit_price: 300,
          total_price: 4500,
        },
        {
          id: 'q-item-7',
          quotation_id: 'quot-tcc-1557',
          description: 'Onsite calibration charges / Day for 2 persons',
          range: '',
          quantity: 10,
          unit_price: 1000,
          total_price: 10000,
        },
      ],
    };
    local = [sampleQuote];
    saveLocalItems(QUOTATIONS_STORAGE_PREFIX, tenantId, local);
  }
  return local;
}

export interface CreateQuotationPayload {
  tenantId: string;
  organizationId: string;
  requestId: string;
  referenceNo?: string;
  quotationDate?: string;
  kindAttn?: string;
  phoneNo?: string;
  subject?: string;
  enquiryRef?: string;
  subtotal: number;
  discount: number;
  taxAmount: number;
  totalAmount: number;
  items: {
    description: string;
    range?: string;
    remarks?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

export async function createQuotation(payload: CreateQuotationPayload): Promise<Quotation> {
  if (!payload.tenantId || !payload.organizationId || !payload.requestId) {
    throw new Error('Triple-Key violation: tenantId, organizationId, and requestId required');
  }

  const quoteNumber = `QT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const now = new Date().toISOString();
  const quoteId = crypto.randomUUID();

  const newQuote: Quotation = {
    id: quoteId,
    tenant_id: payload.tenantId,
    organization_id: payload.organizationId,
    request_id: payload.requestId,
    quotation_number: quoteNumber,
    reference_no: payload.referenceNo || `TCC/CQ/${new Date().getFullYear().toString().slice(-2)}-${(new Date().getFullYear() + 1).toString().slice(-2)}/${Math.floor(1000 + Math.random() * 9000)}`,
    quotation_date: payload.quotationDate,
    kind_attn: payload.kindAttn,
    phone_no: payload.phoneNo,
    subject: payload.subject || 'Quotation for Calibration Charges for Instruments and Gauges - Reg.',
    enquiry_ref: payload.enquiryRef,
    subtotal: payload.subtotal,
    discount: payload.discount,
    tax_amount: payload.taxAmount,
    total_amount: payload.totalAmount,
    status: 'DRAFT',
    created_at: now,
    items: payload.items.map((it) => ({
      id: crypto.randomUUID(),
      quotation_id: quoteId,
      description: it.description,
      range: it.range,
      remarks: it.remarks,
      quantity: it.quantity,
      unit_price: it.unitPrice,
      total_price: it.totalPrice,
    })),
  };

  try {
    const { data: quote, error: quoteError } = await supabase
      .from('quotations')
      .insert({
        id: newQuote.id,
        tenant_id: payload.tenantId,
        organization_id: payload.organizationId,
        request_id: payload.requestId,
        quotation_number: quoteNumber,
        subtotal: payload.subtotal,
        discount: payload.discount,
        tax_amount: payload.taxAmount,
        total_amount: payload.totalAmount,
        status: 'DRAFT',
      })
      .select()
      .single();

    if (!quoteError && quote) {
      if (payload.items.length > 0) {
        const itemRows = payload.items.map((it) => ({
          quotation_id: quote.id,
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          total_price: it.totalPrice,
        }));
        await supabase.from('quotation_items').insert(itemRows);
      }
      return { ...newQuote, ...quote };
    }
  } catch (_remoteErr) {
    // Fallback
  }

  const existing = getLocalItems<Quotation>(QUOTATIONS_STORAGE_PREFIX, payload.tenantId);
  saveLocalItems(QUOTATIONS_STORAGE_PREFIX, payload.tenantId, [newQuote, ...existing]);

  const localReqs = getLocalRequests(payload.tenantId);
  const rIdx = localReqs.findIndex((r) => r.id === payload.requestId);
  if (rIdx !== -1) {
    localReqs[rIdx].status = 'QUOTATION';
    localReqs[rIdx].updated_at = now;
    saveLocalRequests(payload.tenantId, localReqs);
  }

  return newQuote;
}

export interface ApproveQuotationPayload {
  tenantId: string;
  quotationId: string;
  requestId: string;
  approved: boolean;
  clientPoRef?: string;
  approverNotes?: string;
}

export async function approveQuotation(payload: ApproveQuotationPayload): Promise<Quotation> {
  const now = new Date().toISOString();
  const existing = getLocalItems<Quotation>(QUOTATIONS_STORAGE_PREFIX, payload.tenantId);
  const idx = existing.findIndex((q) => q.id === payload.quotationId);

  if (idx !== -1) {
    existing[idx] = {
      ...existing[idx],
      status: payload.approved ? 'APPROVED' : 'REJECTED',
      client_po_ref: payload.clientPoRef,
      approver_notes: payload.approverNotes,
      approved_at: now,
    };
    saveLocalItems(QUOTATIONS_STORAGE_PREFIX, payload.tenantId, existing);
  }

  // Update request status to APPROVED
  const localReqs = getLocalRequests(payload.tenantId);
  const rIdx = localReqs.findIndex((r) => r.id === payload.requestId);
  if (rIdx !== -1) {
    localReqs[rIdx].status = payload.approved ? 'APPROVED' : 'QUOTATION';
    if (payload.clientPoRef) {
      localReqs[rIdx].client_po_ref = payload.clientPoRef;
    }
    localReqs[rIdx].updated_at = now;
    saveLocalRequests(payload.tenantId, localReqs);
  }

  return idx !== -1 ? existing[idx] : ({} as Quotation);
}

export interface CreateInvoicePayload {
  tenantId: string;
  organizationId: string;
  quotationId?: string;
  requestId: string;
  clientId: string;
  clientPoRef?: string;
  invoiceType?: InvoiceType;
  selectedItemIds?: string[];
  itemIds?: string[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  items?: {
    quotationItemId?: string;
    requestItemId?: string;
    description: string;
    hsnSacCode?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

export async function createInvoice(payload: CreateInvoicePayload): Promise<Invoice> {
  const now = new Date().toISOString();
  const invoiceId = crypto.randomUUID();
  const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const invoiceType: InvoiceType = payload.invoiceType || 'ACTUAL';

  const localReqs = getLocalRequests(payload.tenantId);
  const rIdx = localReqs.findIndex((r) => r.id === payload.requestId);

  const existingQuotations = payload.quotationId
    ? getLocalItems<Quotation>(QUOTATIONS_STORAGE_PREFIX, payload.tenantId)
    : [];
  const qIdx = payload.quotationId ? existingQuotations.findIndex((q) => q.id === payload.quotationId) : -1;

  const selectedIds = new Set(
    payload.selectedItemIds ||
      payload.itemIds ||
      (payload.items || []).map((it) => it.quotationItemId || it.requestItemId).filter(Boolean)
  );

  let invoiceItems: InvoiceItem[] = (payload.items || []).map((it) => ({
    id: crypto.randomUUID(),
    invoice_id: invoiceId,
    quotation_item_id: it.quotationItemId || it.requestItemId || '',
    description: it.description,
    hsn_sac_code: it.hsnSacCode || '998346',
    quantity: it.quantity,
    unit_price: it.unitPrice,
    unit_rate: it.unitPrice,
    total_price: it.totalPrice,
  }));

  // If items wasn't explicitly passed, retrieve from existing quotation or direct calibration request
  if (invoiceItems.length === 0) {
    if (qIdx !== -1) {
      const quote = existingQuotations[qIdx];
      if (quote.items) {
        invoiceItems = quote.items
          .filter((it) => selectedIds.size === 0 || selectedIds.has(it.id))
          .map((it) => ({
            id: crypto.randomUUID(),
            invoice_id: invoiceId,
            quotation_item_id: it.id,
            description: it.description,
            quantity: it.quantity,
            unit_price: it.unit_price,
            unit_rate: it.unit_price,
            total_price: it.total_price,
          }));
      }
    } else if (rIdx !== -1) {
      // Direct invoicing from Calibration Request without quotation
      const req = localReqs[rIdx];
      if (req.request_items) {
        invoiceItems = req.request_items
          .filter((it) => selectedIds.size === 0 || selectedIds.has(it.id))
          .map((it) => {
            const itemName = it.item_masters?.item_name || `Calibrated Instrument (SN: ${it.serial_number || 'N/A'})`;
            const cost = it.item_masters?.standard_cost || 100;
            const qty = it.received_quantity || it.quantity || 1;
            return {
              id: crypto.randomUUID(),
              invoice_id: invoiceId,
              quotation_item_id: it.id,
              description: itemName,
              quantity: qty,
              unit_price: cost,
              unit_rate: cost,
              total_price: qty * cost,
            };
          });
      }
    }
  }

  const newInvoice: Invoice = {
    id: invoiceId,
    tenant_id: payload.tenantId,
    organization_id: payload.organizationId,
    request_id: payload.requestId,
    quotation_id: payload.quotationId,
    client_id: payload.clientId,
    invoice_number: invoiceNumber,
    invoice_type: invoiceType,
    invoice_date: now,
    subtotal: payload.subtotal,
    discount_amount: payload.discountAmount,
    tax_amount: payload.taxAmount,
    total_amount: payload.totalAmount,
    client_po_ref: payload.clientPoRef,
    invoice_status: 'ISSUED',
    items: invoiceItems,
    created_at: now,
  };

  const existingInvoices = getLocalItems<Invoice>(INVOICES_STORAGE_PREFIX, payload.tenantId);
  saveLocalItems(INVOICES_STORAGE_PREFIX, payload.tenantId, [newInvoice, ...existingInvoices]);

  // Update Quotation line items if quotation was used
  let allQuotationItemsInvoiced = true;

  if (qIdx !== -1) {
    const quote = existingQuotations[qIdx];

    if (quote.items && quote.items.length > 0) {
      quote.items = quote.items.map((it) => {
        if (selectedIds.has(it.id)) {
          return {
            ...it,
            invoiced: true,
            invoice_id: invoiceId,
            invoice_number: invoiceNumber,
          };
        }
        return it;
      });

      allQuotationItemsInvoiced = quote.items.every((it) => it.invoiced);
    } else {
      allQuotationItemsInvoiced = invoiceType === 'ACTUAL';
    }

    quote.status = allQuotationItemsInvoiced ? 'INVOICED' : 'PARTIALLY_INVOICED';
    existingQuotations[qIdx] = quote;
    saveLocalItems(QUOTATIONS_STORAGE_PREFIX, payload.tenantId, existingQuotations);
  }

  // Update Request and Request Items state
  if (rIdx !== -1) {
    let allReqItemsInvoiced = invoiceType === 'ACTUAL';
    if (localReqs[rIdx].request_items) {
      localReqs[rIdx].request_items = localReqs[rIdx].request_items!.map((it: any) => {
        if (selectedIds.has(it.id)) {
          return {
            ...it,
            invoiced: true,
            invoice_id: invoiceId,
            invoice_number: invoiceNumber,
          };
        }
        return it;
      });

      allReqItemsInvoiced = localReqs[rIdx].request_items!.every((it: any) => it.invoiced);
    }

    const isFullyInvoiced =
      payload.invoiceType === 'ACTUAL' ||
      (qIdx !== -1 ? allQuotationItemsInvoiced : allReqItemsInvoiced);

    localReqs[rIdx].status = isFullyInvoiced ? 'INVOICED' : 'PARTIALLY_INVOICED';
    if (payload.clientPoRef && !localReqs[rIdx].client_po_ref) {
      localReqs[rIdx].client_po_ref = payload.clientPoRef;
    }
    localReqs[rIdx].updated_at = now;
    saveLocalRequests(payload.tenantId, localReqs);
  }

  return newInvoice;
}

export async function getInvoices(tenantId: string, organizationId?: string): Promise<Invoice[]> {
  if (!tenantId) throw new Error('tenantId is required');
  const local = getLocalItems<Invoice>(INVOICES_STORAGE_PREFIX, tenantId);
  return organizationId ? local.filter((i) => !i.organization_id || i.organization_id === organizationId) : local;
}

export interface UpdateInvoicePayload {
  id: string;
  tenantId: string;
  items?: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  clientPoRef?: string;
}

export async function updateInvoice(payload: UpdateInvoicePayload): Promise<Invoice> {
  if (!payload.id || !payload.tenantId) {
    throw new Error('Triple-Key violation: invoice id and tenantId required');
  }

  const existingInvoices = getLocalItems<Invoice>(INVOICES_STORAGE_PREFIX, payload.tenantId);
  const idx = existingInvoices.findIndex((i) => i.id === payload.id);
  if (idx === -1) {
    throw new Error(`Invoice with ID "${payload.id}" not found`);
  }

  const current = existingInvoices[idx];
  const updatedInvoice: Invoice = {
    ...current,
    items: payload.items ?? current.items,
    subtotal: payload.subtotal,
    discount_amount: payload.discountAmount,
    tax_amount: payload.taxAmount,
    total_amount: payload.totalAmount,
    client_po_ref: payload.clientPoRef !== undefined ? payload.clientPoRef : current.client_po_ref,
  };

  existingInvoices[idx] = updatedInvoice;
  saveLocalItems(INVOICES_STORAGE_PREFIX, payload.tenantId, existingInvoices);

  try {
    await supabase
      .from('invoices')
      .update({
        subtotal: updatedInvoice.subtotal,
        discount_amount: updatedInvoice.discount_amount,
        tax_amount: updatedInvoice.tax_amount,
        total_amount: updatedInvoice.total_amount,
        client_po_ref: updatedInvoice.client_po_ref,
      })
      .eq('id', payload.id)
      .eq('tenant_id', payload.tenantId);
  } catch {
    // fallback
  }

  return updatedInvoice;
}

// ============================================================================
// Process 5: Gate Pass Dispatch & Delivery
// ============================================================================

export async function getDispatches(tenantId: string, organizationId?: string): Promise<Dispatch[]> {
  if (!tenantId) throw new Error('tenantId is required');
  const local = getLocalItems<Dispatch>(DISPATCHES_STORAGE_PREFIX, tenantId);
  if (local.length > 0) {
    return organizationId ? local.filter((d) => !d.organization_id || d.organization_id === organizationId) : local;
  }

  try {
    let query = supabase
      .from('dispatches')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) return data;
  } catch {
    // fallback to local
  }
  return organizationId ? local.filter((d) => !d.organization_id || d.organization_id === organizationId) : local;
}

export interface CreateDispatchPayload {
  tenantId: string;
  organizationId: string;
  requestId: string;
  dispatchType?: DispatchType;
  packageType?: DispatchPackageType;
  courierPartner?: string;
  trackingNumber?: string;
  collectionAgentName?: string;
  collectionAgentPhone?: string;
  clientSignature?: string;
  invoiceId?: string;
  recipientName: string;
  recipientPhone?: string;
}

export async function createDispatch(payload: CreateDispatchPayload): Promise<Dispatch> {
  if (!payload.tenantId || !payload.organizationId || !payload.requestId) {
    throw new Error('Triple-Key violation: tenantId, organizationId, and requestId required');
  }

  const now = new Date().toISOString();
  const dispatchId = crypto.randomUUID();
  const gatePassNumber = `GP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newDispatch: Dispatch = {
    id: dispatchId,
    tenant_id: payload.tenantId,
    organization_id: payload.organizationId,
    request_id: payload.requestId,
    gate_pass_number: gatePassNumber,
    dispatch_type: payload.dispatchType || (payload.courierPartner ? 'COURIER' : 'COLLECTION_AGENT'),
    package_type: payload.packageType || 'ITEMS_AND_INVOICE',
    courier_partner: payload.courierPartner || undefined,
    tracking_number: payload.trackingNumber || undefined,
    collection_agent_name: payload.collectionAgentName || undefined,
    collection_agent_phone: payload.collectionAgentPhone || undefined,
    client_signature: payload.clientSignature || undefined,
    invoice_id: payload.invoiceId || undefined,
    recipient_name: payload.recipientName,
    recipient_phone: payload.recipientPhone || undefined,
    dispatched_by: payload.collectionAgentName || 'Operator',
    dispatch_date: now,
    status: 'DISPATCHED',
    created_at: now,
  };

  const existing = getLocalItems<Dispatch>(DISPATCHES_STORAGE_PREFIX, payload.tenantId);
  saveLocalItems(DISPATCHES_STORAGE_PREFIX, payload.tenantId, [newDispatch, ...existing]);

  // Update request status to DISPATCHED
  const localReqs = getLocalRequests(payload.tenantId);
  const rIdx = localReqs.findIndex((r) => r.id === payload.requestId);
  if (rIdx !== -1) {
    localReqs[rIdx].status = 'DISPATCHED';
    localReqs[rIdx].updated_at = now;
    saveLocalRequests(payload.tenantId, localReqs);
  }

  try {
    await supabase.from('dispatches').insert({
      tenant_id: payload.tenantId,
      organization_id: payload.organizationId,
      request_id: payload.requestId,
      gate_pass_number: gatePassNumber,
      courier_partner: payload.courierPartner || null,
      tracking_number: payload.trackingNumber || null,
      recipient_name: payload.recipientName,
      recipient_phone: payload.recipientPhone || null,
      status: 'DISPATCHED',
    });
    await supabase.from('calibration_requests').update({ status: 'DISPATCHED' }).eq('id', payload.requestId);
  } catch {
    // fallback gracefully
  }

  return newDispatch;
}

export async function getDeliveries(tenantId: string, organizationId?: string): Promise<Delivery[]> {
  if (!tenantId) throw new Error('tenantId is required');
  const local = getLocalItems<Delivery>(DELIVERIES_STORAGE_PREFIX, tenantId);
  return organizationId ? local.filter((d) => !d.organization_id || d.organization_id === organizationId) : local;
}

export async function updateDispatchStatus(
  tenantId: string,
  dispatchId: string,
  status: 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED'
): Promise<Dispatch> {
  const localDispatches = getLocalItems<Dispatch>(DISPATCHES_STORAGE_PREFIX, tenantId);
  const dIdx = localDispatches.findIndex((d) => d.id === dispatchId);
  if (dIdx === -1) throw new Error('Dispatch not found');

  localDispatches[dIdx].status = status;
  saveLocalItems(DISPATCHES_STORAGE_PREFIX, tenantId, localDispatches);

  try {
    await supabase.from('dispatches').update({ status }).eq('id', dispatchId);
  } catch {
    // fallback
  }

  return localDispatches[dIdx];
}

export interface RecordDeliveryPayload {
  tenantId: string;
  organizationId: string;
  dispatchId: string;
  receivedBy: string;
  recipientPhone?: string;
  signature?: string;
  remarks?: string;
}

export async function recordDelivery(payload: RecordDeliveryPayload): Promise<Delivery> {
  if (!payload.tenantId || !payload.dispatchId || !payload.receivedBy) {
    throw new Error('tenantId, dispatchId, and receivedBy are required');
  }

  const now = new Date().toISOString();
  const deliveryId = crypto.randomUUID();

  // Find dispatch to get request_id
  const localDispatches = getLocalItems<Dispatch>(DISPATCHES_STORAGE_PREFIX, payload.tenantId);
  const dIdx = localDispatches.findIndex((d) => d.id === payload.dispatchId);
  let requestId = '';

  if (dIdx !== -1) {
    localDispatches[dIdx].status = 'DELIVERED';
    if (payload.signature) {
      localDispatches[dIdx].client_signature = payload.signature;
    }
    localDispatches[dIdx].recipient_name = payload.receivedBy;
    if (payload.recipientPhone) {
      localDispatches[dIdx].recipient_phone = payload.recipientPhone;
    }
    saveLocalItems(DISPATCHES_STORAGE_PREFIX, payload.tenantId, localDispatches);
    requestId = localDispatches[dIdx].request_id;
  }

  const newDelivery: Delivery = {
    id: deliveryId,
    tenant_id: payload.tenantId,
    organization_id: payload.organizationId,
    dispatch_id: payload.dispatchId,
    delivered_at: now,
    received_by: payload.receivedBy,
    recipient_phone: payload.recipientPhone,
    signature_data_url: payload.signature,
    signature_storage_path: payload.signature ? 'stored_inline' : undefined,
    remarks: payload.remarks || 'Delivered in good order and satisfactory condition.',
    created_at: now,
  };

  const existingDeliveries = getLocalItems<Delivery>(DELIVERIES_STORAGE_PREFIX, payload.tenantId);
  saveLocalItems(DELIVERIES_STORAGE_PREFIX, payload.tenantId, [newDelivery, ...existingDeliveries]);

  // CRITICAL REQUIREMENT: Change the request status to COMPLETED state
  if (requestId) {
    const localReqs = getLocalRequests(payload.tenantId);
    const rIdx = localReqs.findIndex((r) => r.id === requestId);
    if (rIdx !== -1) {
      localReqs[rIdx].status = 'COMPLETED';
      localReqs[rIdx].updated_at = now;
      saveLocalRequests(payload.tenantId, localReqs);
    }

    try {
      await supabase.from('calibration_requests').update({ status: 'COMPLETED' }).eq('id', requestId);
    } catch {
      // offline fallback
    }
  }

  try {
    await supabase.from('deliveries').insert({
      id: deliveryId,
      tenant_id: payload.tenantId,
      organization_id: payload.organizationId,
      dispatch_id: payload.dispatchId,
      delivered_at: now,
      received_by: payload.receivedBy,
      remarks: payload.remarks || null,
    });
    await supabase.from('dispatches').update({ status: 'DELIVERED' }).eq('id', payload.dispatchId);
  } catch {
    // offline fallback
  }

  return newDelivery;
}

// ============================================================================
// Section 8: Calibration Due List (FR-DUE-01 to FR-DUE-06)
// ============================================================================

export async function getCalibrationDueList(
  tenantId: string,
  organizationId?: string
): Promise<CalibrationDueItem[]> {
  if (!tenantId) return [];

  const [requests, certs, outsources] = await Promise.all([
    getCalibrationRequests(tenantId, organizationId),
    getCertificates(tenantId),
    getOutsourcePOs(tenantId),
  ]);

  const dueItems: CalibrationDueItem[] = [];
  const processedKeys = new Set<string>();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Process from In-House Certificates
  for (const cert of certs) {
    if (!cert.valid_until) continue;
    const req = requests.find((r) => r.id === cert.request_id);
    if (!req) continue;

    const reqItem = (req.request_items || []).find((it) => it.id === cert.request_item_id) || req.request_items?.[0];
    const key = `${cert.request_id}_${reqItem?.id || cert.certificate_number}`;
    if (processedKeys.has(key)) continue;
    processedKeys.add(key);

    const outsource = outsources.find(
      (po) =>
        po.id === cert.calibration_id ||
        (po.request_id === req.id && (po.request_item_id === reqItem?.id || po.request_item_id === cert.request_item_id))
    );

    const dueDate = new Date(cert.valid_until);
    dueDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let urgencyStatus: CalibrationDueItem['urgencyStatus'] = 'UPCOMING';
    if (daysDiff < 0) {
      urgencyStatus = 'OVERDUE';
    } else if (daysDiff <= 7) {
      urgencyStatus = 'DUE_7_DAYS';
    } else if (daysDiff <= 15) {
      urgencyStatus = 'DUE_15_DAYS';
    } else if (daysDiff <= 30) {
      urgencyStatus = 'DUE_30_DAYS';
    }

    dueItems.push({
      id: cert.id,
      itemMasterId: reqItem?.item_master_id || reqItem?.item_masters?.id || 'item-gauge',
      itemName: reqItem?.item_masters?.item_name || 'Precision Gauge',
      itemCode: reqItem?.item_masters?.item_code,
      itemCategory: reqItem?.item_masters?.item_category || reqItem?.item_masters?.item_type || 'General Metrology',
      serialNumber: reqItem?.serial_number || 'SN-N/A',
      clientId: req.client_id,
      clientName: req.clients?.client_name || 'Client',
      clientCode: req.clients?.client_code || 'CL-N/A',
      clientEmail: req.clients?.email,
      clientPhone: req.clients?.phone,
      requestId: req.id,
      requestNumber: req.request_number,
      certificateNumber: cert.certificate_number,
      lastCalibratedDate: cert.issued_at || cert.created_at || req.created_at,
      nextDueDate: cert.valid_until,
      daysRemaining: daysDiff,
      urgencyStatus,
      isOutsourced: Boolean(outsource || cert.certificate_number?.startsWith('VCERT')),
      vendorName: outsource?.vendor_name,
      vendorCertificateNumber: outsource?.vendor_certificate_number,
    });
  }

  // 2. Process Outsource POs returned with next_due_date not captured above
  for (const po of outsources) {
    if (po.status === 'ACCEPTED' && po.next_due_date) {
      const req = requests.find((r) => r.id === po.request_id);
      if (!req) continue;

      const reqItem = (req.request_items || []).find((it) => it.id === po.request_item_id);
      const key = `${po.request_id}_${po.request_item_id || po.id}`;
      if (processedKeys.has(key)) continue;
      processedKeys.add(key);

      const dueDate = new Date(po.next_due_date);
      dueDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let urgencyStatus: CalibrationDueItem['urgencyStatus'] = 'UPCOMING';
      if (daysDiff < 0) {
        urgencyStatus = 'OVERDUE';
      } else if (daysDiff <= 7) {
        urgencyStatus = 'DUE_7_DAYS';
      } else if (daysDiff <= 15) {
        urgencyStatus = 'DUE_15_DAYS';
      } else if (daysDiff <= 30) {
        urgencyStatus = 'DUE_30_DAYS';
      }

      dueItems.push({
        id: po.id,
        itemMasterId: reqItem?.item_master_id || 'item-outsource',
        itemName: reqItem?.item_masters?.item_name || 'Outsourced Metrology Item',
        itemCode: reqItem?.item_masters?.item_code,
        itemCategory: reqItem?.item_masters?.item_category || 'External Vendor',
        serialNumber: reqItem?.serial_number || 'SN-EXT',
        clientId: req.client_id,
        clientName: req.clients?.client_name || 'Client',
        clientCode: req.clients?.client_code || 'CL-N/A',
        clientEmail: req.clients?.email,
        clientPhone: req.clients?.phone,
        requestId: req.id,
        requestNumber: req.request_number,
        certificateNumber: po.vendor_certificate_number,
        lastCalibratedDate: po.updated_at || po.created_at,
        nextDueDate: po.next_due_date,
        daysRemaining: daysDiff,
        urgencyStatus,
        isOutsourced: true,
        vendorName: po.vendor_name,
        vendorCertificateNumber: po.vendor_certificate_number,
      });
    }
  }

  // Sort by daysRemaining ascending (most urgent / overdue first)
  return dueItems.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

