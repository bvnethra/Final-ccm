// src/super-admin/services/platformConfigService.ts
import { supabase } from '../../lib/supabaseClient';
import type { ConfigItem } from '../types/superAdmin';
import { logPlatformEvent } from './platformAuditService';

export async function fetchConfigByCategory(category: string): Promise<ConfigItem[]> {
  const { data, error } = await supabase
    .from('config_lists')
    .select('*')
    .eq('category', category)
    .order('sort_order', { ascending: true })
    .order('label', { ascending: true });

  if (error) throw new Error(`Fetch config for ${category} failed: ${error.message}`);

  return (data || []).map((c: any) => ({
    id: c.id,
    category: c.category,
    code: c.code,
    label: c.label,
    description: c.description,
    isActive: c.is_active,
    sortOrder: c.sort_order,
    metadata: c.metadata,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));
}

export async function fetchAllConfigCategories(): Promise<{ category: string; count: number }[]> {
  const { data, error } = await supabase
    .from('config_lists')
    .select('category');

  if (error) throw new Error(`Fetch config categories failed: ${error.message}`);

  const counts: Record<string, number> = {};
  for (const item of data || []) {
    counts[item.category] = (counts[item.category] || 0) + 1;
  }

  return Object.entries(counts).map(([category, count]) => ({ category, count }));
}

export async function createConfigItem(payload: {
  category: string;
  code: string;
  label: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<ConfigItem> {
  const code = payload.code.trim().toUpperCase().replace(/\s+/g, '_');
  
  const { data, error } = await supabase
    .from('config_lists')
    .insert([{
      category: payload.category,
      code,
      label: payload.label.trim(),
      description: payload.description?.trim() || null,
      sort_order: payload.sortOrder || 0,
      is_active: payload.isActive !== undefined ? payload.isActive : true,
    }])
    .select()
    .single();

  if (error) throw new Error(`Create config item failed: ${error.message}`);

  await logPlatformEvent({
    action: 'CONFIG_ITEM_CREATED',
    referenceId: `${payload.category}:${code}`,
    newState: data,
    reason: `Added new dynamic configuration item to category '${payload.category}'`,
  });

  return {
    id: data.id,
    category: data.category,
    code: data.code,
    label: data.label,
    description: data.description,
    isActive: data.is_active,
    sortOrder: data.sort_order,
    metadata: data.metadata,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateConfigItem(id: string, updates: Partial<ConfigItem>): Promise<void> {
  // Fetch existing state for audit
  const { data: previous } = await supabase.from('config_lists').select('*').eq('id', id).single();

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.label !== undefined) updatePayload.label = updates.label;
  if (updates.description !== undefined) updatePayload.description = updates.description;
  if (updates.sortOrder !== undefined) updatePayload.sort_order = updates.sortOrder;
  if (updates.isActive !== undefined) updatePayload.is_active = updates.isActive;

  const { error } = await supabase
    .from('config_lists')
    .update(updatePayload)
    .eq('id', id);

  if (error) throw new Error(`Update config item failed: ${error.message}`);

  await logPlatformEvent({
    action: 'CONFIG_ITEM_UPDATED',
    referenceId: id,
    previousState: previous,
    newState: { ...previous, ...updatePayload },
    reason: `Updated dynamic configuration item in category '${previous?.category}'`,
  });
}

export async function deleteConfigItem(id: string): Promise<void> {
  const { data: previous } = await supabase.from('config_lists').select('*').eq('id', id).single();

  const { error } = await supabase.from('config_lists').delete().eq('id', id);
  if (error) throw new Error(`Delete config item failed: ${error.message}`);

  await logPlatformEvent({
    action: 'CONFIG_ITEM_DELETED',
    referenceId: id,
    previousState: previous,
    reason: `Deleted configuration item from category '${previous?.category}'`,
  });
}
