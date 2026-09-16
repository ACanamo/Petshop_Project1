import { createClient } from '@supabase/supabase-js';

// Falls back to this project's own values so nothing breaks for existing
// deployments, but a different environment (staging, a fork) can now point
// at its own Supabase project via .env instead of editing this file — see
// .env.example. These are the public anon key/URL, safe to ship in client
// code either way (that's what RLS is for); this is a deployability
// improvement, not a secrets fix.
const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://yezlwgljhiqzfghltfkw.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_jJPz6AjY8_s48wmyslkM0g_amgs9piY";
export const PRIMARY_ADMIN_EMAIL = "canamoaries13@gmail.com";

const STORAGE_KEY_URL = "petchup_sb_url";
const STORAGE_KEY_KEY = "petchup_sb_anon_key";

export function getSavedUrl() {
  try {
    return localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_SUPABASE_URL;
  } catch (_) {
    return DEFAULT_SUPABASE_URL;
  }
}

export function getSavedKey() {
  try {
    return localStorage.getItem(STORAGE_KEY_KEY) || DEFAULT_SUPABASE_ANON_KEY;
  } catch (_) {
    return DEFAULT_SUPABASE_ANON_KEY;
  }
}

export function saveCredentials(url, key) {
  if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim());
  if (key) localStorage.setItem(STORAGE_KEY_KEY, key.trim());
}

export function resetCredentials() {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_KEY);
}

export function isConfigured() {
  const url = getSavedUrl();
  const key = getSavedKey();
  return Boolean(url && key && url.includes(".supabase.co") && key.length > 20);
}

export const supabase = createClient(getSavedUrl(), getSavedKey(), {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
