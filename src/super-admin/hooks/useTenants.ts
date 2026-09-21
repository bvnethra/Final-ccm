// src/super-admin/hooks/useTenants.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTenants,
  fetchTenantById,
  onboardTenant,
  updateTenantStatus,
  updateTenantDetails,
  triggerAdminInvite,
  fetchTenantOrganizations,
  createTenantOrganization,
  deleteTenant,
} from '../services/tenantManagementService';
import type { 
  TenantFilters, 
  OnboardTenantPayload, 
  TenantStatus, 
  CreateOrganizationPayload,
  UpdateTenantPayload
} from '../types/superAdmin';

export function useTenants(filters: TenantFilters = {}) {
  return useQuery({
    queryKey: ['platformTenants', filters],
    queryFn: () => fetchTenants(filters),
  });
}

export function useTenantDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['platformTenant', id],
    queryFn: () => (id ? fetchTenantById(id) : Promise.reject('No ID provided')),
    enabled: Boolean(id),
  });
}

export function useTenantOrganizations(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['platformTenantOrganizations', tenantId],
    queryFn: () => (tenantId ? fetchTenantOrganizations(tenantId) : Promise.resolve([])),
    enabled: Boolean(tenantId),
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrganizationPayload) => createTenantOrganization(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['platformTenantOrganizations', variables.tenantId] });
      queryClient.invalidateQueries({ queryKey: ['platformTenant', variables.tenantId] });
      queryClient.invalidateQueries({ queryKey: ['platformTenants'] });
      queryClient.invalidateQueries({ queryKey: ['platformAuditLogs'] });
    },
  });
}

export function useOnboardTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OnboardTenantPayload) => onboardTenant(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformTenants'] });
      queryClient.invalidateQueries({ queryKey: ['superAdminDashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['platformAuditLogs'] });
    },
  });
}

export function useUpdateTenantStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { tenantId: string; newStatus: TenantStatus; reason: string }) =>
      updateTenantStatus(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['platformTenants'] });
      queryClient.invalidateQueries({ queryKey: ['platformTenant', variables.tenantId] });
      queryClient.invalidateQueries({ queryKey: ['superAdminDashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['platformAuditLogs'] });
    },
  });
}

export function useUpdateTenantDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTenantPayload) => updateTenantDetails(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['platformTenant', variables.tenantId] });
      queryClient.invalidateQueries({ queryKey: ['platformTenants'] });
      queryClient.invalidateQueries({ queryKey: ['superAdminDashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['platformAuditLogs'] });
    },
  });
}

export function useTriggerAdminInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tenantId: string) => triggerAdminInvite(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformAuditLogs'] });
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, reason }: { tenantId: string; reason?: string }) =>
      deleteTenant(tenantId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformTenants'] });
      queryClient.invalidateQueries({ queryKey: ['superAdminDashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['platformAuditLogs'] });
    },
  });
}

