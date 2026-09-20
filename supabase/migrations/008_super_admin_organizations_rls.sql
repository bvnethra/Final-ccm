-- 008_super_admin_organizations_rls.sql
-- Enable Super Admin management of tenant organizations

DROP POLICY IF EXISTS "Platform users can view organizations" ON organizations;
CREATE POLICY "Platform users can view organizations"
ON organizations FOR SELECT TO authenticated
USING (public.is_platform_user() OR tenant_id = public.get_auth_user_tenant_id() OR public.has_permission('ORG_VIEW'));

DROP POLICY IF EXISTS "Super Admin can insert organizations" ON organizations;
CREATE POLICY "Super Admin can insert organizations"
ON organizations FOR INSERT TO authenticated
WITH CHECK (public.is_platform_super_admin());

DROP POLICY IF EXISTS "Super Admin can update organizations" ON organizations;
CREATE POLICY "Super Admin can update organizations"
ON organizations FOR UPDATE TO authenticated
USING (public.is_platform_super_admin())
WITH CHECK (public.is_platform_super_admin());

DROP POLICY IF EXISTS "Super Admin can delete organizations" ON organizations;
CREATE POLICY "Super Admin can delete organizations"
ON organizations FOR DELETE TO authenticated
USING (public.is_platform_super_admin());
