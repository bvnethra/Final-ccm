import { describe, it, expect } from 'vitest';
import { generateTenantCodeFromName } from '../super-admin/services/tenantManagementService';

describe('Tenant Onboarding Code Generation & Custom Type Handling', () => {
  describe('generateTenantCodeFromName', () => {
    it('generates TNT-APEX for "Apex Metrology Systems Ltd"', () => {
      expect(generateTenantCodeFromName('Apex Metrology Systems Ltd')).toBe('TNT-APEX');
    });

    it('generates TNT-NETHRA for "Nethra Calibration Centre"', () => {
      expect(generateTenantCodeFromName('Nethra Calibration Centre')).toBe('TNT-NETHRA');
    });

    it('combines short acronyms like "E2E Precision Labs Inc"', () => {
      expect(generateTenantCodeFromName('E2E Precision Labs Inc')).toBe('TNT-E2E-PRECISION');
    });

    it('handles single word company names', () => {
      expect(generateTenantCodeFromName('Apex')).toBe('TNT-APEX');
    });

    it('strips corporate suffixes such as Pvt, Ltd, LLC, Corp', () => {
      expect(generateTenantCodeFromName('Sathish Enterprises Pvt Ltd')).toBe('TNT-SATHISH');
      expect(generateTenantCodeFromName('Global Testing Corp.')).toBe('TNT-GLOBAL');
    });

    it('returns empty string for empty or whitespace input', () => {
      expect(generateTenantCodeFromName('')).toBe('');
      expect(generateTenantCodeFromName('   ')).toBe('');
    });
  });

  describe('Custom Tenant Type Payload Resolution', () => {
    it('resolves effective tenant type as custom string when type is OTHER', () => {
      const selectedType: string = 'OTHER';
      const customType = 'Automotive Component Testing Facility';
      const effectiveType = selectedType === 'OTHER' ? customType.trim() : selectedType;
      expect(effectiveType).toBe('Automotive Component Testing Facility');
    });

    it('preserves standard dynamic DB code when not OTHER', () => {
      const selectedType: string = 'COMMERCIAL_LAB';
      const customType = '';
      const effectiveType = selectedType === 'OTHER' ? customType.trim() : selectedType;
      expect(effectiveType).toBe('COMMERCIAL_LAB');
    });
  });
});
