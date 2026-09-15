import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

// 30 minutes of no mouse/keyboard/scroll/touch activity signs the user out.
// Non-rendering, mirrors the RouteEffects pattern already used in App.jsx.
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];

export default function IdleSessionWatcher() {
  const { user, logout } = useAuth();
  const { showToast } = useCart();
  const timerRef = useRef(null);

  useEffect(() => {
    if (!user) {
      window.clearTimeout(timerRef.current);
      return;
    }

    const resetTimer = () => {
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(async () => {
        await logout();
        showToast("You were signed out after a period of inactivity.");
      }, IDLE_TIMEOUT_MS);
    };

    resetTimer();
    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, resetTimer));

    return () => {
      window.clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [user, logout, showToast]);

  return null;
}
