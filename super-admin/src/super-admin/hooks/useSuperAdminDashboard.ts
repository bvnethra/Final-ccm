// src/super-admin/hooks/useSuperAdminDashboard.ts
import { useQuery } from '@tanstack/react-query';
import { fetchSuperAdminDashboardMetrics } from '../services/superAdminDashboardService';

export function useSuperAdminDashboard() {
  return useQuery({
    queryKey: ['superAdminDashboardMetrics'],
    queryFn: fetchSuperAdminDashboardMetrics,
    refetchInterval: 30000, // Background refresh every 30s
  });
}
