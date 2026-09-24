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
  // ─── 1. Load user_profiles ───────────────────────────────────────────────
  let { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*, tenants(id, name, code), organizations(id, name, code)')
    .eq('id', authUserId)
    .maybeSingle();

  // Self-healing: provision user_profile from platform_users if missing
  if (!profile) {
    const { data: pUser } = await supabase
      .from('platform_users')
      .select('*')
      .eq('id', authUserId)
      .maybeSingle();

    if (pUser) {
      const { data: tenant } = await supabase.from('tenants').select('id, name, code').limit(1).maybeSingle();
      const { data: org } = await supabase.from('organizations').select('id, name, code').limit(1).maybeSingle();

      const newProfile = {
        id: authUserId,
        tenant_id: tenant?.id,
        organization_id: org?.id,
        email: pUser.email,
        full_name: pUser.full_name,
        status: pUser.status || 'ACTIVE',
      };

      await supabase.from('user_profiles').upsert(newProfile);
      profile = {
        ...newProfile,
        tenants: tenant,
        organizations: org,
      } as any;
    }
  }

  if (profileError || !profile) {
    throw new Error(
      profileError?.message ||
        'No active user profile found for this account. Contact your system administrator.'
    );
  }

  // ─── 2. Determine authoritative role from platform_users (super admin sets this) ──
  let platformRole: string | null = null;
  try {
    const { data: pUser } = await supabase
      .from('platform_users')
      .select('role')
      .eq('id', authUserId)
      .maybeSingle();
    platformRole = pUser?.role || null;
  } catch {
    // non-critical
  }

  // ─── 3. Load user_roles from the database ────────────────────────────────
  const { data: userRoleRows } = await supabase
    .from('user_roles')
    .select('role_id, roles(id, code, name)')
    .eq('user_id', authUserId);

  let roleCodes: string[] = [];
  let roleIds: string[] = [];
  const permissionCodes = new Set<string>();

  if (userRoleRows && userRoleRows.length > 0) {
    for (const ur of userRoleRows as any[]) {
      if (ur.roles) {
        roleCodes.push(ur.roles.code);
        roleIds.push(ur.roles.id);
      }
    }
  }

  // ─── 4. If platform_users.role is set and differs from user_roles, sync it ──
  if (platformRole && (!roleCodes.includes(platformRole) || roleCodes.length === 0)) {
    // Fetch the role row from roles table
    const { data: roleData } = await supabase
      .from('roles')
      .select('id, code, name')
      .eq('code', platformRole)
      .maybeSingle();

    if (roleData) {
      // Self-heal: sync user_roles table to match platform_users.role
      try {
        await supabase.from('user_roles').delete().eq('user_id', authUserId);
        await supabase.from('user_roles').insert({ user_id: authUserId, role_id: roleData.id });
      } catch (syncErr) {
        console.warn('Could not sync user_roles from platform_users.role:', syncErr);
      }

      // Use the platform role as authoritative
      roleCodes = [roleData.code];
      roleIds = [roleData.id];
    } else if (platformRole === 'SUPER_ADMIN') {
      // SUPER_ADMIN is a special platform role
      roleCodes = ['SUPER_ADMIN'];
    }
  }

  // ─── 5. Load module permissions from DB for the resolved roleIds ─────────
  const LEVEL_RANK: Record<string, number> = {
    NONE: 0,
    VIEW: 1,
    CREATE: 2,
    CREATE_EDIT: 3,
    APPROVE: 4,
  };

  const modulePermissions: Record<string, 'NONE' | 'VIEW' | 'CREATE' | 'CREATE_EDIT' | 'APPROVE'> = {};

  if (roleIds.length > 0) {
    try {
      const { data: modPerms, error: modPermsError } = await supabase
        .from('role_module_permissions')
        .select('module_code, permission_level')
        .in('role_id', roleIds);

      if (modPermsError) {
        console.warn('Error loading role_module_permissions:', modPermsError.message);
      }

      if (modPerms && modPerms.length > 0) {
        for (const mp of modPerms) {
          const currentLevel = modulePermissions[mp.module_code] || 'NONE';
          const currentRank = LEVEL_RANK[currentLevel] ?? 0;
          const newRank = LEVEL_RANK[mp.permission_level] ?? 0;

          // Always take the highest level if user has multiple roles
          if (newRank >= currentRank) {
            modulePermissions[mp.module_code] = mp.permission_level as any;
          }

          // Build legacy permissionCodes set for hasPermission() compatibility
          if (mp.permission_level !== 'NONE') {
            permissionCodes.add(mp.module_code);
            permissionCodes.add(`${mp.module_code}:${mp.permission_level}`);
            if (newRank >= 1) permissionCodes.add(`${mp.module_code}:VIEW`);
            if (newRank >= 2) permissionCodes.add(`${mp.module_code}:CREATE`);
            if (newRank >= 3) permissionCodes.add(`${mp.module_code}:CREATE_EDIT`);
            if (newRank >= 4) permissionCodes.add(`${mp.module_code}:APPROVE`);
          }
        }
      }
    } catch (err) {
      console.warn('Could not query role_module_permissions:', err);
    }
  }

  const isSuperAdmin = roleCodes.includes('SUPER_ADMIN') || permissionCodes.has('*');

  // ─── 6. Safely extract tenant and organization data ───────────────────────
  let tenantName = Array.isArray((profile as any).tenants)
    ? (profile as any).tenants[0]?.name
    : (profile as any).tenants?.name;
  let tenantCode = Array.isArray((profile as any).tenants)
    ? (profile as any).tenants[0]?.code
    : (profile as any).tenants?.code;
  let organizationName = Array.isArray((profile as any).organizations)
    ? (profile as any).organizations[0]?.name
    : (profile as any).organizations?.name;
  let organizationCode = Array.isArray((profile as any).organizations)
    ? (profile as any).organizations[0]?.code
    : (profile as any).organizations?.code;

  // Fallback: query directly by ID if join wasn't populated
  if (!tenantName && profile.tenant_id) {
    const { data: t } = await supabase
      .from('tenants')
      .select('name, code')
      .eq('id', profile.tenant_id)
      .maybeSingle();
    if (t?.name) {
      tenantName = t.name;
      tenantCode = t.code;
    }
  }

  if (!organizationName && profile.organization_id) {
    const { data: o } = await supabase
      .from('organizations')
      .select('name, code')
      .eq('id', profile.organization_id)
      .maybeSingle();
    if (o?.name) {
      organizationName = o.name;
      organizationCode = o.code;
    }
  }

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    phone: profile.phone,
    tenantId: profile.tenant_id,
    tenantName: tenantName || undefined,
    tenantCode: tenantCode || undefined,
    organizationId: profile.organization_id,
    organizationName: organizationName || undefined,
    organizationCode: organizationCode || undefined,
    roles: roleCodes,
    permissions: Array.from(permissionCodes),
    modulePermissions,
    isSuperAdmin,
  };
}

export async function logoutUser(): Promise<void> {
  await supabase.auth.signOut();
}
