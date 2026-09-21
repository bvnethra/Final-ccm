import { describe, it, expect } from 'vitest';

function evaluatePermission(userPermissions: string[], requiredPermission: string, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  return userPermissions.includes(requiredPermission);
}

describe('RBAC & Permission Evaluator', () => {
  it('should grant access to Super Admin regardless of specific permission codes', () => {
    const result = evaluatePermission([], 'request.create', true);
    expect(result).toBe(true);
  });

  it('should grant access if user has exact matching dot-notation permission', () => {
    const permissions = ['request.view', 'request.create', 'verification.view'];
    expect(evaluatePermission(permissions, 'request.create', false)).toBe(true);
    expect(evaluatePermission(permissions, 'calibration.create', false)).toBe(false);
  });

  it('should reject access if non-admin user lacks requested permission', () => {
    const permissions = ['request.view'];
    expect(evaluatePermission(permissions, 'role.create', false)).toBe(false);
  });
});
