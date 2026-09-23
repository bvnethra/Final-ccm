// application/src/test/itemMaster.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateItemCode,
  deriveItemCode,
  formatTccItemCode,
  createItemMaster,
  updateItemMaster,
  getItemMasters,
  getItemMasterById,
  toggleItemMasterStatus,
} from '../services/itemMasterService';
import type { ItemMasterFormData } from '../types/domain';

describe('Item Master Data Business Logic & Metrology Validations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Item Code & Dynamic Derivation Rules', () => {
    it('dynamically derives item codes from instrument name and range (e.g. VC-50)', () => {
      // Direct user requirement test
      expect(deriveItemCode('vernier caliper 0-50mm')).toBe('VC-50');
      expect(deriveItemCode('vernier caliper', 50, '0 - 50 mm')).toBe('VC-50');

      // Additional standard metrology instruments without hardcoding
      expect(deriveItemCode('Screw Gauge', 25, '0 - 25 mm')).toBe('SG-25');
      expect(deriveItemCode('Dial Indicator', 10, '0 - 10 mm')).toBe('DI-10');
      expect(deriveItemCode('Digital Vernier Caliper', 150, '0 - 150 mm')).toBe('VC-150');
      expect(deriveItemCode('Micrometer', 25, '0 - 25 mm')).toBe('MIC-25');
      expect(deriveItemCode('Pressure Gauge', 100, '0 - 100 bar')).toBe('PG-100');
      expect(deriveItemCode('Slip Gauge Block', 100, '0.5 - 100 mm')).toBe('SGB-100');
    });

    it('generates item code using dynamic derivation or fallback sequence', () => {
      expect(generateItemCode('vernier caliper 0-50mm')).toBe('VC-50');
      expect(generateItemCode(75)).toBe('TCC-MAS-075');
    });

    it('formats TCC-MAS sequential item codes from TCC-MAS-001 to 999 correctly', () => {
      expect(formatTccItemCode(1)).toBe('TCC-MAS-001');
      expect(formatTccItemCode(25)).toBe('TCC-MAS-025');
      expect(formatTccItemCode(75)).toBe('TCC-MAS-075');
      expect(formatTccItemCode(100)).toBe('TCC-MAS-100');
      expect(formatTccItemCode(999)).toBe('TCC-MAS-999');
      expect(formatTccItemCode(1000)).toBe('TCC-MAS-1000');
    });
  });

  describe('Metrology & Commercial Validation Rules', () => {
    const dummyTenant = 'tenant-metrology-001';
    const dummyOrg = 'org-metrology-001';

    const validFormData: ItemMasterFormData = {
      item_name: 'Digital Vernier Caliper (0-300mm)',
      item_category: 'Dimensional Metrology',
      manufacturer: 'Mitutoyo',
      model: '500-196-30',
      range_min: 0,
      range_max: 300,
      range_unit: 'mm',
      least_count: 0.01,
      least_count_unit: 'mm',
      standard_cost: 1250,
      calibration_frequency: 12,
      status: 'ACTIVE',
    };

    it('creates an item master successfully with auto-generated code and formatted measurement range', async () => {
      const created = await createItemMaster(dummyTenant, dummyOrg, validFormData, {
        id: 'tech-user-1',
        name: 'Senior Calibration Tech',
      });

      expect(created.id).toBeDefined();
      expect(created.tenant_id).toBe(dummyTenant);
      expect(created.organization_id).toBe(dummyOrg);
      expect(created.item_code).toBe('VC-300');
      expect(created.item_name).toBe(validFormData.item_name);
      expect(created.item_category).toBe('Dimensional Metrology');
      expect(created.range_min).toBe(0);
      expect(created.range_max).toBe(300);
      expect(created.range_unit).toBe('mm');
      expect(created.measurement_range).toBe('0 - 300 mm');
      expect(created.least_count).toBe(0.01);
      expect(created.least_count_unit).toBe('mm');
      expect(created.standard_cost).toBe(1250);
      expect(created.calibration_frequency).toBe(12);
      expect(created.status).toBe('ACTIVE');
      expect(created.created_by).toBe('tech-user-1');
      expect(created.created_by_name).toBe('Senior Calibration Tech');
      expect(created.created_at).toBeDefined();
    });

    it('respects manually specified unique item code when provided', async () => {
      const customCode = 'CALIPER-MITU-001';
      const created = await createItemMaster(dummyTenant, dummyOrg, {
        ...validFormData,
        item_code: customCode,
      });

      expect(created.item_code).toBe(customCode);
    });

    it('rejects item creation when item_name is blank', async () => {
      await expect(
        createItemMaster(dummyTenant, dummyOrg, { ...validFormData, item_name: '   ' })
      ).rejects.toThrow('Item name is required');
    });

    it('rejects item creation when range_min > range_max', async () => {
      await expect(
        createItemMaster(dummyTenant, dummyOrg, {
          ...validFormData,
          range_min: 300,
          range_max: 50,
        })
      ).rejects.toThrow('Measurement Range Min cannot exceed Range Max');
    });

    it('rejects item creation when range unit of measure is missing', async () => {
      await expect(
        createItemMaster(dummyTenant, dummyOrg, {
          ...validFormData,
          range_unit: '',
        })
      ).rejects.toThrow('Measurement Range Unit of measure is required');
    });

    it('rejects item creation when least count is zero or negative', async () => {
      await expect(
        createItemMaster(dummyTenant, dummyOrg, {
          ...validFormData,
          least_count: 0,
        })
      ).rejects.toThrow('Least Count is required, must be numeric and greater than zero');

      await expect(
        createItemMaster(dummyTenant, dummyOrg, {
          ...validFormData,
          least_count: -0.05,
        })
      ).rejects.toThrow('Least Count is required, must be numeric and greater than zero');
    });

    it('rejects item creation when least count unit is missing', async () => {
      await expect(
        createItemMaster(dummyTenant, dummyOrg, {
          ...validFormData,
          least_count_unit: '',
        })
      ).rejects.toThrow('Least Count unit of measure is required');
    });

    it('rejects item creation when standard cost is negative', async () => {
      await expect(
        createItemMaster(dummyTenant, dummyOrg, {
          ...validFormData,
          standard_cost: -50,
        })
      ).rejects.toThrow('Standard Cost is required and must be zero or a positive numeric amount');
    });

    it('allows zero standard cost for complimentary or internal items', async () => {
      const freeItem = await createItemMaster(dummyTenant, dummyOrg, {
        ...validFormData,
        standard_cost: 0,
      });
      expect(freeItem.standard_cost).toBe(0);
    });
  });

  describe('Item Master Lifecycle, Update, and Multi-Tenant Isolation', () => {
    const tenantA = 'tenant-alpha-001';
    const tenantB = 'tenant-bravo-002';
    const dummyOrg = 'org-alpha-001';

    const itemData: ItemMasterFormData = {
      item_name: 'Pressure Transmitter 0-100 bar',
      item_category: 'Pressure & Vacuum',
      manufacturer: 'Yokogawa',
      model: 'EJA530E',
      range_min: 0,
      range_max: 100,
      range_unit: 'bar',
      least_count: 0.1,
      least_count_unit: 'bar',
      standard_cost: 2500,
      calibration_frequency: 6,
      status: 'ACTIVE',
    };

    it('enforces multi-tenant data isolation: Tenant B cannot view Tenant A items', async () => {
      await createItemMaster(tenantA, dummyOrg, itemData);
      await createItemMaster(tenantA, dummyOrg, {
        ...itemData,
        item_name: 'Deadweight Tester',
        item_code: 'DWT-001',
      });

      const tenantAItems = await getItemMasters(tenantA);
      const tenantBItems = await getItemMasters(tenantB);

      expect(tenantAItems.length).toBe(2);
      expect(tenantBItems.length).toBe(0);
    });

    it('updates item specifications and captures modified audit metadata', async () => {
      const created = await createItemMaster(tenantA, dummyOrg, itemData, {
        id: 'creator-user',
        name: 'Junior Engineer',
      });

      const updated = await updateItemMaster(
        created.id,
        tenantA,
        {
          standard_cost: 2800,
          calibration_frequency: 12,
          range_max: 150,
        },
        {
          id: 'lead-user',
          name: 'Chief Quality Inspector',
        }
      );

      expect(updated.standard_cost).toBe(2800);
      expect(updated.calibration_frequency).toBe(12);
      expect(updated.range_max).toBe(150);
      expect(updated.measurement_range).toBe('0 - 150 bar');
      expect(updated.updated_by).toBe('lead-user');
      expect(updated.updated_by_name).toBe('Chief Quality Inspector');
      expect(updated.updated_at).toBeDefined();
    });

    it('prevents update if range_min exceeds range_max', async () => {
      const created = await createItemMaster(tenantA, dummyOrg, itemData);

      await expect(
        updateItemMaster(created.id, tenantA, {
          range_min: 200, // current range_max is 100
        })
      ).rejects.toThrow('Measurement Range Min cannot exceed Range Max');
    });

    it('toggles item status between ACTIVE and INACTIVE', async () => {
      const created = await createItemMaster(tenantA, dummyOrg, itemData);
      expect(created.status).toBe('ACTIVE');

      const toggledInactive = await toggleItemMasterStatus(created.id, tenantA);
      expect(toggledInactive.status).toBe('INACTIVE');

      const toggledActive = await toggleItemMasterStatus(created.id, tenantA);
      expect(toggledActive.status).toBe('ACTIVE');
    });

    it('retrieves item by id and throws if not found', async () => {
      const created = await createItemMaster(tenantA, dummyOrg, itemData);
      const fetched = await getItemMasterById(created.id, tenantA);

      expect(fetched.id).toBe(created.id);
      expect(fetched.item_name).toBe(created.item_name);

      await expect(getItemMasterById('non-existent-id', tenantA)).rejects.toThrow(
        'Item master not found'
      );
    });
  });
});
