# Nethra CCM — Enterprise Security & Compliance Policy

> **Policy Statement:** Nethra CCM is committed to upholding the highest standards of data integrity, enterprise multi-tenant isolation, role-based access security, and immutable auditability for metrology and calibration records.

---

## Policy 1: Multi-Tenant Data Isolation Standard

1. **Strict Data Boundary:**
   - No user belonging to Tenant A shall under any circumstances view, query, modify, or infer data belonging to Tenant B.
   - Cross-tenant data access attempts must trigger immediate PostgreSQL RLS violation exceptions and write a security alert log to `audit_logs`.

2. **Organization-Level Scoping:**
   - Within a single Tenant, operational personnel (Lab Engineers, Verification Technicians, Logistics Agents) are scoped to their assigned `organization_id`.
   - Super Admins can oversee all sub-organizations under their specific `tenant_id`.

---

## Policy 2: Dynamic RBAC & Permission Delegation

1. **Dot-Notation Permission Unification:**
   - All system permissions follow standard dot-notation format:
     * `user.view`, `user.create`, `user.edit`
     * `organization.view`, `organization.create`
     * `role.view`, `role.create`
     * `request.view`, `request.create`
     * `verification.view`, `verification.create`
     * `calibration.view`, `calibration.create`
     * `certificate.view`, `certificate.generate`
     * `quotation.view`, `quotation.create`, `quotation.approve`
     * `invoice.view`, `invoice.create`
     * `dispatch.view`, `dispatch.create`
     * `delivery.view`, `delivery.update`

2. **Super Admin Scope Boundaries:**
   - **Allowed Actions:** Manage Users, Create Organizations, Define Dynamic Roles, Assign Permissions, View Audit Logs, View Executive Analytics Dashboard.
   - **Prohibited Actions:** Super Admins cannot register intake requests, perform lab verifications, log calibration measurements, approve quotations, or issue gate passes. Operational tasks are reserved for role-delegated operational personnel.

---

## Policy 3: Immutable Audit Trail & Process Traceability

1. **Process Chain Integrity:**
   - Calibration records, test measurement arrays, and certificates cannot be deleted or mutated once marked as `PASS` / `GENERATED`.
   - Any revision or corrective test requires generating a new calibration record linked to the same `request_id` with an explicit audit note.

2. **Audit Log Payload:**
   - Every administrative change automatically writes a row to `audit_logs` containing `tenant_id`, `organization_id`, `user_id`, `action`, `entity_name`, `entity_id`, and `details` (JSONB).
