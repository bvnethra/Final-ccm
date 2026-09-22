// application/src/services/labProfileService.ts
import { supabase } from '../lib/supabaseClient';
import type { LabIssuerProfile } from '../types/domain';

export const DEFAULT_LAB_PROFILE: LabIssuerProfile = {
  name: 'TESPA CALIBRATION CENTRE',
  division: 'A Division of TESPA TOOLS PVT LTD',
  logo_text: 'tespa',
  logo_tagline: 'PRECISION & QUALITY',
  address1: 'D-105, First Main Road',
  address2: 'Anna Nagar East',
  city: 'Chennai',
  state: 'Tamil Nadu',
  state_code: '33',
  pin: '600102',
  phones: '044-2663 2191, 2663 1820, 2663 0669',
  mobile: '+91 9445191573',
  email: 'calibration@tespaindia.com',
  gstin: '33AAACT2870N1Z5',
  udyam: 'UDYAM-TN-02-0048127 (Micro)',
  bank_name: 'Indian Bank',
  account_no: '504946658',
  branch_ifsc: 'Padi, Chennai & IDIB000P001',
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
