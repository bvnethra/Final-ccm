-- Migration: 021_add_routing_and_serial_to_request_items.sql
-- Add destination, vendor tracking, and serial number columns to request_items for routing support

ALTER TABLE request_items ADD COLUMN IF NOT EXISTS destination VARCHAR(50) DEFAULT 'IN_HOUSE';
ALTER TABLE request_items ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL;
ALTER TABLE request_items ADD COLUMN IF NOT EXISTS vendor_name TEXT;
ALTER TABLE request_items ADD COLUMN IF NOT EXISTS serial_number TEXT;
ALTER TABLE request_items ADD COLUMN IF NOT EXISTS expected_return_date TIMESTAMPTZ;
ALTER TABLE request_items ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC(12, 2);

-- Also add index for fast filtering on destination
CREATE INDEX IF NOT EXISTS idx_request_items_destination ON request_items(destination);
CREATE INDEX IF NOT EXISTS idx_request_items_vendor_id ON request_items(vendor_id);
