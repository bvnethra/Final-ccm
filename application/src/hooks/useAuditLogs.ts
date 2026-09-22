// application/src/hooks/useAuditLogs.ts
import { useQuery } from '@tanstack/react-query';
import { fetchAuditLogs, type AuditLogEntry } from '../services/auditLogService';
import { useAuthContext } from '../contexts/AuthContext';

export function useAuditLogs(filters?: { entity?: string; entityId?: string; limit?: number }) {
  const { tenantId } = useAuthContext();

  return useQuery<AuditLogEntry[]>({
    queryKey: ['audit-logs', tenantId, filters?.entity, filters?.entityId, filters?.limit],
    queryFn: () => fetchAuditLogs({ tenantId, ...filters }),
    enabled: Boolean(tenantId),
    refetchInterval: 10000, // auto-refresh activity trail
  });
}
