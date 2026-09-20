// src/super-admin/services/superAdminDashboardService.ts
import { supabase } from '../../lib/supabaseClient';
import type { SuperAdminDashboardMetrics, TenantStatus, PlatformTenant } from '../types/superAdmin';
import { fetchPlatformAuditLogs } from './platformAuditService';

export async function fetchSuperAdminDashboardMetrics(): Promise<SuperAdminDashboardMetrics> {
  // 1. Fetch all tenants basic status info from Supabase for aggregation
  const { data: allTenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('id, name, code, status, tenant_type, admin_email, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (tenantsError) throw new Error(`Dashboard metrics query failed: ${tenantsError.message}`);

  const tenantRows = allTenants || [];
  const totalTenants = tenantRows.length;

  let activeCount = 0;
  let deactivatedCount = 0;

  for (const t of tenantRows) {
    if (t.status === 'ACTIVE') activeCount++;
    else if (t.status === 'DEACTIVATED') deactivatedCount++;
  }

  // 2. Build live dynamic distribution
  const statusDistribution: { status: TenantStatus; count: number; percentage: number }[] = [
    {
      status: 'ACTIVE',
      count: activeCount,
      percentage: totalTenants > 0 ? Math.round((activeCount / totalTenants) * 100) : 0,
    },
    {
      status: 'DEACTIVATED',
      count: deactivatedCount,
      percentage: totalTenants > 0 ? Math.round((deactivatedCount / totalTenants) * 100) : 0,
    },
  ];

  // 3. Map recent 5 tenants
  const recentTenants: PlatformTenant[] = tenantRows.slice(0, 5).map((t: any) => ({
    id: t.id,
    name: t.name,
    code: t.code,
    status: t.status,
    tenantType: t.tenant_type,
    adminEmail: t.admin_email,
    branchesCount: 1,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));

  // 4. Load recent 8 platform activity logs from platform_audit_logs
  const recentActivity = await fetchPlatformAuditLogs({ limit: 8 });

  return {
    totalTenants,
    activeTenants: activeCount,
    deactivatedTenants: deactivatedCount,
    statusDistribution,
    recentTenants,
    recentActivity,
  };
}
