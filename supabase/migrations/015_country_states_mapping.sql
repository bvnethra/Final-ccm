-- Migration 015: Country-Specific States and Provinces Mapping
-- Link states to country via metadata JSONB

-- 1. Update Indian States with country metadata
UPDATE config_lists
SET metadata = '{"country_code": "IN", "country": "India"}'::jsonb
WHERE category = 'states' AND code IN (
  'AP', 'AR', 'AS', 'BR', 'CG', 'GA', 'GJ', 'HR', 'HP', 'JH', 
  'KA', 'KL', 'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OD', 'PB', 
  'RJ', 'SK', 'TN', 'TS', 'TR', 'UP', 'UK', 'WB'
);

-- 2. Insert United States (50 states)
INSERT INTO config_lists (category, code, label, description, sort_order, metadata) VALUES
('states', 'US_AL', 'Alabama', 'US State', 10, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_AK', 'Alaska', 'US State', 20, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_AZ', 'Arizona', 'US State', 30, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_AR', 'Arkansas', 'US State', 40, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_CA', 'California', 'US State', 50, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_CO', 'Colorado', 'US State', 60, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_CT', 'Connecticut', 'US State', 70, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_DE', 'Delaware', 'US State', 80, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_FL', 'Florida', 'US State', 90, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_GA', 'Georgia', 'US State', 100, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_HI', 'Hawaii', 'US State', 110, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_ID', 'Idaho', 'US State', 120, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_IL', 'Illinois', 'US State', 130, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_IN', 'Indiana', 'US State', 140, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_IA', 'Iowa', 'US State', 150, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_KS', 'Kansas', 'US State', 160, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_KY', 'Kentucky', 'US State', 170, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_LA', 'Louisiana', 'US State', 180, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_ME', 'Maine', 'US State', 190, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_MD', 'Maryland', 'US State', 200, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_MA', 'Massachusetts', 'US State', 210, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_MI', 'Michigan', 'US State', 220, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_MN', 'Minnesota', 'US State', 230, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_MS', 'Mississippi', 'US State', 240, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_MO', 'Missouri', 'US State', 250, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_MT', 'Montana', 'US State', 260, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_NE', 'Nebraska', 'US State', 270, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_NV', 'Nevada', 'US State', 280, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_NH', 'New Hampshire', 'US State', 290, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_NJ', 'New Jersey', 'US State', 300, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_NM', 'New Mexico', 'US State', 310, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_NY', 'New York', 'US State', 320, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_NC', 'North Carolina', 'US State', 330, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_ND', 'North Dakota', 'US State', 340, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_OH', 'Ohio', 'US State', 350, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_OK', 'Oklahoma', 'US State', 360, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_OR', 'Oregon', 'US State', 370, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_PA', 'Pennsylvania', 'US State', 380, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_RI', 'Rhode Island', 'US State', 390, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_SC', 'South Carolina', 'US State', 400, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_SD', 'South Dakota', 'US State', 410, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_TN', 'Tennessee', 'US State', 420, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_TX', 'Texas', 'US State', 430, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_UT', 'Utah', 'US State', 440, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_VT', 'Vermont', 'US State', 450, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_VA', 'Virginia', 'US State', 460, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_WA', 'Washington', 'US State', 470, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_WV', 'West Virginia', 'US State', 480, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_WI', 'Wisconsin', 'US State', 490, '{"country_code": "US", "country": "United States"}'::jsonb),
('states', 'US_WY', 'Wyoming', 'US State', 500, '{"country_code": "US", "country": "United States"}'::jsonb)
ON CONFLICT (category, code) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- 3. Insert United Kingdom (Countries/Regions)
INSERT INTO config_lists (category, code, label, description, sort_order, metadata) VALUES
('states', 'GB_ENG', 'England', 'UK Country', 10, '{"country_code": "GB", "country": "United Kingdom"}'::jsonb),
('states', 'GB_SCT', 'Scotland', 'UK Country', 20, '{"country_code": "GB", "country": "United Kingdom"}'::jsonb),
('states', 'GB_WLS', 'Wales', 'UK Country', 30, '{"country_code": "GB", "country": "United Kingdom"}'::jsonb),
('states', 'GB_NIR', 'Northern Ireland', 'UK Country', 40, '{"country_code": "GB", "country": "United Kingdom"}'::jsonb)
ON CONFLICT (category, code) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- 4. Insert Germany (Bundesländer)
INSERT INTO config_lists (category, code, label, description, sort_order, metadata) VALUES
('states', 'DE_BW', 'Baden-Württemberg', 'German State', 10, '{"country_code": "DE", "country": "Germany"}'::jsonb),
('states', 'DE_BY', 'Bavaria', 'German State', 20, '{"country_code": "DE", "country": "Germany"}'::jsonb),
('states', 'DE_BE', 'Berlin', 'German State', 30, '{"country_code": "DE", "country": "Germany"}'::jsonb),
('states', 'DE_BB', 'Brandenburg', 'German State', 40, '{"country_code": "DE", "country": "Germany"}'::jsonb),
('states', 'DE_HB', 'Bremen', 'German State', 50, '{"country_code": "DE", "country": "Germany"}'::jsonb),
('states', 'DE_HH', 'Hamburg', 'German State', 60, '{"country_code": "DE", "country": "Germany"}'::jsonb),
('states', 'DE_HE', 'Hesse', 'German State', 70, '{"country_code": "DE", "country": "Germany"}'::jsonb),
('states', 'DE_NI', 'Lower Saxony', 'German State', 80, '{"country_code": "DE", "country": "Germany"}'::jsonb),
('states', 'DE_MV', 'Mecklenburg-Vorpommern', 'German State', 90, '{"country_code": "DE", "country": "Germany"}'::jsonb),
('states', 'DE_NW', 'North Rhine-Westphalia', 'German State', 100, '{"country_code": "DE", "country": "Germany"}'::jsonb),
('states', 'DE_RP', 'Rhineland-Palatinate', 'German State', 110, '{"country_code": "DE", "country": "Germany"}'::jsonb),
('states', 'DE_SL', 'Saarland', 'German State', 120, '{"country_code": "DE", "country": "Germany"}'::jsonb),
('states', 'DE_SN', 'Saxony', 'German State', 130, '{"country_code": "DE", "country": "Germany"}'::jsonb),
('states', 'DE_ST', 'Saxony-Anhalt', 'German State', 140, '{"country_code": "DE", "country": "Germany"}'::jsonb),
('states', 'DE_SH', 'Schleswig-Holstein', 'German State', 150, '{"country_code": "DE", "country": "Germany"}'::jsonb),
('states', 'DE_TH', 'Thuringia', 'German State', 160, '{"country_code": "DE", "country": "Germany"}'::jsonb)
ON CONFLICT (category, code) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- 5. Insert United Arab Emirates (Emirates)
INSERT INTO config_lists (category, code, label, description, sort_order, metadata) VALUES
('states', 'AE_AZ', 'Abu Dhabi', 'UAE Emirate', 10, '{"country_code": "AE", "country": "United Arab Emirates"}'::jsonb),
('states', 'AE_AJ', 'Ajman', 'UAE Emirate', 20, '{"country_code": "AE", "country": "United Arab Emirates"}'::jsonb),
('states', 'AE_DU', 'Dubai', 'UAE Emirate', 30, '{"country_code": "AE", "country": "United Arab Emirates"}'::jsonb),
('states', 'AE_FU', 'Fujairah', 'UAE Emirate', 40, '{"country_code": "AE", "country": "United Arab Emirates"}'::jsonb),
('states', 'AE_RK', 'Ras Al Khaimah', 'UAE Emirate', 50, '{"country_code": "AE", "country": "United Arab Emirates"}'::jsonb),
('states', 'AE_SH', 'Sharjah', 'UAE Emirate', 60, '{"country_code": "AE", "country": "United Arab Emirates"}'::jsonb),
('states', 'AE_UQ', 'Umm Al-Quwain', 'UAE Emirate', 70, '{"country_code": "AE", "country": "United Arab Emirates"}'::jsonb)
ON CONFLICT (category, code) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- 6. Insert Singapore (CDC Districts)
INSERT INTO config_lists (category, code, label, description, sort_order, metadata) VALUES
('states', 'SG_CS', 'Central Singapore', 'Singapore CDC District', 10, '{"country_code": "SG", "country": "Singapore"}'::jsonb),
('states', 'SG_NE', 'North East', 'Singapore CDC District', 20, '{"country_code": "SG", "country": "Singapore"}'::jsonb),
('states', 'SG_NW', 'North West', 'Singapore CDC District', 30, '{"country_code": "SG", "country": "Singapore"}'::jsonb),
('states', 'SG_SE', 'South East', 'Singapore CDC District', 40, '{"country_code": "SG", "country": "Singapore"}'::jsonb),
('states', 'SG_SW', 'South West', 'Singapore CDC District', 50, '{"country_code": "SG", "country": "Singapore"}'::jsonb)
ON CONFLICT (category, code) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- 7. Update Countries metadata with default currency and timezone
UPDATE config_lists SET metadata = '{"currency": "INR", "timezone": "Asia/Kolkata"}'::jsonb WHERE category = 'countries' AND code = 'IN';
UPDATE config_lists SET metadata = '{"currency": "USD", "timezone": "America/New_York"}'::jsonb WHERE category = 'countries' AND code = 'US';
UPDATE config_lists SET metadata = '{"currency": "GBP", "timezone": "Europe/London"}'::jsonb WHERE category = 'countries' AND code = 'GB';
UPDATE config_lists SET metadata = '{"currency": "EUR", "timezone": "Europe/Berlin"}'::jsonb WHERE category = 'countries' AND code = 'DE';
UPDATE config_lists SET metadata = '{"currency": "AED", "timezone": "Asia/Dubai"}'::jsonb WHERE category = 'countries' AND code = 'AE';
UPDATE config_lists SET metadata = '{"currency": "SGD", "timezone": "UTC"}'::jsonb WHERE category = 'countries' AND code = 'SG';
