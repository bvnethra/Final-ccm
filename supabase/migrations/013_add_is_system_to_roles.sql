-- Migration: Add is_system flag to roles table to avoid hardcoding role codes in UI
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false;

UPDATE roles 
SET is_system = true 
WHERE code IN ('COLLECTION_AGENT', 'LAB_ENTRY_PERSON', 'LAB_APPROVER', 'ADMIN');
