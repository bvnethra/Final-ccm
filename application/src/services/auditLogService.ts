// application/src/services/auditLogService.ts
import { supabase } from '../lib/supabaseClient';

export interface AuditLogEntry {
  id: string;
  tenant_id: string;
  organization_id?: string;
  actor_user_id?: string;
  actor_name?: string;
  actor_email?: string;
  action: string;
  entity: string;
  entity_id?: string;
  old_data?: any;
  new_data?: any;
  remarks?: string;
  created_at: string;
}

export interface LogAuditParams {
  tenantId: string;
  organizationId?: string;
  actorUserId?: string;
  actorName?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
  remarks?: string;
}

/**
 * Inserts an immutable audit log record into audit_logs table
 */
export async function logAuditEvent(params: LogAuditParams): Promise<void> {
  try {
    const payload = {
      tenant_id: params.tenantId,
      organization_id: params.organizationId || null,
      actor_user_id: params.actorUserId || null,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId || null,
      old_data: params.oldData || null,
      new_data: {
        ...(params.newData || {}),
        actor_name: params.actorName || 'System / Authorized User',
        remarks: params.remarks || undefined,
      },
    };

    await supabase.from('audit_logs').insert(payload);
  } catch (err) {
    console.warn('Could not record audit log event:', err);
  }
}

/**
 * Fetches audit logs filtered by tenant, entity, entity_id, or date range
 */
export async function fetchAuditLogs(filters?: {
  tenantId?: string;
  entity?: string;
  entityId?: string;
  limit?: number;
}): Promise<AuditLogEntry[]> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.tenantId) {
      query = query.eq('tenant_id', filters.tenantId);
    }
    if (filters?.entity) {
      query = query.eq('entity', filters.entity);
    }
    if (filters?.entityId) {
      query = query.eq('entity_id', filters.entityId);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    } else {
      query = query.limit(100);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('fetchAuditLogs error:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      tenant_id: row.tenant_id,
      organization_id: row.organization_id,
      actor_user_id: row.actor_user_id,
      actor_name: row.new_data?.actor_name || 'System / User',
      action: row.action,
      entity: row.entity,
      entity_id: row.entity_id,
      old_data: row.old_data,
      new_data: row.new_data,
      remarks: row.new_data?.remarks || row.new_data?.notes,
      created_at: row.created_at,
    }));
  } catch (err) {
    console.warn('fetchAuditLogs exception:', err);
    return [];
  }
}
