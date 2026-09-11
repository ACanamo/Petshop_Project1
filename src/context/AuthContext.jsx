import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isConfigured, PRIMARY_ADMIN_EMAIL } from '../lib/supabase';

const AuthContext = createContext();

const STORAGE_KEY_CUSTOMER = "petchup_current_customer";
const STORAGE_KEY_CUSTOMERS = "petchup_registered_customers";

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

  const isPrimaryAdmin = email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
  const role = isPrimaryAdmin || profile?.role === 'admin' || appRole === 'admin'
    ? 'admin'
    : 'user';

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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (isConfigured()) return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOMER);
      return stored ? JSON.parse(stored) : null;
    } catch (_) {
      return null;
    }
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);

  const isAdmin = Boolean(
    user && (user.role === 'admin' || (user.email && user.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()))
  );

  // Restore Supabase Session on mount
  useEffect(() => {
    if (!isConfigured()) return;

    let active = true;

    async function setAuthenticatedUser(authUser) {
      const customer = await buildCustomer(authUser);
      if (!active) return;
      setUser(customer);
      localStorage.setItem(STORAGE_KEY_CUSTOMER, JSON.stringify(customer));
    }

    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await setAuthenticatedUser(session.user);
        } else if (active) {
          setUser(null);
          localStorage.removeItem(STORAGE_KEY_CUSTOMER);
        }
      } catch (err) {
        console.warn("Could not retrieve session:", err);
      }
    }

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY_CUSTOMER);
      } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
        window.setTimeout(() => setAuthenticatedUser(session.user), 0);
      }
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  const openAuth = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const closeAuth = () => {
    setIsAuthOpen(false);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      if (isConfigured() && email.includes('@')) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        });

        if (error) {
          setLoading(false);
          return { success: false, error: error.message };
        }

        const authUser = data.user;
        if (!authUser) {
          setLoading(false);
          return { success: false, error: "No user was returned after sign in." };
        }
        const customerObj = await buildCustomer(authUser);

        setUser(customerObj);
        localStorage.setItem(STORAGE_KEY_CUSTOMER, JSON.stringify(customerObj));
        setLoading(false);
        closeAuth();
        return { success: true, user: customerObj };
      }

      // Offline / Local fallback
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
      const list = stored ? JSON.parse(stored) : [];
      const query = email.trim().toLowerCase();
      const found = list.find(c => c.email?.toLowerCase() === query || c.name?.toLowerCase() === query);

      if (!found) {
        setLoading(false);
        return { success: false, error: "Account not found. Please create an account!" };
      }

      setUser(found);
      localStorage.setItem(STORAGE_KEY_CUSTOMER, JSON.stringify(found));
      setLoading(false);
      closeAuth();
      return { success: true, user: found };
    } catch (err) {
      setLoading(false);
      return { success: false, error: err.message || "Failed to sign in" };
    }
  };

  const register = async ({ name, email, password, petName, petType }) => {
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
        const customerObj = {
          id: authUser ? authUser.id : ("cust-" + Date.now()),
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role: email.trim().toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase() ? "admin" : "user",
          petName: petName || "Buddy",
          petType: petType || "dog",
          petEmoji: petEmoji,
          memberTier: "VIP Paw Member"
        };

        setUser(customerObj);
        localStorage.setItem(STORAGE_KEY_CUSTOMER, JSON.stringify(customerObj));
        setLoading(false);
        closeAuth();
        return { success: true, user: customerObj };
      }

      // Local fallback
      const customerObj = {
        id: "cust-" + Date.now(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: email.trim().toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase() ? "admin" : "user",
        petName: petName || "Buddy",
        petType: petType || "dog",
        petEmoji: petEmoji,
        memberTier: "VIP Paw Member"
      };

      const stored = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(customerObj);
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(list));
      localStorage.setItem(STORAGE_KEY_CUSTOMER, JSON.stringify(customerObj));

      setUser(customerObj);
      setLoading(false);
      closeAuth();
      return { success: true, user: customerObj };
    } catch (err) {
      setLoading(false);
      return { success: false, error: err.message || "Registration failed" };
    }
  };

  const logout = async () => {
    if (isConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (_) {}
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_CUSTOMER);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin,
      isAuthOpen,
      authMode,
      loading,
      openAuth,
      closeAuth,
      login,
      register,
      logout
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
