-- ============================================================================
-- SQL SCRIPT: AUDIT LOGS & DYNAMIC SYSTEM CONFIGURATION
-- ============================================================================

-- 1. Audit Logs Table (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 2. System Configurations Table (Tenant Business Rule Settings)
CREATE TABLE IF NOT EXISTS system_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tenant_config_key UNIQUE (tenant_id, config_key)
);

-- Seed default calibration frequency configuration
INSERT INTO system_configurations (tenant_id, config_key, config_value, description)
VALUES (NULL, 'DEFAULT_CALIBRATION_FREQUENCY_DAYS', '{"days": 365}'::jsonb, 'Default calibration interval for standard instruments')
ON CONFLICT (tenant_id, config_key) DO NOTHING;

-- 3. Audit Logger Function
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action TEXT,
    p_entity TEXT,
    p_entity_id TEXT,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_tenant_id UUID;
    v_org_id UUID;
BEGIN
    v_tenant_id := public.get_auth_user_tenant_id();
    v_org_id := public.get_auth_user_organization_id();

    IF v_tenant_id IS NULL THEN
        RETURN NULL;
    END IF;

    INSERT INTO audit_logs (
        tenant_id,
        organization_id,
        actor_user_id,
        action,
        entity,
        entity_id,
        old_data,
        new_data
    ) VALUES (
        v_tenant_id,
        v_org_id,
        auth.uid(),
        p_action,
        p_entity,
        p_entity_id,
        p_old_data,
        p_new_data
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;

-- 5. Audit Logs Policies
DROP POLICY IF EXISTS "Auditors and admins can view tenant audit logs" ON audit_logs;
CREATE POLICY "Auditors and admins can view tenant audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (
    tenant_id = public.get_auth_user_tenant_id()
    AND (public.has_permission('AUDIT_VIEW') OR public.has_permission('ADMIN_FULL_ACCESS'))
);

DROP POLICY IF EXISTS "Authenticated users can insert tenant audit logs" ON audit_logs;
CREATE POLICY "Authenticated users can insert tenant audit logs"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id = public.get_auth_user_tenant_id()
);

-- 6. System Configuration Policies
DROP POLICY IF EXISTS "Authenticated users can read system configs" ON system_configurations;
CREATE POLICY "Authenticated users can read system configs"
ON system_configurations FOR SELECT
TO authenticated
USING (
    tenant_id IS NULL OR tenant_id = public.get_auth_user_tenant_id()
);

DROP POLICY IF EXISTS "Admins can manage tenant system configs" ON system_configurations;
CREATE POLICY "Admins can manage tenant system configs"
ON system_configurations FOR ALL
TO authenticated
USING (
    tenant_id = public.get_auth_user_tenant_id() AND public.has_permission('TENANT_EDIT')
)
WITH CHECK (
    tenant_id = public.get_auth_user_tenant_id() AND public.has_permission('TENANT_EDIT')
);
