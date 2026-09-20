-- ============================================================================
-- SQL SCRIPT: SUPER ADMIN PLATFORM GOVERNANCE & CONFIGURATION REPOSITORY
-- ============================================================================

-- 1. Extend Tenants with Enterprise Platform Attributes
ALTER TABLE tenants 
    ADD COLUMN IF NOT EXISTS setup_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_ORG' CHECK (setup_status IN ('PENDING_ORG', 'COMPLETE')),
    ADD COLUMN IF NOT EXISTS tenant_type VARCHAR(50) DEFAULT 'COMMERCIAL_LAB',
    ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS gst_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS address_line1 TEXT,
    ADD COLUMN IF NOT EXISTS address_line2 TEXT,
    ADD COLUMN IF NOT EXISTS city VARCHAR(100),
    ADD COLUMN IF NOT EXISTS state VARCHAR(100),
    ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India',
    ADD COLUMN IF NOT EXISTS pincode VARCHAR(20),
    ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR',
    ADD COLUMN IF NOT EXISTS branches_count INT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS status_reason TEXT;

-- Update existing default tenant to COMPLETE setup status
UPDATE tenants 
SET setup_status = 'COMPLETE', 
    tenant_type = 'COMMERCIAL_LAB', 
    country = 'India', 
    city = 'Chennai',
    state = 'Tamil Nadu',
    pincode = '600001',
    phone = '+91 98765 43210'
WHERE code = 'TNT-NETHRA';

-- 2. Create Platform Users Table (Distinct from Tenant User Profiles)
CREATE TABLE IF NOT EXISTS platform_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'PLATFORM_SUPPORT')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial Super Admin auth user into platform_users
INSERT INTO platform_users (id, email, full_name, role, status)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', 'Nethra Super Admin'), 'SUPER_ADMIN', 'ACTIVE'
FROM auth.users
WHERE email = 'admin@nethra.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'SUPER_ADMIN', status = 'ACTIVE';

-- 3. Dynamic Configuration Repository (Zero Hardcoding Source of Truth)
CREATE TABLE IF NOT EXISTS config_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_config_list_cat_code UNIQUE(category, code)
);

CREATE INDEX IF NOT EXISTS idx_config_lists_category ON config_lists(category, is_active, sort_order);

-- Seed Dynamic Configuration Lists
INSERT INTO config_lists (category, code, label, description, sort_order) VALUES
-- Tenant Types
('tenant_types', 'COMMERCIAL_LAB', 'Commercial Calibration Laboratory', 'Third-party commercial calibration and testing facility', 10),
('tenant_types', 'INTERNAL_CORP', 'Internal Corporate Metrology Lab', 'Captive metrology lab inside a manufacturing corporation', 20),
('tenant_types', 'DEFENSE_AERO', 'Defense & Aerospace Testing Facility', 'High-security defense, avionics and aerospace calibration center', 30),
('tenant_types', 'MEDICAL_DEVICE', 'Medical Devices & Healthcare Lab', 'ISO 13485 compliant hospital and medical instruments testing lab', 40),

-- Countries
('countries', 'IN', 'India', 'Republic of India (+91)', 10),
('countries', 'US', 'United States', 'United States of America (+1)', 20),
('countries', 'GB', 'United Kingdom', 'United Kingdom (+44)', 30),
('countries', 'DE', 'Germany', 'Federal Republic of Germany (+49)', 40),
('countries', 'AE', 'United Arab Emirates', 'United Arab Emirates (+971)', 50),
('countries', 'SG', 'Singapore', 'Republic of Singapore (+65)', 60),

-- Currencies
('currencies', 'INR', 'INR (₹) - Indian Rupee', 'Indian Rupee standard national currency', 10),
('currencies', 'USD', 'USD ($) - US Dollar', 'United States Dollar international standard', 20),
('currencies', 'EUR', 'EUR (€) - Euro', 'European Union Euro currency', 30),
('currencies', 'GBP', 'GBP (£) - British Pound', 'Great British Pound sterling', 40),
('currencies', 'AED', 'AED (د.إ) - UAE Dirham', 'United Arab Emirates Dirham', 50),
('currencies', 'SGD', 'SGD ($) - Singapore Dollar', 'Singapore Dollar', 60),

-- Timezones
('timezones', 'Asia/Kolkata', 'Asia/Kolkata (IST +5:30)', 'Indian Standard Time', 10),
('timezones', 'UTC', 'UTC (Coordinated Universal Time)', 'Universal Time Base', 20),
('timezones', 'Asia/Dubai', 'Asia/Dubai (GST +4:00)', 'Gulf Standard Time', 30),
('timezones', 'Europe/London', 'Europe/London (GMT/BST)', 'Greenwich Mean Time / British Summer Time', 40),
('timezones', 'Europe/Berlin', 'Europe/Berlin (CET/CEST)', 'Central European Time', 50),
('timezones', 'America/New_York', 'America/New_York (EST/EDT)', 'Eastern Standard Time', 60),

-- Validation Rules
('validation_rules', 'GST_IN', '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$', 'Standard 15-character Indian GSTIN regex', 10),
('validation_rules', 'PHONE_INTL', '^\+?[1-9]\d{1,14}$', 'E.164 International Phone format', 20)
ON CONFLICT (category, code) DO NOTHING;

-- 4. Immutable Platform Audit Logs (Append-Only)
CREATE TABLE IF NOT EXISTS platform_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email VARCHAR(255),
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    reference_id VARCHAR(100),
    previous_state JSONB,
    new_state JSONB,
    ip_address VARCHAR(50),
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_audit_created ON platform_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_audit_action ON platform_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_platform_audit_ref ON platform_audit_logs(reference_id);

-- Insert initial platform log
INSERT INTO platform_audit_logs (actor_email, actor_role, action, reference_id, reason, metadata)
VALUES ('admin@nethra.com', 'SUPER_ADMIN', 'PLATFORM_INITIALIZED', 'SYSTEM', 'Platform governance schema and dynamic configuration initialized', '{"version": "2.0"}'::jsonb);

-- 5. Helper Functions & Security Definers
CREATE OR REPLACE FUNCTION public.is_platform_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.platform_users
        WHERE id = auth.uid() AND status = 'ACTIVE'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_platform_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.platform_users
        WHERE id = auth.uid() AND role = 'SUPER_ADMIN' AND status = 'ACTIVE'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE platform_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_audit_logs ENABLE ROW LEVEL SECURITY;

-- Platform Users Policies
DROP POLICY IF EXISTS "Platform users can view platform directory" ON platform_users;
CREATE POLICY "Platform users can view platform directory"
ON platform_users FOR SELECT TO authenticated
USING (public.is_platform_user());

DROP POLICY IF EXISTS "Super Admin can manage platform users" ON platform_users;
CREATE POLICY "Super Admin can manage platform users"
ON platform_users FOR ALL TO authenticated
USING (public.is_platform_super_admin())
WITH CHECK (public.is_platform_super_admin());

-- Config Lists Policies
DROP POLICY IF EXISTS "Platform users can read dynamic config" ON config_lists;
DROP POLICY IF EXISTS "Anyone can read dynamic config" ON config_lists;
CREATE POLICY "Anyone can read dynamic config"
ON config_lists FOR SELECT TO anon, authenticated
USING (TRUE); -- Allow reading dynamic config lists

DROP POLICY IF EXISTS "Super Admin can manage dynamic config" ON config_lists;
CREATE POLICY "Super Admin can manage dynamic config"
ON config_lists FOR ALL TO authenticated
USING (public.is_platform_super_admin())
WITH CHECK (public.is_platform_super_admin());

-- Platform Audit Logs Policies (Strictly Append-Only)
DROP POLICY IF EXISTS "Platform users can read audit logs" ON platform_audit_logs;
CREATE POLICY "Platform users can read audit logs"
ON platform_audit_logs FOR SELECT TO authenticated
USING (public.is_platform_user());

DROP POLICY IF EXISTS "Platform users can insert audit logs" ON platform_audit_logs;
CREATE POLICY "Platform users can insert audit logs"
ON platform_audit_logs FOR INSERT TO authenticated
WITH CHECK (public.is_platform_user());

-- Tenants Policies Update: Platform Users Can View All Tenants; Super Admin Can Create & Modify
DROP POLICY IF EXISTS "Platform users can view all tenants" ON tenants;
CREATE POLICY "Platform users can view all tenants"
ON tenants FOR SELECT TO authenticated
USING (public.is_platform_user() OR id = public.get_auth_user_tenant_id());

DROP POLICY IF EXISTS "Super Admin can insert tenants" ON tenants;
CREATE POLICY "Super Admin can insert tenants"
ON tenants FOR INSERT TO authenticated
WITH CHECK (public.is_platform_super_admin());

DROP POLICY IF EXISTS "Super Admin can update tenants" ON tenants;
CREATE POLICY "Super Admin can update tenants"
ON tenants FOR UPDATE TO authenticated
USING (public.is_platform_super_admin())
WITH CHECK (public.is_platform_super_admin());
