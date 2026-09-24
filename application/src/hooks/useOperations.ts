// application/src/hooks/useOperations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '../contexts/AuthContext';
import {
  getCalibrationRequests,
  getCalibrationRequestById,
  getLabQueueRequests,
  createCalibrationRequest,
  recordVerification,
  recordCalibration,
  getCertificates,
  getRepairs,
  recordRepairOrder,
  approveRepairOrder,
  completeRepairOrder,
  getOutsourcePOs,
  createOutsourcePO,
  receiveOutsourceReturn,
  getQuotations,
  getClientPastServicedItems,
  createQuotation,
  approveQuotation,
  getInvoices,
  createInvoice,
  updateInvoice,
  type UpdateInvoicePayload,
  getDispatches,
  createDispatch,
  updateDispatchStatus,
  getDeliveries,
  recordDelivery,
  getCalibrationDueList,
  type CreateRequestPayload,
  type RecordVerificationPayload,
  type RecordCalibrationPayload,
  type RecordRepairPayload,
  type ApproveRepairPayload,
  type CompleteRepairPayload,
  type CreateOutsourcePOPayload,
  type ReceiveOutsourceReturnPayload,
  type CreateQuotationPayload,
  type ApproveQuotationPayload,
  type CreateInvoicePayload,
  type CreateDispatchPayload,
  type RecordDeliveryPayload,
  routeRequestItems,
  type RouteRequestItemsPayload,
  approveInvoice,
  type ApproveInvoicePayload,
  approveDispatch,
  type ApproveDispatchPayload,
  getVendorItemsLog,
  type VendorItemLogEntry,
  updateRequestItemStatus,
  type UpdateItemStatusPayload,
  updateRequestItemInvoicePending,
  type UpdateItemInvoicePendingPayload,
} from '../services/operationsService';

export type { VendorItemLogEntry };

export function useVendorItemsLog() {
  const { tenantId, organizationId } = useAuthContext();

  return useQuery({
    queryKey: ['vendorItemsLog', tenantId, organizationId],
    queryFn: () => getVendorItemsLog(tenantId!, organizationId),
    enabled: Boolean(tenantId),
  });
}

export function useCalibrationRequests(statusFilter?: string) {
  const { tenantId, organizationId } = useAuthContext();

  return useQuery({
    queryKey: ['calibrationRequests', tenantId, organizationId, statusFilter],
    queryFn: () => getCalibrationRequests(tenantId!, organizationId, statusFilter),
    enabled: Boolean(tenantId),
  });
}

export function useLabQueue(priorityFilter?: string) {
  const { tenantId, organizationId } = useAuthContext();

  return useQuery({
    queryKey: ['labQueue', tenantId, organizationId, priorityFilter],
    queryFn: () => getLabQueueRequests(tenantId!, organizationId, priorityFilter),
    enabled: Boolean(tenantId),
  });
}

export function useCalibrationRequest(requestId: string | undefined) {
  const { tenantId } = useAuthContext();

  return useQuery({
    queryKey: ['calibrationRequest', requestId, tenantId],
    queryFn: () => getCalibrationRequestById(requestId!, tenantId!),
    enabled: Boolean(tenantId && requestId),
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthContext();

  return useMutation({
    mutationFn: (payload: CreateRequestPayload) => createCalibrationRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calibrationRequests', tenantId] });
    },
  });
}

export function useRecordVerification() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthContext();

  return useMutation({
    mutationFn: (payload: RecordVerificationPayload) => recordVerification(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calibrationRequests', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['calibrationRequest'] });
    },
  });
}

export function useRecordCalibration() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthContext();

  return useMutation({
    mutationFn: (payload: RecordCalibrationPayload) => recordCalibration(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calibrationRequests', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['calibrationRequest'] });
    },
  });
}

export function useQuotations() {
  const { tenantId, organizationId } = useAuthContext();

  return useQuery({
    queryKey: ['quotations', tenantId, organizationId],
    queryFn: () => getQuotations(tenantId!, organizationId),
    enabled: Boolean(tenantId),
  });
}

export function useClientPastServicedItems(clientId?: string) {
  const { tenantId } = useAuthContext();

  return useQuery({
    queryKey: ['clientPastServicedItems', tenantId, clientId],
    queryFn: () => getClientPastServicedItems(tenantId!, clientId!),
    enabled: Boolean(tenantId && clientId),
  });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthContext();

  return useMutation({
    mutationFn: (payload: CreateQuotationPayload) => createQuotation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['calibrationRequests', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs', tenantId] });
    },
  });
}

export function useDispatches() {
  const { tenantId, organizationId } = useAuthContext();

  return useQuery({
    queryKey: ['dispatches', tenantId, organizationId],
    queryFn: () => getDispatches(tenantId!, organizationId),
    enabled: Boolean(tenantId),
  });
}

export function useCreateDispatch() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthContext();

  return useMutation({
    mutationFn: (payload: CreateDispatchPayload) => createDispatch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatches', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['calibrationRequests', tenantId] });
    },
  });
}

export function useUpdateDispatchStatus() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthContext();

  return useMutation({
    mutationFn: (payload: { dispatchId: string; status: 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' }) =>
      updateDispatchStatus(tenantId!, payload.dispatchId, payload.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatches', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['calibrationRequests', tenantId] });
    },
  });
}

export function useDeliveries() {
  const { tenantId, organizationId } = useAuthContext();

  return useQuery({
    queryKey: ['deliveries', tenantId, organizationId],
    queryFn: () => getDeliveries(tenantId!, organizationId),
    enabled: Boolean(tenantId),
  });
}

export function useRecordDelivery() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthContext();

  return useMutation({
    mutationFn: (payload: RecordDeliveryPayload) => recordDelivery(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['dispatches', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['calibrationRequests', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['calibrationRequest'] });
    },
  });
}

export function useCertificates(requestId?: string) {
  const { tenantId } = useAuthContext();

  return useQuery({
    queryKey: ['certificates', tenantId, requestId],
    queryFn: () => getCertificates(tenantId!, requestId),
    enabled: Boolean(tenantId),
  });
}

export function useRepairs(requestId?: string) {
  const { tenantId } = useAuthContext();

  return useQuery({
    queryKey: ['repairs', tenantId, requestId],
    queryFn: () => getRepairs(tenantId!, requestId),
    enabled: Boolean(tenantId),
  });
}

export function useRecordRepair() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthContext();

  return useMutation({
    mutationFn: (payload: RecordRepairPayload) => recordRepairOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['calibrationRequests', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['calibrationRequest'] });
    },
  });
}

export function useApproveRepair() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthContext();

  return useMutation({
    mutationFn: (payload: ApproveRepairPayload) => approveRepairOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['calibrationRequests', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['calibrationRequest'] });
    },
  });
}

export function useCompleteRepair() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthContext();

  return useMutation({
    mutationFn: (payload: CompleteRepairPayload) => completeRepairOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['calibrationRequests', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['calibrationRequest'] });
    },
  });
}

export function useOutsourcePOs(requestId?: string) {
  const { tenantId } = useAuthContext();

  return useQuery({
    queryKey: ['outsourcePOs', tenantId, requestId],
    queryFn: () => getOutsourcePOs(tenantId!, requestId),
    enabled: Boolean(tenantId),
  });
}

export function useCreateOutsourcePO() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthContext();

  return useMutation({
    mutationFn: (payload: CreateOutsourcePOPayload) => createOutsourcePO(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outsourcePOs', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['calibrationRequests', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['calibrationRequest'] });
    },
  });
}

export function useReceiveOutsourceReturn() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthContext();

  return useMutation({
    mutationFn: (payload: ReceiveOutsourceReturnPayload) => receiveOutsourceReturn(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outsourcePOs', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['certificates', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['calibrationRequests', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['calibrationRequest'] });
    },
  });
}

export function useApproveQuotation() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthContext();

  return useMutation({
    mutationFn: (payload: ApproveQuotationPayload) => approveQuotation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['calibrationRequests', tenantId] });
    },
  });
}

export function useInvoices() {
  const { tenantId, organizationId } = useAuthContext();

  return useQuery({
    queryKey: ['invoices', tenantId, organizationId],
    queryFn: () => getInvoices(tenantId!, organizationId),
    enabled: Boolean(tenantId),
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthContext();

  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => createInvoice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['calibrationRequests', tenantId] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthContext();

  return useMutation({
    mutationFn: (payload: UpdateInvoicePayload) => updateInvoice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', tenantId] });
    },
  });
}

export function useCalibrationDueList() {
  const { tenantId, organizationId } = useAuthContext();

  return useQuery({
    queryKey: ['calibrationDueList', tenantId, organizationId],
    queryFn: () => getCalibrationDueList(tenantId!, organizationId),
    enabled: Boolean(tenantId),
  });
}

export function useRouteRequestItems() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthContext();

  return useMutation({
    mutationFn: (payload: RouteRequestItemsPayload) => routeRequestItems(payload),
    onSuccess: (updatedRequest, variables) => {
      if (updatedRequest) {
        queryClient.setQueryData(['calibrationRequest', variables.requestId, tenantId], updatedRequest);
      }
      queryClient.invalidateQueries({ queryKey: ['calibrationRequests'] });
      queryClient.invalidateQueries({ queryKey: ['calibrationRequest', variables.requestId] });
      queryClient.invalidateQueries({ queryKey: ['labQueue'] });
    },
  });
}

export function useApproveInvoice() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthContext();

  return useMutation({
    mutationFn: (payload: ApproveInvoicePayload) => approveInvoice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', tenantId] });
    },
  });
}

export function useApproveDispatch() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthContext();

  return useMutation({
    mutationFn: (payload: ApproveDispatchPayload) => approveDispatch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatches', tenantId] });
    },
  });
}

// ============================================================
// Item-level: Mark as NOT_SERVICEABLE or any manual status
// ============================================================
export function useUpdateItemStatus() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthContext();

  return useMutation({
    mutationFn: (payload: UpdateItemStatusPayload) => updateRequestItemStatus(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['calibration-requests', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['calibration-request', variables.requestId] });
    },
  });
}

export type { UpdateItemStatusPayload };

// ============================================================
// Item-level: Toggle invoice_pending before CV is closed
// ============================================================
export function useUpdateItemInvoicePending() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthContext();

  return useMutation({
    mutationFn: (payload: UpdateItemInvoicePendingPayload) =>
      updateRequestItemInvoicePending(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['calibration-requests', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['calibration-request', variables.requestId] });
    },
  });
}

export type { UpdateItemInvoicePendingPayload };
