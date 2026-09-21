// src/super-admin/services/platformUserService.ts
import { supabase } from '../../lib/supabaseClient';
import type { PlatformUser, PlatformRole, PlatformUserStatus } from '../types/superAdmin';
import { logPlatformEvent } from './platformAuditService';

export async function fetchPlatformUsers(): Promise<PlatformUser[]> {
  const { data, error } = await supabase
    .from('platform_users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Fetch platform users failed: ${error.message}`);

  return (data || []).map((u: any) => ({
    id: u.id,
    email: u.email,
    fullName: u.full_name,
    role: u.role,
    status: u.status,
    lastLoginAt: u.last_login_at,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
  }));
}

export async function createPlatformUser(payload: {
  email: string;
  fullName: string;
  role: PlatformRole;
  password?: string;
}): Promise<PlatformUser> {
  const email = payload.email.trim().toLowerCase();
  const password = payload.password?.trim();

  if (!password) {
    throw new Error('Initial provisioning password is required.');
  }

  // Create auth user or check if user exists in auth
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: payload.fullName.trim(),
      },
    },
  });

  if (authErr && !authData?.user) {
    throw new Error(`Failed to create platform auth account: ${authErr.message}`);
  }

  const userId = authData.user?.id || crypto.randomUUID();

  const { data, error } = await supabase
    .from('platform_users')
    .insert([{
      id: userId,
      email,
      full_name: payload.fullName.trim(),
      role: payload.role,
      status: 'ACTIVE',
    }])
    .select()
    .single();

  if (error) throw new Error(`Failed to register platform user: ${error.message}`);

  await logPlatformEvent({
    action: 'PLATFORM_USER_CREATED',
    referenceId: data.id,
    newState: data,
    reason: `Registered new platform operator '${data.full_name}' with role ${data.role}`,
  });

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    role: data.role,
    status: data.status,
    lastLoginAt: data.last_login_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updatePlatformUserStatus(userId: string, status: PlatformUserStatus, reason: string): Promise<void> {
  const { data: previous } = await supabase.from('platform_users').select('*').eq('id', userId).single();

  const { error } = await supabase
    .from('platform_users')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw new Error(`Update platform user status failed: ${error.message}`);

  await logPlatformEvent({
    action: `PLATFORM_USER_${status}`,
    referenceId: userId,
    previousState: previous,
    newState: { ...previous, status },
    reason: reason.trim() || `Platform user status updated to ${status}`,
  });
}

export async function updatePlatformUserRole(userId: string, role: PlatformRole, reason: string): Promise<void> {
  const { data: previous } = await supabase.from('platform_users').select('*').eq('id', userId).single();

  const { error } = await supabase
    .from('platform_users')
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw new Error(`Update platform user role failed: ${error.message}`);

  await logPlatformEvent({
    action: 'PLATFORM_USER_ROLE_CHANGED',
    referenceId: userId,
    previousState: previous,
    newState: { ...previous, role },
    reason: reason.trim() || `Platform user role changed to ${role}`,
  });
}

export async function deletePlatformUser(userId: string, reason?: string): Promise<void> {
  const { data: previous } = await supabase.from('platform_users').select('*').eq('id', userId).single();

  const { error } = await supabase
    .from('platform_users')
    .delete()
    .eq('id', userId);

  if (error) throw new Error(`Failed to delete platform user: ${error.message}`);

  await logPlatformEvent({
    action: 'PLATFORM_USER_DELETED',
    referenceId: userId,
    previousState: previous,
    reason: reason?.trim() || `Permanently deleted platform operator '${previous?.full_name}' (${previous?.email})`,
    metadata: {
      deletedEmail: previous?.email,
      deletedRole: previous?.role,
    },
  });
}

