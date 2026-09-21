// application/src/services/clientMasterService.ts
import { supabase } from '../lib/supabaseClient';
import type { Client, ClientFormData } from '../types/domain';

const CLIENTS_STORAGE_PREFIX = 'ccm_tenant_clients_';

// ============================================================================
// Validators & Utility Functions
// ============================================================================

export function validateGSTIN(gstin: string): boolean {
  if (!gstin) return false;
  // Standard Indian 15-character GSTIN format
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin.trim().toUpperCase());
}

export function validateEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15 && /^\+?[0-9]+$/.test(cleaned);
}

export function generateClientCode(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `CLI-${year}-${randomSuffix}`;
}

function getLocalClients(tenantId: string): Client[] {
  try {
    const raw = localStorage.getItem(`${CLIENTS_STORAGE_PREFIX}${tenantId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalClients(tenantId: string, clients: Client[]): void {
  try {
    localStorage.setItem(`${CLIENTS_STORAGE_PREFIX}${tenantId}`, JSON.stringify(clients));
  } catch (err) {
    console.error('Failed to save clients locally:', err);
  }
}

// ============================================================================
// Service API Layer
// ============================================================================

export async function getClients(
  tenantId: string,
  organizationId?: string,
  search?: string,
  status?: string
): Promise<Client[]> {
  if (!tenantId) throw new Error('tenantId is required for data boundary');

  try {
    let query = supabase
      .from('clients')
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
      let filtered = data as Client[];
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.client_name.toLowerCase().includes(q) ||
            c.client_code.toLowerCase().includes(q) ||
            c.contact_person?.toLowerCase().includes(q) ||
            c.city?.toLowerCase().includes(q)
        );
      }
      return filtered;
    }
  } catch (_remoteErr) {
    // Fallback to tenant-scoped repository
  }

  // Resilient fallback
  let clients = getLocalClients(tenantId);
  if (organizationId) {
    clients = clients.filter((c) => !c.organization_id || c.organization_id === organizationId);
  }
  if (status && status !== 'ALL') {
    clients = clients.filter((c) => c.status === status);
  }
  if (search) {
    const q = search.toLowerCase();
    clients = clients.filter(
      (c) =>
        c.client_name.toLowerCase().includes(q) ||
        c.client_code.toLowerCase().includes(q) ||
        c.contact_person?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q)
    );
  }
  return clients;
}

export async function getClientById(id: string, tenantId: string): Promise<Client> {
  if (!id || !tenantId) throw new Error('Client id and tenantId are required');

  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (!error && data) {
      return data as Client;
    }
  } catch (_err) {
    // Fallback
  }

  const clients = getLocalClients(tenantId);
  const found = clients.find((c) => c.id === id);
  if (!found) {
    throw new Error('Client not found');
  }
  return found;
}

export async function createClient(
  tenantId: string,
  organizationId: string | undefined,
  formData: ClientFormData,
  creator?: { id?: string; name?: string }
): Promise<Client> {
  if (!tenantId) throw new Error('tenantId is required');

  // Validate mandatory fields
  if (!formData.client_name.trim()) throw new Error('Client name is required');
  if (!formData.address.trim()) throw new Error('Registered address is required');
  if (!formData.city.trim()) throw new Error('City is required');
  if (!formData.state.trim()) throw new Error('State is required');
  if (!formData.pin.trim()) throw new Error('PIN code is required');
  if (!formData.contact_person.trim()) throw new Error('Contact person is required');

  // Validate GSTIN
  if (!validateGSTIN(formData.gst_tax_number)) {
    throw new Error('Invalid GSTIN format. Expected standard 15-character alphanumeric format (e.g. 22AAAAA0000A1Z5).');
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

  // Process billing address
  const billingAddress = formData.billing_address?.trim() || formData.address.trim();

  // Auto-generate client code if not provided
  const clientCode = formData.client_code?.trim() || generateClientCode();
  const now = new Date().toISOString();

  const newClient: Client = {
    id: crypto.randomUUID(),
    tenant_id: tenantId,
    organization_id: organizationId,
    client_code: clientCode,
    client_name: formData.client_name.trim(),
    address: formData.address.trim(),
    billing_address: billingAddress,
    city: formData.city.trim(),
    state: formData.state.trim(),
    pin: formData.pin.trim(),
    gst_tax_number: formData.gst_tax_number.trim().toUpperCase(),
    contact_person: formData.contact_person.trim(),
    email: validEmails[0],
    phone: validPhones[0],
    phone_numbers: validPhones,
    email_addresses: validEmails,
    payment_term: formData.payment_term || 'IMMEDIATE',
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
      .from('clients')
      .insert({
        id: newClient.id,
        tenant_id: newClient.tenant_id,
        organization_id: newClient.organization_id || null,
        client_code: newClient.client_code,
        client_name: newClient.client_name,
        address: newClient.address,
        billing_address: newClient.billing_address,
        gst_tax_number: newClient.gst_tax_number,
        contact_person: newClient.contact_person,
        email: newClient.email,
        phone: newClient.phone,
        status: newClient.status,
      })
      .select()
      .single();

    if (!error && data) {
      return { ...newClient, ...data };
    }
  } catch (_remoteErr) {
    // Save to local tenant store
  }

  const existing = getLocalClients(tenantId);
  saveLocalClients(tenantId, [newClient, ...existing]);
  return newClient;
}

export async function updateClient(
  id: string,
  tenantId: string,
  formData: Partial<ClientFormData>,
  modifier?: { id?: string; name?: string }
): Promise<Client> {
  const current = await getClientById(id, tenantId);

  // Validate GSTIN if changed
  if (formData.gst_tax_number && !validateGSTIN(formData.gst_tax_number)) {
    throw new Error('Invalid GSTIN format. Expected 15-character alphanumeric format.');
  }

  // Validate Phones if changed
  if (formData.phone_numbers) {
    const validPhones = formData.phone_numbers.filter((p) => Boolean(p.trim()));
    if (validPhones.length === 0) {
      throw new Error('At least one phone number is required');
    }
    for (const phone of validPhones) {
      if (!validatePhone(phone)) throw new Error(`Invalid phone number: ${phone}`);
    }
  }

  // Validate Emails if changed
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

  const updatedClient: Client = {
    ...current,
    client_name: formData.client_name?.trim() ?? current.client_name,
    address: formData.address?.trim() ?? current.address,
    billing_address: formData.billing_address?.trim() ?? current.billing_address,
    city: formData.city?.trim() ?? current.city,
    state: formData.state?.trim() ?? current.state,
    pin: formData.pin?.trim() ?? current.pin,
    gst_tax_number: formData.gst_tax_number?.trim().toUpperCase() ?? current.gst_tax_number,
    contact_person: formData.contact_person?.trim() ?? current.contact_person,
    email: updatedEmails[0],
    phone: updatedPhones[0],
    phone_numbers: updatedPhones,
    email_addresses: updatedEmails,
    payment_term: formData.payment_term ?? current.payment_term,
    status: formData.status ?? current.status,
    updated_by: modifier?.id,
    updated_by_name: modifier?.name || 'Authorized Operator',
    updated_at: now,
  };

  try {
    await supabase
      .from('clients')
      .update({
        client_name: updatedClient.client_name,
        address: updatedClient.address,
        billing_address: updatedClient.billing_address,
        gst_tax_number: updatedClient.gst_tax_number,
        contact_person: updatedClient.contact_person,
        email: updatedClient.email,
        phone: updatedClient.phone,
        status: updatedClient.status,
      })
      .eq('id', id)
      .eq('tenant_id', tenantId);
  } catch (_remoteErr) {
    // Ignore remote err
  }

  const clients = getLocalClients(tenantId);
  const updatedList = clients.map((c) => (c.id === id ? updatedClient : c));
  saveLocalClients(tenantId, updatedList);
  return updatedClient;
}

export async function toggleClientStatus(
  id: string,
  tenantId: string,
  modifier?: { id?: string; name?: string }
): Promise<Client> {
  const current = await getClientById(id, tenantId);
  const nextStatus = current.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  return updateClient(id, tenantId, { status: nextStatus }, modifier);
}

export async function createClientsBulk(
  tenantId: string,
  organizationId: string | undefined,
  records: Array<{
    client_name: string;
    client_code?: string;
    address?: string;
    billing_address?: string;
    gst_tax_number?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    status?: 'ACTIVE' | 'INACTIVE';
  }>
): Promise<{ count: number }> {
  if (!tenantId) throw new Error('tenantId is required');
  if (!records.length) return { count: 0 };

  const now = new Date().toISOString();
  const dbRows = records.map((r, idx) => ({
    tenant_id: tenantId,
    organization_id: organizationId || null,
    client_code: r.client_code?.trim() || `CLI-${Date.now()}-${idx + 1}`,
    client_name: r.client_name.trim(),
    address: r.address?.trim() || 'Facility Address',
    billing_address: r.billing_address?.trim() || r.address?.trim() || 'Facility Address',
    gst_tax_number: r.gst_tax_number?.trim() || null,
    contact_person: r.contact_person?.trim() || 'Quality Manager',
    email: r.email?.trim() || null,
    phone: r.phone?.trim() || null,
    status: r.status || 'ACTIVE',
    created_at: now,
    updated_at: now,
  }));

  const CHUNK_SIZE = 50;
  for (let i = 0; i < dbRows.length; i += CHUNK_SIZE) {
    const chunk = dbRows.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from('clients').insert(chunk);
    if (error) {
      console.error('Supabase bulk insert error:', error);
      throw new Error(`Bulk insert failed: ${error.message}`);
    }
  }

  return { count: dbRows.length };
}
