import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { readJSON, writeJSON } from '../lib/storage';
import { getPasswordStrength, MIN_PASSWORD_SCORE } from '../lib/passwordStrength';
import { logError } from '../lib/errorLog';

import { clearSensitiveCustomerStorage } from '../lib/sessionManager';

const AuthContext = createContext();

const STORAGE_KEY_CUSTOMER = "petchup_current_customer";
const STORAGE_KEY_CUSTOMERS = "petchup_registered_customers";
const LOGIN_ATTEMPTS_KEY = "petchup_login_attempts";
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

async function buildCustomer(authUser) {
  const email = authUser.email || "";
  const userMeta = authUser.user_metadata || {};
  const appRole = authUser.app_metadata?.role;
  let profile = null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('name, role, pet_name, pet_type, pet_emoji, member_tier')
      .eq('id', authUser.id)
      .maybeSingle();
    if (!error) profile = data;
  } catch (_) {
    // Auth still works if the optional profile row has not been created yet.
  }

  // Admin status is strictly derived from the database profiles.role column
  // (or the JWT's app_metadata role, which only the Supabase service role can issue).
  // No client-side email-string backdoor is permitted.
  const role = profile?.role === 'admin' || appRole === 'admin' ? 'admin' : 'customer';

  return {
    id: authUser.id,
    name: profile?.name || userMeta.full_name || userMeta.name || email.split('@')[0],
    email,
    role,
    petName: profile?.pet_name || userMeta.pet_name || "Buddy",
    petType: profile?.pet_type || userMeta.pet_type || "dog",
    petEmoji: profile?.pet_emoji || userMeta.pet_emoji || "🐶",
    memberTier: profile?.member_tier || "VIP Paw Member"
  };
}

// Client-side login-attempt lockout, keyed by lowercased email. This is a
// low-effort deterrent (a cleared localStorage resets it), not real
// server-side rate limiting — but it applies uniformly wherever login() is
// called, including the separate admin login form in AdminPage.jsx.
function getLoginLockout(emailKey) {
  const attempts = readJSON(LOGIN_ATTEMPTS_KEY, {});
  const entry = attempts[emailKey];
  if (entry && entry.lockedUntil && entry.lockedUntil > Date.now()) {
    return Math.ceil((entry.lockedUntil - Date.now()) / 1000);
  }
  return 0;
}

function recordFailedLogin(emailKey) {
  const attempts = readJSON(LOGIN_ATTEMPTS_KEY, {});
  const entry = attempts[emailKey] || { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
    entry.count = 0;
  }
  attempts[emailKey] = entry;
  writeJSON(LOGIN_ATTEMPTS_KEY, attempts);
}

function clearLoginAttempts(emailKey) {
  const attempts = readJSON(LOGIN_ATTEMPTS_KEY, {});
  if (attempts[emailKey]) {
    delete attempts[emailKey];
    writeJSON(LOGIN_ATTEMPTS_KEY, attempts);
  }
}

// The lockout counter should only track actual credential guesses — not
// e.g. "email not confirmed," which a correct password still triggers
// every time until the user clicks their confirmation link.
function isCredentialError(error) {
  if (!error) return true;
  if (error.code === 'email_not_confirmed') return false;
  if (/email not confirmed/i.test(error.message || '')) return false;
  return true;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (isConfigured()) return null;
    return readJSON(STORAGE_KEY_CUSTOMER, null);
  });

  const [loading, setLoading] = useState(false);
  const [sessionGeneration, setSessionGeneration] = useState(1);

  // Distinguishes a sign-out the user clicked ("Sign Out" button, via
  // logout() below) from one Supabase itself triggered — e.g. its
  // server-side inactivity timeout or session time-boxing (configured in
  // the Supabase dashboard under Authentication > Sessions). Only the
  // latter should surface an explanatory toast.
  const isManualSignOutRef = useRef(false);
  const [sessionExpiredAt, setSessionExpiredAt] = useState(null);

  const isAdmin = Boolean(user && user.role === 'admin');

  // Restore Supabase Session on mount
  useEffect(() => {
    if (!isConfigured()) return;

    let active = true;

    async function setAuthenticatedUser(authUser) {
      const customer = await buildCustomer(authUser);
      if (!active) return;
      setUser(customer);
      setSessionGeneration(g => g + 1);
      writeJSON(STORAGE_KEY_CUSTOMER, customer);
    }

    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await setAuthenticatedUser(session.user);
        } else if (active) {
          setUser(null);
          clearSensitiveCustomerStorage();
        }
      } catch (err) {
        logError('AuthContext.checkSession', err);
      }
    }

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        if (!isManualSignOutRef.current) {
          // Supabase ended this session on its own (inactivity timeout,
          // time-boxed session, or token expiry) rather than the user
          // clicking "Sign Out" — let the UI explain why.
          setSessionExpiredAt(Date.now());
        }
        setUser(null);
        setSessionGeneration(g => g + 1);
        clearSensitiveCustomerStorage();
      } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
        window.setTimeout(() => setAuthenticatedUser(session.user), 0);
      }
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const emailKey = email.trim().toLowerCase();
    const lockedSeconds = getLoginLockout(emailKey);
    if (lockedSeconds > 0) {
      return { success: false, error: `Too many failed attempts. Try again in ${lockedSeconds}s.` };
    }

    setLoading(true);
    try {
      if (isConfigured() && email.includes('@')) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        });

        if (error) {
          if (isCredentialError(error)) recordFailedLogin(emailKey);
          setLoading(false);
          return { success: false, error: error.message };
        }

        const authUser = data.user;
        if (!authUser) {
          recordFailedLogin(emailKey);
          setLoading(false);
          return { success: false, error: "No user was returned after sign in." };
        }
        const customerObj = await buildCustomer(authUser);

        clearLoginAttempts(emailKey);
        setUser(customerObj);
        writeJSON(STORAGE_KEY_CUSTOMER, customerObj);
        setLoading(false);
        return { success: true, user: customerObj };
      }

      // Offline / Local fallback
      const list = readJSON(STORAGE_KEY_CUSTOMERS, []);
      const query = email.trim().toLowerCase();
      const found = list.find(c => c.email?.toLowerCase() === query || c.name?.toLowerCase() === query);

      if (!found) {
        recordFailedLogin(emailKey);
        setLoading(false);
        return { success: false, error: "Account not found. Please create an account!" };
      }

      clearLoginAttempts(emailKey);
      setUser(found);
      writeJSON(STORAGE_KEY_CUSTOMER, found);
      setLoading(false);
      return { success: true, user: found };
    } catch (err) {
      recordFailedLogin(emailKey);
      setLoading(false);
      return { success: false, error: err.message || "Failed to sign in" };
    }
  };

  const register = async ({ name, email, password, petName, petType }) => {
    // Defense-in-depth: LoginPage already blocks submission of a weak
    // password via the strength meter, but guard here too in case
    // register() is ever called some other way.
    if (getPasswordStrength(password).score < MIN_PASSWORD_SCORE) {
      return { success: false, error: "Please choose a stronger password (8+ characters, with a number or mixed case)." };
    }

    setLoading(true);
    try {
      const petEmoji = petType === 'cat' ? '🐱' : petType === 'bird' ? '🦜' : '🐶';

      if (isConfigured()) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password: password.trim(),
          options: {
            data: {
              name: name.trim(),
              full_name: name.trim(),
              pet_name: petName || "Buddy",
              pet_type: petType || "dog",
              pet_emoji: petEmoji
            }
          }
        });

        if (error) {
          setLoading(false);
          return { success: false, error: error.message };
        }

        const authUser = data.user;
        if (!data.session) {
          setLoading(false);
          return { success: true, requiresEmailConfirmation: true };
        }
        // A brand-new signup is always 'user' — handle_new_user() in
        // supabase_schema.sql no longer auto-promotes any email, so there's
        // nothing to look up here. (The one existing admin was seeded once
        // via a bootstrap UPDATE, not by this signup path.)
        const customerObj = {
          id: authUser ? authUser.id : ("cust-" + Date.now()),
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role: "customer",
          petName: petName || "Buddy",
          petType: petType || "dog",
          petEmoji: petEmoji,
          memberTier: "VIP Paw Member"
        };

        setUser(customerObj);
        writeJSON(STORAGE_KEY_CUSTOMER, customerObj);
        setLoading(false);
        return { success: true, user: customerObj };
      }

      // Local fallback for offline/demo registration
      const customerObj = {
        id: "cust-" + Date.now(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: "customer",
        petName: petName || "Buddy",
        petType: petType || "dog",
        petEmoji: petEmoji,
        memberTier: "VIP Paw Member"
      };

      const list = readJSON(STORAGE_KEY_CUSTOMERS, []);
      list.unshift(customerObj);
      writeJSON(STORAGE_KEY_CUSTOMERS, list);
      writeJSON(STORAGE_KEY_CUSTOMER, customerObj);

      setUser(customerObj);
      setLoading(false);
      return { success: true, user: customerObj };
    } catch (err) {
      setLoading(false);
      return { success: false, error: err.message || "Registration failed" };
    }
  };

  const logout = async () => {
    if (isConfigured()) {
      isManualSignOutRef.current = true;
      try {
        await supabase.auth.signOut();
      } catch (_) {}
      isManualSignOutRef.current = false;
    }
    setUser(null);
    setSessionGeneration(g => g + 1);
    clearSensitiveCustomerStorage();
  };

  // Sends a password-reset email. Always resolves success-shaped (when
  // Supabase is configured) regardless of whether the email is registered,
  // so the UI can't be used to enumerate accounts.
  const resetPassword = async (email) => {
    if (!isConfigured()) {
      return { success: false, error: "Password reset needs an online account — this demo is running in offline mode." };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + '/reset-password'
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || "Could not send the reset email." };
    }
  };

  // Used by ResetPasswordPage once Supabase has established a recovery
  // session from the emailed link.
  const updatePassword = async (newPassword) => {
    if (!isConfigured()) {
      return { success: false, error: "Password reset needs an online account — this demo is running in offline mode." };
    }
    if (getPasswordStrength(newPassword).score < MIN_PASSWORD_SCORE) {
      return { success: false, error: "Please choose a stronger password (8+ characters, with a number or mixed case)." };
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword.trim() });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || "Could not update the password." };
    }
  };

  const resendConfirmation = async (email) => {
    if (!isConfigured()) {
      return { success: false, error: "Email confirmation isn't used in offline mode." };
    }
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase() });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || "Could not resend the confirmation email." };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin,
      loading,
      login,
      register,
      logout,
      resetPassword,
      updatePassword,
      resendConfirmation,
      sessionExpiredAt,
      sessionGeneration
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
