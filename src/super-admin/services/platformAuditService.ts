// src/super-admin/services/platformAuditService.ts
import { supabase } from '../../lib/supabaseClient';
import type { PlatformAuditLog } from '../types/superAdmin';

export async function logPlatformEvent(params: {
  action: string;
  referenceId?: string;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
  reason?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const { data: session } = await supabase.auth.getSession();
    const user = session?.session?.user;

    // Resolve actor platform role
    let actorRole = 'SUPER_ADMIN';
    if (user?.id) {
      const { data: pUser } = await supabase
        .from('platform_users')
        .select('role')
        .eq('id', user.id)
        .single();
      if (pUser?.role) {
        actorRole = pUser.role;
      }
    }

    await supabase.from('platform_audit_logs').insert([{
      actor_id: user?.id || null,
      actor_email: user?.email || 'system-automated',
      actor_role: actorRole,
      action: params.action,
      reference_id: params.referenceId || null,
      previous_state: params.previousState || null,
      new_state: params.newState || null,
      reason: params.reason || null,
      metadata: params.metadata || {},
    }]);
  } catch (err) {
    console.error('Failed to write platform audit event:', err);
  }
}

export async function fetchPlatformAuditLogs(params?: {
  limit?: number;
  action?: string;
  referenceId?: string;
}): Promise<PlatformAuditLog[]> {
  let query = supabase
    .from('platform_audit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (params?.limit) {
    query = query.limit(params.limit);
  }
  if (params?.action && params.action !== 'ALL') {
    query = query.eq('action', params.action);
  }
  if (params?.referenceId) {
    query = query.eq('reference_id', params.referenceId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Fetch platform audit logs failed: ${error.message}`);

  return (data || []).map((row: any) => ({
    id: row.id,
    actorId: row.actor_id,
    actorEmail: row.actor_email,
    actorRole: row.actor_role,
    action: row.action,
    referenceId: row.reference_id,
    previousState: row.previous_state,
    newState: row.new_state,
    ipAddress: row.ip_address,
    reason: row.reason,
    metadata: row.metadata,
    createdAt: row.created_at,
  }));
}
