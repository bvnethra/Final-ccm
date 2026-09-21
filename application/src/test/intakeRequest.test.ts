// application/src/test/intakeRequest.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateRequestNumber,
  createCalibrationRequest,
  getCalibrationRequests,
  getCalibrationRequestById,
  getLabQueueRequests,
  recordVerification,
} from '../services/operationsService';
import type { CreateRequestPayload } from '../services/operationsService';

describe('Calibration Intake Request Domain Logic & Validations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Request Number Generation', () => {
    it('generates unique intake request numbers matching pattern REQ-YYYYMMDD-XXXXX', () => {
      const num1 = generateRequestNumber();
      const num2 = generateRequestNumber();

      expect(num1).toMatch(/^REQ-\d{8}-[A-Z0-9]{5}$/);
      expect(num2).toMatch(/^REQ-\d{8}-[A-Z0-9]{5}$/);
      expect(num1).not.toBe(num2);
    });
  });

  describe('Intake Request Validations', () => {
    const dummyTenant = 'tenant-intake-001';
    const dummyOrg = 'org-intake-001';

    const validPayload: CreateRequestPayload = {
      tenantId: dummyTenant,
      organizationId: dummyOrg,
      clientId: 'client-uuid-101',
      collectionDate: '2026-09-21',
      priority: 'NORMAL',
      clientPoRef: 'PO-2026-CLIENT-09',
      remarks: 'Handle with care: glass optics included',
      collector: { id: 'agent-1', name: 'Field Executive Rajesh' },
      items: [
        {
          itemMasterId: 'item-uuid-201',
          quantity: 2,
          serialNumber: 'SN-MITU-9901',
          accessories: 'Protective Case, Setting Ring',
          itemCondition: 'GOOD',
          remarks: 'Calibrate at zero and span',
        },
      ],
    };

    it('creates an intake request successfully with generated request number, items, and status CREATED', async () => {
      const created = await createCalibrationRequest(validPayload);

      expect(created.id).toBeDefined();
      expect(created.tenant_id).toBe(dummyTenant);
      expect(created.organization_id).toBe(dummyOrg);
      expect(created.request_number).toMatch(/^REQ-\d{8}-[A-Z0-9]{5}$/);
      expect(created.status).toBe('CREATED');
      expect(created.priority).toBe('NORMAL');
      expect(created.client_po_ref).toBe('PO-2026-CLIENT-09');
      expect(created.collection_agent_name).toBe('Field Executive Rajesh');
      expect(created.request_items?.length).toBe(1);

      const firstItem = created.request_items![0];
      expect(firstItem.item_master_id).toBe('item-uuid-201');
      expect(firstItem.quantity).toBe(2);
      expect(firstItem.serial_number).toBe('SN-MITU-9901');
      expect(firstItem.accessories).toBe('Protective Case, Setting Ring');
      expect(firstItem.item_condition).toBe('GOOD');
      expect(firstItem.status).toBe('ADDED');
    });

    it('rejects creation when client account is missing', async () => {
      await expect(
        createCalibrationRequest({ ...validPayload, clientId: '' })
      ).rejects.toThrow('Client account selection is required');
    });

    it('rejects creation when collection date is missing', async () => {
      await expect(
        createCalibrationRequest({ ...validPayload, collectionDate: '' })
      ).rejects.toThrow('Collection date is required');
    });

    it('rejects creation when items array is empty', async () => {
      await expect(
        createCalibrationRequest({ ...validPayload, items: [] })
      ).rejects.toThrow('At least one equipment line item is required');
    });

    it('rejects creation when an item line has no item master selected', async () => {
      await expect(
        createCalibrationRequest({
          ...validPayload,
          items: [{ itemMasterId: '', quantity: 1, itemCondition: 'GOOD' }],
        })
      ).rejects.toThrow('Equipment item at line 1 is required');
    });

    it('rejects creation when quantity is zero or negative', async () => {
      await expect(
        createCalibrationRequest({
          ...validPayload,
          items: [{ itemMasterId: 'item-1', quantity: 0, itemCondition: 'GOOD' }],
        })
      ).rejects.toThrow('Quantity for line 1 must be at least 1');
    });
  });

  describe('Multi-Tenant Data Isolation & Querying', () => {
    const tenantA = 'tenant-acme-corp';
    const tenantB = 'tenant-beta-labs';
    const dummyOrg = 'org-common';

    it('enforces multi-tenant data isolation: Tenant B cannot see Tenant A requests', async () => {
      await createCalibrationRequest({
        tenantId: tenantA,
        organizationId: dummyOrg,
        clientId: 'client-1',
        collectionDate: '2026-09-21',
        priority: 'NORMAL',
        items: [{ itemMasterId: 'item-1', quantity: 1, itemCondition: 'GOOD' }],
      });

      await createCalibrationRequest({
        tenantId: tenantA,
        organizationId: dummyOrg,
        clientId: 'client-2',
        collectionDate: '2026-09-21',
        priority: 'URGENT',
        items: [{ itemMasterId: 'item-2', quantity: 3, itemCondition: 'GOOD' }],
      });

      const tenantARequests = await getCalibrationRequests(tenantA);
      const tenantBRequests = await getCalibrationRequests(tenantB);

      expect(tenantARequests.length).toBe(2);
      expect(tenantBRequests.length).toBe(0);
    });

    it('filters requests by status accurately', async () => {
      await createCalibrationRequest({
        tenantId: tenantA,
        organizationId: dummyOrg,
        clientId: 'client-1',
        collectionDate: '2026-09-21',
        priority: 'NORMAL',
        items: [{ itemMasterId: 'item-1', quantity: 1, itemCondition: 'GOOD' }],
      });

      const createdList = await getCalibrationRequests(tenantA, undefined, 'CREATED');
      const verifiedList = await getCalibrationRequests(tenantA, undefined, 'VERIFIED');

      expect(createdList.length).toBe(1);
      expect(verifiedList.length).toBe(0);
    });

    it('retrieves request by ID and throws if not found', async () => {
      const created = await createCalibrationRequest({
        tenantId: tenantA,
        organizationId: dummyOrg,
        clientId: 'client-1',
        collectionDate: '2026-09-21',
        priority: 'NORMAL',
        items: [{ itemMasterId: 'item-1', quantity: 1, itemCondition: 'GOOD' }],
      });

      const fetched = await getCalibrationRequestById(created.id, tenantA);
      expect(fetched.id).toBe(created.id);
      expect(fetched.request_number).toBe(created.request_number);

      await expect(
        getCalibrationRequestById('non-existent-request', tenantA)
      ).rejects.toThrow('Calibration request not found');
    });
  });

  describe('Multi-Format Attachment Proofs & Priority-Based Lab Queue Scheduling', () => {
    const tenantId = 'tenant-lab-queue-test';
    const orgId = 'org-lab-test';

    it('persists multi-format attachment proof documents (PDF, DOCX, Images) with the request', async () => {
      const sampleAttachments = [
        {
          id: 'att-1',
          name: 'delivery_challan_gatepass.pdf',
          size: 145000,
          type: 'application/pdf',
          base64Data: 'data:application/pdf;base64,JVBERi0xLjQK...',
          uploaded_at: '2026-09-21T01:00:00Z',
        },
        {
          id: 'att-2',
          name: 'damaged_vernier_photo.jpg',
          size: 850000,
          type: 'image/jpeg',
          base64Data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
          uploaded_at: '2026-09-21T01:05:00Z',
        },
        {
          id: 'att-3',
          name: 'client_calibration_spec.docx',
          size: 42000,
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          base64Data: 'data:application/vnd.openxmlformats...;base64,UEsDBB...',
          uploaded_at: '2026-09-21T01:10:00Z',
        },
      ];

      const created = await createCalibrationRequest({
        tenantId,
        organizationId: orgId,
        clientId: 'client-xyz',
        collectionDate: '2026-09-21',
        priority: 'URGENT',
        clientPoRef: 'PO-ATTACH-99',
        attachments: sampleAttachments,
        items: [{ itemMasterId: 'item-micrometer', quantity: 1, itemCondition: 'DAMAGED' }],
      });

      expect(created.attachments?.length).toBe(3);
      expect(created.attachments![0].name).toBe('delivery_challan_gatepass.pdf');
      expect(created.attachments![1].name).toBe('damaged_vernier_photo.jpg');
      expect(created.attachments![2].name).toBe('client_calibration_spec.docx');

      const fetched = await getCalibrationRequestById(created.id, tenantId);
      expect(fetched.attachments?.length).toBe(3);
      expect(fetched.attachments![0].type).toBe('application/pdf');
    });

    it('schedules lab queue strictly by Priority (URGENT at top), followed by FIFO collection date', async () => {
      // 1. Create a Normal priority request collected on Day 1
      const reqNormalDay1 = await createCalibrationRequest({
        tenantId,
        organizationId: orgId,
        clientId: 'client-1',
        collectionDate: '2026-09-18',
        priority: 'NORMAL',
        items: [{ itemMasterId: 'item-1', quantity: 1, itemCondition: 'GOOD' }],
      });

      // 2. Create a Normal priority request collected on Day 2
      const reqNormalDay2 = await createCalibrationRequest({
        tenantId,
        organizationId: orgId,
        clientId: 'client-2',
        collectionDate: '2026-09-19',
        priority: 'NORMAL',
        items: [{ itemMasterId: 'item-2', quantity: 2, itemCondition: 'GOOD' }],
      });

      // 3. Create an URGENT request collected on Day 3 (created later than normal requests)
      const reqUrgentDay3 = await createCalibrationRequest({
        tenantId,
        organizationId: orgId,
        clientId: 'client-3',
        collectionDate: '2026-09-20',
        priority: 'URGENT',
        items: [{ itemMasterId: 'item-3', quantity: 1, itemCondition: 'GOOD' }],
      });

      // 4. Create another URGENT request collected on Day 2
      const reqUrgentDay2 = await createCalibrationRequest({
        tenantId,
        organizationId: orgId,
        clientId: 'client-4',
        collectionDate: '2026-09-19',
        priority: 'URGENT',
        items: [{ itemMasterId: 'item-4', quantity: 1, itemCondition: 'GOOD' }],
      });

      // Retrieve queue
      const queue = await getLabQueueRequests(tenantId, orgId);

      // Verify that URGENT requests are scheduled at the top of the queue:
      expect(queue[0].id).toBe(reqUrgentDay2.id); // Urgent, collected Sep 19
      expect(queue[0].priority).toBe('URGENT');

      expect(queue[1].id).toBe(reqUrgentDay3.id); // Urgent, collected Sep 20
      expect(queue[1].priority).toBe('URGENT');

      // Followed by NORMAL requests in FIFO order:
      expect(queue[2].id).toBe(reqNormalDay1.id); // Normal, collected Sep 18
      expect(queue[2].priority).toBe('NORMAL');

      expect(queue[3].id).toBe(reqNormalDay2.id); // Normal, collected Sep 19
      expect(queue[3].priority).toBe('NORMAL');
    });

    it('filters lab queue specifically by URGENT priority only', async () => {
      await createCalibrationRequest({
        tenantId,
        organizationId: orgId,
        clientId: 'client-u1',
        collectionDate: '2026-09-20',
        priority: 'URGENT',
        items: [{ itemMasterId: 'item-1', quantity: 1, itemCondition: 'GOOD' }],
      });
      await createCalibrationRequest({
        tenantId,
        organizationId: orgId,
        clientId: 'client-n1',
        collectionDate: '2026-09-20',
        priority: 'NORMAL',
        items: [{ itemMasterId: 'item-2', quantity: 1, itemCondition: 'GOOD' }],
      });

      const urgentOnly = await getLabQueueRequests(tenantId, orgId, 'URGENT');
      expect(urgentOnly.length).toBe(1);
      expect(urgentOnly.every((r) => r.priority === 'URGENT')).toBe(true);

      const normalOnly = await getLabQueueRequests(tenantId, orgId, 'NORMAL');
      expect(normalOnly.length).toBe(1);
      expect(normalOnly.every((r) => r.priority === 'NORMAL')).toBe(true);
    });
  });

  describe('Physical Inward Verification Process (Step 7)', () => {
    const tenantId = 'tenant-verify-001';
    const orgId = 'org-verify-001';

    it('successfully verifies received instruments and advances request status to VERIFIED', async () => {
      const created = await createCalibrationRequest({
        tenantId,
        organizationId: orgId,
        clientId: 'client-v1',
        collectionDate: '2026-09-21',
        priority: 'NORMAL',
        items: [
          {
            itemMasterId: 'item-caliper',
            quantity: 2,
            serialNumber: 'SN-001, SN-002',
            itemCondition: 'GOOD',
          },
        ],
      });

      expect(created.status).toBe('CREATED');
      const itemToVerify = created.request_items![0];

      const verificationRecord = await recordVerification({
        tenantId,
        organizationId: orgId,
        requestId: created.id,
        requestItemId: itemToVerify.id,
        verifiedQuantity: 2,
        expectedQuantity: 2,
        observedItemCondition: 'GOOD',
        result: 'VERIFIED',
        inspector: { id: 'inspector-1', name: 'Quality Lead Priya' },
      });

      expect(verificationRecord.id).toBeDefined();
      expect(verificationRecord.result).toBe('VERIFIED');
      expect(verificationRecord.verified_quantity).toBe(2);

      const updatedRequest = await getCalibrationRequestById(created.id, tenantId);
      expect(updatedRequest.status).toBe('VERIFIED');
      expect(updatedRequest.request_items![0].status).toBe('VERIFIED');
      expect(updatedRequest.request_items![0].received_quantity).toBe(2);
    });

    it('records discrepancy when physical count or condition does not match', async () => {
      const created = await createCalibrationRequest({
        tenantId,
        organizationId: orgId,
        clientId: 'client-v2',
        collectionDate: '2026-09-21',
        priority: 'URGENT',
        items: [
          {
            itemMasterId: 'item-gauge',
            quantity: 5,
            itemCondition: 'GOOD',
          },
        ],
      });

      const itemToVerify = created.request_items![0];

      await recordVerification({
        tenantId,
        organizationId: orgId,
        requestId: created.id,
        requestItemId: itemToVerify.id,
        verifiedQuantity: 4, // 1 short
        expectedQuantity: 5,
        observedItemCondition: 'DAMAGED',
        result: 'DISCREPANCY',
        discrepancyReason: 'Received only 4 units instead of declared 5; 1 unit has cracked bezel',
      });

      const updatedRequest = await getCalibrationRequestById(created.id, tenantId);
      expect(updatedRequest.status).toBe('DISCREPANCY');
      expect(updatedRequest.request_items![0].status).toBe('DISCREPANCY');
    });
  });
});
