// Small helpers for the repeated "read/write JSON in localStorage, fail
// quietly if it's unavailable or the value is bad" pattern used across the
// context providers (CartContext, AuthContext, OrdersContext, StoreContext).

export function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {
    // Storage may be full or unavailable (e.g. private browsing) — fail
    // silently, matching the previous per-file behavior.
  }
}
