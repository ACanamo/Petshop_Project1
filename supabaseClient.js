/**
 * PETCHUP — SUPABASE CLIENT & CLOUD SYNC LAYER
 * Connects the web application directly to Supabase Postgres & Auth.
 * Includes graceful offline/localStorage fallback.
 */

(function () {
  "use strict";

  // Pre-configured default project URL provided by owner
  const DEFAULT_SUPABASE_URL = "https://yezlwgljhiqzfghltfkw.supabase.co";
  const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_jJPz6AjY8_s48wmyslkM0g_amgs9piY";
  const PRIMARY_ADMIN_EMAIL = "canamoaries13@gmail.com";

  const STORAGE_KEY_URL = "petchup_sb_url";
  const STORAGE_KEY_KEY = "petchup_sb_anon_key";

  let clientInstance = null;

  function getSavedUrl() {
    return localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_SUPABASE_URL;
  }

  function getSavedKey() {
    return localStorage.getItem(STORAGE_KEY_KEY) || DEFAULT_SUPABASE_ANON_KEY;
  }

  function initClient() {
    const url = getSavedUrl();
    const key = getSavedKey();

    if (window.supabase && url && key) {
      try {
        clientInstance = window.supabase.createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true
          }
        });
        console.log("🐾 Supabase client initialized for:", url);
        return clientInstance;
      } catch (err) {
        console.warn("Failed to initialize Supabase client:", err);
        clientInstance = null;
        return null;
      }
    }
    clientInstance = null;
    return null;
  }

  // Initialize on script evaluation
  initClient();

  const PetchupSupabase = {
    /**
     * Check whether Supabase credentials have been configured
     */
    isConfigured: function () {
      const url = getSavedUrl();
      const key = getSavedKey();
      return Boolean(url && key && url.includes(".supabase.co") && key.length > 20);
    },

    /**
     * Get underlying Supabase client instance
     */
    getClient: function () {
      if (!clientInstance) {
        initClient();
      }
      return clientInstance;
    },

    /**
     * Retrieve stored credentials
     */
    getCredentials: function () {
      return {
        url: getSavedUrl(),
        key: getSavedKey()
      };
    },

    /**
     * Save new credentials from Admin UI and re-initialize
     */
    saveCredentials: function (url, key) {
      const cleanUrl = (url || "").trim();
      const cleanKey = (key || "").trim();

      if (cleanUrl) {
        localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
      } else {
        localStorage.removeItem(STORAGE_KEY_URL);
      }

      if (cleanKey) {
        localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
      } else {
        localStorage.removeItem(STORAGE_KEY_KEY);
      }

      initClient();
      window.dispatchEvent(
        new CustomEvent("petchup:supabase-config-updated", {
          detail: { isConfigured: this.isConfigured() }
        })
      );
      return this.isConfigured();
    },

    /**
     * Clear custom credentials
     */
    clearCredentials: function () {
      localStorage.removeItem(STORAGE_KEY_URL);
      localStorage.removeItem(STORAGE_KEY_KEY);
      clientInstance = null;
      window.dispatchEvent(
        new CustomEvent("petchup:supabase-config-updated", {
          detail: { isConfigured: false }
        })
      );
    },

    /**
     * Test live connection to Supabase database
     */
    testConnection: async function () {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: "Supabase Anon Public Key is missing. Please enter your Anon Key from your Supabase Dashboard (Project Settings -> API)."
        };
      }

      const client = this.getClient();
      if (!client) {
        return {
          success: false,
          error: "Could not create Supabase client instance. Ensure the Supabase JS library is loaded."
        };
      }

      try {
        // Query products table
        const { data, count, error } = await client
          .from("products")
          .select("id, name", { count: "exact" })
          .limit(1);

        if (error) {
          // If table doesn't exist yet, guide user to run schema
          if (
            error.code === "42P01" ||
            error.code === "PGRST205" ||
            error.message.includes("does not exist") ||
            error.message.includes("relation \"public.products\"") ||
            error.message.includes("Could not find the table")
          ) {
            return {
              success: false,
              tableMissing: true,
              error: "Connected to Supabase, but tables are not created yet! Copy and run 'supabase_schema.sql' in your Supabase SQL Editor."
            };
          }
          return {
            success: false,
            error: error.message || "Database query failed"
          };
        }

        return {
          success: true,
          productCount: count !== null ? count : (data ? data.length : 0),
          message: `Successfully connected to Supabase! Found ${count !== null ? count : (data ? data.length : 0)} products.`
        };
      } catch (err) {
        return {
          success: false,
          error: err.message || "Network connection error while contacting Supabase"
        };
      }
    },

    /**
     * Fetch products from Supabase
     */
    fetchProducts: async function () {
      const client = this.getClient();
      if (!client || !this.isConfigured()) return null;

      try {
        const { data, error } = await client
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Supabase fetchProducts error:", error);
          return null;
        }

        if (!data || data.length === 0) return [];

        // Normalize DB fields to application schema
        return data.map((row) => ({
          id: row.id,
          sku: row.sku || ("SKU-" + row.id.toUpperCase()),
          name: row.name,
          category: row.category,
          categoryLabel: row.category_label,
          pet: row.pet,
          price: parseFloat(row.price),
          originalPrice: parseFloat(row.original_price || 0),
          stockQuantity: typeof row.stock_quantity === "number" ? row.stock_quantity : (row.in_stock ? 10 : 0),
          imageUrl: row.image_url || "",
          unit: row.unit || "",
          rating: parseFloat(row.rating || 5),
          ratingCount: parseInt(row.rating_count || 1, 10),
          popularity: parseInt(row.popularity || 90, 10),
          img: row.img || "🐾",
          badge: row.badge || "",
          badgeClass: row.badge_class || "",
          tintClass: row.tint_class || "bg-yellow-tint",
          desc: row.desc || "",
          inStock: Boolean(row.in_stock),
          priceHistory: Array.isArray(row.price_history) ? row.price_history : []
        }));
      } catch (err) {
        console.warn("Error in fetchProducts:", err);
        return null;
      }
    },

    /**
     * Upload product image to Supabase Storage
     */
    uploadProductImage: async function (file) {
      const client = this.getClient();
      if (!client || !this.isConfigured()) {
        return { success: false, error: "Supabase not connected." };
      }

      try {
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `products/${Date.now()}_${cleanName}`;

        const { data, error } = await client.storage
          .from("product-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true
          });

        if (error) {
          console.warn("Storage upload error:", error);
          // If storage bucket is missing, provide a friendly explanation
          return { success: false, error: error.message };
        }

        const { data: pubData } = client.storage
          .from("product-images")
          .getPublicUrl(filePath);

        const pubUrl = pubData ? pubData.publicUrl : "";
        return {
          success: true,
          url: pubUrl,
          publicUrl: pubUrl
        };
      } catch (e) {
        return { success: false, error: e.message || "Failed to upload image" };
      }
    },

    /**
     * Upsert single product to Supabase with price history logging
     */
    upsertProduct: async function (product) {
      const client = this.getClient();
      if (!client || !this.isConfigured()) return null;

      // Handle price history logging
      let priceHistory = Array.isArray(product.priceHistory) ? [...product.priceHistory] : [];
      const currentPrice = parseFloat(product.price);
      const lastEntry = priceHistory[priceHistory.length - 1];

      if (!lastEntry || parseFloat(lastEntry.price) !== currentPrice) {
        priceHistory.push({
          price: currentPrice,
          changed_at: new Date().toISOString(),
          note: product.priceNote || (lastEntry ? "Price adjusted" : "Initial price")
        });
      }

      const row = {
        id: product.id,
        sku: product.sku || ("SKU-" + product.id.toUpperCase()),
        name: product.name,
        category: product.category,
        category_label: product.categoryLabel,
        pet: product.pet || "all",
        price: currentPrice,
        original_price: parseFloat(product.originalPrice) || 0,
        stock_quantity: parseInt(product.stockQuantity, 10) || 0,
        in_stock: (parseInt(product.stockQuantity, 10) > 0) && (product.inStock !== false),
        image_url: product.imageUrl || "",
        unit: product.unit || "",
        rating: product.rating || 5,
        rating_count: product.ratingCount || 1,
        popularity: product.popularity || 90,
        img: product.img || "🐾",
        badge: product.badge || "",
        badge_class: product.badgeClass || "",
        tint_class: product.tintClass || "bg-yellow-tint",
        desc: product.desc || "",
        price_history: priceHistory,
        updated_at: new Date().toISOString()
      };

      try {
        const { data, error } = await client.from("products").upsert(row).select();
        if (error) {
          console.warn("Supabase upsertProduct error:", error);
          return null;
        }
        return data ? data[0] : row;
      } catch (err) {
        console.warn("Error in upsertProduct:", err);
        return null;
      }
    },

    /**
     * Delete product from Supabase
     */
    deleteProduct: async function (id) {
      const client = this.getClient();
      if (!client || !this.isConfigured()) return false;

      try {
        const { error } = await client.from("products").delete().eq("id", id);
        if (error) {
          console.warn("Supabase deleteProduct error:", error);
          return false;
        }
        return true;
      } catch (err) {
        console.warn("Error in deleteProduct:", err);
        return false;
      }
    },

    /**
     * Fetch announcements from Supabase
     */
    fetchAnnouncements: async function () {
      const client = this.getClient();
      if (!client || !this.isConfigured()) return null;

      try {
        const { data, error } = await client
          .from("announcements")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Supabase fetchAnnouncements error:", error);
          return null;
        }

        if (!data) return [];

        return data.map((row) => ({
          id: row.id,
          pill: row.pill,
          title: row.title || "",
          text: row.text || row.message || "",
          link: row.link || "shop.html",
          linkText: row.link_text || "Shop Deals →",
          startDate: row.start_date || "",
          endDate: row.end_date || "",
          isActive: Boolean(row.is_active),
          createdAt: (row.created_at || "").split("T")[0]
        }));
      } catch (err) {
        console.warn("Error in fetchAnnouncements:", err);
        return null;
      }
    },

    /**
     * Check if an announcement is currently live based on schedule
     */
    isAnnouncementLive: function (ann) {
      if (!ann || !ann.isActive) return false;
      const today = new Date().toISOString().split("T")[0];
      if (ann.startDate && today < ann.startDate) return false;
      if (ann.endDate && today > ann.endDate) return false;
      return true;
    },

    /**
     * Upsert single announcement to Supabase with scheduling
     */
    upsertAnnouncement: async function (ann) {
      const client = this.getClient();
      if (!client || !this.isConfigured()) return null;

      const row = {
        id: ann.id,
        pill: ann.pill || "📢 ANNOUNCEMENT",
        title: ann.title || "",
        text: ann.text || ann.message || "",
        link: ann.link || "shop.html",
        link_text: ann.linkText || "Shop Deals →",
        start_date: ann.startDate || null,
        end_date: ann.endDate || null,
        is_active: Boolean(ann.isActive),
        updated_at: new Date().toISOString()
      };

      try {
        const { data, error } = await client.from("announcements").upsert(row).select();
        if (error) {
          console.warn("Supabase upsertAnnouncement error:", error);
          return null;
        }
        return data ? data[0] : row;
      } catch (err) {
        console.warn("Error in upsertAnnouncement:", err);
        return null;
      }
    },

    /**
     * Delete announcement from Supabase
     */
    deleteAnnouncement: async function (id) {
      const client = this.getClient();
      if (!client || !this.isConfigured()) return false;

      try {
        const { error } = await client.from("announcements").delete().eq("id", id);
        if (error) {
          console.warn("Supabase deleteAnnouncement error:", error);
          return false;
        }
        return true;
      } catch (err) {
        console.warn("Error in deleteAnnouncement:", err);
        return false;
      }
    },

    /**
     * Create order in Supabase
     */
    createOrder: async function (order) {
      const client = this.getClient();
      if (!client || !this.isConfigured()) return null;

      let customerId = order.customerId || null;
      if (!customerId) {
        try {
          const userRes = await client.auth?.getUser ? await client.auth.getUser() : null;
          if (userRes?.data?.user?.id) {
            customerId = userRes.data.user.id;
          }
        } catch (_) {}
      }

      const orderRow = {
        id: order.id || ("ord-" + Date.now()),
        customer_id: customerId,
        customer_name: order.customerName || "Guest Pet Parent",
        customer_email: order.customerEmail || "",
        pet_name: order.petName || "",
        items: order.items || [],
        item_count: (order.items || []).reduce((sum, it) => sum + (it.qty || 1), 0),
        subtotal: order.subtotal || 0,
        discount_code: order.discountCode || "",
        discount_amount: order.discountAmount || 0,
        total: order.total || 0,
        status: order.status || "pending",
        created_at: order.createdAt || new Date().toISOString()
      };

      try {
        const { data, error } = await client.from("orders").insert(orderRow).select();
        if (error) {
          console.warn("Supabase createOrder error:", error);
          return null;
        }
        return data ? data[0] : orderRow;
      } catch (err) {
        console.warn("Error creating order in Supabase:", err);
        return null;
      }
    },

    /**
     * Fetch all orders from Supabase (for Admin)
     */
    fetchOrders: async function () {
      const client = this.getClient();
      if (!client || !this.isConfigured()) return [];

      try {
        const { data, error } = await client
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Supabase fetchOrders error:", error);
          return [];
        }
        return data || [];
      } catch (err) {
        console.warn("Error fetching orders from Supabase:", err);
        return [];
      }
    },

    /**
     * Fetch orders for a specific customer
     */
    fetchCustomerOrders: async function (email, userId = null) {
      const client = this.getClient();
      if (!client || !this.isConfigured()) return [];

      try {
        let query = client.from("orders").select("*").order("created_at", { ascending: false });

        if (userId && email) {
          query = query.or(`customer_id.eq.${userId},customer_email.eq.${email}`);
        } else if (userId) {
          query = query.eq("customer_id", userId);
        } else if (email) {
          query = query.eq("customer_email", email);
        } else {
          return [];
        }

        const { data, error } = await query;
        if (error) {
          console.warn("Supabase fetchCustomerOrders error:", error);
          return [];
        }
        return data || [];
      } catch (err) {
        console.warn("Error fetching customer orders:", err);
        return [];
      }
    },

    /**
     * Update order status in Supabase (Admin)
     */
    updateOrderStatus: async function (orderId, newStatus) {
      const client = this.getClient();
      if (!client || !this.isConfigured()) return null;

      try {
        const { data, error } = await client
          .from("orders")
          .update({ status: newStatus })
          .eq("id", orderId)
          .select();

        if (error) {
          console.warn("Supabase updateOrderStatus error:", error);
          return null;
        }
        return data ? data[0] : { id: orderId, status: newStatus };
      } catch (err) {
        console.warn("Error updating order status in Supabase:", err);
        return null;
      }
    },

    /**
     * Delete order from Supabase (Admin)
     */
    deleteOrder: async function (orderId) {
      const client = this.getClient();
      if (!client || !this.isConfigured()) return false;

      try {
        const { error } = await client.from("orders").delete().eq("id", orderId);
        if (error) {
          console.warn("Supabase deleteOrder error:", error);
          return false;
        }
        return true;
      } catch (err) {
        console.warn("Error deleting order in Supabase:", err);
        return false;
      }
    },

    /**
     * Push current local products and announcements to Supabase in 1 click
     */
    syncLocalToCloud: async function (localProducts, localAnnouncements) {
      const client = this.getClient();
      if (!client || !this.isConfigured()) {
        return { success: false, error: "Supabase is not configured yet." };
      }

      try {
        let productsSynced = 0;
        let announcementsSynced = 0;

        if (Array.isArray(localProducts) && localProducts.length > 0) {
          const productRows = localProducts.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            category_label: p.categoryLabel,
            pet: p.pet,
            price: p.price,
            original_price: p.originalPrice || 0,
            unit: p.unit || "",
            rating: p.rating || 5,
            rating_count: p.ratingCount || 1,
            popularity: p.popularity || 90,
            img: p.img || "🐾",
            badge: p.badge || "",
            badge_class: p.badgeClass || "",
            tint_class: p.tintClass || "bg-yellow-tint",
            desc: p.desc || "",
            in_stock: p.inStock !== false
          }));

          const { error: pErr } = await client.from("products").upsert(productRows);
          if (pErr) throw pErr;
          productsSynced = productRows.length;
        }

        if (Array.isArray(localAnnouncements) && localAnnouncements.length > 0) {
          const annRows = localAnnouncements.map((a) => ({
            id: a.id,
            pill: a.pill,
            text: a.text,
            link: a.link || "shop.html",
            link_text: a.linkText || "Shop Deals →",
            is_active: Boolean(a.isActive)
          }));

          const { error: aErr } = await client.from("announcements").upsert(annRows);
          if (aErr) throw aErr;
          announcementsSynced = annRows.length;
        }

        return {
          success: true,
          productsSynced,
          announcementsSynced,
          message: `Successfully synced ${productsSynced} products and ${announcementsSynced} announcements to Supabase!`
        };
      } catch (err) {
        return {
          success: false,
          error: err.message || "Failed to push data to Supabase"
        };
      }
    },

    /* --- SUPABASE AUTHENTICATION & RBAC API --- */
    /**
     * Verify if a user is an administrator
     */
    isUserAdmin: async function (user) {
      if (!user) return false;
      const userEmail = (user.email || "").toLowerCase();
      if (userEmail === PRIMARY_ADMIN_EMAIL.toLowerCase()) return true;

      const client = this.getClient();
      if (!client) return false;

      try {
        const { data } = await client
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        return data?.role === "admin";
      } catch (err) {
        return false;
      }
    },

    /**
     * Send password reset email
     */
    sendPasswordResetEmail: async function (email) {
      const client = this.getClient();
      if (!client || !this.isConfigured()) {
        return { success: false, error: "Supabase is not configured." };
      }

      try {
        const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: window.location.origin + window.location.pathname + "?mode=reset"
        });

        if (error) return { success: false, error: error.message };
        return { success: true, message: "Password reset link sent to your email!" };
      } catch (err) {
        return { success: false, error: err.message || "Failed to send reset email." };
      }
    },

    /**
     * Update user password (from password reset link)
     */
    updatePassword: async function (newPassword) {
      const client = this.getClient();
      if (!client || !this.isConfigured()) {
        return { success: false, error: "Supabase is not configured." };
      }

      try {
        const { data, error } = await client.auth.updateUser({
          password: newPassword
        });

        if (error) return { success: false, error: error.message };
        return { success: true, user: data.user };
      } catch (err) {
        return { success: false, error: err.message || "Failed to update password." };
      }
    },

    /**
     * Streamlined Sign-Up: Name, Email, Password
     */
    signUpCustomer: async function ({ email, password, name, petName = "", petType = "dog", petEmoji = "🐶" }) {
      const client = this.getClient();
      if (!client || !this.isConfigured()) {
        return { success: false, error: "Supabase credentials are not configured yet." };
      }

      try {
        const cleanEmail = email.trim().toLowerCase();
        const cleanName = name.trim();
        const isAdminEmail = cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase();

        const { data, error } = await client.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              full_name: cleanName,
              name: cleanName,
              role: isAdminEmail ? "admin" : "customer",
              pet_name: petName.trim(),
              pet_type: petType,
              pet_emoji: petEmoji,
              member_tier: isAdminEmail ? "Store Administrator" : "VIP Paw Member"
            }
          }
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (!data || !data.user) {
          return { success: false, error: "No user account was returned by Supabase." };
        }

        const customer = {
          id: data.user.id,
          name: cleanName,
          email: cleanEmail,
          role: isAdminEmail ? "admin" : "customer",
          petName: petName.trim(),
          petType: petType,
          petEmoji: petEmoji,
          memberTier: isAdminEmail ? "Store Administrator" : "VIP Paw Member",
          hasSeenWelcomeDiscount: false,
          firstDiscountCode: "FIRSTPAW20"
        };

        // Sync to profiles table
        try {
          await client.from("profiles").upsert({
            id: data.user.id,
            name: customer.name,
            email: customer.email,
            role: customer.role,
            pet_name: customer.petName,
            pet_type: customer.petType,
            pet_emoji: customer.petEmoji,
            member_tier: customer.memberTier
          });
        } catch (dbErr) {
          console.warn("Could not insert into profiles table:", dbErr);
        }

        const emailConfirmationRequired = data.user && !data.session;

        return {
          success: true,
          customer: customer,
          session: data.session,
          emailConfirmationRequired: emailConfirmationRequired
        };
      } catch (err) {
        return { success: false, error: err.message || "Sign up failed." };
      }
    },

    /**
     * Sign in existing user (Customer or Admin)
     */
    signInCustomer: async function (email, password) {
      const client = this.getClient();
      if (!client || !this.isConfigured()) {
        return { success: false, error: "Supabase credentials are not configured yet." };
      }

      try {
        const cleanEmail = email.trim().toLowerCase();
        const { data, error } = await client.auth.signInWithPassword({
          email: cleanEmail,
          password: password
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (!data || !data.user) {
          return { success: false, error: "Authentication failed. No user returned." };
        }

        const meta = data.user.user_metadata || {};
        let role = cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase() ? "admin" : (meta.role || "customer");

        let customer = {
          id: data.user.id,
          name: meta.full_name || meta.name || data.user.email.split("@")[0],
          email: data.user.email,
          role: role,
          petName: meta.pet_name || "",
          petType: meta.pet_type || "dog",
          petEmoji: meta.pet_emoji || "🐶",
          memberTier: meta.member_tier || (role === "admin" ? "Store Administrator" : "VIP Paw Member"),
          hasSeenWelcomeDiscount: true,
          firstDiscountCode: "FIRSTPAW20"
        };

        // Fetch fresh profile from profiles table
        try {
          const { data: profile } = await client
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .maybeSingle();

          if (profile) {
            customer.name = profile.name || customer.name;
            customer.role = profile.role || customer.role;
            customer.petName = profile.pet_name || customer.petName;
            customer.petType = profile.pet_type || customer.petType;
            customer.petEmoji = profile.pet_emoji || customer.petEmoji;
            customer.memberTier = profile.member_tier || customer.memberTier;
          }
        } catch (dbErr) {
          // Metadata fallback
        }

        return {
          success: true,
          customer: customer,
          isAdmin: customer.role === "admin" || cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase(),
          session: data.session
        };
      } catch (err) {
        return { success: false, error: err.message || "Sign in failed." };
      }
    },

    /**
     * Sign out active user
     */
    signOutCustomer: async function () {
      const client = this.getClient();
      if (!client || !this.isConfigured()) return { success: true };

      try {
        await client.auth.signOut();
        return { success: true };
      } catch (err) {
        console.warn("Error signing out from Supabase:", err);
        return { success: false, error: err.message };
      }
    },

    /**
     * Retrieve active session user and role
     */
    getActiveSessionCustomer: async function () {
      const client = this.getClient();
      if (!client || !this.isConfigured()) return null;

      try {
        const { data } = await client.auth.getSession();
        if (!data || !data.session || !data.session.user) return null;

        const user = data.session.user;
        const userEmail = (user.email || "").toLowerCase();
        const meta = user.user_metadata || {};
        let role = userEmail === PRIMARY_ADMIN_EMAIL.toLowerCase() ? "admin" : (meta.role || "customer");

        let customer = {
          id: user.id,
          name: meta.full_name || meta.name || userEmail.split("@")[0],
          email: user.email,
          role: role,
          petName: meta.pet_name || "",
          petType: meta.pet_type || "dog",
          petEmoji: meta.pet_emoji || "🐶",
          memberTier: meta.member_tier || (role === "admin" ? "Store Administrator" : "VIP Paw Member"),
          hasSeenWelcomeDiscount: true,
          firstDiscountCode: "FIRSTPAW20"
        };

        try {
          const { data: profile } = await client
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          if (profile) {
            customer.name = profile.name || customer.name;
            customer.role = profile.role || customer.role;
            customer.petName = profile.pet_name || customer.petName;
            customer.petType = profile.pet_type || customer.petType;
            customer.petEmoji = profile.pet_emoji || customer.petEmoji;
            customer.memberTier = profile.member_tier || customer.memberTier;
          }
        } catch (dbErr) {
          // Fallback
        }

        return customer;
      } catch (err) {
        console.warn("Error getting Supabase session:", err);
        return null;
      }
    },

    /**
     * Subscribe to auth changes
     */
    onAuthStateChange: function (callback) {
      const client = this.getClient();
      if (!client || !this.isConfigured()) return null;
      return client.auth.onAuthStateChange(callback);
    }
  };

  // Expose to window
  window.PetchupSupabase = PetchupSupabase;
})();
