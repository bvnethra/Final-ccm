// application/src/hooks/useClientMaster.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '../contexts/AuthContext';
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  toggleClientStatus,
} from '../services/clientMasterService';
import type { ClientFormData } from '../types/domain';

export function useClients(search?: string, status?: string) {
  const { tenantId, organizationId } = useAuthContext();

  return useQuery({
    queryKey: ['clients', tenantId, organizationId, search, status],
    queryFn: () => getClients(tenantId!, organizationId, search, status),
    enabled: Boolean(tenantId),
  });
}

export function useClient(id?: string) {
  const { tenantId } = useAuthContext();

  return useQuery({
    queryKey: ['client', id, tenantId],
    queryFn: () => getClientById(id!, tenantId!),
    enabled: Boolean(tenantId && id),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { tenantId, organizationId, user } = useAuthContext();

  return useMutation({
    mutationFn: (formData: ClientFormData) =>
      createClient(tenantId!, organizationId, formData, {
        id: user?.id,
        name: user?.fullName,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', tenantId] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  const { tenantId, user } = useAuthContext();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClientFormData> }) =>
      updateClient(id, tenantId!, data, {
        id: user?.id,
        name: user?.fullName,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['client', variables.id, tenantId] });
    },
  });
}

export function useToggleClientStatus() {
  const queryClient = useQueryClient();
  const { tenantId, user } = useAuthContext();

  return useMutation({
    mutationFn: (id: string) =>
      toggleClientStatus(id, tenantId!, {
        id: user?.id,
        name: user?.fullName,
      }),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['clients', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['client', id, tenantId] });
    },
  });
}
