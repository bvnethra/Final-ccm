// src/types/auth.ts

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

export interface UserProfile {
  id: string;
  tenantId: string;
  organizationId: string;
  email: string;
  fullName: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  organizationName?: string;
  roles: string[];
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  adminName?: string;
  adminEmail?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string;
  module: string;
}

export interface RoleTemplate {
  id: string;
  tenantId?: string;
  organizationId?: string;
  templateCode: string;
  name: string;
  description?: string;
  category: 'OPERATIONS' | 'COMMERCIAL' | 'LOGISTICS' | 'MANAGEMENT' | 'CLIENT' | 'ADMINISTRATION';
  permissions?: Permission[];
}

export interface Role {
  id: string;
  tenantId: string;
  organizationId?: string;
  name: string;
  code: string;
  description?: string;
  roleTemplateId?: string;
  status: 'ACTIVE' | 'INACTIVE';
  permissions: Permission[];
}
