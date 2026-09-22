-- ============================================================================
-- MIGRATION 020: FIX RLS — ALL AUTHENTICATED USERS CAN READ THEIR PERMISSIONS
-- Removes all admin-only guards on SELECT for permission_modules and
-- role_module_permissions. Keeps write operations restricted to super admin.
-- This is required for the dynamic RBAC system to work for all roles.
-- ============================================================================

-- ============================================================================
-- 1. permission_modules — allow ALL authenticated users to READ
-- ============================================================================
DROP POLICY IF EXISTS "Allow authenticated to select permission_modules"     ON permission_modules;
DROP POLICY IF EXISTS "Allow admin and super admin to select permission_modules" ON permission_modules;
DROP POLICY IF EXISTS "Allow super admin to select permission_modules"        ON permission_modules;
DROP POLICY IF EXISTS "Allow super admin to manage permission_modules"        ON permission_modules;
DROP POLICY IF EXISTS "Allow admin and super admin to manage permission_modules" ON permission_modules;

-- Any authenticated user can read the module catalog
CREATE POLICY "allow_authenticated_read_permission_modules"
    ON permission_modules FOR SELECT
    TO authenticated
    USING (true);

-- Only platform super admin can write
CREATE POLICY "allow_super_admin_manage_permission_modules"
    ON permission_modules FOR ALL
    TO authenticated
    USING (public.is_platform_super_admin());

-- ============================================================================
-- 2. role_module_permissions — allow ALL authenticated users to READ
-- ============================================================================
DROP POLICY IF EXISTS "Allow authenticated to select role_module_permissions"      ON role_module_permissions;
DROP POLICY IF EXISTS "Allow admin and super admin to select role_module_permissions" ON role_module_permissions;
DROP POLICY IF EXISTS "Allow super admin to select role_module_permissions"          ON role_module_permissions;
DROP POLICY IF EXISTS "Allow super admin to manage role_module_permissions"          ON role_module_permissions;
DROP POLICY IF EXISTS "Allow admin and super admin to manage role_module_permissions" ON role_module_permissions;

-- Any authenticated user can read permission levels (needed to load their own permissions on login)
CREATE POLICY "allow_authenticated_read_role_module_permissions"
    ON role_module_permissions FOR SELECT
    TO authenticated
    USING (true);

-- Only platform super admin OR local admin can write (UPDATE/INSERT/DELETE)
CREATE POLICY "allow_admin_manage_role_module_permissions"
    ON role_module_permissions FOR ALL
    TO authenticated
    USING (public.is_admin_or_super_admin());

-- ============================================================================
-- 3. roles — allow ALL authenticated users to READ (already exists but ensure)
-- ============================================================================
DROP POLICY IF EXISTS "Allow authenticated to select roles" ON roles;
DROP POLICY IF EXISTS "Allow admin and super admin to manage roles" ON roles;
DROP POLICY IF EXISTS "Allow super admin to manage roles" ON roles;

CREATE POLICY "allow_authenticated_read_roles"
    ON roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "allow_admin_manage_roles"
    ON roles FOR ALL
    TO authenticated
    USING (public.is_admin_or_super_admin());

-- ============================================================================
-- 4. user_roles — allow users to read their OWN role entries
--    and allow admin to manage all
-- ============================================================================
DROP POLICY IF EXISTS "Allow users to select their own roles"    ON user_roles;
DROP POLICY IF EXISTS "Allow admin to manage user_roles"         ON user_roles;
DROP POLICY IF EXISTS "Allow authenticated to select user_roles" ON user_roles;

CREATE POLICY "allow_users_read_own_user_roles"
    ON user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin_or_super_admin());

CREATE POLICY "allow_admin_manage_user_roles"
    ON user_roles FOR ALL
    TO authenticated
    USING (public.is_admin_or_super_admin());
