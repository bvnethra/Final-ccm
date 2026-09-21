// application/src/test/clientMaster.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateGSTIN,
  validateEmail,
  validatePhone,
  generateClientCode,
  createClient,
  updateClient,
  toggleClientStatus,
} from '../services/clientMasterService';
import type { ClientFormData } from '../types/domain';

describe('Client Master Data Business Logic & Validations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Validation Rules', () => {
    it('validates 15-character Indian GSTIN alphanumeric structure correctly', () => {
      // Valid GSTIN: 2 digits, 5 letters, 4 digits, 1 letter, 1 alpha/num, 'Z', 1 alpha/num
      expect(validateGSTIN('27AAAAA0000A1Z5')).toBe(true);
      expect(validateGSTIN('29ABCDE1234F1Z5')).toBe(true);
      expect(validateGSTIN('33GHIJK5678L1Z9')).toBe(true);

      // Invalid GSTINs
      expect(validateGSTIN('')).toBe(false);
      expect(validateGSTIN('INVALID_GSTIN')).toBe(false);
      expect(validateGSTIN('27AAAAA0000A1')).toBe(false); // too short
      expect(validateGSTIN('27AAAAA0000A1Z599')).toBe(false); // too long
    });

    it('validates email addresses accurately', () => {
      expect(validateEmail('billing@acme.com')).toBe(true);
      expect(validateEmail('operations.support@nethra-lab.org')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('validates telephonic contact formats', () => {
      expect(validatePhone('+919876543210')).toBe(true);
      expect(validatePhone('9876543210')).toBe(true);
      expect(validatePhone('+1 (555) 019-2834')).toBe(true);
      expect(validatePhone('12345')).toBe(false); // too short
      expect(validatePhone('')).toBe(false);
    });

    it('generates unique client codes matching format CLI-YYYY-XXXXX', () => {
      const code1 = generateClientCode();
      const code2 = generateClientCode();
      const currentYear = new Date().getFullYear();

      expect(code1).toMatch(new RegExp(`^CLI-${currentYear}-\\d{5}$`));
      expect(code2).toMatch(new RegExp(`^CLI-${currentYear}-\\d{5}$`));
      expect(code1).not.toBe(code2);
    });
  });

  describe('Client Lifecycle & Audit Tracking', () => {
    const dummyTenant = 'tenant-test-uuid-001';
    const dummyOrg = 'org-test-uuid-001';

    const sampleFormData: ClientFormData = {
      client_name: 'Precision Metrology Instruments Ltd',
      address: 'Plot 101, Tech Park, Industrial Corridor',
      city: 'Pune',
      state: 'Maharashtra',
      pin: '411057',
      gst_tax_number: '27AAAAA0000A1Z5',
      contact_person: 'Vikram Sharma',
      phone_numbers: ['+91 98765 00001', '+91 98765 00002'],
      email_addresses: ['contact@precision.com', 'accounts@precision.com'],
      payment_term: '30_DAYS',
      status: 'ACTIVE',
    };

    it('creates a client with auto-generated code, audit logs, and default billing address', async () => {
      const created = await createClient(dummyTenant, dummyOrg, sampleFormData, {
        id: 'user-op-1',
        name: 'Lead Metrologist',
      });

      expect(created.id).toBeDefined();
      expect(created.tenant_id).toBe(dummyTenant);
      expect(created.organization_id).toBe(dummyOrg);
      expect(created.client_code).toMatch(/^CLI-\d{4}-\d{5}$/);
      expect(created.client_name).toBe(sampleFormData.client_name);
      // When billing address is omitted, it defaults to registered address
      expect(created.billing_address).toBe(sampleFormData.address);
      expect(created.status).toBe('ACTIVE');
      expect(created.payment_term).toBe('30_DAYS');
      expect(created.phone_numbers?.length).toBe(2);
      expect(created.email_addresses?.length).toBe(2);
      // Audit fields
      expect(created.created_by).toBe('user-op-1');
      expect(created.created_by_name).toBe('Lead Metrologist');
      expect(created.created_at).toBeDefined();
    });

    it('updates client fields and records modified by audit info', async () => {
      const created = await createClient(dummyTenant, dummyOrg, sampleFormData, {
        id: 'user-op-1',
        name: 'Lead Metrologist',
      });

      const updated = await updateClient(
        created.id,
        dummyTenant,
        {
          contact_person: 'Anita Roy',
          payment_term: '60_DAYS',
        },
        {
          id: 'user-admin-2',
          name: 'Chief Commercial Officer',
        }
      );

      expect(updated.contact_person).toBe('Anita Roy');
      expect(updated.payment_term).toBe('60_DAYS');
      expect(updated.updated_by).toBe('user-admin-2');
      expect(updated.updated_by_name).toBe('Chief Commercial Officer');
      expect(updated.updated_at).toBeDefined();
    });

    it('toggles client status between ACTIVE and INACTIVE', async () => {
      const created = await createClient(dummyTenant, dummyOrg, sampleFormData);
      expect(created.status).toBe('ACTIVE');

      const inactive = await toggleClientStatus(created.id, dummyTenant);
      expect(inactive.status).toBe('INACTIVE');

      const reactivated = await toggleClientStatus(created.id, dummyTenant);
      expect(reactivated.status).toBe('ACTIVE');
    });

    it('rejects client creation when mandatory fields are missing', async () => {
      const invalidData = { ...sampleFormData, client_name: '' };
      await expect(createClient(dummyTenant, dummyOrg, invalidData)).rejects.toThrow(
        'Client name is required'
      );
    });

    it('rejects client creation with invalid GSTIN', async () => {
      const invalidData = { ...sampleFormData, gst_tax_number: 'NOT_A_GSTIN' };
      await expect(createClient(dummyTenant, dummyOrg, invalidData)).rejects.toThrow(
        'Invalid GSTIN format'
      );
    });
  });
});
