-- Restrict permission_modules and role_module_permissions SELECT to Super Admin only
DROP POLICY IF EXISTS "Allow authenticated to select permission_modules" ON permission_modules;
DROP POLICY IF EXISTS "Allow super admin to select permission_modules" ON permission_modules;
CREATE POLICY "Allow super admin to select permission_modules"
    ON permission_modules FOR SELECT
    TO authenticated
    USING (public.is_platform_super_admin());

DROP POLICY IF EXISTS "Allow authenticated to select role_module_permissions" ON role_module_permissions;
DROP POLICY IF EXISTS "Allow super admin to select role_module_permissions" ON role_module_permissions;
CREATE POLICY "Allow super admin to select role_module_permissions"
    ON role_module_permissions FOR SELECT
    TO authenticated
    USING (public.is_platform_super_admin());
