// application/src/services/itemMasterService.ts
import { supabase } from '../lib/supabaseClient';
import type { ItemMaster, ItemMasterFormData } from '../types/domain';

const ITEMS_STORAGE_PREFIX = 'ccm_tenant_items_';

export const ITEM_METROLOGY_CATEGORIES = [
  'Dimensional Metrology',
  'Thermal & Temperature',
  'Pressure & Vacuum',
  'Electrical & Electronic',
  'Mass, Balances & Weights',
  'Torque & Force',
  'Optical & Photonics',
  'Fluid Flow & Volume',
] as const;

export const COMMON_MEASUREMENT_UNITS = [
  'mm',
  'cm',
  'm',
  'in',
  '°C',
  '°F',
  'K',
  'bar',
  'psi',
  'kPa',
  'MPa',
  'kg',
  'g',
  'mg',
  'N',
  'Nm',
  'V',
  'mV',
  'kV',
  'A',
  'mA',
  'Ω',
  'kΩ',
  'MΩ',
  'Hz',
  'kHz',
  'RPM',
  'dB',
] as const;

export function generateItemCode(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `ITM-${year}-${randomSuffix}`;
}

function getLocalItems(tenantId: string): ItemMaster[] {
  try {
    const raw = localStorage.getItem(`${ITEMS_STORAGE_PREFIX}${tenantId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalItems(tenantId: string, items: ItemMaster[]): void {
  try {
    localStorage.setItem(`${ITEMS_STORAGE_PREFIX}${tenantId}`, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save items locally:', err);
  }
}

// ============================================================================
// Service API Layer
// ============================================================================

export async function getItemMasters(
  tenantId: string,
  organizationId?: string,
  search?: string,
  status?: string,
  category?: string
): Promise<ItemMaster[]> {
  if (!tenantId) throw new Error('tenantId is required for data boundary');

  try {
    let query = supabase
      .from('item_masters')
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
      let filtered = data as ItemMaster[];
      if (category && category !== 'ALL') {
        filtered = filtered.filter((i) => i.item_category === category || i.item_type === category);
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (i) =>
            i.item_name.toLowerCase().includes(q) ||
            i.item_code.toLowerCase().includes(q) ||
            i.item_category?.toLowerCase().includes(q) ||
            i.manufacturer?.toLowerCase().includes(q)
        );
      }
      return filtered;
    }
  } catch (_remoteErr) {
    // Fallback
  }

  let items = getLocalItems(tenantId);
  if (organizationId) {
    items = items.filter((i) => !i.organization_id || i.organization_id === organizationId);
  }
  if (status && status !== 'ALL') {
    items = items.filter((i) => i.status === status);
  }
  if (category && category !== 'ALL') {
    items = items.filter((i) => i.item_category === category || i.item_type === category);
  }
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (i) =>
        i.item_name.toLowerCase().includes(q) ||
        i.item_code.toLowerCase().includes(q) ||
        i.item_category?.toLowerCase().includes(q) ||
        i.manufacturer?.toLowerCase().includes(q)
    );
  }
  return items;
}

export async function getItemMasterById(id: string, tenantId: string): Promise<ItemMaster> {
  if (!id || !tenantId) throw new Error('Item id and tenantId are required');

  try {
    const { data, error } = await supabase
      .from('item_masters')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (!error && data) {
      return data as ItemMaster;
    }
  } catch (_err) {
    // Fallback
  }

  const items = getLocalItems(tenantId);
  const found = items.find((i) => i.id === id);
  if (!found) {
    throw new Error('Item master not found');
  }
  return found;
}

export async function createItemMaster(
  tenantId: string,
  organizationId: string | undefined,
  formData: ItemMasterFormData,
  creator?: { id?: string; name?: string }
): Promise<ItemMaster> {
  if (!tenantId) throw new Error('tenantId is required');

  // Mandatory fields validation
  if (!formData.item_name.trim()) throw new Error('Item name is required');
  if (isNaN(formData.range_min) || formData.range_min === null) {
    throw new Error('Measurement Range Min is required and must be numeric');
  }
  if (isNaN(formData.range_max) || formData.range_max === null) {
    throw new Error('Measurement Range Max is required and must be numeric');
  }
  if (formData.range_min > formData.range_max) {
    throw new Error('Measurement Range Min cannot exceed Range Max');
  }
  if (!formData.range_unit?.trim()) {
    throw new Error('Measurement Range Unit of measure is required');
  }
  if (isNaN(formData.least_count) || formData.least_count === null || formData.least_count <= 0) {
    throw new Error('Least Count is required, must be numeric and greater than zero');
  }
  if (!formData.least_count_unit?.trim()) {
    throw new Error('Least Count unit of measure is required');
  }
  if (isNaN(formData.standard_cost) || formData.standard_cost === null || formData.standard_cost < 0) {
    throw new Error('Standard Cost is required and must be zero or a positive numeric amount');
  }

  const itemCode = formData.item_code?.trim() || generateItemCode();
  const now = new Date().toISOString();
  const formattedRange = `${formData.range_min} - ${formData.range_max} ${formData.range_unit.trim()}`;

  const newItem: ItemMaster = {
    id: crypto.randomUUID(),
    tenant_id: tenantId,
    organization_id: organizationId,
    item_code: itemCode,
    item_name: formData.item_name.trim(),
    item_category: formData.item_category?.trim() || undefined,
    item_type: formData.item_category?.trim() || 'EQUIPMENT',
    manufacturer: formData.manufacturer?.trim() || undefined,
    model: formData.model?.trim() || undefined,
    range_min: Number(formData.range_min),
    range_max: Number(formData.range_max),
    range_unit: formData.range_unit.trim(),
    measurement_range: formattedRange,
    least_count: Number(formData.least_count),
    least_count_unit: formData.least_count_unit.trim(),
    standard_cost: Number(formData.standard_cost),
    calibration_frequency: formData.calibration_frequency ? Number(formData.calibration_frequency) : 12,
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
      .from('item_masters')
      .insert({
        id: newItem.id,
        tenant_id: newItem.tenant_id,
        organization_id: newItem.organization_id || null,
        item_code: newItem.item_code,
        item_name: newItem.item_name,
        item_type: newItem.item_type,
        manufacturer: newItem.manufacturer || null,
        model: newItem.model || null,
        measurement_range: newItem.measurement_range,
        least_count: `${newItem.least_count} ${newItem.least_count_unit}`,
        standard_cost: newItem.standard_cost,
        calibration_frequency: newItem.calibration_frequency,
        status: newItem.status,
      })
      .select()
      .single();

    if (!error && data) {
      return { ...newItem, ...data };
    }
  } catch (_remoteErr) {
    // Local store fallback
  }

  const existing = getLocalItems(tenantId);
  saveLocalItems(tenantId, [newItem, ...existing]);
  return newItem;
}

export async function updateItemMaster(
  id: string,
  tenantId: string,
  formData: Partial<ItemMasterFormData>,
  modifier?: { id?: string; name?: string }
): Promise<ItemMaster> {
  const current = await getItemMasterById(id, tenantId);

  const rangeMin = formData.range_min !== undefined ? Number(formData.range_min) : current.range_min;
  const rangeMax = formData.range_max !== undefined ? Number(formData.range_max) : current.range_max;
  const rangeUnit = formData.range_unit?.trim() || current.range_unit;

  if (rangeMin > rangeMax) {
    throw new Error('Measurement Range Min cannot exceed Range Max');
  }

  const leastCount = formData.least_count !== undefined ? Number(formData.least_count) : current.least_count;
  if (leastCount <= 0) {
    throw new Error('Least Count must be greater than zero');
  }

  const standardCost = formData.standard_cost !== undefined ? Number(formData.standard_cost) : current.standard_cost;
  if (standardCost < 0) {
    throw new Error('Standard Cost must be zero or a positive amount');
  }

  const now = new Date().toISOString();
  const formattedRange = `${rangeMin} - ${rangeMax} ${rangeUnit}`;

  const updatedItem: ItemMaster = {
    ...current,
    item_name: formData.item_name?.trim() ?? current.item_name,
    item_category: formData.item_category !== undefined ? formData.item_category.trim() : current.item_category,
    item_type: formData.item_category !== undefined ? formData.item_category.trim() : current.item_type,
    manufacturer: formData.manufacturer !== undefined ? formData.manufacturer.trim() : current.manufacturer,
    model: formData.model !== undefined ? formData.model.trim() : current.model,
    range_min: rangeMin,
    range_max: rangeMax,
    range_unit: rangeUnit,
    measurement_range: formattedRange,
    least_count: leastCount,
    least_count_unit: formData.least_count_unit?.trim() || current.least_count_unit,
    standard_cost: standardCost,
    calibration_frequency: formData.calibration_frequency !== undefined ? Number(formData.calibration_frequency) : current.calibration_frequency,
    status: formData.status ?? current.status,
    updated_by: modifier?.id,
    updated_by_name: modifier?.name || 'Authorized Operator',
    updated_at: now,
  };

  try {
    await supabase
      .from('item_masters')
      .update({
        item_name: updatedItem.item_name,
        item_type: updatedItem.item_type,
        manufacturer: updatedItem.manufacturer || null,
        model: updatedItem.model || null,
        measurement_range: updatedItem.measurement_range,
        least_count: `${updatedItem.least_count} ${updatedItem.least_count_unit}`,
        standard_cost: updatedItem.standard_cost,
        calibration_frequency: updatedItem.calibration_frequency,
        status: updatedItem.status,
      })
      .eq('id', id)
      .eq('tenant_id', tenantId);
  } catch (_remoteErr) {
    // Ignore remote err
  }

  const items = getLocalItems(tenantId);
  const updatedList = items.map((i) => (i.id === id ? updatedItem : i));
  saveLocalItems(tenantId, updatedList);
  return updatedItem;
}

export async function toggleItemMasterStatus(
  id: string,
  tenantId: string,
  modifier?: { id?: string; name?: string }
): Promise<ItemMaster> {
  const current = await getItemMasterById(id, tenantId);
  const nextStatus = current.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  return updateItemMaster(id, tenantId, { status: nextStatus }, modifier);
}

export async function createItemMastersBulk(
  tenantId: string,
  organizationId: string | undefined,
  records: Array<{
    item_name: string;
    item_code?: string;
    item_type?: string;
    manufacturer?: string;
    model?: string;
    serial_number?: string;
    measurement_range?: string;
    least_count?: string;
    standard_cost?: number;
    calibration_frequency?: number;
    status?: 'ACTIVE' | 'INACTIVE';
  }>
): Promise<{ count: number }> {
  if (!tenantId) throw new Error('tenantId is required');
  if (!records.length) return { count: 0 };

  const now = new Date().toISOString();
  const dbRows = records.map((r, idx) => ({
    tenant_id: tenantId,
    organization_id: organizationId || null,
    item_code: r.item_code?.trim() || `ITM-${Date.now()}-${idx + 1}`,
    item_name: r.item_name.trim(),
    item_type: r.item_type?.trim() || 'EQUIPMENT',
    manufacturer: r.manufacturer?.trim() || null,
    model: r.model?.trim() || null,
    serial_number: r.serial_number?.trim() || null,
    measurement_range: r.measurement_range?.trim() || 'Standard Range',
    least_count: r.least_count?.trim() || '0.01 mm',
    standard_cost: typeof r.standard_cost === 'number' ? r.standard_cost : 0,
    calibration_frequency: typeof r.calibration_frequency === 'number' ? r.calibration_frequency : 365,
    status: r.status || 'ACTIVE',
    created_at: now,
    updated_at: now,
  }));

  const CHUNK_SIZE = 50;
  for (let i = 0; i < dbRows.length; i += CHUNK_SIZE) {
    const chunk = dbRows.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from('item_masters').insert(chunk);
    if (error) {
      console.error('Supabase bulk insert error:', error);
      throw new Error(`Bulk insert failed: ${error.message}`);
    }
  }

  return { count: dbRows.length };
}
