// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Executes a lightweight query to automatically verify live database connectivity.
 */
export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  latencyMs: number;
  error?: string;
}> {
  const start = performance.now();
  try {
    const { error } = await supabase
      .from('config_lists')
      .select('id', { count: 'exact', head: true });

    if (error) throw error;

    return {
      connected: true,
      latencyMs: Math.round(performance.now() - start),
    };
  } catch (err: any) {
    return {
      connected: false,
      latencyMs: Math.round(performance.now() - start),
      error: err.message || 'Database unreachable',
    };
  }
}
