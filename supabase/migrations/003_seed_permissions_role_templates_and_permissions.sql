-- ============================================================================
-- SQL SCRIPT: SEED MASTER PERMISSIONS, ROLE TEMPLATES & ROLE PERMISSIONS
-- ============================================================================

DO $$
DECLARE
    v_tenant_id UUID;
    v_org_id UUID;
    v_super_admin_role_id UUID;
    v_normal_role_id UUID;
    
    v_tpl_super_admin_id UUID;
    v_tpl_lab_engineer_id UUID;
    v_tpl_quality_manager_id UUID;
    v_tpl_auditor_id UUID;

BEGIN
    -- 1. Fetch Existing Tenant and Organization
    SELECT id INTO v_tenant_id FROM tenants WHERE code = 'TNT-NETHRA';
    SELECT id INTO v_org_id FROM organizations WHERE tenant_id = v_tenant_id AND code = 'ORG-HQ';
    SELECT id INTO v_super_admin_role_id FROM roles WHERE tenant_id = v_tenant_id AND code = 'SUPER_ADMIN';
    SELECT id INTO v_normal_role_id FROM roles WHERE tenant_id = v_tenant_id AND code = 'ROLE_LAB_ENGINEER';

    -- 2. Insert Master Permissions Catalog into permissions Table
    INSERT INTO permissions (code, name, description, module) VALUES
    -- System & Administration
    ('ADMIN_FULL_ACCESS', 'Full System Access', 'Unrestricted system control across all modules', 'ADMIN'),
    ('USER_VIEW', 'View Users', 'View user profile lists and details', 'USER_MGMT'),
    ('USER_CREATE', 'Create User', 'Create and register new user accounts', 'USER_MGMT'),
    ('USER_EDIT', 'Edit User', 'Update user profiles, roles, and status', 'USER_MGMT'),
    ('USER_DELETE', 'Delete User', 'Deactivate or delete user accounts', 'USER_MGMT'),
    ('TENANT_VIEW', 'View Tenant Settings', 'View organization tenant settings', 'TENANT_MGMT'),
    ('TENANT_EDIT', 'Edit Tenant Settings', 'Manage tenant configuration and preferences', 'TENANT_MGMT'),
    ('ORG_VIEW', 'View Sub-Organizations', 'View branches and sub-labs', 'ORG_MGMT'),
    ('ORG_CREATE', 'Create Sub-Organization', 'Add new branches and sub-labs', 'ORG_MGMT'),
    ('ORG_EDIT', 'Edit Sub-Organization', 'Update branch details and status', 'ORG_MGMT'),
    ('ROLE_VIEW', 'View Roles & Templates', 'View dynamic roles and template matrices', 'ROLE_MGMT'),
    ('ROLE_CREATE', 'Create Dynamic Role', 'Create custom roles from templates', 'ROLE_MGMT'),
    ('ROLE_EDIT', 'Edit Dynamic Role', 'Update role permissions and assignments', 'ROLE_MGMT'),
    
    -- Master Data & Equipment
    ('EQUIPMENT_VIEW', 'View Equipment Catalog', 'View master equipment list and calibration histories', 'EQUIPMENT'),
    ('EQUIPMENT_CREATE', 'Register Equipment', 'Intake and register new instruments', 'EQUIPMENT'),
    ('EQUIPMENT_EDIT', 'Update Equipment Details', 'Modify specifications and calibration frequencies', 'EQUIPMENT'),
    ('EQUIPMENT_DELETE', 'Decommission Equipment', 'Decommission or archive instruments', 'EQUIPMENT'),
    
    -- Calibration Requests & Work Orders
    ('REQUEST_VIEW', 'View Calibration Requests', 'View inbound calibration requests and status', 'REQUESTS'),
    ('REQUEST_CREATE', 'Submit Calibration Request', 'Submit new instrument calibration requests', 'REQUESTS'),
    ('REQUEST_EDIT', 'Edit Calibration Request', 'Modify request details before assignment', 'REQUESTS'),
    ('REQUEST_APPROVE', 'Approve/Assign Request', 'Approve request and assign lab engineer', 'REQUESTS'),
    ('REQUEST_REJECT', 'Reject Request', 'Reject invalid calibration request', 'REQUESTS'),

    -- Testing & Calibration Execution
    ('CALIBRATION_VIEW', 'View Calibration Records', 'View active test datasheets and raw measurements', 'CALIBRATION'),
    ('CALIBRATION_PERFORM', 'Execute Calibration Test', 'Perform calibration and record test measurements', 'CALIBRATION'),
    ('CALIBRATION_VERIFY', 'Verify Calibration Results', 'Peer review calibration measurement datasheets', 'CALIBRATION'),
    ('CALIBRATION_APPROVE', 'Approve Test Datasheet', 'Final technical approval of calibration datasheet', 'CALIBRATION'),

    -- Certificates & Reports
    ('CERTIFICATE_VIEW', 'View Certificates', 'View generated calibration certificates', 'CERTIFICATES'),
    ('CERTIFICATE_GENERATE', 'Generate Certificate', 'Generate draft calibration certificate', 'CERTIFICATES'),
    ('CERTIFICATE_SIGN', 'Digitally Sign Certificate', 'Authorize and sign official certificate', 'CERTIFICATES'),
    ('CERTIFICATE_REVOKE', 'Revoke Certificate', 'Revoke or supersede calibration certificate', 'CERTIFICATES'),
    ('REPORTS_VIEW', 'View Management Reports', 'Access operational and compliance reports', 'REPORTS'),
    ('AUDIT_VIEW', 'View Audit Logs', 'Inspect immutable system activity audit trails', 'AUDIT')
    ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        module = EXCLUDED.module;

    -- 3. Insert System Role Templates into role_templates Table
    SELECT id INTO v_tpl_super_admin_id FROM role_templates WHERE template_code = 'TPL_SUPER_ADMIN';
    IF v_tpl_super_admin_id IS NULL THEN
        INSERT INTO role_templates (tenant_id, organization_id, template_code, name, description, category) VALUES
        (v_tenant_id, v_org_id, 'TPL_SUPER_ADMIN', 'Super Administrator Template', 'Complete administrative authority template', 'ADMINISTRATION')
        RETURNING id INTO v_tpl_super_admin_id;
    END IF;

    SELECT id INTO v_tpl_lab_engineer_id FROM role_templates WHERE template_code = 'TPL_LAB_ENGINEER';
    IF v_tpl_lab_engineer_id IS NULL THEN
        INSERT INTO role_templates (tenant_id, organization_id, template_code, name, description, category) VALUES
        (v_tenant_id, v_org_id, 'TPL_LAB_ENGINEER', 'Calibration Engineer Template', 'Operational testing and datasheet entry template', 'OPERATIONS')
        RETURNING id INTO v_tpl_lab_engineer_id;
    END IF;

    SELECT id INTO v_tpl_quality_manager_id FROM role_templates WHERE template_code = 'TPL_QUALITY_MANAGER';
    IF v_tpl_quality_manager_id IS NULL THEN
        INSERT INTO role_templates (tenant_id, organization_id, template_code, name, description, category) VALUES
        (v_tenant_id, v_org_id, 'TPL_QUALITY_MANAGER', 'Quality Manager Template', 'Verification, technical approval, and certificate signing template', 'QUALITY')
        RETURNING id INTO v_tpl_quality_manager_id;
    END IF;

    SELECT id INTO v_tpl_auditor_id FROM role_templates WHERE template_code = 'TPL_AUDITOR';
    IF v_tpl_auditor_id IS NULL THEN
        INSERT INTO role_templates (tenant_id, organization_id, template_code, name, description, category) VALUES
        (v_tenant_id, v_org_id, 'TPL_AUDITOR', 'ISO Compliance Auditor Template', 'Read-only audit trail and certificate review template', 'AUDIT')
        RETURNING id INTO v_tpl_auditor_id;
    END IF;

    -- 4. Tag organization_id & role_template_id on existing roles
    UPDATE roles 
    SET organization_id = v_org_id,
        role_template_id = v_tpl_super_admin_id
    WHERE code = 'SUPER_ADMIN';

    UPDATE roles 
    SET organization_id = v_org_id,
        role_template_id = v_tpl_lab_engineer_id
    WHERE code = 'ROLE_LAB_ENGINEER';

    -- 5. Map Permissions to Role Templates (role_template_permissions)
    -- Super Admin Template -> ALL permissions
    INSERT INTO role_template_permissions (role_template_id, permission_id)
    SELECT v_tpl_super_admin_id, p.id
    FROM permissions p
    ON CONFLICT (role_template_id, permission_id) DO NOTHING;

    -- Lab Engineer Template -> Operations & Testing permissions
    INSERT INTO role_template_permissions (role_template_id, permission_id)
    SELECT v_tpl_lab_engineer_id, p.id
    FROM permissions p
    WHERE p.code IN ('EQUIPMENT_VIEW', 'EQUIPMENT_CREATE', 'REQUEST_VIEW', 'CALIBRATION_VIEW', 'CALIBRATION_PERFORM', 'CERTIFICATE_VIEW')
    ON CONFLICT (role_template_id, permission_id) DO NOTHING;

    -- Quality Manager Template -> Approval & Signing permissions
    INSERT INTO role_template_permissions (role_template_id, permission_id)
    SELECT v_tpl_quality_manager_id, p.id
    FROM permissions p
    WHERE p.code IN ('EQUIPMENT_VIEW', 'REQUEST_VIEW', 'REQUEST_APPROVE', 'CALIBRATION_VIEW', 'CALIBRATION_VERIFY', 'CALIBRATION_APPROVE', 'CERTIFICATE_VIEW', 'CERTIFICATE_GENERATE', 'CERTIFICATE_SIGN', 'REPORTS_VIEW')
    ON CONFLICT (role_template_id, permission_id) DO NOTHING;

    -- Auditor Template -> Read-only permissions
    INSERT INTO role_template_permissions (role_template_id, permission_id)
    SELECT v_tpl_auditor_id, p.id
    FROM permissions p
    WHERE p.code IN ('EQUIPMENT_VIEW', 'REQUEST_VIEW', 'CALIBRATION_VIEW', 'CERTIFICATE_VIEW', 'REPORTS_VIEW', 'AUDIT_VIEW')
    ON CONFLICT (role_template_id, permission_id) DO NOTHING;

    -- 6. Attach Permissions to Created Roles in role_permissions Table
    -- SUPER_ADMIN Role -> ALL permissions
    IF v_super_admin_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT v_super_admin_role_id, p.id
        FROM permissions p
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;

    -- ROLE_LAB_ENGINEER Role -> Operational permissions
    IF v_normal_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT v_normal_role_id, p.id
        FROM permissions p
        WHERE p.code IN ('EQUIPMENT_VIEW', 'EQUIPMENT_CREATE', 'REQUEST_VIEW', 'CALIBRATION_VIEW', 'CALIBRATION_PERFORM', 'CERTIFICATE_VIEW')
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;

END $$;
