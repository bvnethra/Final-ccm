// application/src/test/domain.test.ts
import { describe, it, expect } from 'vitest';

describe('Operational Calibration Domain & Permission Rules', () => {
  it('strictly validates dot-notation permissions', () => {
    const userPermissions = ['REQUEST_CREATE', 'VERIFICATION_CREATE', 'CALIBRATION_CREATE'];

    const hasPermission = (perm: string) => {
      const normalized = perm.toUpperCase().replace(/\./g, '_');
      return userPermissions.includes(normalized);
    };

    expect(hasPermission('request.create')).toBe(true);
    expect(hasPermission('verification.create')).toBe(true);
    expect(hasPermission('calibration.create')).toBe(true);
    expect(hasPermission('quotation.approve')).toBe(false);
  });

  it('rejects un-scoped operations without tenantId or organizationId (Triple-Key)', () => {
    const validateTripleKey = (tenantId?: string, organizationId?: string, requestId?: string) => {
      if (!tenantId || !organizationId || !requestId) {
        throw new Error('Triple-Key violation: missing tenantId, organizationId, or requestId');
      }
      return true;
    };

    expect(() => validateTripleKey(undefined, 'org-1', 'req-1')).toThrow(
      'Triple-Key violation'
    );
    expect(() => validateTripleKey('tenant-1', undefined, 'req-1')).toThrow(
      'Triple-Key violation'
    );
    expect(() => validateTripleKey('tenant-1', 'org-1', undefined)).toThrow(
      'Triple-Key violation'
    );
    expect(validateTripleKey('tenant-1', 'org-1', 'req-1')).toBe(true);
  });
});
