// application/src/hooks/useLabProfile.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '../contexts/AuthContext';
import {
  getLabProfile,
  updateLabProfile,
  resetLabProfile,
  DEFAULT_LAB_PROFILE,
} from '../services/labProfileService';
import type { LabIssuerProfile } from '../types/domain';

export const LAB_PROFILE_QUERY_KEY = ['labProfile'];

export function useLabProfile() {
  const { tenantId } = useAuthContext();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...LAB_PROFILE_QUERY_KEY, tenantId],
    queryFn: () => getLabProfile(tenantId),
    initialData: DEFAULT_LAB_PROFILE,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<LabIssuerProfile>) => {
      if (!tenantId) throw new Error('Tenant ID required to update lab profile');
      return updateLabProfile(tenantId, updates);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData([...LAB_PROFILE_QUERY_KEY, tenantId], updated);
      queryClient.invalidateQueries({ queryKey: LAB_PROFILE_QUERY_KEY });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => {
      if (!tenantId) throw new Error('Tenant ID required to reset lab profile');
      return resetLabProfile(tenantId);
    },
    onSuccess: (defaultProfile) => {
      queryClient.setQueryData([...LAB_PROFILE_QUERY_KEY, tenantId], defaultProfile);
      queryClient.invalidateQueries({ queryKey: LAB_PROFILE_QUERY_KEY });
    },
  });

  return {
    labProfile: query.data || DEFAULT_LAB_PROFILE,
    isLoading: query.isLoading,
    updateLabProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    resetToDefault: resetMutation.mutateAsync,
    isResetting: resetMutation.isPending,
  };
}
