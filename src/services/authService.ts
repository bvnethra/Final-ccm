// src/services/authService.ts
import { supabase } from '../lib/supabaseClient';
import type { AuthUser } from '../types/auth';
import { SYSTEM_PERMISSIONS, WILDCARD_PERMISSION } from '../constants/auth';

export async function loginWithCredentials(email: string, pass: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });

  if (error || !data.user) {
    throw new Error(error?.message || 'Authentication failed');
  }

  return await getCurrentUserProfile(data.user.id);
}

export async function getCurrentUserProfile(authUserId: string): Promise<AuthUser> {
  // 1. Check Platform Operators Directory (platform_users)
  const { data: pUser } = await supabase
    .from('platform_users')
    .select('*')
    .eq('id', authUserId)
    .maybeSingle();

  if (pUser && pUser.status === 'ACTIVE') {
    const isSuperAdmin = pUser.role === 'SUPER_ADMIN';
    return {
      id: pUser.id,
      email: pUser.email,
      fullName: pUser.full_name,
      tenantId: '',
      organizationId: '',
      roles: [pUser.role],
      permissions: isSuperAdmin ? [WILDCARD_PERMISSION] : [pUser.role],
      isSuperAdmin,
    };
  }

  // 2. Fallback to user_profiles if existing
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*, tenants(id, name, code), organizations(id, name, code)')
    .eq('id', authUserId)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error(profileError?.message || 'User profile not found in database');
  }

  // Fetch dynamic user roles & assigned permissions from PostgreSQL
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('roles(id, code, name, role_permissions(permissions(code)))')
    .eq('user_id', profile.id);

  const roleCodes: string[] = [];
  const permissionCodes = new Set<string>();

  if (userRoles) {
    for (const ur of userRoles as any[]) {
      if (ur.roles) {
        roleCodes.push(ur.roles.code);
        if (ur.roles.role_permissions) {
          for (const rp of ur.roles.role_permissions) {
            if (rp.permissions?.code) {
              permissionCodes.add(rp.permissions.code);
            }
          }
        }
      }
    }
  }

  const isSuperAdmin =
    permissionCodes.has(SYSTEM_PERMISSIONS.ADMIN_FULL_ACCESS) ||
    permissionCodes.has(WILDCARD_PERMISSION) ||
    roleCodes.includes('SUPER_ADMIN');

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    phone: profile.phone,
    tenantId: profile.tenant_id,
    organizationId: profile.organization_id,
    roles: roleCodes,
    permissions: isSuperAdmin ? [WILDCARD_PERMISSION] : Array.from(permissionCodes),
    isSuperAdmin,
  };
}

export async function logoutUser(): Promise<void> {
  await supabase.auth.signOut();
}
