-- ============================================================================
-- Migration 016: Seed Separate User Accounts with Defined Roles and Passwords
-- (Excluding Client and Vendor)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
    v_tenant_id UUID;
    v_org_id UUID;
    
    v_super_admin_role_id UUID;
    v_admin_role_id UUID;
    v_lab_approver_role_id UUID;
    v_lab_entry_role_id UUID;
    v_collection_agent_role_id UUID;
    
    v_superadmin_auth_id UUID;
    v_backoffice_auth_id UUID;
    v_labapprover_auth_id UUID;
    v_labentry_auth_id UUID;
    v_collector_auth_id UUID;
BEGIN
    -- 1. Fetch Tenant and Organization
    SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
    SELECT id INTO v_org_id FROM organizations WHERE tenant_id = v_tenant_id LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        INSERT INTO tenants (name, code, status, admin_name, admin_email)
        VALUES ('Nethra Metrology Services Ltd', 'TNT-NETHRA', 'ACTIVE', 'Super Admin', 'superadmin@nethra.com')
        RETURNING id INTO v_tenant_id;
    END IF;

    IF v_org_id IS NULL THEN
        INSERT INTO organizations (tenant_id, name, code, status)
        VALUES (v_tenant_id, 'Central Calibration Lab - HQ', 'ORG-HQ', 'ACTIVE')
        RETURNING id INTO v_org_id;
    END IF;

    -- 2. Fetch or Create Required System Roles
    SELECT id INTO v_super_admin_role_id FROM roles WHERE code = 'SUPER_ADMIN' LIMIT 1;
    SELECT id INTO v_admin_role_id FROM roles WHERE code = 'ADMIN' LIMIT 1;
    SELECT id INTO v_lab_approver_role_id FROM roles WHERE code = 'LAB_APPROVER' LIMIT 1;
    SELECT id INTO v_lab_entry_role_id FROM roles WHERE code = 'LAB_ENTRY_PERSON' LIMIT 1;
    SELECT id INTO v_collection_agent_role_id FROM roles WHERE code = 'COLLECTION_AGENT' LIMIT 1;

    -- Ensure roles exist
    IF v_super_admin_role_id IS NULL THEN
        INSERT INTO roles (tenant_id, name, code, description, is_system)
        VALUES (v_tenant_id, 'Super Administrator', 'SUPER_ADMIN', 'Platform Administrator', true)
        RETURNING id INTO v_super_admin_role_id;
    END IF;

    IF v_admin_role_id IS NULL THEN
        INSERT INTO roles (tenant_id, name, code, description, is_system)
        VALUES (v_tenant_id, 'Admin', 'ADMIN', 'Internal master-data owner and lab administrator', true)
        RETURNING id INTO v_admin_role_id;
    END IF;

    IF v_lab_approver_role_id IS NULL THEN
        INSERT INTO roles (tenant_id, name, code, description, is_system)
        VALUES (v_tenant_id, 'Lab Approver', 'LAB_APPROVER', 'Senior lab staff / Lab Head approver', true)
        RETURNING id INTO v_lab_approver_role_id;
    END IF;

    IF v_lab_entry_role_id IS NULL THEN
        INSERT INTO roles (tenant_id, name, code, description, is_system)
        VALUES (v_tenant_id, 'Lab Entry Person', 'LAB_ENTRY_PERSON', 'Internal lab operations staff', true)
        RETURNING id INTO v_lab_entry_role_id;
    END IF;

    IF v_collection_agent_role_id IS NULL THEN
        INSERT INTO roles (tenant_id, name, code, description, is_system)
        VALUES (v_tenant_id, 'Collection Agent', 'COLLECTION_AGENT', 'Field staff who visit client site', true)
        RETURNING id INTO v_collection_agent_role_id;
    END IF;

    -- =========================================================================
    -- 3. Provision User 1: Super Admin (superadmin@nethra.com / SuperAdmin@2026!)
    -- =========================================================================
    SELECT id INTO v_superadmin_auth_id FROM auth.users WHERE email = 'superadmin@nethra.com';
    IF v_superadmin_auth_id IS NULL THEN
        v_superadmin_auth_id := gen_random_uuid();
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at, is_super_admin
        ) VALUES (
            v_superadmin_auth_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'superadmin@nethra.com', extensions.crypt('SuperAdmin@2026!', extensions.gen_salt('bf')),
            NOW(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Nethra Super Admin"}',
            NOW(), NOW(), true
        );
    ELSE
        UPDATE auth.users
        SET encrypted_password = extensions.crypt('SuperAdmin@2026!', extensions.gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            updated_at = NOW()
        WHERE id = v_superadmin_auth_id;
    END IF;

    -- Profile & Roles
    INSERT INTO user_profiles (id, tenant_id, organization_id, email, full_name, status)
    VALUES (v_superadmin_auth_id, v_tenant_id, v_org_id, 'superadmin@nethra.com', 'Nethra Super Admin', 'ACTIVE')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, status = 'ACTIVE';

    INSERT INTO platform_users (id, email, full_name, role, status)
    VALUES (v_superadmin_auth_id, 'superadmin@nethra.com', 'Nethra Super Admin', 'SUPER_ADMIN', 'ACTIVE')
    ON CONFLICT (id) DO UPDATE SET role = 'SUPER_ADMIN', status = 'ACTIVE';

    INSERT INTO user_roles (user_id, role_id)
    VALUES (v_superadmin_auth_id, v_super_admin_role_id)
    ON CONFLICT DO NOTHING;

    -- Also update existing admin@nethra.com password to SuperAdmin@2026!
    UPDATE auth.users
    SET encrypted_password = extensions.crypt('SuperAdmin@2026!', extensions.gen_salt('bf'))
    WHERE email = 'admin@nethra.com';

    -- =========================================================================
    -- 4. Provision User 2: Admin / Back Office (backoffice@nethra.com / BackOffice@2026!)
    -- =========================================================================
    SELECT id INTO v_backoffice_auth_id FROM auth.users WHERE email = 'backoffice@nethra.com';
    IF v_backoffice_auth_id IS NULL THEN
        v_backoffice_auth_id := gen_random_uuid();
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at, is_super_admin
        ) VALUES (
            v_backoffice_auth_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'backoffice@nethra.com', extensions.crypt('BackOffice@2026!', extensions.gen_salt('bf')),
            NOW(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Back Office Admin"}',
            NOW(), NOW(), false
        );
    ELSE
        UPDATE auth.users
        SET encrypted_password = extensions.crypt('BackOffice@2026!', extensions.gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            updated_at = NOW()
        WHERE id = v_backoffice_auth_id;
    END IF;

    INSERT INTO user_profiles (id, tenant_id, organization_id, email, full_name, status)
    VALUES (v_backoffice_auth_id, v_tenant_id, v_org_id, 'backoffice@nethra.com', 'Back Office Admin', 'ACTIVE')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, status = 'ACTIVE';

    INSERT INTO user_roles (user_id, role_id)
    VALUES (v_backoffice_auth_id, v_admin_role_id)
    ON CONFLICT DO NOTHING;

    -- =========================================================================
    -- 5. Provision User 3: Lab Approver (labapprover@nethra.com / LabApprover@2026!)
    -- =========================================================================
    SELECT id INTO v_labapprover_auth_id FROM auth.users WHERE email = 'labapprover@nethra.com';
    IF v_labapprover_auth_id IS NULL THEN
        v_labapprover_auth_id := gen_random_uuid();
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at, is_super_admin
        ) VALUES (
            v_labapprover_auth_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'labapprover@nethra.com', extensions.crypt('LabApprover@2026!', extensions.gen_salt('bf')),
            NOW(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Senior Lab Approver"}',
            NOW(), NOW(), false
        );
    ELSE
        UPDATE auth.users
        SET encrypted_password = extensions.crypt('LabApprover@2026!', extensions.gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            updated_at = NOW()
        WHERE id = v_labapprover_auth_id;
    END IF;

    INSERT INTO user_profiles (id, tenant_id, organization_id, email, full_name, status)
    VALUES (v_labapprover_auth_id, v_tenant_id, v_org_id, 'labapprover@nethra.com', 'Senior Lab Approver', 'ACTIVE')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, status = 'ACTIVE';

    INSERT INTO user_roles (user_id, role_id)
    VALUES (v_labapprover_auth_id, v_lab_approver_role_id)
    ON CONFLICT DO NOTHING;

    -- =========================================================================
    -- 6. Provision User 4: Lab Entry Person (labentry@nethra.com / LabEntry@2026!)
    -- =========================================================================
    SELECT id INTO v_labentry_auth_id FROM auth.users WHERE email = 'labentry@nethra.com';
    IF v_labentry_auth_id IS NULL THEN
        v_labentry_auth_id := gen_random_uuid();
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at, is_super_admin
        ) VALUES (
            v_labentry_auth_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'labentry@nethra.com', extensions.crypt('LabEntry@2026!', extensions.gen_salt('bf')),
            NOW(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Lab Entry Technician"}',
            NOW(), NOW(), false
        );
    ELSE
        UPDATE auth.users
        SET encrypted_password = extensions.crypt('LabEntry@2026!', extensions.gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            updated_at = NOW()
        WHERE id = v_labentry_auth_id;
    END IF;

    INSERT INTO user_profiles (id, tenant_id, organization_id, email, full_name, status)
    VALUES (v_labentry_auth_id, v_tenant_id, v_org_id, 'labentry@nethra.com', 'Lab Entry Technician', 'ACTIVE')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, status = 'ACTIVE';

    INSERT INTO user_roles (user_id, role_id)
    VALUES (v_labentry_auth_id, v_lab_entry_role_id)
    ON CONFLICT DO NOTHING;

    -- =========================================================================
    -- 7. Provision User 5: Collection Agent (collectionagent@nethra.com / Collection@2026!)
    -- =========================================================================
    SELECT id INTO v_collector_auth_id FROM auth.users WHERE email = 'collectionagent@nethra.com';
    IF v_collector_auth_id IS NULL THEN
        v_collector_auth_id := gen_random_uuid();
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at, is_super_admin
        ) VALUES (
            v_collector_auth_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'collectionagent@nethra.com', extensions.crypt('Collection@2026!', extensions.gen_salt('bf')),
            NOW(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Field Collection Agent"}',
            NOW(), NOW(), false
        );
    ELSE
        UPDATE auth.users
        SET encrypted_password = extensions.crypt('Collection@2026!', extensions.gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            updated_at = NOW()
        WHERE id = v_collector_auth_id;
    END IF;

    INSERT INTO user_profiles (id, tenant_id, organization_id, email, full_name, status)
    VALUES (v_collector_auth_id, v_tenant_id, v_org_id, 'collectionagent@nethra.com', 'Field Collection Agent', 'ACTIVE')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, status = 'ACTIVE';

    INSERT INTO user_roles (user_id, role_id)
    VALUES (v_collector_auth_id, v_collection_agent_role_id)
    ON CONFLICT DO NOTHING;

END $$;
