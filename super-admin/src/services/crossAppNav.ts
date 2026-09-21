// super-admin/src/services/crossAppNav.ts
import { supabase } from '../lib/supabaseClient';

/**
 * Seamlessly navigates from Super Admin (port 5173) to the Operational Application (port 5174),
 * passing the active Supabase authentication session tokens for instant SSO handoff.
 */
export async function openOperationalApp(path = '', tenantId?: string): Promise<void> {
  const targetBaseUrl = import.meta.env.VITE_OPERATIONAL_APP_URL || 'http://localhost:5174';
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = new URL(path || '/', targetBaseUrl);

  if (tenantId) {
    url.searchParams.set('tenantId', tenantId);
  }

  if (session?.access_token && session?.refresh_token) {
    url.searchParams.set('access_token', session.access_token);
    url.searchParams.set('refresh_token', session.refresh_token);
  }

  window.open(url.toString(), '_blank');
}
