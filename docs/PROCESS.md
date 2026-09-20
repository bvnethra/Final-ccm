# Nethra CCM — Business Process & Workflow Specifications

> **Core Objective:** Map every step of the Metrology & Equipment Calibration lifecycle from initial client intake to final delivery and certificate issuance.

---

## 1. End-to-End Metrology Lifecycle Overview

```
┌─────────────────────────┐
│ 1. Equipment Intake     │  Route: /requests/new
│    (Status: CREATED)    │  Role: Intake / Collection Agent [request.create]
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ 2. Lab Inspection       │  Route: /lab/verification/:requestId
│    & Verification       │  Role: Lab Verification Engineer [verification.create]
│    (Status: VERIFIED)   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ 3. Metrology Testing    │  Route: /lab/calibration/:requestId
│    & Calibration        │  Role: Calibration Engineer [calibration.create]
│    (Status: CALIBRATED) │  Auto-generates Certificate (if PASS)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ 4. Commercial Billing   │  Route: /commercial/quotations/new
│    & Invoicing          │  Role: Commercial Manager / Approver [quotation.create]
│    (Status: QUOTED/PO)  │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ 5. Gate Pass Dispatch   │  Route: /logistics/dispatch/new
│    & Delivery           │  Role: Dispatch Officer [dispatch.create]
│    (Status: DELIVERED)  │
└─────────────────────────┘
```

---

## 2. Detailed Process Step Specifications

### Step 1: Equipment Intake Request Registration
* **URL Route:** `/requests/new`
* **Permission Required:** `request.create`
* **Input Data:** Client selection, Collection Agent, Collection Date, Priority (`NORMAL` / `URGENT`), Item Master, Quantity, Serial Numbers, Condition.
* **Database Action:** Inserts into `calibration_requests` (`status: CREATED`) and `request_items`.

---

### Step 2: Lab Queue & Equipment Verification
* **URL Route:** `/lab/queue` $\rightarrow$ `/lab/verification/:requestId`
* **Permission Required:** `verification.view` & `verification.create`
* **Input Data:** Expected Qty vs. Verified Received Qty, Observed Condition (`GOOD` / `DAMAGED` / `FAULTY`), Serial Number validation, Result (`VERIFIED` / `DISCREPANCY` / `REJECTED`).
* **Database Action:** Inserts into `verifications` table. Updates `calibration_requests.status` to `VERIFIED` or `DISCREPANCY`.

---

### Step 3: Metrology Testing, Calibration & Certificate Issuance
* **URL Route:** `/lab/calibration/:requestId`
* **Permission Required:** `calibration.create` & `certificate.generate`
* **Input Data:** Environmental Conditions (Temp, Humidity), Measurement Test Grid (Nominal vs Measured Values, Unit, Tolerance Min/Max, Result), Outcome (`CALIBRATED` / `FAULTY` / `OUTSOURCED`).
* **Database Action:** Inserts into `calibrations` and `calibration_measurements`. Auto-generates row in `certificates` if PASS.

---

### Step 4: Commercial Quotation, Approval & Invoicing
* **URL Route:** `/commercial/quotations/new` $\rightarrow$ `/commercial/approvals` $\rightarrow$ `/commercial/invoices`
* **Permission Required:** `quotation.create`, `quotation.approve`, `invoice.create`
* **Input Data:** Line items, pricing, discounts, tax calculations, approver comments, PO link.
* **Database Action:** Creates `quotations`, `quotation_items`, `approvals`, `purchase_orders`, `invoices`.

---

### Step 5: Gate Pass Dispatch & Delivery Receipt
* **URL Route:** `/logistics/dispatch/new` $\rightarrow$ `/logistics/deliveries`
* **Permission Required:** `dispatch.create`, `delivery.update`
* **Input Data:** Gate Pass Number (`GP-YYYY-XXXX`), Courier Partner, Tracking #, Recipient Name & Phone, Recipient Signature.
* **Database Action:** Creates `dispatches` and `deliveries`. Updates `calibration_requests.status` to `COMPLETED`.
