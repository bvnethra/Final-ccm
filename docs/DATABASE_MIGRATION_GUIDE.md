# Nethra CCM — Modular Process Database Migration Guide

> **Target Database:** Supabase Project `zwrbhnsfqapbritnqswe` (`https://zwrbhnsfqapbritnqswe.supabase.co`)  
> **Directory:** [`react-supabase-ccm/supabase/migrations/`](file:///c:/Users/vishal%20AV/OneDrive/Desktop/Nethra-CCM/react-supabase-ccm/supabase/migrations/)

---

## 1. Process Migration Script Structure

All database schema migrations are split into 9 modular, process-specific SQL files:

```
react-supabase-ccm/supabase/migrations/
├── 001_tenants_and_organizations.sql               # Core Tenants & Sub-Orgs
├── 002_rbac_and_role_templates.sql                # Dynamic RBAC & Role Templates
├── 003_master_data.sql                            # Clients, Vendors & Item Masters
├── 004_equipment_intake_process.sql               # Process 1: Equipment Intake Requests
├── 005_lab_inspection_verification_process.sql    # Process 2: Lab Queue & Verifications
├── 006_metrology_calibration_certificate_process.sql # Process 3: Calibration & Certificates
├── 007_commercial_billing_invoicing_process.sql   # Process 4: Quotations & Tax Invoices
├── 008_logistics_gatepass_delivery_process.sql    # Process 5: Gate Pass & Delivery Confirmation
└── 009_canonical_seed_data.sql                    # Initial Permissions & System Seed Data
```

---

## 2. Execution Command

To execute all process migrations sequentially against the target Supabase database:

```bash
cd react-supabase-ccm
node scripts/apply_process_migrations.js
```

---

## 3. Automated Verification

Verify table creation in PostgreSQL via SQL query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```
