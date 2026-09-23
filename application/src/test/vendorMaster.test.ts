// application/src/test/vendorMaster.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatTccVendorCode,
  generateVendorCode,
  getNextTccVendorCode,
  createVendor,
  updateVendor,
  toggleVendorStatus,
} from '../services/vendorMasterService';
import type { VendorFormData } from '../types/domain';

describe('Vendor Master Data Business Logic & Validations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Vendor Code Generation (TCC-MAS-VC-001 to 999)', () => {
    it('formats sequential vendor codes from TCC-MAS-VC-001 to 999 correctly', () => {
      expect(formatTccVendorCode(1)).toBe('TCC-MAS-VC-001');
      expect(formatTccVendorCode(25)).toBe('TCC-MAS-VC-025');
      expect(formatTccVendorCode(100)).toBe('TCC-MAS-VC-100');
      expect(formatTccVendorCode(999)).toBe('TCC-MAS-VC-999');
      expect(formatTccVendorCode(1000)).toBe('TCC-MAS-VC-1000');
      expect(generateVendorCode(75)).toBe('TCC-MAS-VC-075');
    });

    it('retrieves next sequential vendor code starting at TCC-MAS-VC-001', async () => {
      const code1 = await getNextTccVendorCode('tenant-fresh-01');
      expect(code1).toBe('TCC-MAS-VC-001');
    });
  });

  describe('Vendor Lifecycle & Audit Tracking', () => {
    const dummyTenant = 'tenant-test-uuid-002';
    const dummyOrg = 'org-test-uuid-002';

    const sampleFormData: VendorFormData = {
      vendor_name: 'Apex Precision Metrology Standards Ltd',
      address: 'Plot 45, Phase 2, Calibration Corridor',
      city: 'Bengaluru',
      state: 'Karnataka',
      pin: '560100',
      gst_tax_number: '29ABCDE1234F1Z5',
      contact_person: 'Dr. S. Ramaswamy',
      phone_numbers: ['+91 98450 11111', '+91 98450 22222'],
      email_addresses: ['lab@apexstandards.com', 'support@apexstandards.com'],
      serviced_categories: ['Dimensional Metrology', 'Thermal & Temperature'],
      status: 'ACTIVE',
    };

    it('creates a vendor with auto-generated code, serviced categories, and system audit log', async () => {
      const created = await createVendor(dummyTenant, dummyOrg, sampleFormData, {
        id: 'user-op-1',
        name: 'Calibration Engineer',
      });

      expect(created.id).toBeDefined();
      expect(created.tenant_id).toBe(dummyTenant);
      expect(created.organization_id).toBe(dummyOrg);
      expect(created.vendor_code).toMatch(/^TCC-MAS-VC-\d{3}$/);
      expect(created.vendor_name).toBe(sampleFormData.vendor_name);
      expect(created.status).toBe('ACTIVE');
      expect(created.phone_numbers?.length).toBe(2);
      expect(created.email_addresses?.length).toBe(2);
      expect(created.serviced_categories).toEqual(['Dimensional Metrology', 'Thermal & Temperature']);
      // Audit fields
      expect(created.created_by).toBe('user-op-1');
      expect(created.created_by_name).toBe('Calibration Engineer');
      expect(created.created_at).toBeDefined();
    });

    it('updates vendor fields, serviced categories and records modified by audit info', async () => {
      const created = await createVendor(dummyTenant, dummyOrg, sampleFormData, {
        id: 'user-op-1',
        name: 'Calibration Engineer',
      });

      const updated = await updateVendor(
        created.id,
        dummyTenant,
        {
          contact_person: 'N. Venkatesh',
          serviced_categories: ['Dimensional Metrology', 'Pressure & Vacuum', 'Electrical & Electronic'],
        },
        {
          id: 'user-lead-2',
          name: 'Procurement Head',
        }
      );

      expect(updated.contact_person).toBe('N. Venkatesh');
      expect(updated.serviced_categories.length).toBe(3);
      expect(updated.updated_by).toBe('user-lead-2');
      expect(updated.updated_by_name).toBe('Procurement Head');
      expect(updated.updated_at).toBeDefined();
    });

    it('toggles vendor status between ACTIVE and INACTIVE', async () => {
      const created = await createVendor(dummyTenant, dummyOrg, sampleFormData);
      expect(created.status).toBe('ACTIVE');

      const inactive = await toggleVendorStatus(created.id, dummyTenant);
      expect(inactive.status).toBe('INACTIVE');

      const reactivated = await toggleVendorStatus(created.id, dummyTenant);
      expect(reactivated.status).toBe('ACTIVE');
    });

    it('rejects vendor creation when mandatory fields are missing', async () => {
      const invalidData = { ...sampleFormData, vendor_name: '' };
      await expect(createVendor(dummyTenant, dummyOrg, invalidData)).rejects.toThrow(
        'Vendor name is required'
      );
    });

    it('rejects vendor creation with invalid GSTIN', async () => {
      const invalidData = { ...sampleFormData, gst_tax_number: 'INVALID' };
      await expect(createVendor(dummyTenant, dummyOrg, invalidData)).rejects.toThrow(
        'Invalid GSTIN format'
      );
    });
  });
});
