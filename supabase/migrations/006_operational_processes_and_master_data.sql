-- ============================================================================
-- SQL SCRIPT: OPERATIONAL PROCESSES, MASTER DATA & CALIBRATION SCHEMAS
-- ============================================================================

-- 1. Master Data: Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    client_code VARCHAR(50) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    address TEXT,
    billing_address TEXT,
    gst_tax_number VARCHAR(50),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Master Data: Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    vendor_code VARCHAR(50) NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    address TEXT,
    gst_tax_number VARCHAR(50),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    serviced_categories TEXT[],
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Master Data: Item Masters Table (Instruments & Equipment)
CREATE TABLE IF NOT EXISTS item_masters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    item_code VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_type VARCHAR(50) NOT NULL DEFAULT 'EQUIPMENT',
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(255),
    measurement_range VARCHAR(255),
    least_count VARCHAR(255),
    standard_cost NUMERIC(12,2) DEFAULT 0,
    calibration_frequency INT DEFAULT 365,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Process 1: Calibration Requests Table
CREATE TABLE IF NOT EXISTS calibration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    request_number VARCHAR(50) NOT NULL DEFAULT ('REQ-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 6)),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    collection_agent_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    collection_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'URGENT')),
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Process 1: Request Items Table
CREATE TABLE IF NOT EXISTS request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    item_master_id UUID REFERENCES item_masters(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1,
    received_quantity INT DEFAULT 0,
    item_condition VARCHAR(50) DEFAULT 'GOOD',
    status VARCHAR(50) NOT NULL DEFAULT 'ADDED',
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Process 2: Verifications Table
CREATE TABLE IF NOT EXISTS verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    request_item_id UUID NOT NULL REFERENCES request_items(id) ON DELETE CASCADE,
    verified_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_quantity INT NOT NULL DEFAULT 1,
    expected_quantity INT NOT NULL DEFAULT 1,
    observed_serial_number VARCHAR(255),
    observed_item_condition VARCHAR(50) NOT NULL DEFAULT 'GOOD',
    result VARCHAR(50) NOT NULL CHECK (result IN ('VERIFIED', 'DISCREPANCY', 'SHORT', 'REJECTED')),
    discrepancy_reason TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Process 3: Calibrations Table
CREATE TABLE IF NOT EXISTS calibrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    request_item_id UUID NOT NULL REFERENCES request_items(id) ON DELETE CASCADE,
    calibration_number VARCHAR(50) NOT NULL DEFAULT ('CAL-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 6)),
    calibrated_by VARCHAR(255) NOT NULL,
    calibration_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    calibration_method VARCHAR(255),
    calibration_location VARCHAR(255),
    result VARCHAR(20) NOT NULL CHECK (result IN ('PASS', 'FAIL')),
    outcome VARCHAR(50) NOT NULL CHECK (outcome IN ('CALIBRATED', 'FAULTY', 'OUTSOURCED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Process 3: Calibration Measurements Table
CREATE TABLE IF NOT EXISTS calibration_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    calibration_id UUID NOT NULL REFERENCES calibrations(id) ON DELETE CASCADE,
    parameter_name VARCHAR(255) NOT NULL,
    nominal_value NUMERIC(12,4) NOT NULL,
    measured_value NUMERIC(12,4) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    tolerance_min NUMERIC(12,4) NOT NULL,
    tolerance_max NUMERIC(12,4) NOT NULL,
    result VARCHAR(20) NOT NULL CHECK (result IN ('PASS', 'FAIL')),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Process 3: Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    request_item_id UUID REFERENCES request_items(id) ON DELETE SET NULL,
    calibration_id UUID REFERENCES calibrations(id) ON DELETE SET NULL,
    certificate_number VARCHAR(50) NOT NULL DEFAULT ('CERT-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 6)),
    certificate_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    certificate_status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    certificate_version INT NOT NULL DEFAULT 1,
    storage_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Process 4: Quotations Table
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    quotation_number VARCHAR(50) NOT NULL DEFAULT ('QUO-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 6)),
    quotation_version INT NOT NULL DEFAULT 1,
    quotation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    quotation_status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Process 4: Approvals Table
CREATE TABLE IF NOT EXISTS approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    approval_level INT NOT NULL DEFAULT 1,
    approver_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    approval_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    comments TEXT,
    action_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Process 4: Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL DEFAULT ('INV-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 6)),
    invoice_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    invoice_status VARCHAR(50) NOT NULL DEFAULT 'ISSUED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Process 5: Logistics & Execution (Signatures, Dispatches, Deliveries)
CREATE TABLE IF NOT EXISTS signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    signature_type VARCHAR(50) NOT NULL CHECK (signature_type IN ('CLIENT_INVOICE', 'CLIENT_DELIVERY')),
    signer_name VARCHAR(255) NOT NULL,
    signer_designation VARCHAR(255),
    signer_phone VARCHAR(50),
    signature_data TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    dispatch_number VARCHAR(50) NOT NULL DEFAULT ('DSP-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 6)),
    courier_partner VARCHAR(255),
    tracking_number VARCHAR(255),
    dispatch_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dispatch_status VARCHAR(50) NOT NULL DEFAULT 'DISPATCHED',
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    dispatch_id UUID REFERENCES dispatches(id) ON DELETE SET NULL,
    delivery_number VARCHAR(50) NOT NULL DEFAULT ('DLV-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 6)),
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(50),
    delivery_status VARCHAR(50) NOT NULL DEFAULT 'SIGNED',
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Lab Queue View
CREATE OR REPLACE VIEW view_lab_queue AS
SELECT 
    cr.id AS request_id,
    cr.tenant_id,
    cr.organization_id,
    cr.request_number,
    cr.client_id,
    c.client_name,
    cr.priority,
    cr.status AS request_status,
    cr.collection_date,
    ri.id AS request_item_id,
    ri.item_master_id,
    im.item_name,
    im.item_code,
    ri.quantity,
    ri.status AS item_status
FROM calibration_requests cr
JOIN clients c ON cr.client_id = c.id
LEFT JOIN request_items ri ON cr.id = ri.request_id
LEFT JOIN item_masters im ON ri.item_master_id = im.id;

-- 15. Enable Row Level Security (RLS) on all operational tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- 16. Multi-Tenant RLS Policies
-- Clients
DROP POLICY IF EXISTS "Tenant Isolation for clients" ON clients;
CREATE POLICY "Tenant Isolation for clients" ON clients FOR ALL TO authenticated
USING (tenant_id = public.get_auth_user_tenant_id())
WITH CHECK (tenant_id = public.get_auth_user_tenant_id());

-- Vendors
DROP POLICY IF EXISTS "Tenant Isolation for vendors" ON vendors;
CREATE POLICY "Tenant Isolation for vendors" ON vendors FOR ALL TO authenticated
USING (tenant_id = public.get_auth_user_tenant_id())
WITH CHECK (tenant_id = public.get_auth_user_tenant_id());

-- Item Masters
DROP POLICY IF EXISTS "Tenant Isolation for item_masters" ON item_masters;
CREATE POLICY "Tenant Isolation for item_masters" ON item_masters FOR ALL TO authenticated
USING (tenant_id = public.get_auth_user_tenant_id())
WITH CHECK (tenant_id = public.get_auth_user_tenant_id());

-- Calibration Requests
DROP POLICY IF EXISTS "Tenant Isolation for calibration_requests" ON calibration_requests;
CREATE POLICY "Tenant Isolation for calibration_requests" ON calibration_requests FOR ALL TO authenticated
USING (tenant_id = public.get_auth_user_tenant_id())
WITH CHECK (tenant_id = public.get_auth_user_tenant_id());

-- Request Items
DROP POLICY IF EXISTS "Tenant Isolation for request_items" ON request_items;
CREATE POLICY "Tenant Isolation for request_items" ON request_items FOR ALL TO authenticated
USING (tenant_id = public.get_auth_user_tenant_id())
WITH CHECK (tenant_id = public.get_auth_user_tenant_id());

-- Verifications
DROP POLICY IF EXISTS "Tenant Isolation for verifications" ON verifications;
CREATE POLICY "Tenant Isolation for verifications" ON verifications FOR ALL TO authenticated
USING (tenant_id = public.get_auth_user_tenant_id())
WITH CHECK (tenant_id = public.get_auth_user_tenant_id());

-- Calibrations
DROP POLICY IF EXISTS "Tenant Isolation for calibrations" ON calibrations;
CREATE POLICY "Tenant Isolation for calibrations" ON calibrations FOR ALL TO authenticated
USING (tenant_id = public.get_auth_user_tenant_id())
WITH CHECK (tenant_id = public.get_auth_user_tenant_id());

-- Calibration Measurements
DROP POLICY IF EXISTS "Tenant Isolation for calibration_measurements" ON calibration_measurements;
CREATE POLICY "Tenant Isolation for calibration_measurements" ON calibration_measurements FOR ALL TO authenticated
USING (tenant_id = public.get_auth_user_tenant_id())
WITH CHECK (tenant_id = public.get_auth_user_tenant_id());

-- Certificates
DROP POLICY IF EXISTS "Tenant Isolation for certificates" ON certificates;
CREATE POLICY "Tenant Isolation for certificates" ON certificates FOR ALL TO authenticated
USING (tenant_id = public.get_auth_user_tenant_id())
WITH CHECK (tenant_id = public.get_auth_user_tenant_id());

-- Quotations
DROP POLICY IF EXISTS "Tenant Isolation for quotations" ON quotations;
CREATE POLICY "Tenant Isolation for quotations" ON quotations FOR ALL TO authenticated
USING (tenant_id = public.get_auth_user_tenant_id())
WITH CHECK (tenant_id = public.get_auth_user_tenant_id());

-- Approvals
DROP POLICY IF EXISTS "Tenant Isolation for approvals" ON approvals;
CREATE POLICY "Tenant Isolation for approvals" ON approvals FOR ALL TO authenticated
USING (tenant_id = public.get_auth_user_tenant_id())
WITH CHECK (tenant_id = public.get_auth_user_tenant_id());

-- Invoices
DROP POLICY IF EXISTS "Tenant Isolation for invoices" ON invoices;
CREATE POLICY "Tenant Isolation for invoices" ON invoices FOR ALL TO authenticated
USING (tenant_id = public.get_auth_user_tenant_id())
WITH CHECK (tenant_id = public.get_auth_user_tenant_id());

-- Signatures
DROP POLICY IF EXISTS "Tenant Isolation for signatures" ON signatures;
CREATE POLICY "Tenant Isolation for signatures" ON signatures FOR ALL TO authenticated
USING (tenant_id = public.get_auth_user_tenant_id())
WITH CHECK (tenant_id = public.get_auth_user_tenant_id());

-- Dispatches
DROP POLICY IF EXISTS "Tenant Isolation for dispatches" ON dispatches;
CREATE POLICY "Tenant Isolation for dispatches" ON dispatches FOR ALL TO authenticated
USING (tenant_id = public.get_auth_user_tenant_id())
WITH CHECK (tenant_id = public.get_auth_user_tenant_id());

-- Deliveries
DROP POLICY IF EXISTS "Tenant Isolation for deliveries" ON deliveries;
CREATE POLICY "Tenant Isolation for deliveries" ON deliveries FOR ALL TO authenticated
USING (tenant_id = public.get_auth_user_tenant_id())
WITH CHECK (tenant_id = public.get_auth_user_tenant_id());
