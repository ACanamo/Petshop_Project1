/**
 * PETCHUP — SESSION ISOLATION & STORAGE PURGE UTILITY
 *
 * Ensures customer data, cached orders, invoices, and cart attempts
 * are securely purged on sign-out, session expiration, and account switching.
 */

export function clearSensitiveCustomerStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const sensitivePrefixes = [
    'petchup_current_customer',
    'petchup_orders',
    'petchup_cart',
    'petchup_active_discount'
  ];

  try {
    // 1. Purge sensitive keys in localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && sensitivePrefixes.some(prefix => key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    }

    // 2. Purge sensitive attempt keys in sessionStorage
    if (window.sessionStorage) {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith('petchup_attempt_') || key.startsWith('petchup_checkout_'))) {
          sessionStorage.removeItem(key);
        }
      }
    }

    // 3. Broadcast global session cleared event across components
    window.dispatchEvent(new CustomEvent('petchup_session_cleared'));
  } catch (_) {}
}

export function getUserOrderStorageKey(userId) {
  return userId ? `petchup_orders_${userId}` : 'petchup_orders_guest';
}
