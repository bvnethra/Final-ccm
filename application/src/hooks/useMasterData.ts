// application/src/hooks/useMasterData.ts
import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '../contexts/AuthContext';
import { getClients, getItemMasters } from '../services/masterDataService';

export function useClients() {
  const { tenantId, organizationId } = useAuthContext();

  return useQuery({
    queryKey: ['clients', tenantId, organizationId],
    queryFn: () => getClients(tenantId!, organizationId),
    enabled: Boolean(tenantId),
  });
}

export function useItemMasters() {
  const { tenantId, organizationId } = useAuthContext();

  return useQuery({
    queryKey: ['itemMasters', tenantId, organizationId],
    queryFn: () => getItemMasters(tenantId!, organizationId),
    enabled: Boolean(tenantId),
  });
}
