// application/src/services/authService.ts
import { supabase } from '../lib/supabaseClient';
import type { AuthUser } from '../types/auth';

export async function loginWithCredentials(email: string, pass: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: pass,
  });

  if (error || !data?.user) {
    throw new Error(error?.message || 'Invalid login credentials. Please check your email and password.');
  }

  const profile = await getCurrentUserProfile(data.user.id);
  return profile;
}

export async function getCurrentUserProfile(authUserId: string): Promise<AuthUser> {
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*, tenants(id, name, code), organizations(id, name, code)')
    .eq('id', authUserId)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error(
      profileError?.message ||
        'No active user profile found for this account. Contact your system administrator.'
    );
  }

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

  const isSuperAdmin = roleCodes.includes('SUPER_ADMIN') || permissionCodes.has('*');

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    phone: profile.phone,
    tenantId: profile.tenant_id,
    organizationId: profile.organization_id,
    roles: roleCodes,
    permissions: Array.from(permissionCodes),
    isSuperAdmin,
  };
}

export async function logoutUser(): Promise<void> {
  await supabase.auth.signOut();
}
