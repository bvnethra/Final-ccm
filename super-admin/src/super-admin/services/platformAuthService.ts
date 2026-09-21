// src/super-admin/services/platformAuthService.ts
import { supabase } from '../../lib/supabaseClient';
import type { PlatformRole, PlatformUser } from '../types/superAdmin';

export interface PlatformSession {
  user: PlatformUser | null;
  isPlatformUser: boolean;
  isSuperAdmin: boolean;
  isPlatformSupport: boolean;
}

export async function getCurrentPlatformUser(): Promise<PlatformSession> {
  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData?.user;

  if (!authUser) {
    return {
      user: null,
      isPlatformUser: false,
      isSuperAdmin: false,
      isPlatformSupport: false,
    };
  }

  const { data: pUser, error } = await supabase
    .from('platform_users')
    .select('*')
    .eq('id', authUser.id)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (error || !pUser) {
    return {
      user: null,
      isPlatformUser: false,
      isSuperAdmin: false,
      isPlatformSupport: false,
    };
  }

  const role = pUser.role as PlatformRole;

  return {
    user: {
      id: pUser.id,
      email: pUser.email,
      fullName: pUser.full_name,
      role,
      status: pUser.status,
      lastLoginAt: pUser.last_login_at,
      createdAt: pUser.created_at,
      updatedAt: pUser.updated_at,
    },
    isPlatformUser: true,
    isSuperAdmin: role === 'SUPER_ADMIN',
    isPlatformSupport: role === 'PLATFORM_SUPPORT',
  };
}
