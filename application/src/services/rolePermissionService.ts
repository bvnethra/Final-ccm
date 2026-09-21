// application/src/services/rolePermissionService.ts
import { supabase } from '../lib/supabaseClient';

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
  isSystem: boolean;
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
    .select('id, name, code, description, status, is_system')
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
      isSystem: Boolean(r.is_system),
      permissions: rolePerms,
    };
  });

  return { modules, roles };
}

export async function updateRolePermissions(
  roleId: string,
  _roleName: string,
  permissions: Record<string, PermissionLevel>
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
    isSystem: false,
    permissions: finalPermissions,
  };
}

export async function deleteCustomRole(roleId: string): Promise<void> {
  const { error } = await supabase.from('roles').delete().eq('id', roleId);
  if (error) {
    throw new Error(`Failed to delete role: ${error.message}`);
  }
}
