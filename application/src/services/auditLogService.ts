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

const AUDIT_LOGS_STORAGE_PREFIX = 'ccm_tenant_audit_logs_';

function getLocalAuditLogs(tenantId: string): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(`${AUDIT_LOGS_STORAGE_PREFIX}${tenantId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAuditLog(tenantId: string, entry: AuditLogEntry): void {
  try {
    const existing = getLocalAuditLogs(tenantId);
    localStorage.setItem(
      `${AUDIT_LOGS_STORAGE_PREFIX}${tenantId}`,
      JSON.stringify([entry, ...existing.filter((e) => e.id !== entry.id)].slice(0, 200))
    );
  } catch (err) {
    console.error('Failed to save audit log locally:', err);
  }
}

/**
 * Inserts an immutable audit log record into audit_logs table
 */
export async function logAuditEvent(params: LogAuditParams): Promise<void> {
  if (!params.tenantId) return;

  const entryId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const entry: AuditLogEntry = {
    id: entryId,
    tenant_id: params.tenantId,
    organization_id: params.organizationId,
    actor_user_id: params.actorUserId,
    actor_name: params.actorName || 'System / Authorized User',
    action: params.action,
    entity: params.entity,
    entity_id: params.entityId,
    old_data: params.oldData || null,
    new_data: {
      ...(params.newData || {}),
      actor_name: params.actorName || 'System / Authorized User',
      remarks: params.remarks || undefined,
    },
    remarks: params.remarks,
    created_at: createdAt,
  };

  // Always save locally for resilience
  saveLocalAuditLog(params.tenantId, entry);

  try {
    const payload = {
      id: entry.id,
      tenant_id: params.tenantId,
      organization_id: params.organizationId || null,
      actor_user_id: params.actorUserId || null,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId || null,
      old_data: params.oldData || null,
      new_data: entry.new_data,
      created_at: entry.created_at,
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
  const remoteLogs: AuditLogEntry[] = [];

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
    if (!error && data) {
      for (const row of data) {
        remoteLogs.push({
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
        });
      }
    } else if (error) {
      console.warn('fetchAuditLogs error:', error.message);
    }
  } catch (err) {
    console.warn('fetchAuditLogs exception:', err);
  }

  // Merge with local fallback
  if (filters?.tenantId) {
    const localLogs = getLocalAuditLogs(filters.tenantId);
    const existingIds = new Set(remoteLogs.map((l) => l.id));
    for (const log of localLogs) {
      if (!existingIds.has(log.id)) {
        if (filters.entity && log.entity !== filters.entity) continue;
        if (filters.entityId && log.entity_id !== filters.entityId) continue;
        remoteLogs.push(log);
      }
    }
    remoteLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return filters?.limit ? remoteLogs.slice(0, filters.limit) : remoteLogs;
}
