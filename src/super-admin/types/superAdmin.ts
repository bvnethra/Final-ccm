// src/super-admin/types/superAdmin.ts

export type TenantStatus = 'ACTIVE' | 'DEACTIVATED';
export type PlatformRole = 'SUPER_ADMIN' | 'PLATFORM_SUPPORT';
export type PlatformUserStatus = 'ACTIVE' | 'INACTIVE';

export interface PlatformTenant {
  id: string;
  name: string;
  code: string;
  status: TenantStatus;
  tenantType: string;
  registrationNumber?: string;
  gstNumber?: string;
  phone?: string;
  adminName?: string;
  adminEmail?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  timezone?: string;
  currency?: string;
  branchesCount: number;
  statusReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantOrganization {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationPayload {
  tenantId: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface TenantFilters {
  search?: string;
  status?: string;
  tenantType?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedTenants {
  data: PlatformTenant[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PlatformUser {
  id: string;
  email: string;
  fullName: string;
  role: PlatformRole;
  status: PlatformUserStatus;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigItem {
  id: string;
  category: string;
  code: string;
  label: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformAuditLog {
  id: string;
  actorId?: string;
  actorEmail?: string;
  actorRole: string;
  action: string;
  referenceId?: string;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
  ipAddress?: string;
  reason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface SuperAdminDashboardMetrics {
  totalTenants: number;
  activeTenants: number;
  deactivatedTenants: number;
  statusDistribution: {
    status: TenantStatus;
    count: number;
    percentage: number;
  }[];
  recentTenants: PlatformTenant[];
  recentActivity: PlatformAuditLog[];
}

export interface OnboardTenantPayload {
  name: string;
  code: string;
  tenantType: string;
  registrationNumber?: string;
  gstNumber?: string;
  phone?: string;
  adminName: string;
  adminEmail: string;
  adminPassword?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  timezone?: string;
  currency?: string;
  branchesCount?: number;
}
