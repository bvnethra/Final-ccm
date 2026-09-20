-- ============================================================================
-- SQL SCRIPT: CORE RBAC ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- 1. user_profiles Policies
DROP POLICY IF EXISTS "Users can read own profile or tenant profiles" ON user_profiles;
CREATE POLICY "Users can read own profile or tenant profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (
    id = auth.uid() OR tenant_id = public.get_auth_user_tenant_id()
);

DROP POLICY IF EXISTS "Users can update own profile or admins update tenant profiles" ON user_profiles;
CREATE POLICY "Users can update own profile or admins update tenant profiles"
ON user_profiles FOR UPDATE
TO authenticated
USING (
    id = auth.uid() OR public.has_permission('USER_EDIT')
);

DROP POLICY IF EXISTS "Admins can insert tenant user profiles" ON user_profiles;
CREATE POLICY "Admins can insert tenant user profiles"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (
    public.has_permission('USER_CREATE') OR auth.uid() IS NOT NULL
);

-- 2. tenants Policies
DROP POLICY IF EXISTS "Authenticated users can read their tenant" ON tenants;
CREATE POLICY "Authenticated users can read their tenant"
ON tenants FOR SELECT
TO authenticated
USING (
    id = public.get_auth_user_tenant_id() OR public.has_permission('TENANT_VIEW')
);

-- 3. organizations Policies
DROP POLICY IF EXISTS "Users can read tenant organizations" ON organizations;
CREATE POLICY "Users can read tenant organizations"
ON organizations FOR SELECT
TO authenticated
USING (
    tenant_id = public.get_auth_user_tenant_id() OR public.has_permission('ORG_VIEW')
);

-- 4. permissions Master Table Policies
DROP POLICY IF EXISTS "Authenticated users can read system permissions" ON permissions;
CREATE POLICY "Authenticated users can read system permissions"
ON permissions FOR SELECT
TO authenticated
USING (true);

-- 5. role_templates Policies
DROP POLICY IF EXISTS "Authenticated users can read role templates" ON role_templates;
CREATE POLICY "Authenticated users can read role templates"
ON role_templates FOR SELECT
TO authenticated
USING (
    tenant_id IS NULL OR tenant_id = public.get_auth_user_tenant_id()
);

-- 6. role_template_permissions Policies
DROP POLICY IF EXISTS "Authenticated users can read role template permissions" ON role_template_permissions;
CREATE POLICY "Authenticated users can read role template permissions"
ON role_template_permissions FOR SELECT
TO authenticated
USING (true);

-- 7. roles Policies
DROP POLICY IF EXISTS "Users can read tenant roles" ON roles;
CREATE POLICY "Users can read tenant roles"
ON roles FOR SELECT
TO authenticated
USING (
    tenant_id = public.get_auth_user_tenant_id()
);

-- 8. user_roles Policies
DROP POLICY IF EXISTS "Users can read user roles" ON user_roles;
CREATE POLICY "Users can read user roles"
ON user_roles FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = user_roles.user_id AND up.tenant_id = public.get_auth_user_tenant_id()
    )
);

-- 9. role_permissions Policies
DROP POLICY IF EXISTS "Authenticated users can read role permissions" ON role_permissions;
CREATE POLICY "Authenticated users can read role permissions"
ON role_permissions FOR SELECT
TO authenticated
USING (true);
