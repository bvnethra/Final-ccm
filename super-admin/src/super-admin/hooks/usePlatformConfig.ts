// src/super-admin/hooks/usePlatformConfig.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchConfigByCategory,
  fetchAllConfigCategories,
  createConfigItem,
  updateConfigItem,
  deleteConfigItem,
} from '../services/platformConfigService';
import type { ConfigItem } from '../types/superAdmin';

export function usePlatformConfig(category: string) {
  return useQuery({
    queryKey: ['platformConfig', category],
    queryFn: () => fetchConfigByCategory(category),
    enabled: Boolean(category),
  });
}

export function usePlatformConfigCategories() {
  return useQuery({
    queryKey: ['platformConfigCategories'],
    queryFn: fetchAllConfigCategories,
  });
}

export function useCreateConfigItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createConfigItem,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['platformConfig', variables.category] });
      queryClient.invalidateQueries({ queryKey: ['platformConfigCategories'] });
      queryClient.invalidateQueries({ queryKey: ['platformAuditLogs'] });
    },
  });
}

export function useUpdateConfigItem(category: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ConfigItem> }) =>
      updateConfigItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformConfig', category] });
      queryClient.invalidateQueries({ queryKey: ['platformAuditLogs'] });
    },
  });
}

export function useDeleteConfigItem(category: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteConfigItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformConfig', category] });
      queryClient.invalidateQueries({ queryKey: ['platformConfigCategories'] });
      queryClient.invalidateQueries({ queryKey: ['platformAuditLogs'] });
    },
  });
}
