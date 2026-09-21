-- ============================================================================
-- SQL SCRIPT: PLATFORM BRANDING DYNAMIC CONFIGURATION
-- ============================================================================

INSERT INTO config_lists (category, code, label, description, sort_order)
VALUES 
    ('platform_branding', 'PLATFORM_NAME', 'CCM PLATFORM', 'Platform branding header title', 10),
    ('platform_branding', 'PLATFORM_TAGLINE', 'Calibration Commercial Module Governance', 'Platform subtitle description', 20)
ON CONFLICT (category, code) DO UPDATE
SET label = EXCLUDED.label, description = EXCLUDED.description;
