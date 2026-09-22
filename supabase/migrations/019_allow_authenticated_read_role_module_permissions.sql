-- ============================================================================
-- SQL SCRIPT: ALLOW AUTHENTICATED USERS TO SELECT ROLE MODULE PERMISSIONS
-- Ensures all operational users (Collection Agent, Lab Entry Person, etc.)
-- can dynamically load their active permissions configured by Super Admin.
-- ============================================================================

-- 1. Allow authenticated to select permission_modules
DROP POLICY IF EXISTS "Allow admin and super admin to select permission_modules" ON permission_modules;
DROP POLICY IF EXISTS "Allow authenticated to select permission_modules" ON permission_modules;

CREATE POLICY "Allow authenticated to select permission_modules"
    ON permission_modules FOR SELECT
    TO authenticated
    USING (true);

-- 2. Allow authenticated to select role_module_permissions
DROP POLICY IF EXISTS "Allow admin and super admin to select role_module_permissions" ON role_module_permissions;
DROP POLICY IF EXISTS "Allow authenticated to select role_module_permissions" ON role_module_permissions;

CREATE POLICY "Allow authenticated to select role_module_permissions"
    ON role_module_permissions FOR SELECT
    TO authenticated
    USING (true);
