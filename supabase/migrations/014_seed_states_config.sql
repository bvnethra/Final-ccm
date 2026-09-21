-- Migration 014: Seed Indian States into config_lists
-- Category: 'states'

INSERT INTO config_lists (category, code, label, description, sort_order) VALUES
('states', 'AP', 'Andhra Pradesh', 'State of India', 10),
('states', 'AR', 'Arunachal Pradesh', 'State of India', 20),
('states', 'AS', 'Assam', 'State of India', 30),
('states', 'BR', 'Bihar', 'State of India', 40),
('states', 'CG', 'Chhattisgarh', 'State of India', 50),
('states', 'GA', 'Goa', 'State of India', 60),
('states', 'GJ', 'Gujarat', 'State of India', 70),
('states', 'HR', 'Haryana', 'State of India', 80),
('states', 'HP', 'Himachal Pradesh', 'State of India', 90),
('states', 'JH', 'Jharkhand', 'State of India', 100),
('states', 'KA', 'Karnataka', 'State of India', 110),
('states', 'KL', 'Kerala', 'State of India', 120),
('states', 'MP', 'Madhya Pradesh', 'State of India', 130),
('states', 'MH', 'Maharashtra', 'State of India', 140),
('states', 'MN', 'Manipur', 'State of India', 150),
('states', 'ML', 'Meghalaya', 'State of India', 160),
('states', 'MZ', 'Mizoram', 'State of India', 170),
('states', 'NL', 'Nagaland', 'State of India', 180),
('states', 'OD', 'Odisha', 'State of India', 190),
('states', 'PB', 'Punjab', 'State of India', 200),
('states', 'RJ', 'Rajasthan', 'State of India', 210),
('states', 'SK', 'Sikkim', 'State of India', 220),
('states', 'TN', 'Tamil Nadu', 'State of India', 230),
('states', 'TS', 'Telangana', 'State of India', 240),
('states', 'TR', 'Tripura', 'State of India', 250),
('states', 'UP', 'Uttar Pradesh', 'State of India', 260),
('states', 'UK', 'Uttarakhand', 'State of India', 270),
('states', 'WB', 'West Bengal', 'State of India', 280)
ON CONFLICT (category, code) DO UPDATE 
SET label = EXCLUDED.label,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();
