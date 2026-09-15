import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

// Non-rendering, mirrors the RouteEffects pattern in App.jsx. Shows a
// toast when Supabase itself ends the session (its server-side inactivity
// timeout or time-boxed session, configured in the Supabase dashboard
// under Authentication > Sessions) rather than the user clicking "Sign
// Out" — see the isManualSignOutRef distinction in AuthContext.jsx.
export default function SessionExpiryNotice() {
  const { sessionExpiredAt } = useAuth();
  const { showToast } = useCart();
  const lastShownRef = useRef(null);

  useEffect(() => {
    if (sessionExpiredAt && sessionExpiredAt !== lastShownRef.current) {
      lastShownRef.current = sessionExpiredAt;
      showToast("You were signed out — your session expired.");
    }
  }, [sessionExpiredAt, showToast]);

  return null;
}
