-- ============================================================================
-- SQL SCRIPT: ALLOW ADMIN & SUPER ADMIN TO MANAGE ROLES & PERMISSIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin_or_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- 1. Check if platform super admin
    IF public.is_platform_super_admin() THEN
        RETURN TRUE;
    END IF;

    -- 2. Check if authenticated user has ADMIN or SUPER_ADMIN role in user_roles
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
          AND r.code IN ('ADMIN', 'SUPER_ADMIN')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update permission_modules policies
DROP POLICY IF EXISTS "Allow super admin to select permission_modules" ON permission_modules;
DROP POLICY IF EXISTS "Allow authenticated to select permission_modules" ON permission_modules;
CREATE POLICY "Allow admin and super admin to select permission_modules"
    ON permission_modules FOR SELECT
    TO authenticated
    USING (public.is_admin_or_super_admin());

DROP POLICY IF EXISTS "Allow super admin to manage permission_modules" ON permission_modules;
CREATE POLICY "Allow admin and super admin to manage permission_modules"
    ON permission_modules FOR ALL
    TO authenticated
    USING (public.is_admin_or_super_admin());

-- Update role_module_permissions policies
DROP POLICY IF EXISTS "Allow super admin to select role_module_permissions" ON role_module_permissions;
DROP POLICY IF EXISTS "Allow authenticated to select role_module_permissions" ON role_module_permissions;
CREATE POLICY "Allow admin and super admin to select role_module_permissions"
    ON role_module_permissions FOR SELECT
    TO authenticated
    USING (public.is_admin_or_super_admin());

DROP POLICY IF EXISTS "Allow super admin to manage role_module_permissions" ON role_module_permissions;
CREATE POLICY "Allow admin and super admin to manage role_module_permissions"
    ON role_module_permissions FOR ALL
    TO authenticated
    USING (public.is_admin_or_super_admin());

-- Update roles management policy
DROP POLICY IF EXISTS "Allow super admin to manage roles" ON roles;
CREATE POLICY "Allow admin and super admin to manage roles"
    ON roles FOR ALL
    TO authenticated
    USING (public.is_admin_or_super_admin());
