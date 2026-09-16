import { supabase, isConfigured } from './supabase';

// Fire-and-forget error logging via log_client_error() (see
// supabase_schema.sql section 15) — a minimal, self-hosted stand-in for a
// real error-tracking service. Background failures (a cart sync, a product
// refresh, a session restore) used to only ever reach console.warn, which
// is invisible in production unless a developer happens to have devtools
// open at that exact moment. Always logs to the console too, and never
// throws — a failure to log an error must not become a second error.
//
// Goes through the RPC rather than a direct table insert — the table has no
// INSERT policy at all, only log_client_error() (SECURITY DEFINER) can
// write to it, since an unbounded free-text insert open to anon was a real
// abuse vector (unlike place_order, which is bounded by real stock/prices).
// The function also derives user_id from the caller's own session, so there
// is no longer an `extra.userId` to pass — a caller could never claim to be
// someone else here.
export function logError(context, error) {
  const message = (error && error.message) || String(error);
  console.error(`[${context}]`, error);

  if (!isConfigured()) return;

  // Only send client logs to PostgreSQL if the user is authenticated
  // (the RPC is restricted to authenticated users to prevent unauthenticated log spam).
  supabase.auth.getSession().then(({ data }) => {
    if (!data?.session) return;

    supabase.rpc('log_client_error', {
      p_context: context,
      p_message: message,
      p_stack: (error && error.stack) || null
    }).then(({ error: rpcError }) => {
      if (rpcError) console.warn("Could not write to error_logs:", rpcError);
    }).catch(() => {});
  }).catch(() => {});
}

