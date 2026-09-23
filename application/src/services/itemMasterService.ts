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

export function formatTccItemCode(seq: number): string {
  if (seq >= 1000) {
    return `TCC-MAS-${seq}`;
  }
  return `TCC-MAS-${String(seq).padStart(3, '0')}`;
}

export function deriveItemCode(
  itemName?: string,
  rangeMax?: number | string,
  measurementRange?: string
): string {
  const name = (itemName || '').trim();
  const rangeStr = (measurementRange || '').trim();

  // 1. Determine Range Suffix
  let rangeSuffix = '';
  if (
    rangeMax !== undefined &&
    rangeMax !== null &&
    rangeMax !== '' &&
    !isNaN(Number(rangeMax)) &&
    Number(rangeMax) > 0
  ) {
    rangeSuffix = String(Number(rangeMax));
  } else {
    // Check measurementRange first, then name
    const targets = [rangeStr, name].filter(Boolean);
    for (const target of targets) {
      if (target === 'ALL RANGE' || target === 'Standard Range') continue;
      const rangeMatch = target.match(
        /(?:(?:\d+(?:\.\d+)?)\s*(?:-|–|to|\*)\s*(\d+(?:\.\d+)?)|(?:upto\s*[-–]?\s*(\d+(?:\.\d+)?)))/i
      );
      if (rangeMatch) {
        rangeSuffix = String(Number(rangeMatch[1] || rangeMatch[2]));
        break;
      }
      const numMatches = target.match(/\d+(?:\.\d+)?/g);
      if (numMatches && numMatches.length > 0) {
        const nums = numMatches.map(Number).filter((n) => !isNaN(n) && n > 0);
        if (nums.length > 0) {
          rangeSuffix = String(Math.max(...nums));
          break;
        }
      }
    }
  }

  // 2. Determine Instrument Acronym
  // Remove parenthesized content
  let cleanedName = name.replace(/\([^)]*\)/g, ' ');
  // Remove explicit ranges like 0-50mm or 0 to 50 mm
  cleanedName = cleanedName.replace(
    /(?:\d+(?:\.\d+)?)\s*(?:-|–|to|\*)\s*(?:\d+(?:\.\d+)?)\s*(?:mm|cm|m|in|bar|psi|kpa|mpa|°c|°f|k|kg|g|mg|n|nm|v|mv|kv|a|ma|ω|hz|khz|rpm|db)?/gi,
    ' '
  );
  // Remove standalone units
  cleanedName = cleanedName.replace(
    /\b(?:mm|cm|m|in|bar|psi|kpa|mpa|°c|°f|k|kg|g|mg|n|nm|v|mv|kv|a|ma|ω|hz|khz|rpm|db)\b/gi,
    ' '
  );
  // Normalize compound phrases
  cleanedName = cleanedName.replace(/MEASURINGTAPE/gi, 'MEASURING TAPE');
  cleanedName = cleanedName.replace(/BOREDIAL/gi, 'BORE DIAL');
  // Strip non-alphanumeric
  cleanedName = cleanedName.replace(/[^a-zA-Z0-9\s]/g, ' ');

  const allWords = cleanedName.split(/\s+/).filter((w) => w.length > 0);

  const STOP_WORDS = new Set(['and', 'with', 'without', 'or', 'for', 'of', 'the', 'in', 'all', 'range', 'go', 'nogo', 'upto']);
  const filteredWords: string[] = [];
  for (let i = 0; i < allWords.length; i++) {
    const w = allWords[i];
    if (STOP_WORDS.has(w.toLowerCase())) continue;
    if (/^\d+$/.test(w)) {
      if (i + 1 < allWords.length && /^[a-zA-Z]/.test(allWords[i + 1])) {
        filteredWords.push(w);
      }
    } else {
      filteredWords.push(w);
    }
  }

  // Secondary filter: If there are 3+ words and the first word is a modifier (e.g. Digital Vernier Caliper),
  // extract initials from core metrology instrument words (Vernier Caliper -> VC)
  const MODIFIERS = new Set(['digital', 'electronic', 'analog', 'standard', 'precision', 'portable']);
  let targetWords = filteredWords;
  if (filteredWords.length >= 3 && MODIFIERS.has(filteredWords[0].toLowerCase())) {
    const withoutMod = filteredWords.filter((w) => !MODIFIERS.has(w.toLowerCase()));
    if (withoutMod.length >= 2) {
      targetWords = withoutMod;
    }
  }

  let acronym = '';
  if (targetWords.length >= 2) {
    // Take digit or first letter of each word
    acronym = targetWords.map((w) => (/^\d+$/.test(w) ? w : w[0].toUpperCase())).join('');
  } else if (targetWords.length === 1) {
    const w = targetWords[0].toUpperCase();
    if (w.length <= 3) {
      acronym = w;
    } else {
      acronym = w.slice(0, 3);
    }
  } else {
    acronym = 'ITM';
  }

  // 3. Combine Acronym with Range Suffix
  if (rangeSuffix) {
    return `${acronym}-${rangeSuffix}`;
  }
  return acronym;
}

export function generateItemCode(
  sequenceOrName?: number | string,
  rangeMax?: number | string,
  measurementRange?: string
): string {
  if (typeof sequenceOrName === 'number' && sequenceOrName > 0) {
    return formatTccItemCode(sequenceOrName);
  }
  if (typeof sequenceOrName === 'string' && sequenceOrName.trim()) {
    return deriveItemCode(sequenceOrName, rangeMax, measurementRange);
  }
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `ITM-${year}-${randomSuffix}`;
}

export async function getNextTccItemCode(tenantId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('item_masters')
      .select('item_code')
      .eq('tenant_id', tenantId)
      .ilike('item_code', 'TCC-MAS-%');

    if (!error && data && data.length > 0) {
      let maxNum = 0;
      for (const row of data) {
        const match = (row.item_code || '').match(/TCC\s*-\s*MAS\s*-\s*(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      return formatTccItemCode(maxNum + 1);
    }
  } catch (_err) {
    // fallback
  }
  return 'TCC-MAS-001';
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
      .order('item_code', { ascending: true });

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

  const derivedCode = deriveItemCode(
    formData.item_name,
    formData.range_max,
    `${formData.range_min} - ${formData.range_max} ${formData.range_unit?.trim()}`
  );
  const itemCode = formData.item_code?.trim() || derivedCode;
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

  // Calculate starting sequence for auto-generated codes
  let currentSeq = 0;
  try {
    const { data } = await supabase
      .from('item_masters')
      .select('item_code')
      .eq('tenant_id', tenantId)
      .ilike('item_code', 'TCC-MAS-%');

    if (data && data.length > 0) {
      for (const row of data) {
        const match = (row.item_code || '').match(/TCC\s*-\s*MAS\s*-\s*(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > currentSeq) currentSeq = num;
        }
      }
    }
  } catch (_seqErr) {
    // Fallback starting from 0
  }

  const now = new Date().toISOString();
  const dbRows = records.map((r) => {
    let itemCode = r.item_code?.trim();
    if (!itemCode) {
      const derived = deriveItemCode(r.item_name, undefined, r.measurement_range);
      if (derived && derived !== 'ITM') {
        itemCode = derived;
      } else {
        currentSeq += 1;
        itemCode = formatTccItemCode(currentSeq);
      }
    }

    return {
      tenant_id: tenantId,
      organization_id: organizationId || null,
      item_code: itemCode,
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
    };
  });

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
