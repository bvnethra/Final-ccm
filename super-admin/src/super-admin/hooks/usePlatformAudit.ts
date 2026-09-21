// src/super-admin/hooks/usePlatformAudit.ts
import { useQuery } from '@tanstack/react-query';
import { fetchPlatformAuditLogs } from '../services/platformAuditService';

export function usePlatformAudit(params?: { limit?: number; action?: string; referenceId?: string }) {
  return useQuery({
    queryKey: ['platformAuditLogs', params],
    queryFn: () => fetchPlatformAuditLogs(params),
    refetchInterval: 15000,
  });
}
