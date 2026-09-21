// application/src/services/masterDataService.ts
import { supabase } from '../lib/supabaseClient';
import type { Client, ItemMaster } from '../types/domain';

export async function getClients(tenantId: string, organizationId?: string): Promise<Client[]> {
  if (!tenantId) throw new Error('tenantId is required for data boundary');

  let query = supabase
    .from('clients')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'ACTIVE')
    .order('client_name', { ascending: true });

  if (organizationId) {
    query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getItemMasters(tenantId: string, organizationId?: string): Promise<ItemMaster[]> {
  if (!tenantId) throw new Error('tenantId is required for data boundary');

  let query = supabase
    .from('item_masters')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'ACTIVE')
    .order('item_name', { ascending: true });

  if (organizationId) {
    query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}
