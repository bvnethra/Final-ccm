export type PermissionLevel = 'NONE' | 'VIEW' | 'CREATE' | 'CREATE_EDIT' | 'APPROVE';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  tenantId: string;
  tenantName?: string;
  tenantCode?: string;
  organizationId: string;
  organizationName?: string;
  organizationCode?: string;
  roles: string[];
  permissions: string[];
  modulePermissions?: Record<string, PermissionLevel>;
  isSuperAdmin: boolean;
}
