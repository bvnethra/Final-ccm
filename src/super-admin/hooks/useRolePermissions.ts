// src/super-admin/hooks/useRolePermissions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchRolesWithPermissions,
  updateRolePermissions,
  createCustomRole,
  deleteCustomRole,
  type PermissionLevel,
} from '../services/rolePermissionService';

export function useRolesWithPermissions() {
  return useQuery({
    queryKey: ['rolesWithPermissions'],
    queryFn: fetchRolesWithPermissions,
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roleId,
      roleName,
      permissions,
      reason,
    }: {
      roleId: string;
      roleName: string;
      permissions: Record<string, PermissionLevel>;
      reason?: string;
    }) => updateRolePermissions(roleId, roleName, permissions, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolesWithPermissions'] });
      queryClient.invalidateQueries({ queryKey: ['platformAuditLogs'] });
    },
  });
}

export function useCreateCustomRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCustomRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolesWithPermissions'] });
      queryClient.invalidateQueries({ queryKey: ['platformAuditLogs'] });
    },
  });
}

export function useDeleteCustomRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, roleName }: { roleId: string; roleName: string }) =>
      deleteCustomRole(roleId, roleName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolesWithPermissions'] });
      queryClient.invalidateQueries({ queryKey: ['platformAuditLogs'] });
    },
  });
}
