// application/src/services/vendorMasterService.ts
import { supabase } from '../lib/supabaseClient';
import type { Vendor, VendorFormData } from '../types/domain';
import { validateGSTIN, validateEmail, validatePhone } from './clientMasterService';
import { logAuditEvent } from './auditLogService';

const VENDORS_STORAGE_PREFIX = 'ccm_tenant_vendors_';

export const METROLOGY_SERVICE_CATEGORIES = [
  'Dimensional Metrology',
  'Thermal & Temperature',
  'Pressure & Vacuum',
  'Electrical & Electronic',
  'Mass, Balances & Weights',
  'Torque & Force',
  'Optical & Photonics',
  'Fluid Flow & Volume',
  'Calibration Consumables & Standards',
  'Outsourced Laboratory Testing',
] as const;

export function generateVendorCode(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `VND-${year}-${randomSuffix}`;
}

function getLocalVendors(tenantId: string): Vendor[] {
  try {
    const raw = localStorage.getItem(`${VENDORS_STORAGE_PREFIX}${tenantId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalVendors(tenantId: string, vendors: Vendor[]): void {
  try {
    localStorage.setItem(`${VENDORS_STORAGE_PREFIX}${tenantId}`, JSON.stringify(vendors));
  } catch (err) {
    console.error('Failed to save vendors locally:', err);
  }
}

// ============================================================================
// Service API Layer
// ============================================================================

export async function getVendors(
  tenantId: string,
  organizationId?: string,
  search?: string,
  status?: string,
  category?: string
): Promise<Vendor[]> {
  if (!tenantId) throw new Error('tenantId is required for data boundary');

  try {
    let query = supabase
      .from('vendors')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (organizationId) {
      query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
    }

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (!error && data) {
      let filtered = data as Vendor[];
      if (category && category !== 'ALL') {
        filtered = filtered.filter((v) => v.serviced_categories?.includes(category));
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (v) =>
            v.vendor_name.toLowerCase().includes(q) ||
            v.vendor_code.toLowerCase().includes(q) ||
            v.contact_person?.toLowerCase().includes(q) ||
            v.city?.toLowerCase().includes(q)
        );
      }
      return filtered;
    }
  } catch (_remoteErr) {
    // Fallback to local store
  }

  let vendors = getLocalVendors(tenantId);
  if (organizationId) {
    vendors = vendors.filter((v) => !v.organization_id || v.organization_id === organizationId);
  }
  if (status && status !== 'ALL') {
    vendors = vendors.filter((v) => v.status === status);
  }
  if (category && category !== 'ALL') {
    vendors = vendors.filter((v) => v.serviced_categories?.includes(category));
  }
  if (search) {
    const q = search.toLowerCase();
    vendors = vendors.filter(
      (v) =>
        v.vendor_name.toLowerCase().includes(q) ||
        v.vendor_code.toLowerCase().includes(q) ||
        v.contact_person?.toLowerCase().includes(q) ||
        v.city?.toLowerCase().includes(q)
    );
  }
  return vendors;
}

export async function getVendorById(id: string, tenantId: string): Promise<Vendor> {
  if (!id || !tenantId) throw new Error('Vendor id and tenantId are required');

  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (!error && data) {
      return data as Vendor;
    }
  } catch (_err) {
    // Fallback
  }

  const vendors = getLocalVendors(tenantId);
  const found = vendors.find((v) => v.id === id);
  if (!found) {
    throw new Error('Vendor not found');
  }
  return found;
}

export async function createVendor(
  tenantId: string,
  organizationId: string | undefined,
  formData: VendorFormData,
  creator?: { id?: string; name?: string }
): Promise<Vendor> {
  if (!tenantId) throw new Error('tenantId is required');

  // Mandatory fields validation
  if (!formData.vendor_name.trim()) throw new Error('Vendor name is required');
  if (!formData.address.trim()) throw new Error('Vendor address is required');
  if (!formData.city.trim()) throw new Error('City is required');
  if (!formData.state.trim()) throw new Error('State is required');
  if (!formData.pin.trim()) throw new Error('PIN code is required');
  if (!formData.contact_person.trim()) throw new Error('Contact person is required');

  // Validate GSTIN
  if (!validateGSTIN(formData.gst_tax_number)) {
    throw new Error('Invalid GSTIN format. Expected standard 15-character alphanumeric format (e.g. 27AAAAA0000A1Z5).');
  }

  // Validate Phone numbers
  const validPhones = formData.phone_numbers.filter((p) => Boolean(p.trim()));
  if (validPhones.length === 0) {
    throw new Error('At least one valid phone number is required');
  }
  for (const phone of validPhones) {
    if (!validatePhone(phone)) {
      throw new Error(`Invalid phone number format: "${phone}". Must be 10-15 digits.`);
    }
  }

  // Validate Emails
  const validEmails = formData.email_addresses.filter((e) => Boolean(e.trim()));
  if (validEmails.length === 0) {
    throw new Error('At least one valid email address is required');
  }
  for (const email of validEmails) {
    if (!validateEmail(email)) {
      throw new Error(`Invalid email address format: "${email}".`);
    }
  }

  const vendorCode = formData.vendor_code?.trim() || generateVendorCode();
  const now = new Date().toISOString();

  const newVendor: Vendor = {
    id: crypto.randomUUID(),
    tenant_id: tenantId,
    organization_id: organizationId,
    vendor_code: vendorCode,
    vendor_name: formData.vendor_name.trim(),
    address: formData.address.trim(),
    city: formData.city.trim(),
    state: formData.state.trim(),
    pin: formData.pin.trim(),
    gst_tax_number: formData.gst_tax_number.trim().toUpperCase(),
    contact_person: formData.contact_person.trim(),
    email: validEmails[0],
    phone: validPhones[0],
    phone_numbers: validPhones,
    email_addresses: validEmails,
    serviced_categories: formData.serviced_categories || [],
    status: formData.status || 'ACTIVE',
    created_by: creator?.id,
    created_by_name: creator?.name || 'Authorized Operator',
    created_at: now,
    updated_by: creator?.id,
    updated_by_name: creator?.name || 'Authorized Operator',
    updated_at: now,
  };

  try {
    const { data, error } = await supabase
      .from('vendors')
      .insert({
        id: newVendor.id,
        tenant_id: newVendor.tenant_id,
        organization_id: newVendor.organization_id || null,
        vendor_code: newVendor.vendor_code,
        vendor_name: newVendor.vendor_name,
        address: newVendor.address,
        gst_tax_number: newVendor.gst_tax_number,
        contact_person: newVendor.contact_person,
        email: newVendor.email,
        phone: newVendor.phone,
        serviced_categories: newVendor.serviced_categories,
        status: newVendor.status,
      })
      .select()
      .single();

    if (!error && data) {
      const savedVendor = { ...newVendor, ...data };
      await logAuditEvent({
        tenantId,
        organizationId,
        actorUserId: creator?.id,
        actorName: creator?.name || 'Authorized Operator',
        action: 'CREATE_VENDOR',
        entity: 'VENDOR',
        entityId: savedVendor.id,
        newData: {
          vendor_code: savedVendor.vendor_code,
          vendor_name: savedVendor.vendor_name,
          address: savedVendor.address,
          city: savedVendor.city,
          state: savedVendor.state,
          pin: savedVendor.pin,
          gst_tax_number: savedVendor.gst_tax_number,
          contact_person: savedVendor.contact_person,
          email: savedVendor.email,
          phone: savedVendor.phone,
          serviced_categories: savedVendor.serviced_categories,
          status: savedVendor.status,
        },
        remarks: `Registered new vendor "${savedVendor.vendor_name}" (${savedVendor.vendor_code}).`,
      });
      return savedVendor;
    }
  } catch (_remoteErr) {
    // Local store fallback
  }

  const existing = getLocalVendors(tenantId);
  saveLocalVendors(tenantId, [newVendor, ...existing]);

  await logAuditEvent({
    tenantId,
    organizationId,
    actorUserId: creator?.id,
    actorName: creator?.name || 'Authorized Operator',
    action: 'CREATE_VENDOR',
    entity: 'VENDOR',
    entityId: newVendor.id,
    newData: {
      vendor_code: newVendor.vendor_code,
      vendor_name: newVendor.vendor_name,
      address: newVendor.address,
      city: newVendor.city,
      state: newVendor.state,
      pin: newVendor.pin,
      gst_tax_number: newVendor.gst_tax_number,
      contact_person: newVendor.contact_person,
      email: newVendor.email,
      phone: newVendor.phone,
      serviced_categories: newVendor.serviced_categories,
      status: newVendor.status,
    },
    remarks: `Registered new vendor "${newVendor.vendor_name}" (${newVendor.vendor_code}).`,
  });

  return newVendor;
}

export async function updateVendor(
  id: string,
  tenantId: string,
  formData: Partial<VendorFormData>,
  modifier?: { id?: string; name?: string }
): Promise<Vendor> {
  const current = await getVendorById(id, tenantId);

  // Validate GSTIN if modified
  if (formData.gst_tax_number && !validateGSTIN(formData.gst_tax_number)) {
    throw new Error('Invalid GSTIN format. Expected 15-character alphanumeric format.');
  }

  // Validate Phones if modified
  if (formData.phone_numbers) {
    const validPhones = formData.phone_numbers.filter((p) => Boolean(p.trim()));
    if (validPhones.length === 0) {
      throw new Error('At least one phone number is required');
    }
    for (const phone of validPhones) {
      if (!validatePhone(phone)) throw new Error(`Invalid phone number: ${phone}`);
    }
  }

  // Validate Emails if modified
  if (formData.email_addresses) {
    const validEmails = formData.email_addresses.filter((e) => Boolean(e.trim()));
    if (validEmails.length === 0) {
      throw new Error('At least one email address is required');
    }
    for (const email of validEmails) {
      if (!validateEmail(email)) throw new Error(`Invalid email address: ${email}`);
    }
  }

  const now = new Date().toISOString();
  const updatedPhones = formData.phone_numbers?.filter((p) => Boolean(p.trim())) || current.phone_numbers || [current.phone];
  const updatedEmails = formData.email_addresses?.filter((e) => Boolean(e.trim())) || current.email_addresses || [current.email];

  const updatedVendor: Vendor = {
    ...current,
    vendor_name: formData.vendor_name?.trim() ?? current.vendor_name,
    address: formData.address?.trim() ?? current.address,
    city: formData.city?.trim() ?? current.city,
    state: formData.state?.trim() ?? current.state,
    pin: formData.pin?.trim() ?? current.pin,
    gst_tax_number: formData.gst_tax_number?.trim().toUpperCase() ?? current.gst_tax_number,
    contact_person: formData.contact_person?.trim() ?? current.contact_person,
    email: updatedEmails[0],
    phone: updatedPhones[0],
    phone_numbers: updatedPhones,
    email_addresses: updatedEmails,
    serviced_categories: formData.serviced_categories ?? current.serviced_categories,
    status: formData.status ?? current.status,
    updated_by: modifier?.id,
    updated_by_name: modifier?.name || 'Authorized Operator',
    updated_at: now,
  };

  try {
    await supabase
      .from('vendors')
      .update({
        vendor_name: updatedVendor.vendor_name,
        address: updatedVendor.address,
        gst_tax_number: updatedVendor.gst_tax_number,
        contact_person: updatedVendor.contact_person,
        email: updatedVendor.email,
        phone: updatedVendor.phone,
        serviced_categories: updatedVendor.serviced_categories,
        status: updatedVendor.status,
      })
      .eq('id', id)
      .eq('tenant_id', tenantId);
  } catch (_remoteErr) {
    // Ignore remote err
  }

  const vendors = getLocalVendors(tenantId);
  const updatedList = vendors.map((v) => (v.id === id ? updatedVendor : v));
  saveLocalVendors(tenantId, updatedList);

  await logAuditEvent({
    tenantId,
    organizationId: updatedVendor.organization_id,
    actorUserId: modifier?.id,
    actorName: modifier?.name || 'Authorized Operator',
    action: 'UPDATE_VENDOR',
    entity: 'VENDOR',
    entityId: id,
    oldData: {
      vendor_name: current.vendor_name,
      contact_person: current.contact_person,
      email: current.email,
      phone: current.phone,
      gst_tax_number: current.gst_tax_number,
      serviced_categories: current.serviced_categories,
      status: current.status,
    },
    newData: {
      vendor_name: updatedVendor.vendor_name,
      contact_person: updatedVendor.contact_person,
      email: updatedVendor.email,
      phone: updatedVendor.phone,
      gst_tax_number: updatedVendor.gst_tax_number,
      serviced_categories: updatedVendor.serviced_categories,
      status: updatedVendor.status,
    },
    remarks: `Updated profile for vendor "${updatedVendor.vendor_name}" (${updatedVendor.vendor_code}).`,
  });

  return updatedVendor;
}

export async function toggleVendorStatus(
  id: string,
  tenantId: string,
  modifier?: { id?: string; name?: string }
): Promise<Vendor> {
  const current = await getVendorById(id, tenantId);
  const nextStatus = current.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const updated = await updateVendor(id, tenantId, { status: nextStatus }, modifier);

  await logAuditEvent({
    tenantId,
    organizationId: updated.organization_id,
    actorUserId: modifier?.id,
    actorName: modifier?.name || 'Authorized Operator',
    action: nextStatus === 'ACTIVE' ? 'ACTIVATE_VENDOR' : 'DEACTIVATE_VENDOR',
    entity: 'VENDOR',
    entityId: id,
    oldData: { status: current.status },
    newData: { status: nextStatus },
    remarks: `Changed vendor status to ${nextStatus} for "${updated.vendor_name}".`,
  });

  return updated;
}
