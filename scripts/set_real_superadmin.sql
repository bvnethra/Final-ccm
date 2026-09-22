-- ============================================================================
-- SQL SCRIPT: PROMOTE / CONFIGURE REAL SUPER ADMIN ACCOUNT IN NETHRA CCM
-- ============================================================================
-- Instructions:
-- 1. In Supabase Dashboard -> Authentication -> Users, create or locate your
--    real administrator account.
-- 2. Replace 'YOUR_REAL_SUPERADMIN_EMAIL@COMPANY.COM' below with your actual email.
-- 3. Execute this script in Supabase Dashboard -> SQL Editor.
-- ============================================================================

DO $$
DECLARE
    -- >>> CONFIGURE YOUR REAL SUPER ADMIN EMAIL HERE <<<
    v_target_email TEXT := 'nethrabv2005@gmail.com';
    
    v_user_auth_id UUID;
    v_tenant_id UUID;
    v_org_id UUID;
    v_super_admin_role_id UUID;
BEGIN
    -- 1. Locate the Auth User by Email
    SELECT id INTO v_user_auth_id 
    FROM auth.users 
    WHERE LOWER(email) = LOWER(v_target_email) 
    LIMIT 1;

    IF v_user_auth_id IS NULL THEN
        RAISE EXCEPTION 'User with email "%" was not found in auth.users. Please register/create the user first in Supabase Auth.', v_target_email;
    END IF;

    -- 2. Fetch or Create Default Tenant & Organization
    SELECT id INTO v_tenant_id FROM tenants ORDER BY created_at ASC LIMIT 1;
    IF v_tenant_id IS NULL THEN
        INSERT INTO tenants (name, code, status, admin_name, admin_email)
        VALUES ('Nethra Metrology Services Ltd', 'TNT-NETHRA', 'ACTIVE', 'Platform Super Admin', v_target_email)
        RETURNING id INTO v_tenant_id;
    END IF;

    SELECT id INTO v_org_id FROM organizations WHERE tenant_id = v_tenant_id ORDER BY created_at ASC LIMIT 1;
    IF v_org_id IS NULL THEN
        INSERT INTO organizations (tenant_id, name, code, status)
        VALUES (v_tenant_id, 'Central Calibration Lab - HQ', 'ORG-HQ', 'ACTIVE')
        RETURNING id INTO v_org_id;
    END IF;

    -- 3. Fetch or Create SUPER_ADMIN Role in roles table
    SELECT id INTO v_super_admin_role_id FROM roles WHERE code = 'SUPER_ADMIN' LIMIT 1;
    IF v_super_admin_role_id IS NULL THEN
        INSERT INTO roles (tenant_id, name, code, description, is_system)
        VALUES (v_tenant_id, 'Super Administrator', 'SUPER_ADMIN', 'Unrestricted administrative access across platform and tenants', true)
        RETURNING id INTO v_super_admin_role_id;
    END IF;

    -- 4. Upsert platform_users record with role = 'SUPER_ADMIN'
    INSERT INTO platform_users (id, email, full_name, role, status)
    VALUES (v_user_auth_id, LOWER(v_target_email), 'Platform Super Administrator', 'SUPER_ADMIN', 'ACTIVE')
    ON CONFLICT (id) DO UPDATE SET
        role = 'SUPER_ADMIN',
        status = 'ACTIVE',
        updated_at = NOW();

    -- 5. Upsert user_profiles record linked to active tenant & org
    INSERT INTO user_profiles (id, tenant_id, organization_id, email, full_name, status)
    VALUES (v_user_auth_id, v_tenant_id, v_org_id, LOWER(v_target_email), 'Platform Super Administrator', 'ACTIVE')
    ON CONFLICT (id) DO UPDATE SET
        tenant_id = v_tenant_id,
        organization_id = v_org_id,
        status = 'ACTIVE',
        updated_at = NOW();

    -- 6. Link User to SUPER_ADMIN role in user_roles
    INSERT INTO user_roles (user_id, role_id)
    VALUES (v_user_auth_id, v_super_admin_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;

    -- 7. Sync Auth metadata in auth.users
    UPDATE auth.users
    SET 
        raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "SUPER_ADMIN"}'::jsonb,
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "SUPER_ADMIN", "isSuperAdmin": true}'::jsonb
    WHERE id = v_user_auth_id;

    -- 8. Ensure SUPER_ADMIN role has full wildcard permission (*)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_super_admin_role_id, p.id
    FROM permissions p
    WHERE p.code = '*'
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    RAISE NOTICE 'SUCCESS: User "%" (ID: %) has been successfully promoted to SUPER_ADMIN!', v_target_email, v_user_auth_id;
END $$;
