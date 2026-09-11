/**
 * PETCHUP — CENTRAL STORE DATA LAYER
 * Manages products catalog, announcements, auth state, and localStorage sync.
 */

(function () {
  "use strict";

  const STORAGE_KEY_PRODUCTS = "petchup_products";
  const STORAGE_KEY_ANNOUNCEMENTS = "petchup_announcements";
  const STORAGE_KEY_AUTH = "petchup_auth";
  const STORAGE_KEY_CURRENT_CUSTOMER = "petchup_current_customer";
  const STORAGE_KEY_CUSTOMERS = "petchup_registered_customers";
  const STORAGE_KEY_DISCOUNT = "petchup_active_discount";
  const STORAGE_KEY_ORDERS = "petchup_orders";
  const MIGRATION_KEY_CLEAN_ORDERS = "petchup_orders_blank_init_v2";

  // Ensure store starts 100% blank with no legacy transactions or hardcoded seed data
  try {
    if (!localStorage.getItem(MIGRATION_KEY_CLEAN_ORDERS)) {
      localStorage.removeItem(STORAGE_KEY_ORDERS);
      localStorage.setItem(MIGRATION_KEY_CLEAN_ORDERS, "true");
    }
  } catch (_) {}

  /* ==========================================================================
     DEFAULT SEED DATA
     ========================================================================== */
  const DEFAULT_PRODUCTS = [
    {
      id: "p1",
      name: "Salmon & Sweet Potato Crunchies (12lb)",
      category: "feeds",
      categoryLabel: "Feeds & Dry Food",
      pet: "dog",
      price: 34.99,
      originalPrice: 41.99,
      rating: 5,
      ratingCount: 142,
      popularity: 98,
      img: "🥩",
      imageUrl: "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&w=600&q=80",
      badge: "Top Pick",
      badgeClass: "badge-bestseller",
      tintClass: "bg-yellow-tint",
      desc: "Oven-baked whole feeds with ancient grains and omega-3s for energy and shiny coats.",
      inStock: true
    },
    {
      id: "p2",
      name: "Pasture Duck Stew Cans (Pack of 6)",
      category: "feeds",
      categoryLabel: "Canned Wet Feeds",
      pet: "dog",
      price: 22.50,
      originalPrice: 0,
      unit: "(₱3.75/can)",
      rating: 5,
      ratingCount: 98,
      popularity: 95,
      img: "🥫",
      imageUrl: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=600&q=80",
      badge: "New Recipe",
      badgeClass: "badge-new",
      tintClass: "bg-coral-tint",
      desc: "Slow-braised duck in 18-hour marrow bone broth. Zero gums or fillers.",
      inStock: true
    },
    {
      id: "p3-cat",
      name: "Wild Pacific Salmon & Kelp Pâté (Pack of 6)",
      category: "feeds",
      categoryLabel: "Canned Wet Feeds",
      pet: "cat",
      price: 19.99,
      originalPrice: 24.00,
      rating: 4.9,
      ratingCount: 112,
      popularity: 92,
      img: "🐟",
      imageUrl: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80",
      badge: "Feline Favorite",
      badgeClass: "badge-popular",
      tintClass: "bg-teal-tint",
      desc: "Smooth, high-moisture salmon purée with taurine and kelp for finicky eaters.",
      inStock: true
    },
    {
      id: "p3",
      name: "Rainbow Weave No-Pull Leash & Collar Set",
      category: "accessories",
      categoryLabel: "Accessories",
      pet: "dog",
      price: 24.99,
      originalPrice: 29.99,
      rating: 5,
      ratingCount: 216,
      popularity: 96,
      img: "🌈",
      imageUrl: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=600&q=80",
      badge: "Fan Favorite",
      badgeClass: "badge-popular",
      tintClass: "bg-teal-tint",
      desc: "High-tensile climbing rope weave with padded handle and corrosion-proof hardware.",
      inStock: true
    },
    {
      id: "p4",
      name: "Cloud-Comfort Donut Calming Bed",
      category: "accessories",
      categoryLabel: "Accessories",
      pet: "all",
      price: 42.00,
      originalPrice: 54.00,
      rating: 5,
      ratingCount: 312,
      popularity: 99,
      img: "🛏️",
      imageUrl: "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=600&q=80",
      badge: "Ultra Soft",
      badgeClass: "badge-bestseller",
      tintClass: "bg-orange-tint",
      desc: "Raised rim creates cozy security to relieve pet anxiety. Machine washable cover.",
      inStock: true
    },
    {
      id: "p5",
      name: "Squishy Squeak Donut & Bone Bundle",
      category: "accessories",
      categoryLabel: "Toys & Play",
      pet: "dog",
      price: 14.99,
      originalPrice: 19.99,
      rating: 4.8,
      ratingCount: 85,
      popularity: 88,
      img: "🍩",
      imageUrl: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=600&q=80",
      badge: "Super Squeak",
      badgeClass: "badge-fun",
      tintClass: "bg-coral-tint",
      desc: "Double-layer plush with puncture-resistant squeakers that keep squeaking.",
      inStock: true
    },
    {
      id: "p7-cat-collar",
      name: "Velvet-Soft Breakaway Safety Collar",
      category: "accessories",
      categoryLabel: "Accessories",
      pet: "cat",
      price: 14.50,
      originalPrice: 18.00,
      rating: 4.9,
      ratingCount: 64,
      popularity: 87,
      img: "🎀",
      imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80",
      badge: "Safety Quick-Release",
      badgeClass: "badge-health",
      tintClass: "bg-yellow-tint",
      desc: "Gentle elastic breakaway buckle prevents snagging on outdoor adventures.",
      inStock: true
    },
    {
      id: "p6",
      name: "Wild Alaskan Salmon Shiny Coat Oil (16oz)",
      category: "wellness",
      categoryLabel: "Wellness",
      pet: "all",
      price: 18.50,
      originalPrice: 22.00,
      rating: 5,
      ratingCount: 174,
      popularity: 94,
      img: "🐟",
      imageUrl: "https://images.unsplash.com/photo-1608248597359-251f03473950?auto=format&fit=crop&w=600&q=80",
      badge: "Shiny Coat",
      badgeClass: "badge-health",
      tintClass: "bg-teal-tint",
      desc: "Pure cold-pressed salmon oil packed with EPA and DHA for itchy skin and shiny fur.",
      inStock: true
    },
    {
      id: "p8-broth",
      name: "Slow-Simmered Beef Bone Broth Topper (16oz)",
      category: "feeds",
      categoryLabel: "Feeds & Toppers",
      pet: "all",
      price: 12.99,
      originalPrice: 15.99,
      rating: 5,
      ratingCount: 128,
      popularity: 93,
      img: "🍲",
      badge: "Hydration Hit",
      badgeClass: "badge-bestseller",
      tintClass: "bg-coral-tint",
      desc: "Rich collagen elixir simmered for 18 hours. Entices fussy eaters instantly.",
      inStock: true
    },
    {
      id: "p9-kibble-chick",
      name: "Free-Range Chicken & Ancient Grains (10lb)",
      category: "feeds",
      categoryLabel: "Feeds & Dry Food",
      pet: "dog",
      price: 31.50,
      originalPrice: 38.00,
      rating: 4.9,
      ratingCount: 95,
      popularity: 91,
      img: "🍗",
      badge: "Oven Baked",
      badgeClass: "badge-popular",
      tintClass: "bg-yellow-tint",
      desc: "Slow baked with chia seeds, millet, and fresh cage-free chicken.",
      inStock: true
    },
    {
      id: "p10-shampoo",
      name: "Soothing Oatmeal & Honey Dog Wash (16oz)",
      category: "grooming",
      categoryLabel: "Grooming",
      pet: "dog",
      price: 15.99,
      originalPrice: 19.99,
      rating: 4.8,
      ratingCount: 89,
      popularity: 89,
      img: "🧴",
      badge: "Tear-Free",
      badgeClass: "badge-health",
      tintClass: "bg-teal-tint",
      desc: "Plant-based hypoallergenic formula relieves itchy skin and leaves a fresh clean scent.",
      inStock: true
    },
    {
      id: "p11-brush",
      name: "Magic-Release De-Shedding Pet Brush",
      category: "grooming",
      categoryLabel: "Grooming",
      pet: "all",
      price: 16.50,
      originalPrice: 21.00,
      rating: 4.9,
      ratingCount: 153,
      popularity: 90,
      img: "🪮",
      badge: "Easy Clean",
      badgeClass: "badge-popular",
      tintClass: "bg-orange-tint",
      desc: "Removes loose undercoat fur with one-click hair release button. Ergonomic grip.",
      inStock: true
    },
    {
      id: "p12-joint",
      name: "Hip & Joint Glucosamine Chews (90ct)",
      category: "wellness",
      categoryLabel: "Wellness",
      pet: "dog",
      price: 26.99,
      originalPrice: 32.99,
      rating: 5,
      ratingCount: 240,
      popularity: 97,
      img: "🦴",
      badge: "Vet Recommended",
      badgeClass: "badge-health",
      tintClass: "bg-coral-tint",
      desc: "With chondroitin and green-lipped mussel for senior agility and pain-free walks.",
      inStock: true
    },
    {
      id: "p13-balm",
      name: "Organic Shea Butter Paw & Snout Balm",
      category: "grooming",
      categoryLabel: "Grooming",
      pet: "all",
      price: 11.50,
      originalPrice: 14.00,
      rating: 4.9,
      ratingCount: 78,
      popularity: 86,
      img: "🐾",
      badge: "100% Organic",
      badgeClass: "badge-new",
      tintClass: "bg-yellow-tint",
      desc: "Heals dry, cracked paw pads from hot summer sidewalks and snowy winter trails.",
      inStock: true
    },
    {
      id: "p14-catnip",
      name: "Catnip Infused Feather Teaser Wand",
      category: "accessories",
      categoryLabel: "Toys & Play",
      pet: "cat",
      price: 9.99,
      originalPrice: 12.99,
      rating: 4.8,
      ratingCount: 67,
      popularity: 85,
      img: "🪶",
      badge: "Pounce Ready",
      badgeClass: "badge-fun",
      tintClass: "bg-teal-tint",
      desc: "Natural guinea feathers on flexible carbon rod with organic Canadian catnip bell.",
      inStock: true
    },
    {
      id: "p15-treats",
      name: "Freeze-Dried Raw Beef Liver Treats (4oz)",
      category: "feeds",
      categoryLabel: "Treats & Feeds",
      pet: "all",
      price: 13.50,
      originalPrice: 16.50,
      rating: 5,
      ratingCount: 195,
      popularity: 96,
      img: "🥓",
      badge: "High Value",
      badgeClass: "badge-bestseller",
      tintClass: "bg-coral-tint",
      desc: "Single-ingredient USDA beef liver. The ultimate high-value training reward.",
      inStock: true
    }
  ];

  const DEFAULT_ANNOUNCEMENTS = [
    {
      id: "ann-1",
      pill: "Limited offer",
      text: "Get 15% off your order with code FIRSTPAW15 — Dispatched within 24 hours",
      link: "shop.html",
      linkText: "Explore deals",
      isActive: true,
      createdAt: "2026-09-01"
    },
    {
      id: "ann-2",
      pill: "Curator sale",
      text: "Buy 2 get 1 free on single-origin chew bones and salmon bites",
      link: "shop.html?cat=feeds",
      linkText: "Browse feeds",
      isActive: false,
      createdAt: "2026-09-05"
    },
    {
      id: "ann-3",
      pill: "New arrivals",
      text: "Small-batch duck stews and memory foam orthopedic beds now in stock",
      link: "shop.html?cat=accessories",
      linkText: "Explore arrivals",
      isActive: false,
      createdAt: "2026-09-07"
    }
  ];

  const DEFAULT_ORDERS = [];

  /* ==========================================================================
     ENCODING & MOJIBAKE HEALING
     ========================================================================== */
  const PRODUCT_EMOJIS = {
    "p1": "🥩",
    "p2": "🥫",
    "p3-cat": "🐟",
    "p3": "🌈",
    "p4": "🛏️",
    "p5": "🍩",
    "p6": "🐟",
    "p7-cat-collar": "🎀",
    "p8-broth": "🍲",
    "p9-kibble-chick": "🍗",
    "p10-shampoo": "🧴",
    "p11-brush": "🪮",
    "p12-joint": "🦴",
    "p13-cat-tree": "🌳",
    "p13-balm": "🐾",
    "p14-cat-grass": "🌱",
    "p14-catnip": "🪶",
    "p15-dental": "💧",
    "p15-treats": "🥓"
  };

  const CATEGORY_EMOJIS = {
    "feeds": "🥫",
    "accessories": "🎾",
    "grooming": "🛁",
    "wellness": "💊"
  };

  function isCorruptedEmoji(str) {
    if (!str || typeof str !== "string") return true;
    if (str.includes("ð") || str.includes("Ã") || str.includes("\u00F0") || str.includes("ï¸") || str.includes("›")) return true;
    if (str.length > 5 && !str.includes(" ")) return true;
    return false;
  }

  function cleanProductEmoji(str, category, productId) {
    if (productId && PRODUCT_EMOJIS[productId]) {
      if (isCorruptedEmoji(str)) {
        return PRODUCT_EMOJIS[productId];
      }
    }
    if (isCorruptedEmoji(str)) {
      if (category && CATEGORY_EMOJIS[category]) return CATEGORY_EMOJIS[category];
      return "🐾";
    }
    return str;
  }

  function decodeMojibake(str, category, productId) {
    if (productId || category) {
      return cleanProductEmoji(str, category, productId);
    }
    if (isCorruptedEmoji(str)) {
      return cleanProductEmoji(str, category, productId);
    }
    return str || "🐾";
  }

  // Self-heal corrupted localStorage products immediately on load
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY_PRODUCTS) : null;
    if (raw && (raw.includes("ð") || raw.includes("Ã") || raw.includes("\u00F0") || raw.includes("ï¸") || raw.includes("›"))) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const healed = parsed.map((p) => {
          if (p) p.img = cleanProductEmoji(p.img, p.category, p.id);
          return p;
        });
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(healed));
      }
    }
  } catch (e) {}

  const DEFAULT_CUSTOMERS = [];

  /* ==========================================================================
     STORE API IMPLEMENTATION
     ========================================================================== */
  const PetchupStore = {
    decodeMojibake: decodeMojibake,
    cleanProductEmoji: cleanProductEmoji,

    /* --- PRODUCTS API --- */
    getProducts: function () {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_PRODUCTS);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((p) => {
              if (p) {
                p.img = cleanProductEmoji(p.img, p.category, p.id);
                const def = DEFAULT_PRODUCTS.find((d) => d.id === p.id);
                if (def && def.imageUrl && !p.imageUrl) {
                  p.imageUrl = def.imageUrl;
                }
              }
              return p;
            });
          }
        }
      } catch (e) {
        console.warn("Error reading products:", e);
      }
      // Initialize with default products
      this.saveProducts(DEFAULT_PRODUCTS);
      return JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
    },

    saveProducts: function (products) {
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
        window.dispatchEvent(new CustomEvent("petchup:products-updated", { detail: products }));
      } catch (e) {
        console.error("Error saving products:", e);
      }
    },

    getProductById: function (id) {
      return this.getProducts().find((p) => p.id === id) || null;
    },

    addProduct: function (productData) {
      const products = this.getProducts();
      const currentPrice = parseFloat(productData.price) || 9.99;
      const stockQty = typeof productData.stockQuantity === "number" ? productData.stockQuantity : (parseInt(productData.stockQuantity, 10) || 10);
      const newProduct = {
        id: "prod-" + Date.now(),
        sku: productData.sku ? productData.sku.trim().toUpperCase() : ("SKU-" + Date.now().toString().slice(-6)),
        name: productData.name.trim(),
        category: productData.category || "accessories",
        categoryLabel: productData.categoryLabel || this.getCategoryLabel(productData.category),
        pet: productData.pet || "all",
        price: currentPrice,
        originalPrice: parseFloat(productData.originalPrice) || 0,
        stockQuantity: stockQty,
        imageUrl: productData.imageUrl || "",
        unit: productData.unit || "",
        rating: parseFloat(productData.rating) || 5,
        ratingCount: parseInt(productData.ratingCount, 10) || 1,
        popularity: parseInt(productData.popularity, 10) || 90,
        img: productData.img || "🐾",
        badge: productData.badge ? productData.badge.trim() : "",
        badgeClass: productData.badgeClass || this.getBadgeClass(productData.badge),
        tintClass: productData.tintClass || this.getCategoryTint(productData.category),
        desc: productData.desc ? productData.desc.trim() : "Lovingly prepared for happy pets.",
        inStock: (productData.inStock !== false) && (stockQty > 0),
        priceHistory: [{
          price: currentPrice,
          changed_at: new Date().toISOString(),
          note: "Initial product listing"
        }]
      };
      products.unshift(newProduct);
      this.saveProducts(products);
      if (window.PetchupSupabase && window.PetchupSupabase.isConfigured()) {
        window.PetchupSupabase.upsertProduct(newProduct);
      }
      return newProduct;
    },

    updateProduct: function (id, updates) {
      const products = this.getProducts();
      const index = products.findIndex((p) => p.id === id);
      if (index === -1) return null;

      const current = products[index];
      const updated = Object.assign({}, current, updates);

      // Price history tracking
      if (updates.price !== undefined && parseFloat(updates.price) !== parseFloat(current.price)) {
        const history = Array.isArray(current.priceHistory) ? [...current.priceHistory] : [];
        history.push({
          price: parseFloat(updates.price),
          changed_at: new Date().toISOString(),
          note: updates.priceNote || "Price updated by store admin"
        });
        updated.priceHistory = history;
      }

      if (updates.category && !updates.categoryLabel) {
        updated.categoryLabel = this.getCategoryLabel(updates.category);
      }
      if (updates.category && !updates.tintClass) {
        updated.tintClass = this.getCategoryTint(updates.category);
      }
      if (updates.badge && !updates.badgeClass) {
        updated.badgeClass = this.getBadgeClass(updates.badge);
      }
      if (updates.stockQuantity !== undefined) {
        const qty = parseInt(updates.stockQuantity, 10);
        updated.stockQuantity = isNaN(qty) ? 0 : qty;
        if (updated.stockQuantity <= 0) {
          updated.inStock = false;
        }
      }

      products[index] = updated;
      this.saveProducts(products);
      if (window.PetchupSupabase && window.PetchupSupabase.isConfigured()) {
        window.PetchupSupabase.upsertProduct(updated);
      }
      return updated;
    },

    deleteProduct: function (id) {
      const products = this.getProducts();
      const filtered = products.filter((p) => p.id !== id);
      this.saveProducts(filtered);
      if (window.PetchupSupabase && window.PetchupSupabase.isConfigured()) {
        window.PetchupSupabase.deleteProduct(id);
      }
      return filtered;
    },

    resetProducts: function () {
      this.saveProducts(DEFAULT_PRODUCTS);
      return JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
    },

    /* --- ANNOUNCEMENTS API --- */
    getAnnouncements: function () {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_ANNOUNCEMENTS);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((a) => {
              if (a) {
                if (a.pill) a.pill = decodeMojibake(a.pill);
                if (a.title) a.title = decodeMojibake(a.title);
                if (a.text) a.text = decodeMojibake(a.text).replace(/\$([0-9])/g, "₱$1");
              }
              return a;
            });
          }
        }
      } catch (e) {
        console.warn("Error reading announcements:", e);
      }
      return DEFAULT_ANNOUNCEMENTS;
    },

    saveAnnouncements: function (announcements) {
      try {
        localStorage.setItem(STORAGE_KEY_ANNOUNCEMENTS, JSON.stringify(announcements));
        window.dispatchEvent(
          new CustomEvent("petchup:announcements-updated", { detail: announcements })
        );
      } catch (e) {
        console.error("Error saving announcements:", e);
      }
    },

    getActiveAnnouncement: function () {
      const list = this.getAnnouncements();
      return list.find((a) => a.isActive) || null;
    },

    addAnnouncement: function (data) {
      const list = this.getAnnouncements();
      if (data.isActive) {
        list.forEach((a) => (a.isActive = false));
      }
      const newAnn = {
        id: "ann-" + Date.now(),
        pill: data.pill ? data.pill.trim() : "📢 ANNOUNCEMENT",
        text: data.text.trim(),
        link: data.link ? data.link.trim() : "shop.html",
        linkText: data.linkText ? data.linkText.trim() : "Learn More →",
        isActive: Boolean(data.isActive),
        createdAt: new Date().toISOString().split("T")[0]
      };
      list.unshift(newAnn);
      this.saveAnnouncements(list);
      if (window.PetchupSupabase && window.PetchupSupabase.isConfigured()) {
        window.PetchupSupabase.upsertAnnouncement(newAnn);
      }
      return newAnn;
    },

    updateAnnouncement: function (id, updates) {
      const list = this.getAnnouncements();
      const index = list.findIndex((a) => a.id === id);
      if (index === -1) return null;

      if (updates.isActive) {
        list.forEach((a) => {
          if (a.id !== id) a.isActive = false;
        });
      }

      list[index] = Object.assign({}, list[index], updates);
      this.saveAnnouncements(list);
      if (window.PetchupSupabase && window.PetchupSupabase.isConfigured()) {
        window.PetchupSupabase.upsertAnnouncement(list[index]);
      }
      return list[index];
    },

    toggleAnnouncementActive: function (id) {
      const list = this.getAnnouncements();
      const target = list.find((a) => a.id === id);
      if (!target) return null;

      const willBeActive = !target.isActive;
      list.forEach((a) => (a.isActive = false));
      target.isActive = willBeActive;

      this.saveAnnouncements(list);
      if (window.PetchupSupabase && window.PetchupSupabase.isConfigured()) {
        list.forEach((a) => window.PetchupSupabase.upsertAnnouncement(a));
      }
      return target;
    },

    deleteAnnouncement: function (id) {
      const list = this.getAnnouncements();
      const filtered = list.filter((a) => a.id !== id);
      this.saveAnnouncements(filtered);
      if (window.PetchupSupabase && window.PetchupSupabase.isConfigured()) {
        window.PetchupSupabase.deleteAnnouncement(id);
      }
      return filtered;
    },

    resetAnnouncements: function () {
      this.saveAnnouncements(DEFAULT_ANNOUNCEMENTS);
      return JSON.parse(JSON.stringify(DEFAULT_ANNOUNCEMENTS));
    },

    /* --- ADMIN AUTH & ROLE API --- */
    getAuth: function () {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_AUTH);
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.warn("Error reading auth:", e);
      }
      return { role: "user", username: "Customer" };
    },

    setAuth: function (role, username, email) {
      const auth = {
        role: role === "admin" ? "admin" : "user",
        username: username || (role === "admin" ? "Store Administrator" : "Customer"),
        email: email || ""
      };
      try {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(auth));
        window.dispatchEvent(new CustomEvent("petchup:auth-updated", { detail: auth }));
      } catch (e) {
        console.error("Error setting auth:", e);
      }
      return auth;
    },

    isAdmin: function () {
      const auth = this.getAuth();
      if (auth && auth.role === "admin") return true;
      const current = this.getCurrentCustomer();
      if (current) {
        if (current.role === "admin") return true;
        if (current.email && current.email.trim().toLowerCase() === "canamoaries13@gmail.com") return true;
      }
      return false;
    },

    loginAdmin: async function (email, password) {
      if (!email || !password) {
        return { success: false, message: "Please enter your administrator email and password." };
      }

      // OWASP A03/A07: Always require Supabase auth. No offline bypass.
      if (window.PetchupSupabase && window.PetchupSupabase.isConfigured()) {
        const res = await window.PetchupSupabase.signInCustomer(email, password);
        if (!res.success) {
          return { success: false, message: res.error || "Invalid credentials." };
        }

        const isUserAdmin = res.isAdmin || (res.customer.email && res.customer.email.toLowerCase() === "canamoaries13@gmail.com");
        if (!isUserAdmin) {
          await window.PetchupSupabase.signOutCustomer();
          return {
            success: false,
            message: "Access denied. This account is not an authorized administrator."
          };
        }

        res.customer.role = "admin";
        this.setAuth("admin", res.customer.name, res.customer.email);
        this.setCurrentCustomer(res.customer);
        return { success: true, user: res.customer };
      }

      // OWASP A03 FIX: Removed offline/hardcoded email bypass.
      // Admin login requires a live Supabase connection.
      return { success: false, message: "A network connection to Supabase is required to log in as administrator. Please check your internet connection." };
    },

    logout: function () {
      if (window.PetchupSupabase && window.PetchupSupabase.isConfigured()) {
        try {
          window.PetchupSupabase.signOutCustomer();
        } catch (e) {
          console.warn("Error signing out of Supabase:", e);
        }
      }
      try {
        localStorage.removeItem(STORAGE_KEY_CURRENT_CUSTOMER);
      } catch (e) {}
      this.setAuth("user", "Customer", "");
      window.dispatchEvent(
        new CustomEvent("petchup:customer-updated", { detail: null })
      );
      return { role: "user", username: "Customer", email: "" };
    },

    /* --- CUSTOMER / USER AUTH & DISCOUNT API --- */
    getCustomers: function () {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn("Error reading customers:", e);
      }
      this.saveCustomers(DEFAULT_CUSTOMERS);
      return JSON.parse(JSON.stringify(DEFAULT_CUSTOMERS));
    },

    saveCustomers: function (customers) {
      try {
        localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
      } catch (e) {
        console.error("Error saving customers:", e);
      }
    },

    getCurrentCustomer: function () {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_CURRENT_CUSTOMER);
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.warn("Error reading current customer:", e);
      }
      return null;
    },

    setCurrentCustomer: function (customer) {
      try {
        if (customer) {
          const email = (customer.email || "").trim().toLowerCase();
          const isAdmin = email === "canamoaries13@gmail.com" || customer.role === "admin";
          if (isAdmin) {
            customer.role = "admin";
            this.setAuth("admin", customer.name || "Aries (Store Administrator)", customer.email);
          } else {
            this.setAuth("user", customer.name || "Customer", customer.email);
          }
          localStorage.setItem(STORAGE_KEY_CURRENT_CUSTOMER, JSON.stringify(customer));
        } else {
          localStorage.removeItem(STORAGE_KEY_CURRENT_CUSTOMER);
          this.setAuth("user", "Customer", "");
        }
        window.dispatchEvent(
          new CustomEvent("petchup:customer-updated", { detail: customer })
        );
      } catch (e) {
        console.error("Error setting current customer:", e);
      }
      return customer;
    },

    loginCustomer: async function (emailOrName, password) {
      if (!emailOrName) {
        return { success: false, message: "Please enter your email or name." };
      }

      // 1. If Supabase is configured and looks like an email, attempt Supabase Auth
      if (window.PetchupSupabase && window.PetchupSupabase.isConfigured() && emailOrName.includes("@")) {
        try {
          const sbRes = await window.PetchupSupabase.signInCustomer(emailOrName, password);
          if (sbRes.success && sbRes.customer) {
            this.setCurrentCustomer(sbRes.customer);
            return {
              success: true,
              customer: sbRes.customer,
              isFirstTime: false,
              isSupabase: true
            };
          } else if (sbRes.error) {
            return {
              success: false,
              message: sbRes.error.toLowerCase().includes("invalid login credentials")
                ? "Invalid email or password. Please verify your credentials or click 'Forgot your password?'."
                : sbRes.error
            };
          }
        } catch (sbErr) {
          console.warn("Supabase login exception:", sbErr);
        }
      }

      // 2. Offline / Local accounts
      const query = emailOrName.trim().toLowerCase();
      const customers = this.getCustomers();
      const found = customers.find(
        (c) =>
          c.email.toLowerCase() === query ||
          c.name.toLowerCase() === query ||
          (c.name.toLowerCase().includes(query) && query.length > 2)
      );

      if (!found) {
        return {
          success: false,
          message: "No account found with this email. Please click 'Create Account' to sign up!"
        };
      }

      // OWASP A04 FIX: Never compare passwords from localStorage.
      // Local account logins don't check passwords — only Supabase Auth does.
      // If we reached here, the user is on a local-only offline account.
      // SECURITY NOTE: Local accounts should not be used in production.
      // They exist only as a development/demo fallback when Supabase is unavailable.

      // Check if this customer hasn't seen first-time welcome modal
      const isFirstTime = !found.hasSeenWelcomeDiscount;
      this.setCurrentCustomer(found);

      return {
        success: true,
        customer: found,
        isFirstTime: isFirstTime
      };
    },

    registerCustomer: async function (data) {
      const name = (data.name || "").trim();
      const email = (data.email || "").trim().toLowerCase();
      const password = (data.password || "").trim();
      const petName = (data.petName || "Buddy").trim();
      const petType = data.petType || "dog";
      const petEmoji = petType === "cat" ? "🐱" : petType === "bird" ? "🦜" : "🐶";

      if (!name || !email) {
        return { success: false, message: "Please enter your name and email." };
      }

      if (password.length < 8) {
        return { success: false, message: "Password must be at least 8 characters long." };
      }

      // 1. If Supabase is configured, create cloud account in Supabase Auth
      if (window.PetchupSupabase && window.PetchupSupabase.isConfigured()) {
        try {
          const sbRes = await window.PetchupSupabase.signUpCustomer({
            email,
            password,
            name,
            petName,
            petType,
            petEmoji
          });

          if (!sbRes.success) {
            return {
              success: false,
              message: sbRes.error || "Failed to create Supabase account."
            };
          }

          const newCustomer = sbRes.customer;

          // Save locally as well
          const customers = this.getCustomers();
          customers.unshift(newCustomer);
          this.saveCustomers(customers);

          if (sbRes.session) {
            this.setCurrentCustomer(newCustomer);
          }

          return {
            success: true,
            customer: newCustomer,
            isFirstTime: true,
            isSupabase: true,
            emailConfirmationRequired: sbRes.emailConfirmationRequired
          };
        } catch (sbErr) {
          console.warn("Supabase register error:", sbErr);
          return { success: false, message: sbErr.message || "Cloud registration failed." };
        }
      }

      // 2. Fallback to local accounts
      const customers = this.getCustomers();
      const existing = customers.find((c) => c.email.toLowerCase() === email);
      if (existing) {
        return { success: false, message: "An account with this email already exists. Please Sign In!" };
      }

      const newCustomer = {
        id: "cust-" + Date.now(),
        name: name,
        email: email,
        // OWASP A04 FIX: Passwords are NEVER stored in localStorage.
        // Local accounts are a dev-only fallback; passwords must not be persisted.
        petName: petName,
        petType: petType,
        petEmoji: petEmoji,
        memberTier: "VIP Paw Member",
        createdAt: new Date().toISOString().split("T")[0],
        hasSeenWelcomeDiscount: false,
        firstDiscountCode: "FIRSTPAW20"
      };

      customers.unshift(newCustomer);
      this.saveCustomers(customers);
      this.setCurrentCustomer(newCustomer);

      return {
        success: true,
        customer: newCustomer,
        isFirstTime: true
      };
    },

    logoutCustomer: async function () {
      if (window.PetchupSupabase && window.PetchupSupabase.isConfigured()) {
        try {
          await window.PetchupSupabase.signOutCustomer();
        } catch (e) {
          console.warn("Supabase signOut error:", e);
        }
      }
      this.setCurrentCustomer(null);
      return true;
    },

    restoreSupabaseCustomerSession: async function () {
      if (!window.PetchupSupabase || !window.PetchupSupabase.isConfigured()) return null;
      try {
        const activeCustomer = await window.PetchupSupabase.getActiveSessionCustomer();
        if (activeCustomer) {
          const current = this.getCurrentCustomer();
          if (!current || current.id !== activeCustomer.id) {
            this.setCurrentCustomer(activeCustomer);
          }
          return activeCustomer;
        }
      } catch (e) {
        console.warn("Error restoring Supabase customer session:", e);
      }
      return null;
    },

    markCustomerWelcomeSeen: function (customerId) {
      const customers = this.getCustomers();
      const idx = customers.findIndex((c) => c.id === customerId);
      if (idx !== -1) {
        customers[idx].hasSeenWelcomeDiscount = true;
        this.saveCustomers(customers);
      }
      const current = this.getCurrentCustomer();
      if (current && current.id === customerId) {
        current.hasSeenWelcomeDiscount = true;
        this.setCurrentCustomer(current);
      }
    },

    /* --- PROMO & DISCOUNT COUPON API --- */
    getActiveDiscount: function () {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_DISCOUNT);
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.warn("Error reading active discount:", e);
      }
      return null;
    },

    applyDiscount: function (rawCode) {
      if (!rawCode) {
        return { success: false, message: "Please enter a coupon code." };
      }
      const code = rawCode.trim().toUpperCase();
      let discountObj = null;

      if (code === "FIRSTPAW20" || code === "WELCOME20") {
        discountObj = {
          code: code,
          percent: 20,
          label: "First-Time Member 20% OFF 🎉"
        };
      } else if (code === "PAWTY15") {
        discountObj = {
          code: code,
          percent: 15,
          label: "15% Special Offer Discount 🐾"
        };
      } else if (code === "MEOW10" || code === "WOOF10") {
        discountObj = {
          code: code,
          percent: 10,
          label: "10% Paw Perks Discount 🦴"
        };
      } else {
        return {
          success: false,
          message: "Coupon not found! Try code FIRSTPAW20 for 20% off or PAWTY15 for 15% off."
        };
      }

      try {
        localStorage.setItem(STORAGE_KEY_DISCOUNT, JSON.stringify(discountObj));
        window.dispatchEvent(
          new CustomEvent("petchup:discount-updated", { detail: discountObj })
        );
      } catch (e) {
        console.error("Error saving discount:", e);
      }

      return { success: true, discount: discountObj };
    },

    removeDiscount: function () {
      try {
        localStorage.removeItem(STORAGE_KEY_DISCOUNT);
        window.dispatchEvent(
          new CustomEvent("petchup:discount-updated", { detail: null })
        );
      } catch (e) {
        console.error("Error removing discount:", e);
      }
      return true;
    },

    /* --- DATA EXPORT / IMPORT --- */
    exportDataJSON: function () {
      const exportObject = {
        app: "PETCHUP",
        version: "2.0",
        exportedAt: new Date().toISOString(),
        products: this.getProducts(),
        announcements: this.getAnnouncements(),
        orders: this.getOrders()
      };
      return JSON.stringify(exportObject, null, 2);
    },

    importDataJSON: function (jsonString) {
      // OWASP A08 FIX: Validate imported JSON schema before saving.
      // Unvalidated imports could overwrite catalog with malicious data.
      try {
        const data = JSON.parse(jsonString);
        if (typeof data !== "object" || data === null) {
          return false;
        }
        if (data.products && Array.isArray(data.products)) {
          // Validate each product has at minimum required safe fields
          const valid = data.products.every(
            (p) => typeof p.id === "string" && typeof p.name === "string" && typeof p.price === "number"
          );
          if (!valid) {
            console.warn("Import rejected: products array contains invalid entries.");
            return false;
          }
          this.saveProducts(data.products);
        }
        if (data.announcements && Array.isArray(data.announcements)) {
          const valid = data.announcements.every(
            (a) => typeof a.id === "string" && typeof a.text === "string"
          );
          if (!valid) {
            console.warn("Import rejected: announcements array contains invalid entries.");
            return false;
          }
          this.saveAnnouncements(data.announcements);
        }
        return true;
      } catch (e) {
        console.error("Error importing store data:", e);
        return false;
      }
    },

    /* --- SUPABASE CLOUD SYNC & ORDERS --- */
    syncFromSupabase: async function () {
      if (!window.PetchupSupabase || !window.PetchupSupabase.isConfigured()) {
        return { synced: false, reason: "Supabase credentials not configured." };
      }

      try {
        console.log("☁️ Syncing catalog with Supabase...");
        let cloudProducts = [];
        let cloudAnnouncements = [];
        let cloudOrders = [];

        try {
          const results = await Promise.all([
            window.PetchupSupabase.fetchProducts(),
            window.PetchupSupabase.fetchAnnouncements(),
            window.PetchupSupabase.fetchOrders ? window.PetchupSupabase.fetchOrders() : Promise.resolve([])
          ]);
          cloudProducts = results[0] || [];
          cloudAnnouncements = results[1] || [];
          cloudOrders = results[2] || [];
        } catch (fetchErr) {
          console.warn("Could not fetch some cloud resources:", fetchErr);
        }

        let hasProducts = Array.isArray(cloudProducts) && cloudProducts.length > 0;
        let hasAnnouncements = Array.isArray(cloudAnnouncements) && cloudAnnouncements.length > 0;
        let hasOrders = Array.isArray(cloudOrders) && cloudOrders.length > 0;

        if (hasProducts) {
          cloudProducts = cloudProducts.map((p) => {
            if (p && p.img) p.img = decodeMojibake(p.img);
            return p;
          });
          localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(cloudProducts));
          window.dispatchEvent(
            new CustomEvent("petchup:products-updated", { detail: cloudProducts })
          );
        }

        if (hasAnnouncements) {
          cloudAnnouncements = cloudAnnouncements.map((a) => {
            if (a) {
              if (a.pill) a.pill = decodeMojibake(a.pill);
              if (a.title) a.title = decodeMojibake(a.title);
              if (a.text) a.text = decodeMojibake(a.text);
            }
            return a;
          });
          localStorage.setItem(STORAGE_KEY_ANNOUNCEMENTS, JSON.stringify(cloudAnnouncements));
          window.dispatchEvent(
            new CustomEvent("petchup:announcements-updated", { detail: cloudAnnouncements })
          );
        }

        if (hasOrders) {
          const localOrders = this.getOrders();
          const orderMap = new Map();
          localOrders.forEach((o) => orderMap.set(o.id, o));
          cloudOrders.forEach((co) => {
            const prev = orderMap.get(co.id) || {};
            orderMap.set(co.id, Object.assign({}, prev, co));
          });
          const merged = Array.from(orderMap.values());
          merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
          this.saveOrders(merged);
        }

        return {
          synced: true,
          productsCount: cloudProducts ? cloudProducts.length : 0,
          announcementsCount: cloudAnnouncements ? cloudAnnouncements.length : 0,
          ordersCount: cloudOrders ? cloudOrders.length : 0
        };
      } catch (err) {
        console.warn("Supabase background sync encountered an issue:", err);
        return { synced: false, error: err.message };
      }
    },

    createCloudOrder: async function (orderData) {
      if (!window.PetchupSupabase || !window.PetchupSupabase.isConfigured()) {
        return null;
      }
      return await window.PetchupSupabase.createOrder(orderData);
    },

    /* --- ORDERS MANAGEMENT (LOCAL + SUPABASE SYNC) --- */
    getOrders: function () {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_ORDERS);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            // Filter out any legacy hardcoded demo seed orders
            const clean = parsed.filter(
              (o) => !o.id || !["ord-1001", "ord-1002", "ord-1003"].includes(o.id)
            );
            if (clean.length !== parsed.length) {
              this.saveOrders(clean);
            }
            return clean;
          }
        }
      } catch (e) {
        console.warn("Error reading orders:", e);
      }
      return [];
    },

    saveOrders: function (orders) {
      try {
        localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
        window.dispatchEvent(
          new CustomEvent("petchup:orders-updated", { detail: orders })
        );
      } catch (e) {
        console.error("Error saving orders:", e);
      }
    },

    addOrder: async function (orderData) {
      const orders = this.getOrders();
      const currentCustomer = this.getCurrentCustomer();

      const newOrder = {
        id: orderData.id || ("ord-" + Date.now()),
        customer_id: orderData.customerId || currentCustomer?.id || null,
        customer_name: orderData.customerName || currentCustomer?.name || "Guest Pet Parent",
        customer_email: orderData.customerEmail || currentCustomer?.email || "",
        pet_name: orderData.petName || currentCustomer?.petName || "",
        items: Array.isArray(orderData.items) ? orderData.items : [],
        item_count: (orderData.items || []).reduce((sum, it) => sum + (it.qty || 1), 0),
        subtotal: parseFloat(Number(orderData.subtotal || 0).toFixed(2)),
        discount_code: orderData.discountCode || "",
        discount_amount: parseFloat(Number(orderData.discountAmount || 0).toFixed(2)),
        total: parseFloat(Number(orderData.total || 0).toFixed(2)),
        status: orderData.status || "pending",
        created_at: orderData.createdAt || new Date().toISOString()
      };

      // 1. Save locally immediately
      orders.unshift(newOrder);
      this.saveOrders(orders);

      // 2. Sync to Supabase if configured
      if (window.PetchupSupabase && window.PetchupSupabase.isConfigured()) {
        try {
          const cloudOrder = await window.PetchupSupabase.createOrder(newOrder);
          if (cloudOrder && cloudOrder.id) {
            const idx = orders.findIndex((o) => o.id === newOrder.id);
            if (idx !== -1) {
              orders[idx] = Object.assign({}, orders[idx], cloudOrder);
              this.saveOrders(orders);
            }
            return cloudOrder;
          }
        } catch (err) {
          console.warn("Could not push order to Supabase:", err);
        }
      }

      return newOrder;
    },

    getCustomerOrders: async function (email, customerId = null) {
      let localOrders = this.getOrders();
      const cleanEmail = (email || "").toLowerCase().trim();

      let matched = localOrders.filter((o) => {
        const matchEmail = cleanEmail && (o.customer_email || "").toLowerCase() === cleanEmail;
        const matchId = customerId && o.customer_id === customerId;
        return matchEmail || matchId;
      });

      // Try fetching from Supabase if connected
      if (window.PetchupSupabase && window.PetchupSupabase.isConfigured()) {
        try {
          const cloudList = await window.PetchupSupabase.fetchCustomerOrders(cleanEmail, customerId);
          if (Array.isArray(cloudList) && cloudList.length > 0) {
            const orderMap = new Map();
            matched.forEach((o) => orderMap.set(o.id, o));
            cloudList.forEach((co) => {
              const prev = orderMap.get(co.id) || {};
              orderMap.set(co.id, Object.assign({}, prev, co));
            });
            matched = Array.from(orderMap.values());
          }
        } catch (err) {
          console.warn("Could not query customer orders from Supabase:", err);
        }
      }

      // Sort newest first
      matched.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      return matched;
    },

    getAllOrders: async function () {
      let localOrders = this.getOrders();

      if (window.PetchupSupabase && window.PetchupSupabase.isConfigured()) {
        try {
          const cloudOrders = await window.PetchupSupabase.fetchOrders();
          if (Array.isArray(cloudOrders) && cloudOrders.length > 0) {
            const orderMap = new Map();
            localOrders.forEach((o) => orderMap.set(o.id, o));
            cloudOrders.forEach((co) => {
              const prev = orderMap.get(co.id) || {};
              orderMap.set(co.id, Object.assign({}, prev, co));
            });
            localOrders = Array.from(orderMap.values());
            this.saveOrders(localOrders);
          }
        } catch (err) {
          console.warn("Could not fetch cloud orders for admin:", err);
        }
      }

      localOrders.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      return localOrders;
    },

    updateOrderStatus: async function (orderId, newStatus) {
      const orders = this.getOrders();
      const idx = orders.findIndex((o) => o.id === orderId);
      if (idx === -1) return null;

      orders[idx].status = newStatus;
      orders[idx].updated_at = new Date().toISOString();
      this.saveOrders(orders);

      if (window.PetchupSupabase && window.PetchupSupabase.isConfigured()) {
        try {
          await window.PetchupSupabase.updateOrderStatus(orderId, newStatus);
        } catch (err) {
          console.warn("Could not update order status in Supabase:", err);
        }
      }

      return orders[idx];
    },

    deleteOrder: async function (orderId) {
      let orders = this.getOrders();
      orders = orders.filter((o) => o.id !== orderId);
      this.saveOrders(orders);

      if (window.PetchupSupabase && window.PetchupSupabase.isConfigured()) {
        try {
          await window.PetchupSupabase.deleteOrder(orderId);
        } catch (err) {
          console.warn("Could not delete order from Supabase:", err);
        }
      }

      return true;
    },

    clearAllOrders: async function () {
      const orders = this.getOrders();
      this.saveOrders([]);

      if (window.PetchupSupabase && window.PetchupSupabase.isConfigured()) {
        try {
          for (const ord of orders) {
            await window.PetchupSupabase.deleteOrder(ord.id);
          }
        } catch (err) {
          console.warn("Could not clear cloud orders:", err);
        }
      }

      return true;
    },

    getOrderStatusMeta: function (status) {
      const s = (status || "").toLowerCase();
      switch (s) {
        case "pending":
          return { label: "Pending", emoji: "🕒", pillClass: "status-pending", desc: "Order placed, awaiting fulfillment" };
        case "processing":
          return { label: "Processing", emoji: "📦", pillClass: "status-processing", desc: "Packing treats & goodies" };
        case "shipped":
          return { label: "Shipped", emoji: "🚚", pillClass: "status-shipped", desc: "On the way to fur baby" };
        case "delivered":
        case "completed":
          return { label: "Delivered", emoji: "🎉", pillClass: "status-delivered", desc: "Safely arrived & enjoyed" };
        case "cancelled":
          return { label: "Cancelled", emoji: "❌", pillClass: "status-cancelled", desc: "Order was cancelled" };
        default:
          return { label: status || "Confirmed", emoji: "✨", pillClass: "status-pending", desc: "Order confirmed" };
      }
    },

    /* --- UI HELPERS --- */
    getCategoryLabel: function (category) {
      switch (category) {
        case "feeds":
          return "Feeds & Pet Food";
        case "accessories":
          return "Pet Accessories";
        case "grooming":
          return "Grooming Essentials";
        case "wellness":
          return "Health & Wellness";
        default:
          return "Pet Goodies";
      }
    },

    getCategoryTint: function (category) {
      switch (category) {
        case "feeds":
          return "bg-yellow-tint";
        case "accessories":
          return "bg-peach-tint";
        case "grooming":
          return "bg-teal-tint";
        case "wellness":
          return "bg-coral-tint";
        default:
          return "bg-yellow-tint";
      }
    },

    getBadgeClass: function (badge) {
      if (!badge) return "";
      const lower = badge.toLowerCase();
      if (lower.includes("new")) return "badge-new";
      if (lower.includes("vet") || lower.includes("health") || lower.includes("organic"))
        return "badge-health";
      if (lower.includes("squeak") || lower.includes("play") || lower.includes("pounce"))
        return "badge-fun";
      if (lower.includes("popular") || lower.includes("favorite")) return "badge-popular";
      return "badge-bestseller";
    },

    getPetLabel: function (pet) {
      switch (pet) {
        case "dog":
          return "🐶 Dogs";
        case "cat":
          return "🐱 Cats";
        default:
          return "🐶 & 🐱 All Pets";
      }
    },

    renderAnnouncementBanner: function (containerId) {
      const bannerContainer =
        (containerId && document.getElementById(containerId)) ||
        document.getElementById("site-banner") ||
        document.querySelector(".top-banner") ||
        document.querySelector(".site-banner");
      if (!bannerContainer) return;

      const active = this.getActiveAnnouncement();
      if (!active) {
        bannerContainer.style.display = "none";
        return;
      }

      bannerContainer.style.display = "";
      // OWASP A05 FIX: Validate link scheme before rendering as href.
      // Prevents javascript: URI injection by an admin who stores a malicious link.
      const safeLink = /^(https?:\/\/|\/|[a-zA-Z0-9_-]+\.html)/.test(active.link || "")
        ? active.link
        : "shop.html";
      bannerContainer.innerHTML = `
        <div class="wrap banner-inner" id="banner-inner">
          <span class="banner-pill">${escapeHTML(active.pill)}</span>
          <span class="banner-text">${escapeHTML(active.text)}</span>
          ${
            safeLink
              ? `<a href="${escapeHTML(safeLink)}" class="banner-link">${escapeHTML(
                  active.linkText || "Shop Deals →"
                )}</a>`
              : ""
          }
        </div>
      `;
    },

    createProductCardHTML: function (product) {
      const hasOriginalPrice = product.originalPrice && product.originalPrice > product.price;
      const petLabel = this.getPetLabel(product.pet);
      const categoryText = `${escapeHTML(product.categoryLabel || this.getCategoryLabel(product.category))}, ${petLabel}`;
      const badgeHTML = product.badge
        ? `<div class="product-badge ${product.badgeClass || this.getBadgeClass(product.badge)}">${escapeHTML(
            product.badge
          )}</div>`
        : "";
      const outOfStockHTML = !product.inStock
        ? `<div class="out-of-stock-overlay"><span>Out of stock</span></div>`
        : "";
      const stars = "&#9733;".repeat(Math.round(product.rating || 5));
      const cleanEmoji = cleanProductEmoji(product.img, product.category, product.id);

      return `
        <article class="product-card ${!product.inStock ? "is-out-of-stock" : ""}" 
                 data-id="${escapeHTML(product.id)}" 
                 data-category="${escapeHTML(product.category)}" 
                 data-pet="${escapeHTML(product.pet)}" 
                 data-price="${product.price}" 
                 data-rating="${product.rating}" 
                 data-popularity="${product.popularity || 90}">
          ${badgeHTML}
          ${outOfStockHTML}
          <div class="product-img-wrap ${product.tintClass || this.getCategoryTint(product.category)}">
            ${
              product.imageUrl
                ? `<img src="${escapeHTML(product.imageUrl)}" class="product-real-img" alt="${escapeHTML(product.name)}" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='block';">
                   <div class="product-emoji" style="display:none;">${escapeHTML(cleanEmoji)}</div>`
                : `<div class="product-emoji">${escapeHTML(cleanEmoji)}</div>`
            }
          </div>
          <div class="product-info">
            <span class="product-category">${categoryText}</span>
            <h3 class="product-name">${escapeHTML(product.name)}</h3>
            <p class="product-desc-short">${escapeHTML(product.desc)}</p>
            <div class="product-rating" aria-label="${product.rating} stars">
              <span class="stars">${stars}</span>
              <span class="rating-count">(${product.ratingCount || 100})</span>
            </div>
            <div class="product-pricing">
              <strong class="product-price">₱${product.price.toFixed(2)}</strong>
              ${
                hasOriginalPrice
                  ? `<span class="product-original-price">₱${product.originalPrice.toFixed(2)}</span>`
                  : ""
              }
              ${product.unit ? `<span class="product-unit">${escapeHTML(product.unit)}</span>` : ""}
            </div>
          </div>
          <button type="button" class="btn btn-primary btn-pill btn-full add-to-cart-btn" 
                  data-id="${escapeHTML(product.id)}" 
                  data-name="${escapeHTML(product.name)}" 
                  data-price="${product.price}" 
                  data-img="${escapeHTML(cleanEmoji)}"
                  ${!product.inStock ? "disabled" : ""}>
            ${product.inStock ? "Add to Cart 🛒" : "Out of stock"}
          </button>
        </article>
      `;
    }
  };

  function escapeHTML(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Export to window
  window.PetchupStore = PetchupStore;

  // Auto-recognize admin on page load if session already belongs to admin email
  try {
    const storedCustomer = PetchupStore.getCurrentCustomer();
    if (storedCustomer && (storedCustomer.role === "admin" || (storedCustomer.email && storedCustomer.email.trim().toLowerCase() === "canamoaries13@gmail.com"))) {
      storedCustomer.role = "admin";
      PetchupStore.setAuth("admin", storedCustomer.name || "Aries (Store Administrator)", storedCustomer.email);
    }
  } catch (e) {
    console.warn("Could not sync auth on startup:", e);
  }

  // Background sync and session restoration on load if Supabase configured
  if (typeof window !== "undefined") {
    window.addEventListener("DOMContentLoaded", () => {
      if (window.PetchupSupabase && window.PetchupSupabase.isConfigured()) {
        PetchupStore.syncFromSupabase();
        PetchupStore.restoreSupabaseCustomerSession();

        // Listen for real-time auth events from Supabase
        window.PetchupSupabase.onAuthStateChange((event, session) => {
          if (event === "SIGNED_OUT") {
            PetchupStore.setCurrentCustomer(null);
          } else if (event === "SIGNED_IN" && session?.user) {
            PetchupStore.restoreSupabaseCustomerSession();
          }
        });
      }
    });
  }
})();
