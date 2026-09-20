-- ============================================================================
-- SQL SCRIPT: SEED SUPER ADMIN & NORMAL USER ROLES AND PROFILES (DEV TEMPLATE)
-- ============================================================================

DO $$
DECLARE
    v_tenant_id UUID;
    v_org_id UUID;
    v_super_admin_role_id UUID;
    v_normal_role_id UUID;
    
    v_admin_auth_id UUID;
    v_user_auth_id UUID;
    
    v_encrypted_pw TEXT;
BEGIN
    -- Ensure pgcrypto extension is available for password hashing
    CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

    -- Generate a strong random cryptographic hash for initial template accounts
    -- (In production, users are invited via GoTrue Auth Admin API)
    v_encrypted_pw := extensions.crypt(encode(gen_random_bytes(24), 'hex'), extensions.gen_salt('bf'));

    -- 1. Create Default Tenant if none exists
    SELECT id INTO v_tenant_id FROM tenants WHERE code = 'TNT-NETHRA';
    IF v_tenant_id IS NULL THEN
        INSERT INTO tenants (name, code, status, admin_name, admin_email) VALUES
        ('Nethra Metrology Services Ltd', 'TNT-NETHRA', 'ACTIVE', 'Nethra Super Admin', 'admin@nethra.com')
        RETURNING id INTO v_tenant_id;
    END IF;

    -- 2. Create Organization under Tenant
    SELECT id INTO v_org_id FROM organizations WHERE tenant_id = v_tenant_id AND code = 'ORG-HQ';
    IF v_org_id IS NULL THEN
        INSERT INTO organizations (tenant_id, name, code, status) VALUES
        (v_tenant_id, 'Central Calibration Lab - HQ', 'ORG-HQ', 'ACTIVE')
        RETURNING id INTO v_org_id;
    END IF;

    -- 3. Create Default System Roles under Tenant
    SELECT id INTO v_super_admin_role_id FROM roles WHERE tenant_id = v_tenant_id AND code = 'SUPER_ADMIN';
    IF v_super_admin_role_id IS NULL THEN
        INSERT INTO roles (tenant_id, name, code, description, status) VALUES
        (v_tenant_id, 'Super Administrator', 'SUPER_ADMIN', 'Unrestricted administrative access across tenant', 'ACTIVE')
        RETURNING id INTO v_super_admin_role_id;
    END IF;

    SELECT id INTO v_normal_role_id FROM roles WHERE tenant_id = v_tenant_id AND code = 'ROLE_LAB_ENGINEER';
    IF v_normal_role_id IS NULL THEN
        INSERT INTO roles (tenant_id, name, code, description, status) VALUES
        (v_tenant_id, 'Calibration Engineer', 'ROLE_LAB_ENGINEER', 'Standard operational lab user for calibration testing', 'ACTIVE')
        RETURNING id INTO v_normal_role_id;
    END IF;

    -- 4. Create Initial Super Admin Auth User if not existing
    SELECT id INTO v_admin_auth_id FROM auth.users WHERE email = 'admin@nethra.com';
    IF v_admin_auth_id IS NULL THEN
        v_admin_auth_id := gen_random_uuid();
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, 
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
            created_at, updated_at, is_super_admin
        ) VALUES (
            v_admin_auth_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'admin@nethra.com',
            v_encrypted_pw,
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "Nethra Super Admin"}',
            NOW(),
            NOW(),
            false
        );
    END IF;

    -- Tag Super Admin Profile in public.user_profiles
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = v_admin_auth_id) THEN
        INSERT INTO user_profiles (id, tenant_id, organization_id, email, full_name, phone, status) VALUES
        (v_admin_auth_id, v_tenant_id, v_org_id, 'admin@nethra.com', 'Nethra Super Admin', NULL, 'ACTIVE');
    END IF;

    -- Tag Super Admin Role in public.user_roles
    IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_admin_auth_id AND role_id = v_super_admin_role_id) THEN
        INSERT INTO user_roles (user_id, role_id) VALUES
        (v_admin_auth_id, v_super_admin_role_id);
    END IF;

    -- 5. Create Normal User Auth User if not existing
    SELECT id INTO v_user_auth_id FROM auth.users WHERE email = 'user@nethra.com';
    IF v_user_auth_id IS NULL THEN
        v_user_auth_id := gen_random_uuid();
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, 
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
            created_at, updated_at, is_super_admin
        ) VALUES (
            v_user_auth_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'user@nethra.com',
            v_encrypted_pw,
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "Calibration Engineer User"}',
            NOW(),
            NOW(),
            false
        );
    END IF;

    -- Tag Normal User Profile in public.user_profiles
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = v_user_auth_id) THEN
        INSERT INTO user_profiles (id, tenant_id, organization_id, email, full_name, phone, status) VALUES
        (v_user_auth_id, v_tenant_id, v_org_id, 'user@nethra.com', 'Calibration Engineer User', NULL, 'ACTIVE');
    END IF;

    -- Tag Normal User Role in public.user_roles
    IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_user_auth_id AND role_id = v_normal_role_id) THEN
        INSERT INTO user_roles (user_id, role_id) VALUES
        (v_user_auth_id, v_normal_role_id);
    END IF;
END $$;
