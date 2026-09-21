// src/super-admin/services/rolePermissionService.ts
import { supabase } from '../../lib/supabaseClient';
import { logPlatformEvent } from './platformAuditService';

export type PermissionLevel = 'NONE' | 'VIEW' | 'CREATE' | 'CREATE_EDIT' | 'APPROVE';

export interface PermissionModule {
  moduleCode: string;
  moduleName: string;
  displayOrder: number;
  description?: string;
}

export interface RoleWithPermissions {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
  permissions: Record<string, PermissionLevel>;
}

export async function fetchPermissionModules(): Promise<PermissionModule[]> {
  const { data, error } = await supabase
    .from('permission_modules')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch permission modules: ${error.message}`);
  }

  return (data || []).map((m) => ({
    moduleCode: m.module_code,
    moduleName: m.module_name,
    displayOrder: m.display_order,
    description: m.description,
  }));
}

export async function fetchRolesWithPermissions(): Promise<{
  modules: PermissionModule[];
  roles: RoleWithPermissions[];
}> {
  const modules = await fetchPermissionModules();

  const { data: rolesData, error: rolesError } = await supabase
    .from('roles')
    .select('id, name, code, description, status')
    .order('created_at', { ascending: true });

  if (rolesError) {
    throw new Error(`Failed to fetch roles: ${rolesError.message}`);
  }

  const { data: permsData, error: permsError } = await supabase
    .from('role_module_permissions')
    .select('role_id, module_code, permission_level');

  if (permsError) {
    throw new Error(`Failed to fetch role permissions: ${permsError.message}`);
  }

  const permissionsByRole: Record<string, Record<string, PermissionLevel>> = {};
  (permsData || []).forEach((p) => {
    if (!permissionsByRole[p.role_id]) {
      permissionsByRole[p.role_id] = {};
    }
    permissionsByRole[p.role_id][p.module_code] = p.permission_level as PermissionLevel;
  });

  const roles: RoleWithPermissions[] = (rolesData || []).map((r) => {
    const rolePerms = permissionsByRole[r.id] || {};
    // Ensure every module has a defined level (default to NONE)
    modules.forEach((m) => {
      if (!rolePerms[m.moduleCode]) {
        rolePerms[m.moduleCode] = 'NONE';
      }
    });

    return {
      id: r.id,
      name: r.name,
      code: r.code,
      description: r.description,
      status: r.status,
      permissions: rolePerms,
    };
  });

  return { modules, roles };
}

export async function updateRolePermissions(
  roleId: string,
  roleName: string,
  permissions: Record<string, PermissionLevel>,
  reason?: string
): Promise<void> {
  const upsertRows = Object.entries(permissions).map(([moduleCode, permissionLevel]) => ({
    role_id: roleId,
    module_code: moduleCode,
    permission_level: permissionLevel,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('role_module_permissions')
    .upsert(upsertRows, { onConflict: 'role_id,module_code' });

  if (error) {
    throw new Error(`Failed to save role permissions: ${error.message}`);
  }

  // Audit Logging (FR-ROLE-07)
  await logPlatformEvent({
    action: 'ROLE_PERMISSIONS_UPDATED',
    referenceId: roleId,
    reason: reason?.trim() || `Updated module permissions for role '${roleName}'`,
    metadata: {
      roleId,
      roleName,
      updatedModulesCount: upsertRows.length,
    },
  });
}

export async function createCustomRole(payload: {
  name: string;
  code: string;
  description?: string;
  initialPermissions?: Record<string, PermissionLevel>;
}): Promise<RoleWithPermissions> {
  const roleCode = payload.code.trim().toUpperCase().replace(/\s+/g, '_');

  const { data: newRole, error: roleError } = await supabase
    .from('roles')
    .insert([
      {
        name: payload.name.trim(),
        code: roleCode,
        description: payload.description?.trim() || null,
        status: 'ACTIVE',
      },
    ])
    .select()
    .single();

  if (roleError || !newRole) {
    throw new Error(`Failed to create role: ${roleError?.message || 'Unknown error'}`);
  }

  const modules = await fetchPermissionModules();
  const permsToInsert = modules.map((m) => ({
    role_id: newRole.id,
    module_code: m.moduleCode,
    permission_level: payload.initialPermissions?.[m.moduleCode] || 'NONE',
  }));

  const { error: permsError } = await supabase
    .from('role_module_permissions')
    .insert(permsToInsert);

  if (permsError) {
    throw new Error(`Role created but failed to initialize permissions: ${permsError.message}`);
  }

  await logPlatformEvent({
    action: 'ROLE_CREATED',
    referenceId: newRole.id,
    reason: `Created dynamic platform role '${newRole.name}' (${newRole.code})`,
    metadata: {
      roleName: newRole.name,
      roleCode: newRole.code,
    },
  });

  const finalPermissions: Record<string, PermissionLevel> = {};
  permsToInsert.forEach((p) => {
    finalPermissions[p.module_code] = p.permission_level as PermissionLevel;
  });

  return {
    id: newRole.id,
    name: newRole.name,
    code: newRole.code,
    description: newRole.description,
    status: newRole.status,
    permissions: finalPermissions,
  };
}

export async function deleteCustomRole(roleId: string, roleName: string): Promise<void> {
  const { error } = await supabase.from('roles').delete().eq('id', roleId);
  if (error) {
    throw new Error(`Failed to delete role: ${error.message}`);
  }

  await logPlatformEvent({
    action: 'ROLE_DELETED',
    referenceId: roleId,
    reason: `Permanently deleted role '${roleName}'`,
    metadata: { roleId, roleName },
  });
}
