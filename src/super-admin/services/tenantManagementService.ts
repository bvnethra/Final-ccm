// src/super-admin/services/tenantManagementService.ts
import { supabase } from '../../lib/supabaseClient';
import type { 
  PlatformTenant, 
  TenantFilters, 
  PaginatedTenants, 
  OnboardTenantPayload, 
  TenantStatus,
  TenantOrganization,
  CreateOrganizationPayload
} from '../types/superAdmin';
import { logPlatformEvent } from './platformAuditService';

export async function fetchTenants(filters: TenantFilters = {}): Promise<PaginatedTenants> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('tenants')
    .select('*', { count: 'exact' });

  // Search filter
  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`name.ilike.${term},code.ilike.${term},admin_email.ilike.${term}`);
  }

  // Status filter
  if (filters.status && filters.status !== 'ALL') {
    query = query.eq('status', filters.status);
  }

  // Tenant type filter
  if (filters.tenantType && filters.tenantType !== 'ALL') {
    query = query.eq('tenant_type', filters.tenantType);
  }

  // Sorting
  const sortBy = filters.sortBy || 'created_at';
  const ascending = filters.sortOrder === 'asc';
  query = query.order(sortBy, { ascending });

  // Pagination range
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) throw new Error(`Fetch tenants failed: ${error.message}`);

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize) || 1;

  const mappedData: PlatformTenant[] = (data || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    code: t.code,
    status: t.status,
    tenantType: t.tenant_type,
    registrationNumber: t.registration_number,
    gstNumber: t.gst_number,
    phone: t.phone,
    adminName: t.admin_name,
    adminEmail: t.admin_email,
    addressLine1: t.address_line1,
    addressLine2: t.address_line2,
    city: t.city,
    state: t.state,
    country: t.country,
    pincode: t.pincode,
    timezone: t.timezone,
    currency: t.currency,
    branchesCount: Number(t.branches_count || 1),
    statusReason: t.status_reason,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));

  return {
    data: mappedData,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function fetchTenantById(id: string): Promise<PlatformTenant> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) throw new Error(`Tenant not found: ${error?.message || id}`);

  return {
    id: data.id,
    name: data.name,
    code: data.code,
    status: data.status,
    tenantType: data.tenant_type,
    registrationNumber: data.registration_number,
    gstNumber: data.gst_number,
    phone: data.phone,
    adminName: data.admin_name,
    adminEmail: data.admin_email,
    addressLine1: data.address_line1,
    addressLine2: data.address_line2,
    city: data.city,
    state: data.state,
    country: data.country,
    pincode: data.pincode,
    timezone: data.timezone,
    currency: data.currency,
    branchesCount: Number(data.branches_count || 1),
    statusReason: data.status_reason,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function onboardTenant(payload: OnboardTenantPayload): Promise<PlatformTenant> {
  const code = payload.code.trim().toUpperCase();

  // 1. Backend Duplicate Validation Checks
  const { data: existingCode } = await supabase
    .from('tenants')
    .select('id')
    .eq('code', code)
    .maybeSingle();

  if (existingCode) {
    throw new Error(`A tenant with code '${code}' already exists.`);
  }

  if (payload.gstNumber && payload.gstNumber.trim()) {
    const { data: existingGst } = await supabase
      .from('tenants')
      .select('id')
      .eq('gst_number', payload.gstNumber.trim().toUpperCase())
      .maybeSingle();

    if (existingGst) {
      throw new Error(`A tenant with GST number '${payload.gstNumber}' already exists.`);
    }
  }

  // 2. Insert into PostgreSQL tenants table
  const insertPayload = {
    name: payload.name.trim(),
    code,
    tenant_type: payload.tenantType,
    status: 'ACTIVE',
    registration_number: payload.registrationNumber?.trim() || null,
    gst_number: payload.gstNumber?.trim().toUpperCase() || null,
    phone: payload.phone?.trim() || null,
    admin_name: payload.adminName?.trim() || null,
    admin_email: payload.adminEmail?.trim().toLowerCase() || null,
    address_line1: payload.addressLine1?.trim() || null,
    address_line2: payload.addressLine2?.trim() || null,
    city: payload.city?.trim() || null,
    state: payload.state?.trim() || null,
    country: payload.country?.trim() || 'India',
    pincode: payload.pincode?.trim() || null,
    timezone: payload.timezone?.trim() || 'Asia/Kolkata',
    currency: payload.currency?.trim() || 'INR',
    branches_count: payload.branchesCount || 1,
  };

  const { data: tenant, error: insertErr } = await supabase
    .from('tenants')
    .insert([insertPayload])
    .select()
    .single();

  if (insertErr || !tenant) {
    throw new Error(`Failed to onboard tenant: ${insertErr?.message}`);
  }

  // 3. Log Immutable Platform Audit Event
  await logPlatformEvent({
    action: 'TENANT_ONBOARDED',
    referenceId: tenant.id,
    newState: tenant,
    reason: `Onboarded new enterprise tenant '${tenant.name}' (${tenant.code})`,
    metadata: {
      tenantType: tenant.tenant_type,
      branchesCount: tenant.branches_count,
      ...(tenant.admin_email ? { adminEmail: tenant.admin_email } : {}),
    },
  });

  return fetchTenantById(tenant.id);
}

export async function updateTenantStatus(params: {
  tenantId: string;
  newStatus: TenantStatus;
  reason: string;
}): Promise<void> {
  const { tenantId, newStatus, reason } = params;

  if (!reason || !reason.trim()) {
    throw new Error('A detailed reason is mandatory for any tenant status modification.');
  }

  // Fetch current state for audit
  const previous = await fetchTenantById(tenantId);

  if (previous.status === newStatus) {
    return;
  }

  const { error } = await supabase
    .from('tenants')
    .update({
      status: newStatus,
      status_reason: reason.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenantId);

  if (error) throw new Error(`Update tenant status failed: ${error.message}`);

  // Log Immutable Audit Event
  await logPlatformEvent({
    action: `TENANT_STATUS_${newStatus}`,
    referenceId: tenantId,
    previousState: { status: previous.status, statusReason: previous.statusReason },
    newState: { status: newStatus, statusReason: reason.trim() },
    reason: reason.trim(),
    metadata: { tenantName: previous.name, tenantCode: previous.code },
  });
}

export async function triggerAdminInvite(tenantId: string): Promise<void> {
  const tenant = await fetchTenantById(tenantId);

  await logPlatformEvent({
    action: 'TENANT_ADMIN_INVITED',
    referenceId: tenantId,
    reason: `Dispatched invitation and credential provisioning trigger for tenant admin: ${tenant.adminEmail}`,
    metadata: {
      adminEmail: tenant.adminEmail,
      adminName: tenant.adminName,
    },
  });
}

export async function fetchTenantOrganizations(tenantId: string): Promise<TenantOrganization[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch tenant organizations: ${error.message}`);
  }

  return (data || []).map((org: any) => ({
    id: org.id,
    tenantId: org.tenant_id,
    name: org.name,
    code: org.code,
    address: org.address,
    phone: org.phone,
    email: org.email,
    status: org.status,
    createdAt: org.created_at,
    updatedAt: org.updated_at,
  }));
}

export async function createTenantOrganization(payload: CreateOrganizationPayload): Promise<TenantOrganization> {
  const code = payload.code.trim().toUpperCase();

  // Validate duplicate organization code within this tenant
  const { data: existingCode } = await supabase
    .from('organizations')
    .select('id')
    .eq('tenant_id', payload.tenantId)
    .eq('code', code)
    .maybeSingle();

  if (existingCode) {
    throw new Error(`An organization with code '${code}' already exists under this tenant.`);
  }

  const insertData = {
    tenant_id: payload.tenantId,
    name: payload.name.trim(),
    code,
    address: payload.address?.trim() || null,
    phone: payload.phone?.trim() || null,
    email: payload.email?.trim() || null,
    status: payload.status || 'ACTIVE',
  };

  const { data, error } = await supabase
    .from('organizations')
    .insert([insertData])
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create organization: ${error?.message}`);
  }

  // Also increment or update branches_count on tenant for accuracy
  const { count } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', payload.tenantId);

  if (count !== null) {
    await supabase
      .from('tenants')
      .update({ branches_count: count })
      .eq('id', payload.tenantId);
  }

  // Immutable Platform Audit Event
  await logPlatformEvent({
    action: 'ORGANIZATION_CREATED',
    referenceId: data.id,
    newState: data,
    reason: `Provisioned organization/branch '${data.name}' (${data.code}) under tenant`,
    metadata: {
      tenantId: payload.tenantId,
      orgCode: data.code,
      orgName: data.name,
    },
  });

  return {
    id: data.id,
    tenantId: data.tenant_id,
    name: data.name,
    code: data.code,
    address: data.address,
    phone: data.phone,
    email: data.email,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
