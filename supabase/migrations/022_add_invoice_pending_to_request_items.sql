-- Migration: 022_add_invoice_pending_to_request_items.sql
-- Add invoice_pending flag and optional invoice_id link to request_items for CV/Invoicing partial tracking

ALTER TABLE request_items ADD COLUMN IF NOT EXISTS invoice_pending BOOLEAN DEFAULT FALSE;
ALTER TABLE request_items ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- Index for invoice tracking on line items
CREATE INDEX IF NOT EXISTS idx_request_items_invoice_pending ON request_items(invoice_pending);
CREATE INDEX IF NOT EXISTS idx_request_items_invoice_id ON request_items(invoice_id);
