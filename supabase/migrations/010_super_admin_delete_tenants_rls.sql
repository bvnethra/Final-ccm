-- ============================================================================
-- 010_super_admin_delete_tenants_rls.sql
-- Allow Super Admin to permanently delete tenants with audit logging
-- ============================================================================

DROP POLICY IF EXISTS "Super Admin can delete tenants" ON tenants;
CREATE POLICY "Super Admin can delete tenants"
ON tenants FOR DELETE TO authenticated
USING (public.is_platform_super_admin());
