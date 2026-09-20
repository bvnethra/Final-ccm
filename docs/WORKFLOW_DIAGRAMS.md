# Nethra CCM — Detailed Workflow Sequence Diagrams

---

## 1. Process 1: Equipment Intake Request Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Agent as Collection Agent
    participant Page as /requests/new (Full Page Form)
    participant Hook as useCreateRequest()
    participant Service as operationsService.ts
    participant DB as Supabase PostgreSQL
    
    Agent->>Page: Selects Client, Item Master, Qty, Priority, Condition
    Agent->>Page: Submits Form
    Page->>Hook: mutate({ tenantId, organizationId, clientId, itemMasterId, qty })
    Hook->>Service: createCalibrationRequest(payload)
    Service->>DB: INSERT INTO calibration_requests (status: CREATED)
    Service->>DB: INSERT INTO request_items (status: ADDED)
    DB-->>Service: Return Request # & ID
    Service-->>Hook: Request Created Payload
    Hook-->>Page: onSuccess -> navigate('/requests')
    Page-->>Agent: Shows Request List Table
```

---

## 2. Process 2 & 3: Lab Verification & Metrology Calibration Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Tech as Calibration Engineer
    participant LabPage as /lab/calibration/:requestId
    participant Service as operationsService.ts
    participant DB as Supabase PostgreSQL
    
    Tech->>LabPage: Enters Nominal vs Measured Values, Unit, Tolerances
    Tech->>LabPage: Submits Test Sheet
    LabPage->>Service: recordCalibration(payload)
    Service->>DB: INSERT INTO calibrations (result: PASS/FAIL)
    Service->>DB: INSERT INTO calibration_measurements (linked tenant/org/request)
    alt Result is PASS
        Service->>DB: INSERT INTO certificates (status: GENERATED)
        Service->>DB: UPDATE calibration_requests SET status = 'QUOTATION'
    else Result is FAIL
        Service->>DB: UPDATE calibration_requests SET status = 'FAULTY'
    end
    DB-->>Service: Success Response
    Service-->>LabPage: Redirect to Queue
```

---

## 3. Process 4 & 5: Commercial & Gate Pass Dispatch Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Commercial & Logistics Staff
    participant CommPage as /commercial/quotations/new
    participant DispPage as /logistics/dispatch/new
    participant DB as Supabase PostgreSQL
    
    Admin->>CommPage: Creates Quotation & Invoices
    CommPage->>DB: INSERT INTO quotations, quotation_items, invoices
    Admin->>DispPage: Enters Courier Partner, Tracking #, Recipient
    DispPage->>DB: INSERT INTO dispatches & deliveries
    DB->>DB: UPDATE calibration_requests SET status = 'COMPLETED'
```
