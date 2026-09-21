// application/src/hooks/useVendorMaster.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '../contexts/AuthContext';
import {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  toggleVendorStatus,
} from '../services/vendorMasterService';
import type { VendorFormData } from '../types/domain';

export function useVendors(search?: string, status?: string, category?: string) {
  const { tenantId, organizationId } = useAuthContext();

  return useQuery({
    queryKey: ['vendors', tenantId, organizationId, search, status, category],
    queryFn: () => getVendors(tenantId!, organizationId, search, status, category),
    enabled: Boolean(tenantId),
  });
}

export function useVendor(id?: string) {
  const { tenantId } = useAuthContext();

  return useQuery({
    queryKey: ['vendor', id, tenantId],
    queryFn: () => getVendorById(id!, tenantId!),
    enabled: Boolean(tenantId && id),
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  const { tenantId, organizationId, user } = useAuthContext();

  return useMutation({
    mutationFn: (formData: VendorFormData) =>
      createVendor(tenantId!, organizationId, formData, {
        id: user?.id,
        name: user?.fullName,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors', tenantId] });
    },
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();
  const { tenantId, user } = useAuthContext();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VendorFormData> }) =>
      updateVendor(id, tenantId!, data, {
        id: user?.id,
        name: user?.fullName,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendors', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['vendor', variables.id, tenantId] });
    },
  });
}

export function useToggleVendorStatus() {
  const queryClient = useQueryClient();
  const { tenantId, user } = useAuthContext();

  return useMutation({
    mutationFn: (id: string) =>
      toggleVendorStatus(id, tenantId!, {
        id: user?.id,
        name: user?.fullName,
      }),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['vendors', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['vendor', id, tenantId] });
    },
  });
}
