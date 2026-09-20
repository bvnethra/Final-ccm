// src/super-admin/hooks/usePlatformUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPlatformUsers,
  createPlatformUser,
  updatePlatformUserStatus,
  updatePlatformUserRole,
} from '../services/platformUserService';
import type { PlatformRole, PlatformUserStatus } from '../types/superAdmin';

export function usePlatformUsers() {
  return useQuery({
    queryKey: ['platformUsers'],
    queryFn: fetchPlatformUsers,
  });
}

export function useCreatePlatformUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPlatformUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformUsers'] });
      queryClient.invalidateQueries({ queryKey: ['platformAuditLogs'] });
    },
  });
}

export function useUpdatePlatformUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, status, reason }: { userId: string; status: PlatformUserStatus; reason: string }) =>
      updatePlatformUserStatus(userId, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformUsers'] });
      queryClient.invalidateQueries({ queryKey: ['platformAuditLogs'] });
    },
  });
}

export function useUpdatePlatformUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role, reason }: { userId: string; role: PlatformRole; reason: string }) =>
      updatePlatformUserRole(userId, role, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformUsers'] });
      queryClient.invalidateQueries({ queryKey: ['platformAuditLogs'] });
    },
  });
}
