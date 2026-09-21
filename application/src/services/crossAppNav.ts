// application/src/services/crossAppNav.ts
import { supabase } from '../lib/supabaseClient';

/**
 * Seamlessly navigates from Operational App (port 5174) to Super Admin Portal (port 5173),
 * passing the active Supabase authentication session tokens for instant SSO handoff.
 */
export async function openSuperAdminApp(path = ''): Promise<void> {
  const targetBaseUrl = import.meta.env.VITE_SUPER_ADMIN_URL || 'http://localhost:5173';
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = new URL(path || '/', targetBaseUrl);

  if (session?.access_token && session?.refresh_token) {
    url.searchParams.set('access_token', session.access_token);
    url.searchParams.set('refresh_token', session.refresh_token);
  }

  window.open(url.toString(), '_blank');
}
