-- ============================================================================
-- SQL SCRIPT: ROLE & PERMISSION MATRIX (SECTION 11.1 & 11.2)
-- ============================================================================

-- 1. Ensure roles.tenant_id can be NULL for platform-wide/system default roles
ALTER TABLE roles ALTER COLUMN tenant_id DROP NOT NULL;

-- 2. Create Permission Modules Catalog Table
CREATE TABLE IF NOT EXISTS permission_modules (
    module_code VARCHAR(100) PRIMARY KEY,
    module_name VARCHAR(255) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on permission_modules
ALTER TABLE permission_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated to select permission_modules"
    ON permission_modules FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow super admin to manage permission_modules"
    ON permission_modules FOR ALL
    TO authenticated
    USING (public.is_platform_super_admin());

-- 3. Create Role Module Permissions Junction Table
CREATE TABLE IF NOT EXISTS role_module_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    module_code VARCHAR(100) NOT NULL REFERENCES permission_modules(module_code) ON DELETE CASCADE,
    permission_level VARCHAR(50) NOT NULL CHECK (permission_level IN ('NONE', 'VIEW', 'CREATE', 'CREATE_EDIT', 'APPROVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_role_module UNIQUE (role_id, module_code)
);

-- Enable RLS on role_module_permissions
ALTER TABLE role_module_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated to select role_module_permissions"
    ON role_module_permissions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow super admin to manage role_module_permissions"
    ON role_module_permissions FOR ALL
    TO authenticated
    USING (public.is_platform_super_admin());

-- Update RLS on roles to allow platform users / super admins to select & manage
DROP POLICY IF EXISTS "Allow authenticated to select roles" ON roles;
CREATE POLICY "Allow authenticated to select roles"
    ON roles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow super admin to manage roles" ON roles;
CREATE POLICY "Allow super admin to manage roles"
    ON roles FOR ALL
    TO authenticated
    USING (public.is_platform_super_admin());

-- 4. Seed Core Modules from Section 11.2
INSERT INTO permission_modules (module_code, module_name, display_order, description)
VALUES
    ('CLIENT_VENDOR_ITEM_MASTER', 'Client / Vendor / Item Master (CRUD)', 1, 'Manage clients, vendors, and calibrated equipment masters'),
    ('CREATE_REQUEST', 'Create Request', 2, 'Intake and submission of calibration service requests'),
    ('LAB_VERIFICATION_RECEIPT', 'Lab Verification & Receipt Proof', 3, 'Inward instrument inspection, verification, and receipt proofs'),
    ('RECORD_CALIBRATION_FREQUENCY', 'Record Calibration Frequency', 4, 'Configure and adjust equipment calibration intervals and cycles'),
    ('CREATE_INVOICE', 'Create Invoice (incl. split)', 5, 'Generate billing invoices, split invoicing, and commercial tracking'),
    ('RAISE_SERVICE_FLAG', 'Raise Service Flag', 6, 'Flag service deviations, expedited priority, and quality alerts'),
    ('RAISE_PO_VENDOR_OUTSOURCING', 'Raise PO / Vendor Outsourcing', 7, 'Third-party lab outsourcing and purchase order dispatch'),
    ('CREATE_QUOTATION', 'Create Quotation', 8, 'Commercial price estimations, formal quotations, and discount policies'),
    ('CALIBRATION_DUE_LIST', 'Calibration Due List', 9, 'Monitoring instruments pending or approaching recalibration deadlines'),
    ('ROLE_PERMISSION_MANAGEMENT', 'Role & Permission Management', 10, 'Full governance over role definitions, privilege matrices, and assignments')
ON CONFLICT (module_code) DO UPDATE SET
    module_name = EXCLUDED.module_name,
    display_order = EXCLUDED.display_order,
    description = EXCLUDED.description;

-- Ensure roles.code has unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_code ON roles(code);

-- 5. Seed Default Roles from Section 11.2
INSERT INTO roles (name, code, description, status)
SELECT 'Collection Agent', 'COLLECTION_AGENT', 'Logistics and sample collection field agent', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'COLLECTION_AGENT');

INSERT INTO roles (name, code, description, status)
SELECT 'Lab Entry Person', 'LAB_ENTRY_PERSON', 'Laboratory testing technician and test datasheet data entry personnel', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'LAB_ENTRY_PERSON');

INSERT INTO roles (name, code, description, status)
SELECT 'Lab Approver', 'LAB_APPROVER', 'Senior laboratory technical manager and test report approver', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'LAB_APPROVER');

INSERT INTO roles (name, code, description, status)
SELECT 'Admin', 'ADMIN', 'Comprehensive laboratory operational administrator', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'ADMIN');

-- 6. Seed Section 11.2 Illustrative Default Role Configuration Matrix
DO $$
DECLARE
    r_collection_id UUID;
    r_lab_entry_id UUID;
    r_lab_approver_id UUID;
    r_admin_id UUID;
BEGIN
    SELECT id INTO r_collection_id FROM roles WHERE code = 'COLLECTION_AGENT' LIMIT 1;
    SELECT id INTO r_lab_entry_id FROM roles WHERE code = 'LAB_ENTRY_PERSON' LIMIT 1;
    SELECT id INTO r_lab_approver_id FROM roles WHERE code = 'LAB_APPROVER' LIMIT 1;
    SELECT id INTO r_admin_id FROM roles WHERE code = 'ADMIN' LIMIT 1;

    -- COLLECTION AGENT
    IF r_collection_id IS NOT NULL THEN
        INSERT INTO role_module_permissions (role_id, module_code, permission_level) VALUES
            (r_collection_id, 'CLIENT_VENDOR_ITEM_MASTER', 'VIEW'),
            (r_collection_id, 'CREATE_REQUEST', 'CREATE'),
            (r_collection_id, 'LAB_VERIFICATION_RECEIPT', 'NONE'),
            (r_collection_id, 'RECORD_CALIBRATION_FREQUENCY', 'NONE'),
            (r_collection_id, 'CREATE_INVOICE', 'NONE'),
            (r_collection_id, 'RAISE_SERVICE_FLAG', 'NONE'),
            (r_collection_id, 'RAISE_PO_VENDOR_OUTSOURCING', 'NONE'),
            (r_collection_id, 'CREATE_QUOTATION', 'NONE'),
            (r_collection_id, 'CALIBRATION_DUE_LIST', 'NONE'),
            (r_collection_id, 'ROLE_PERMISSION_MANAGEMENT', 'NONE')
        ON CONFLICT (role_id, module_code) DO UPDATE SET permission_level = EXCLUDED.permission_level;
    END IF;

    -- LAB ENTRY PERSON
    IF r_lab_entry_id IS NOT NULL THEN
        INSERT INTO role_module_permissions (role_id, module_code, permission_level) VALUES
            (r_lab_entry_id, 'CLIENT_VENDOR_ITEM_MASTER', 'VIEW'),
            (r_lab_entry_id, 'CREATE_REQUEST', 'VIEW'),
            (r_lab_entry_id, 'LAB_VERIFICATION_RECEIPT', 'CREATE_EDIT'),
            (r_lab_entry_id, 'RECORD_CALIBRATION_FREQUENCY', 'CREATE_EDIT'),
            (r_lab_entry_id, 'CREATE_INVOICE', 'CREATE_EDIT'),
            (r_lab_entry_id, 'RAISE_SERVICE_FLAG', 'CREATE'),
            (r_lab_entry_id, 'RAISE_PO_VENDOR_OUTSOURCING', 'CREATE_EDIT'),
            (r_lab_entry_id, 'CREATE_QUOTATION', 'CREATE'),
            (r_lab_entry_id, 'CALIBRATION_DUE_LIST', 'VIEW'),
            (r_lab_entry_id, 'ROLE_PERMISSION_MANAGEMENT', 'NONE')
        ON CONFLICT (role_id, module_code) DO UPDATE SET permission_level = EXCLUDED.permission_level;
    END IF;

    -- LAB APPROVER
    IF r_lab_approver_id IS NOT NULL THEN
        INSERT INTO role_module_permissions (role_id, module_code, permission_level) VALUES
            (r_lab_approver_id, 'CLIENT_VENDOR_ITEM_MASTER', 'VIEW'),
            (r_lab_approver_id, 'CREATE_REQUEST', 'VIEW'),
            (r_lab_approver_id, 'LAB_VERIFICATION_RECEIPT', 'VIEW'),
            (r_lab_approver_id, 'RECORD_CALIBRATION_FREQUENCY', 'VIEW'),
            (r_lab_approver_id, 'CREATE_INVOICE', 'VIEW'),
            (r_lab_approver_id, 'RAISE_SERVICE_FLAG', 'APPROVE'),
            (r_lab_approver_id, 'RAISE_PO_VENDOR_OUTSOURCING', 'VIEW'),
            (r_lab_approver_id, 'CREATE_QUOTATION', 'APPROVE'),
            (r_lab_approver_id, 'CALIBRATION_DUE_LIST', 'VIEW'),
            (r_lab_approver_id, 'ROLE_PERMISSION_MANAGEMENT', 'NONE')
        ON CONFLICT (role_id, module_code) DO UPDATE SET permission_level = EXCLUDED.permission_level;
    END IF;

    -- ADMIN
    IF r_admin_id IS NOT NULL THEN
        INSERT INTO role_module_permissions (role_id, module_code, permission_level) VALUES
            (r_admin_id, 'CLIENT_VENDOR_ITEM_MASTER', 'CREATE_EDIT'),
            (r_admin_id, 'CREATE_REQUEST', 'VIEW'),
            (r_admin_id, 'LAB_VERIFICATION_RECEIPT', 'VIEW'),
            (r_admin_id, 'RECORD_CALIBRATION_FREQUENCY', 'VIEW'),
            (r_admin_id, 'CREATE_INVOICE', 'VIEW'),
            (r_admin_id, 'RAISE_SERVICE_FLAG', 'VIEW'),
            (r_admin_id, 'RAISE_PO_VENDOR_OUTSOURCING', 'VIEW'),
            (r_admin_id, 'CREATE_QUOTATION', 'VIEW'),
            (r_admin_id, 'CALIBRATION_DUE_LIST', 'VIEW'),
            (r_admin_id, 'ROLE_PERMISSION_MANAGEMENT', 'CREATE_EDIT')
        ON CONFLICT (role_id, module_code) DO UPDATE SET permission_level = EXCLUDED.permission_level;
    END IF;
END $$;
