// application/src/hooks/useItemMaster.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '../contexts/AuthContext';
import {
  getItemMasters,
  getItemMasterById,
  createItemMaster,
  updateItemMaster,
  toggleItemMasterStatus,
} from '../services/itemMasterService';
import type { ItemMasterFormData } from '../types/domain';

export function useItemMasters(search?: string, status?: string, category?: string) {
  const { tenantId, organizationId } = useAuthContext();

  return useQuery({
    queryKey: ['itemMasters', tenantId, organizationId, search, status, category],
    queryFn: () => getItemMasters(tenantId!, organizationId, search, status, category),
    enabled: Boolean(tenantId),
  });
}

export function useItemMaster(id?: string) {
  const { tenantId } = useAuthContext();

  return useQuery({
    queryKey: ['itemMaster', id, tenantId],
    queryFn: () => getItemMasterById(id!, tenantId!),
    enabled: Boolean(tenantId && id),
  });
}

export function useCreateItemMaster() {
  const queryClient = useQueryClient();
  const { tenantId, organizationId, user } = useAuthContext();

  return useMutation({
    mutationFn: (formData: ItemMasterFormData) =>
      createItemMaster(tenantId!, organizationId, formData, {
        id: user?.id,
        name: user?.fullName,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itemMasters', tenantId] });
    },
  });
}

export function useUpdateItemMaster() {
  const queryClient = useQueryClient();
  const { tenantId, user } = useAuthContext();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ItemMasterFormData> }) =>
      updateItemMaster(id, tenantId!, data, {
        id: user?.id,
        name: user?.fullName,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['itemMasters', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['itemMaster', variables.id, tenantId] });
    },
  });
}

export function useToggleItemMasterStatus() {
  const queryClient = useQueryClient();
  const { tenantId, user } = useAuthContext();

  return useMutation({
    mutationFn: (id: string) =>
      toggleItemMasterStatus(id, tenantId!, {
        id: user?.id,
        name: user?.fullName,
      }),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['itemMasters', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['itemMaster', id, tenantId] });
    },
  });
}
