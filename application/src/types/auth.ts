// application/src/types/auth.ts

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  tenantId: string;
  organizationId: string;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
}
