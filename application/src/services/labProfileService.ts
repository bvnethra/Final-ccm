// application/src/services/labProfileService.ts
import { supabase } from '../lib/supabaseClient';
import type { LabIssuerProfile } from '../types/domain';

export const DEFAULT_LAB_PROFILE: LabIssuerProfile = {
  name: '',
  division: '',
  logo_text: '',
  logo_tagline: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  state_code: '',
  pin: '',
  phones: '',
  mobile: '',
  email: '',
  gstin: '',
  udyam: '',
  bank_name: '',
  account_no: '',
  branch_ifsc: '',
};

const STORAGE_KEY_PREFIX = 'ccm_tenant_lab_profile_';

export async function getLabProfile(tenantId?: string): Promise<LabIssuerProfile> {
  const tid = tenantId || 'default';

  // 1. Check remote system_configurations
  try {
    if (tenantId) {
      const { data, error } = await supabase
        .from('system_configurations')
        .select('config_value')
        .eq('tenant_id', tenantId)
        .eq('config_key', 'LAB_ISSUER_PROFILE')
        .maybeSingle();

      if (!error && data?.config_value) {
        return {
          ...DEFAULT_LAB_PROFILE,
          ...(data.config_value as Partial<LabIssuerProfile>),
        };
      }
    }
  } catch (_err) {
    // Fallback to local
  }

  // 2. Check localStorage
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${tid}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_LAB_PROFILE,
        ...parsed,
      };
    }
  } catch (_err) {
    // Ignore error
  }

  // 3. Fallback to organization details in Supabase for dynamic tenant profile
  if (tenantId) {
    try {
      const { data: org, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (!error && org) {
        return {
          ...DEFAULT_LAB_PROFILE,
          name: org.name || '',
          logo_text: org.code || org.name || '',
          address1: org.address || '',
          phones: org.phone || '',
          email: org.email || '',
        };
      }
    } catch (_err) {
      // Ignore error
    }
  }

  return DEFAULT_LAB_PROFILE;
}

export async function updateLabProfile(
  tenantId: string,
  updates: Partial<LabIssuerProfile>
): Promise<LabIssuerProfile> {
  const current = await getLabProfile(tenantId);
  const merged: LabIssuerProfile = {
    ...current,
    ...updates,
    tenant_id: tenantId,
  };

  // 1. Save locally
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${tenantId}`, JSON.stringify(merged));
  } catch (err) {
    console.error('Failed to save lab profile to localStorage:', err);
  }

  // 2. Persist remotely
  try {
    await supabase.from('system_configurations').upsert(
      {
        tenant_id: tenantId,
        config_key: 'LAB_ISSUER_PROFILE',
        config_value: merged,
        description: 'Dynamic Lab Issuer Profile & Brand Logo Configuration',
      },
      { onConflict: 'tenant_id,config_key' }
    );
  } catch (_err) {
    // Non-blocking fallback
  }

  return merged;
}

export async function resetLabProfile(tenantId: string): Promise<LabIssuerProfile> {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${tenantId}`);
    await supabase
      .from('system_configurations')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('config_key', 'LAB_ISSUER_PROFILE');
  } catch (_err) {
    // Fallback
  }
  return DEFAULT_LAB_PROFILE;
}
