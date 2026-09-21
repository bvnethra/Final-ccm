// application/src/hooks/useRolePermissions.ts
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
    }: {
      roleId: string;
      roleName: string;
      permissions: Record<string, PermissionLevel>;
    }) => updateRolePermissions(roleId, roleName, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolesWithPermissions'] });
    },
  });
}

export function useCreateCustomRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCustomRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolesWithPermissions'] });
    },
  });
}

export function useDeleteCustomRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId }: { roleId: string; roleName: string }) =>
      deleteCustomRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolesWithPermissions'] });
    },
  });
}
