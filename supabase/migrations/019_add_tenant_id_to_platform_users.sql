-- ============================================================================
-- Migration 019: Add tenant_id to platform_users and link to tenants
-- ============================================================================

-- 1. Add tenant_id column to platform_users referencing tenants
ALTER TABLE platform_users 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

-- 2. Relax role check constraint to allow standard system roles (e.g. ADMIN, LAB_APPROVER, etc.)
ALTER TABLE platform_users DROP CONSTRAINT IF EXISTS platform_users_role_check;

-- 3. Populate tenant_id for existing platform_users from user_profiles
UPDATE platform_users pu
SET tenant_id = up.tenant_id
FROM user_profiles up
WHERE pu.id = up.id AND pu.tenant_id IS NULL;

-- Fallback default tenant for any remaining without tenant_id
UPDATE platform_users
SET tenant_id = (SELECT id FROM tenants WHERE code = 'TNT-NETHRA' LIMIT 1)
WHERE tenant_id IS NULL;

-- 4. Synchronize all operators from user_profiles that exist in auth.users into platform_users
INSERT INTO platform_users (id, email, full_name, role, status, tenant_id)
SELECT 
    up.id, 
    up.email, 
    up.full_name, 
    COALESCE(r.code, 'PLATFORM_SUPPORT') as role, 
    up.status, 
    up.tenant_id
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
LEFT JOIN user_roles ur ON ur.user_id = up.id
LEFT JOIN roles r ON r.id = ur.role_id
ON CONFLICT (id) DO UPDATE 
SET tenant_id = EXCLUDED.tenant_id;

-- 5. Refresh RLS policies on platform_users
DROP POLICY IF EXISTS "Platform users can view platform directory" ON platform_users;
CREATE POLICY "Platform users can view platform directory"
ON platform_users FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Super Admin can manage platform users" ON platform_users;
CREATE POLICY "Super Admin can manage platform users"
ON platform_users FOR ALL TO authenticated
USING (true)
WITH CHECK (true);
