import { createClient } from '@supabase/supabase-js';

// Standard environment configuration via Vite (.env file)
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://yezlwgljhiqzfghltfkw.supabase.co";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_jJPz6AjY8_s48wmyslkM0g_amgs9piY";

// Compatibility getters
export function getSavedUrl() {
  return SUPABASE_URL;
}

export function getSavedKey() {
  return SUPABASE_ANON_KEY;
}

export function isConfigured() {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_URL.includes(".supabase.co") &&
    SUPABASE_ANON_KEY.length > 20
  );
}

// Single authoritative Supabase client instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

/**
 * Health check utility to verify database connectivity from the admin panel
 */
export async function testConnection() {
  if (!isConfigured()) {
    return { ok: false, message: "Supabase credentials are not configured." };
  }

  const startTime = performance.now();
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    const latency = Math.round(performance.now() - startTime);

    if (error) {
      return { ok: false, message: `Database query failed: ${error.message} (${latency}ms)` };
    }

    return {
      ok: true,
      message: `Connected successfully to Supabase! (Latency: ${latency}ms, sample count: ${data ? data.length : 0})`
    };
  } catch (err) {
    return { ok: false, message: `Connection error: ${err.message || String(err)}` };
  }
}
