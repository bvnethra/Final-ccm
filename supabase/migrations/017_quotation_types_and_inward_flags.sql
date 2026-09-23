-- ============================================================================
-- SQL SCRIPT: QUOTATION TYPES & INWARD REQUEST QUOTATION FLAGS
-- ============================================================================

-- 1. Add quotation requirement flag and status to calibration_requests
ALTER TABLE calibration_requests 
ADD COLUMN IF NOT EXISTS quotation_required BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE calibration_requests 
ADD COLUMN IF NOT EXISTS quotation_status VARCHAR(50) DEFAULT 'NONE';

CREATE INDEX IF NOT EXISTS idx_calibration_requests_quote_req 
ON calibration_requests(tenant_id, quotation_required, quotation_status);

-- 2. Enhance quotations table to support all 3 quotation types:
--    - INWARD_REQUEST (standard quotation from physical intake)
--    - EXISTING_CUSTOMER (approximate/custom quote for existing customer)
--    - NEW_CLIENT_ESTIMATE (approximate pre-inward estimate for new customer)
ALTER TABLE quotations 
ALTER COLUMN request_id DROP NOT NULL;

ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS quotation_type VARCHAR(50) NOT NULL DEFAULT 'INWARD_REQUEST' 
CHECK (quotation_type IN ('INWARD_REQUEST', 'EXISTING_CUSTOMER', 'NEW_CLIENT_ESTIMATE'));

CREATE INDEX IF NOT EXISTS idx_quotations_type 
ON quotations(tenant_id, quotation_type);

CREATE INDEX IF NOT EXISTS idx_quotations_client 
ON quotations(tenant_id, client_id);
