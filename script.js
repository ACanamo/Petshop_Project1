/**
 * PETCHUP — JOYFUL CLIENT JAVASCRIPT
 * Squeezing happiness into every pet bowl and walk!
 *
 * Architecture:
 * - Shared localStorage cart synchronization across all pages (index.html, shop.html, admin.html)
 * - Dynamic product catalog loading via PetchupStore
 * - Dynamic top announcement banner rendering
 * - Interactive slide-out cart drawer with live badge counter & subtotal
 * - Toast notifications for item additions
 * - Product Listing Page (PLP) dynamic search, category tabs, pet type toggles, and sorting
 * - URL parameter support (e.g. shop.html?cat=accessories)
 * - Promo coupon generator (PAWTY15)
 * - Mobile responsive navigation menu
 */

(function () {
  "use strict";

  const STORAGE_KEY_CART = "petchup_cart";

  /* ==========================================================================
     1. PERSISTENT CART SYSTEM (SYNCED VIA LOCALSTORAGE)
     ========================================================================== */
  function getCart() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CART);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn("Could not read cart from localStorage", e);
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
    } catch (e) {
      console.warn("Could not write cart to localStorage", e);
    }
  }

  let toastTimeout;

  function showToast(message) {
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toast-message");
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    toast.classList.add("is-active");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove("is-active");
    }, 2800);
  }

  function openCart() {
    const cartDrawer = document.getElementById("cart-drawer");
    if (cartDrawer) {
      cartDrawer.classList.add("is-open");
      cartDrawer.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
  }

  function closeCart() {
    const cartDrawer = document.getElementById("cart-drawer");
    if (cartDrawer) {
      cartDrawer.classList.remove("is-open");
      cartDrawer.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
  }

  function initCartSystem() {
    let cart = getCart();

    const cartToggleBtn = document.getElementById("cart-toggle-btn");
    const cartCloseBtn = document.getElementById("cart-close-btn");
    const cartBackdrop = document.getElementById("cart-backdrop");
    const cartDrawer = document.getElementById("cart-drawer");
    const cartCounter = document.getElementById("cart-counter");
    const cartItemsContainer = document.getElementById("cart-items");
    const cartSubtotal = document.getElementById("cart-subtotal");
    const checkoutBtn = document.getElementById("checkout-btn");
    const mobileViewCartBtn = document.getElementById("mobile-view-cart-btn");

    // Promo Discount Elements in Cart Drawer
    const cartPromoForm = document.getElementById("cart-promo-form");
    const cartPromoInput = document.getElementById("cart-promo-input");
    const cartAppliedBanner = document.getElementById("cart-applied-banner");
    const cartAppliedLabel = document.getElementById("cart-applied-label");
    const cartRemoveDiscountBtn = document.getElementById("cart-remove-discount-btn");
    const cartDiscountRow = document.getElementById("cart-discount-row");
    const cartDiscountDesc = document.getElementById("cart-discount-desc");
    const cartDiscountAmount = document.getElementById("cart-discount-amount");
    const cartTotalRow = document.getElementById("cart-total-row");
    const cartFinalTotal = document.getElementById("cart-final-total");

    function renderCart() {
      if (!cartCounter) return;

      const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
      cartCounter.textContent = totalCount;
      cartCounter.classList.add("bump");
      setTimeout(() => cartCounter.classList.remove("bump"), 300);

      if (cartToggleBtn) {
        cartToggleBtn.setAttribute("aria-label", `Open Cart (${totalCount} items)`);
      }

      if (!cartItemsContainer || !cartSubtotal) return;

      if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
          <div class="cart-empty-state">
            <div class="empty-emoji">🎾</div>
            <p class="empty-title">Your cart is empty!</p>
            <p class="empty-sub">Add some crunchy feeds, squeaky toys, or cozy leashes to get started.</p>
          </div>
        `;
        cartSubtotal.textContent = "$0.00";
        if (cartDiscountRow) cartDiscountRow.hidden = true;
        if (cartTotalRow) cartTotalRow.hidden = true;
        if (cartAppliedBanner) cartAppliedBanner.hidden = true;
        return;
      }

      let html = "";
      let totalAmount = 0;

      cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        totalAmount += itemTotal;
        html += `
          <div class="cart-item-row">
            <div class="cart-item-emoji">${item.img}</div>
            <div class="cart-item-info">
              <strong class="cart-item-title">${item.name}</strong>
              <div class="cart-item-price">₱${item.price.toFixed(2)} &times; ${item.qty}</div>
            </div>
            <button type="button" class="cart-item-remove" data-index="${index}" aria-label="Remove ${item.name}">
              🗑️
            </button>
          </div>
        `;
      });

      cartItemsContainer.innerHTML = html;
      cartSubtotal.textContent = `₱${totalAmount.toFixed(2)}`;

      // Active discount calculation
      const activeDiscount = window.PetchupStore ? window.PetchupStore.getActiveDiscount() : null;
      if (activeDiscount && totalAmount > 0) {
        const discountVal = totalAmount * (activeDiscount.percent / 100);
        const finalTotal = Math.max(0, totalAmount - discountVal);

        if (cartDiscountRow) {
          cartDiscountRow.hidden = false;
          if (cartDiscountDesc) cartDiscountDesc.textContent = `Discount (${activeDiscount.percent}% OFF):`;
          if (cartDiscountAmount) cartDiscountAmount.textContent = `-₱${discountVal.toFixed(2)}`;
        }

        if (cartTotalRow) {
          cartTotalRow.hidden = false;
          if (cartFinalTotal) cartFinalTotal.textContent = `₱${finalTotal.toFixed(2)}`;
        }

        if (cartAppliedBanner) {
          cartAppliedBanner.hidden = false;
          if (cartAppliedLabel) cartAppliedLabel.textContent = `🎉 ${activeDiscount.code} (-${activeDiscount.percent}%) Applied!`;
        }
      } else {
        if (cartDiscountRow) cartDiscountRow.hidden = true;
        if (cartTotalRow) cartTotalRow.hidden = true;
        if (cartAppliedBanner) cartAppliedBanner.hidden = true;
      }

      // Attach remove handlers
      const removeButtons = cartItemsContainer.querySelectorAll(".cart-item-remove");
      removeButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.index, 10);
          const removed = cart.splice(idx, 1);
          saveCart(cart);
          renderCart();
          showToast(`Removed ${removed[0]?.name || "item"} from cart`);
        });
      });
    }

    // Attach Add to Cart listener (delegated for dynamically rendered items)
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".add-to-cart-btn");
      if (!btn || btn.disabled) return;

      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const price = parseFloat(btn.dataset.price);
      const img = btn.dataset.img || "🐾";

      const existing = cart.find((item) => item.id === id);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ id, name, price, img, qty: 1 });
      }

      saveCart(cart);
      renderCart();
      showToast(`🎉 Added ${name} to cart!`);

      // Button feedback
      const originalText = btn.innerHTML;
      btn.textContent = "Added! ✨";
      btn.style.backgroundColor = "var(--color-teal)";
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.backgroundColor = "";
      }, 1200);
    });

    if (cartToggleBtn) cartToggleBtn.addEventListener("click", openCart);
    if (cartCloseBtn) cartCloseBtn.addEventListener("click", closeCart);
    if (cartBackdrop) cartBackdrop.addEventListener("click", closeCart);
    if (mobileViewCartBtn) {
      mobileViewCartBtn.addEventListener("click", () => {
        const mobileNav = document.getElementById("mobile-nav");
        if (mobileNav) mobileNav.hidden = true;
        openCart();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && cartDrawer?.classList.contains("is-open")) {
        closeCart();
      }
    });

    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", async () => {
        if (cart.length === 0) {
          showToast("Add some goodies to your cart first!");
          return;
        }

        const currentCustomer = window.PetchupStore ? window.PetchupStore.getCurrentCustomer() : null;
        const activeDiscount = window.PetchupStore ? window.PetchupStore.getActiveDiscount() : null;
        const subtotal = cart.reduce((sum, it) => sum + it.price * it.qty, 0);
        const discountAmount = activeDiscount ? (subtotal * activeDiscount.percent) / 100 : 0;
        const total = Math.max(0, subtotal - discountAmount);

        const orderData = {
          customerId: currentCustomer?.id || null,
          customerName: currentCustomer?.name || "Guest Pet Parent",
          customerEmail: currentCustomer?.email || "",
          petName: currentCustomer?.petName || "",
          items: cart.map((it) => ({
            id: it.id,
            name: it.name,
            price: it.price,
            qty: it.qty,
            img: it.img
          })),
          subtotal: parseFloat(subtotal.toFixed(2)),
          discountCode: activeDiscount?.code || "",
          discountAmount: parseFloat(discountAmount.toFixed(2)),
          total: parseFloat(total.toFixed(2)),
          status: "pending"
        };

        showToast("🚀 Processing your checkout order...");

        let savedOrder = null;
        if (window.PetchupStore?.addOrder) {
          try {
            savedOrder = await window.PetchupStore.addOrder(orderData);
          } catch (err) {
            console.warn("Could not save order in store:", err);
          }
        }

        setTimeout(() => {
          const orderIdDisplay = savedOrder?.id ? `\nOrder ID: #${savedOrder.id}` : "";
          alert(`🎉 Order Confirmed! Thank you for shopping at PETCHUP!${orderIdDisplay}\nYour fur baby will love it! 🐾`);

          // Clear cart
          cart.length = 0;
          saveCart(cart);
          renderCart();
          closeCart();
        }, 400);
      });
    }

    // Coupon form submission
    if (cartPromoForm && cartPromoInput) {
      cartPromoForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const code = cartPromoInput.value.trim();
        if (!code) return;
        if (window.PetchupStore) {
          const res = window.PetchupStore.applyDiscount(code);
          if (res.success) {
            cartPromoInput.value = "";
            renderCart();
            showToast(`🎉 Coupon ${res.discount.code} (-${res.discount.percent}%) applied!`);
          } else {
            alert(res.message || "Invalid coupon code");
          }
        }
      });
    }

    if (cartRemoveDiscountBtn) {
      cartRemoveDiscountBtn.addEventListener("click", () => {
        if (window.PetchupStore) {
          window.PetchupStore.removeDiscount();
          renderCart();
          showToast("Coupon removed.");
        }
      });
    }

    // Initial render
    renderCart();

    // Listen to storage events across multiple browser tabs
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY_CART || e.key === "petchup_active_discount") {
        cart = getCart();
        renderCart();
      }
    });

    window.addEventListener("petchup:discount-updated", renderCart);
  }

  /* ==========================================================================
     2. DYNAMIC ANNOUNCEMENT BANNER
     ========================================================================== */
  function escapeHTML(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initAnnouncementBanner() {
    function refreshBanner() {
      if (window.PetchupStore) {
        window.PetchupStore.renderAnnouncementBanner("site-banner");

        // Render Spotlight Strip on Homepage if element exists
        const stripWrap = document.getElementById("announcement-strip");
        const stripCard = document.getElementById("announcement-strip-card");
        if (stripWrap && stripCard) {
          const active = window.PetchupStore.getActiveAnnouncement();
          if (!active) {
            stripWrap.hidden = true;
          } else {
            stripWrap.hidden = false;
            stripCard.innerHTML = `
              <div class="announcement-strip-left">
                <span class="announcement-strip-pill">${escapeHTML(active.pill)}</span>
                <span class="announcement-strip-text">${escapeHTML(active.text)}</span>
              </div>
              ${
                active.link
                  ? `<a href="${escapeHTML(active.link)}" class="btn btn-primary btn-pill announcement-strip-link">${escapeHTML(
                      active.linkText || "Shop Deals →"
                    )}</a>`
                  : ""
              }
            `;
          }
        }
      }
    }

    refreshBanner();

    // In-tab update event
    window.addEventListener("petchup:announcements-updated", refreshBanner);

    // Cross-tab update event (e.g. added via admin.html in another tab)
    window.addEventListener("storage", (e) => {
      if (e.key === "petchup_announcements") {
        refreshBanner();
      }
    });
  }

  /* ==========================================================================
     3. DYNAMIC FEATURED PRODUCTS (index.html)
     ========================================================================== */
  function initFeaturedProducts() {
    const featuredGrid = document.getElementById("featured-products-grid");
    if (!featuredGrid || !window.PetchupStore) return;

    function renderFeatured() {
      const products = window.PetchupStore.getProducts();
      // Show grid of 6 featured products (per playful brief)
      const featured = products.slice(0, 6);
      featuredGrid.innerHTML = featured
        .map((p) => window.PetchupStore.createProductCardHTML(p))
        .join("");
    }

    renderFeatured();
    window.addEventListener("petchup:products-updated", renderFeatured);
    window.addEventListener("storage", (e) => {
      if (e.key === "petchup_products") {
        renderFeatured();
      }
    });
  }

  /* ==========================================================================
     4. DYNAMIC PRODUCT LISTING PAGE FILTERING & SORTING (shop.html)
     ========================================================================== */
  function initProductListingPage() {
    const grid = document.getElementById("plp-products-grid");
    if (!grid || !window.PetchupStore) return; // Not on shop.html

    const searchInput = document.getElementById("product-search");
    const searchClearBtn = document.getElementById("search-clear-btn");
    const catPills = document.querySelectorAll(".cat-pill-btn");
    const petToggles = document.querySelectorAll(".pet-toggle-btn");
    const sortSelect = document.getElementById("sort-select");
    const countDisplay = document.getElementById("product-count");
    const emptyState = document.getElementById("no-products-msg");
    const resetFiltersBtn = document.getElementById("reset-filters-btn");

    // State
    const filterState = {
      category: "all",
      pet: "all",
      search: "",
      sort: "popular",
    };

    // Check URL parameters (e.g. shop.html?cat=accessories)
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get("cat");
    if (catParam) {
      filterState.category = catParam.toLowerCase();
      catPills.forEach((btn) => {
        const isActive = btn.dataset.category === filterState.category;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-selected", String(isActive));
      });
    }

    function renderAndFilterGrid() {
      const allProducts = window.PetchupStore.getProducts();
      const q = filterState.search.toLowerCase().trim();

      // 1. Filter products
      let visible = allProducts.filter((p) => {
        const pCat = (p.category || "").toLowerCase();
        const pPet = (p.pet || "").toLowerCase();
        const title = (p.name || "").toLowerCase();
        const desc = (p.desc || "").toLowerCase();

        const matchCat = filterState.category === "all" || pCat === filterState.category;
        const matchPet =
          filterState.pet === "all" || pPet === filterState.pet || pPet === "all";
        const matchSearch =
          !q || title.includes(q) || desc.includes(q) || pCat.includes(q);

        return matchCat && matchPet && matchSearch;
      });

      // 2. Sort visible products
      visible.sort((a, b) => {
        const priceA = parseFloat(a.price || 0);
        const priceB = parseFloat(b.price || 0);
        const ratingA = parseFloat(a.rating || 0);
        const ratingB = parseFloat(b.rating || 0);
        const popA = parseFloat(a.popularity || 0);
        const popB = parseFloat(b.popularity || 0);

        if (filterState.sort === "price-asc") {
          return priceA - priceB;
        } else if (filterState.sort === "price-desc") {
          return priceB - priceA;
        } else if (filterState.sort === "rating") {
          return ratingB - ratingA;
        } else {
          // popular
          return popB - popA;
        }
      });

      // 3. Render into DOM
      grid.innerHTML = visible.map((p) => window.PetchupStore.createProductCardHTML(p)).join("");

      // 4. Update count & empty state
      if (countDisplay) {
        countDisplay.textContent = `Showing ${visible.length} ${
          visible.length === 1 ? "goodie" : "goodies"
        }`;
      }

      if (emptyState) {
        emptyState.hidden = visible.length > 0;
      }
    }

    // Category button clicks
    catPills.forEach((btn) => {
      btn.addEventListener("click", () => {
        catPills.forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");

        filterState.category = btn.dataset.category;
        renderAndFilterGrid();
      });
    });

    // Pet type toggles
    petToggles.forEach((btn) => {
      btn.addEventListener("click", () => {
        petToggles.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        filterState.pet = btn.dataset.pet;
        renderAndFilterGrid();
      });
    });

    // Search input
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        filterState.search = e.target.value;
        if (searchClearBtn) {
          searchClearBtn.hidden = !e.target.value;
        }
        renderAndFilterGrid();
      });
    }

    if (searchClearBtn && searchInput) {
      searchClearBtn.addEventListener("click", () => {
        searchInput.value = "";
        filterState.search = "";
        searchClearBtn.hidden = true;
        renderAndFilterGrid();
        searchInput.focus();
      });
    }

    // Sort select
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        filterState.sort = e.target.value;
        renderAndFilterGrid();
      });
    }

    // Reset filters button
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener("click", () => {
        filterState.category = "all";
        filterState.pet = "all";
        filterState.search = "";
        filterState.sort = "popular";

        if (searchInput) {
          searchInput.value = "";
          if (searchClearBtn) searchClearBtn.hidden = true;
        }
        if (sortSelect) sortSelect.value = "popular";

        catPills.forEach((btn) => {
          const isAll = btn.dataset.category === "all";
          btn.classList.toggle("active", isAll);
          btn.setAttribute("aria-selected", String(isAll));
        });

        petToggles.forEach((btn) => {
          const isAll = btn.dataset.pet === "all";
          btn.classList.toggle("active", isAll);
        });

        renderAndFilterGrid();
      });
    }

    // Run initial render & sort
    renderAndFilterGrid();

    // Listen for product catalog updates from Admin portal
    window.addEventListener("petchup:products-updated", renderAndFilterGrid);
  }

  /* ==========================================================================
     5. PROMO & NEWSLETTER FORM
     ========================================================================== */
  function initPromoForm() {
    const form = document.getElementById("promo-form");
    const input = document.getElementById("newsletter-email");
    const successBox = document.getElementById("promo-success");

    if (!form || !input || !successBox) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = input.value.trim();

      if (!email || !email.includes("@")) {
        alert("Please enter a valid email address to claim your discount!");
        input.focus();
        return;
      }

      form.hidden = true;
      successBox.hidden = false;
    });
  }

  /* ==========================================================================
     6. MOBILE NAVIGATION MENU
     ========================================================================== */
  function initMobileNav() {
    const toggleBtn = document.getElementById("mobile-menu-toggle");
    const mobileNav = document.getElementById("mobile-nav");

    if (!toggleBtn || !mobileNav) return;

    function closeMobileMenu() {
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.classList.remove("is-active");
      mobileNav.hidden = true;
    }

    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";
      const nextState = !isExpanded;
      toggleBtn.setAttribute("aria-expanded", String(nextState));
      toggleBtn.classList.toggle("is-active", nextState);
      mobileNav.hidden = !nextState;
    });

    const navLinks = mobileNav.querySelectorAll("a, button");
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        closeMobileMenu();
      });
    });

    // Mobile View Cart CTA Button
    const mobileCartBtn = document.getElementById("mobile-view-cart-btn");
    if (mobileCartBtn) {
      mobileCartBtn.addEventListener("click", () => {
        closeMobileMenu();
        const cartBtn = document.getElementById("cart-toggle-btn");
        if (cartBtn) cartBtn.click();
      });
    }

    // Close on Click Outside
    document.addEventListener("click", (e) => {
      if (!mobileNav.hidden && !mobileNav.contains(e.target) && !toggleBtn.contains(e.target)) {
        closeMobileMenu();
      }
    });

    // Close on Escape Key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !mobileNav.hidden) {
        closeMobileMenu();
      }
    });
  }

  /* ==========================================================================
     7. CUSTOMER AUTH, PROFILE & FIRST-TIME CELEBRATION MODAL
     ========================================================================== */
  function initCustomerAuthAndCelebration() {
    if (!window.PetchupStore) return;

    // Header & Mobile Elements
    const headerUserBtn = document.getElementById("header-user-btn");
    const userBtnIcon = document.getElementById("user-btn-icon");
    const userBtnText = document.getElementById("user-btn-text");
    const userBadgeDiscount = document.getElementById("user-badge-discount");
    const mobileUserBtn = document.getElementById("mobile-user-btn");
    const mobileUserBtnText = document.getElementById("mobile-user-btn-text");

    // Customer Auth Modal Elements
    const customerAuthModal = document.getElementById("customer-auth-modal");
    const customerAuthClose = document.getElementById("customer-auth-close");
    const tabSignIn = document.getElementById("tab-sign-in");
    const tabRegister = document.getElementById("tab-register");
    const loginForm = document.getElementById("customer-login-form");
    const registerForm = document.getElementById("customer-register-form");
    const loginEmail = document.getElementById("login-email");
    const loginPassword = document.getElementById("login-password");
    const regName = document.getElementById("reg-name");
    const regEmail = document.getElementById("reg-email");
    const regPetName = document.getElementById("reg-pet-name");
    const regPetType = document.getElementById("reg-pet-type");
    const regPassword = document.getElementById("reg-password");
    const authSwitchToReg = document.getElementById("auth-switch-to-reg");
    const authSwitchPrompt = document.getElementById("auth-switch-prompt");

    // Password Strength Meter Elements
    const regStrengthFill = document.getElementById("reg-strength-fill");
    const regStrengthText = document.getElementById("reg-strength-text");
    const reqLength = document.getElementById("req-length");
    const reqNumber = document.getElementById("req-number");
    const reqCase = document.getElementById("req-case");

    // Forgot Password Modal Elements
    const forgotPasswordModal = document.getElementById("forgot-password-modal");
    const forgotPasswordForm = document.getElementById("forgot-password-form");
    const forgotEmail = document.getElementById("forgot-email");
    const forgotFeedback = document.getElementById("forgot-feedback");
    const forgotModalClose = document.getElementById("forgot-modal-close");
    const btnForgotBackToLogin = document.getElementById("btn-forgot-back-to-login");
    const btnForgotPasswordTrigger = document.getElementById("btn-forgot-password-trigger");

    // Celebration Modal Elements
    const celebrationModal = document.getElementById("celebration-modal");
    const celebrationWelcomeTitle = document.getElementById("celebration-welcome-title");
    const celebrationWelcomeSub = document.getElementById("celebration-welcome-sub");
    const celebrationCode = document.getElementById("celebration-code");
    const btnCopyCelebrationCode = document.getElementById("btn-copy-celebration-code");
    const celebrationAnnPill = document.getElementById("celebration-ann-pill");
    const celebrationAnnText = document.getElementById("celebration-ann-text");
    const btnClaimDiscountCart = document.getElementById("btn-claim-discount-cart");
    const btnStartShopping = document.getElementById("btn-start-shopping");

    // Customer Profile Modal Elements
    const customerProfileModal = document.getElementById("customer-profile-modal");
    const customerProfileClose = document.getElementById("customer-profile-close");
    const profilePetAvatar = document.getElementById("profile-pet-avatar");
    const profileUserName = document.getElementById("profile-user-name");
    const profileUserEmail = document.getElementById("profile-user-email");
    const profileUserTier = document.getElementById("profile-user-tier");
    const profilePetDisplay = document.getElementById("profile-pet-display");
    const profileApplyCodeBtn = document.getElementById("profile-apply-code-btn");
    const btnProfileReopenWelcome = document.getElementById("btn-profile-reopen-welcome");
    const btnCustomerLogout = document.getElementById("btn-customer-logout");

    // Customer Order History Modal Elements
    const customerOrdersModal = document.getElementById("customer-orders-modal");
    const customerOrdersClose = document.getElementById("customer-orders-close");
    const customerOrdersDone = document.getElementById("customer-orders-done");
    const btnRefreshCustomerOrders = document.getElementById("btn-refresh-customer-orders");
    const btnProfileViewOrders = document.getElementById("btn-profile-view-orders");
    const customerOrdersContainer = document.getElementById("customer-orders-container");
    const profileOrderCount = document.getElementById("profile-order-count");
    const ordersModalSubtitle = document.getElementById("orders-modal-subtitle");

    // 1. Password Visibility Toggles
    const toggleBtns = document.querySelectorAll(".btn-toggle-password");
    toggleBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-target");
        const targetInput = targetId ? document.getElementById(targetId) : btn.previousElementSibling;
        if (!targetInput) return;

        const isPassword = targetInput.type === "password";
        targetInput.type = isPassword ? "text" : "password";
        btn.textContent = isPassword ? "🙈" : "👁️";
        btn.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
      });
    });

    // 2. Password Strength Evaluator
    if (regPassword && regStrengthFill && regStrengthText) {
      regPassword.addEventListener("input", () => {
        const val = regPassword.value;
        const hasLength = val.length >= 8;
        const hasNum = /\d/.test(val);
        const hasCase = /[a-z]/.test(val) && /[A-Z]/.test(val);

        if (reqLength) reqLength.classList.toggle("met", hasLength);
        if (reqNumber) reqNumber.classList.toggle("met", hasNum);
        if (reqCase) reqCase.classList.toggle("met", hasCase);

        let score = 0;
        if (val.length > 0) score++;
        if (hasLength) score++;
        if (hasNum) score++;
        if (hasCase) score++;
        if (val.length >= 12 && hasNum && hasCase) score++;

        regStrengthFill.className = "strength-bar-fill";
        regStrengthText.className = "strength-text";

        if (val.length === 0) {
          regStrengthFill.style.width = "0%";
          regStrengthText.textContent = "Enter password";
        } else if (score <= 2) {
          regStrengthFill.classList.add("strength-weak");
          regStrengthText.classList.add("strength-weak");
          regStrengthText.textContent = "Weak";
        } else if (score === 3) {
          regStrengthFill.classList.add("strength-fair");
          regStrengthText.classList.add("strength-fair");
          regStrengthText.textContent = "Fair";
        } else if (score === 4) {
          regStrengthFill.classList.add("strength-good");
          regStrengthText.classList.add("strength-good");
          regStrengthText.textContent = "Good";
        } else {
          regStrengthFill.classList.add("strength-strong");
          regStrengthText.classList.add("strength-strong");
          regStrengthText.textContent = "Strong 🐾";
        }
      });
    }

    // 3. Current Customer UI State
    function updateUIForCustomer() {
      const customer = window.PetchupStore.getCurrentCustomer();
      const isAdmin = window.PetchupStore.isAdmin();

      // Dynamic Admin entry points
      const headerAdminLink = document.getElementById("header-admin-link");
      const mobileAdminItem = document.getElementById("mobile-admin-item");
      const profileAdminCard = document.getElementById("profile-admin-card");

      if (headerAdminLink) {
        headerAdminLink.hidden = !isAdmin;
      }
      if (mobileAdminItem) {
        mobileAdminItem.hidden = !isAdmin;
      }
      if (profileAdminCard) {
        profileAdminCard.hidden = !isAdmin;
      }

      if (customer) {
        // Logged In
        if (headerUserBtn) {
          headerUserBtn.classList.add("is-logged-in");
          headerUserBtn.setAttribute(
            "title",
            isAdmin ? `👑 Administrator (${customer.name})` : `Logged in as ${customer.name}`
          );
        }
        if (userBtnIcon) userBtnIcon.textContent = isAdmin ? "👑" : (customer.petEmoji || "🐶");
        if (userBtnText) userBtnText.textContent = customer.name.split(" ")[0];
        if (userBadgeDiscount) {
          if (isAdmin) {
            userBadgeDiscount.hidden = false;
            userBadgeDiscount.textContent = "ADMIN";
            userBadgeDiscount.style.background = "var(--color-primary)";
            userBadgeDiscount.style.color = "#ffffff";
          } else {
            userBadgeDiscount.hidden = true;
          }
        }

        if (mobileUserBtnText) {
          mobileUserBtnText.textContent = isAdmin
            ? `👑 ${customer.name} (Store Admin)`
            : `${customer.name} (${customer.petName || "Pet Parent"} 🐾)`;
        }

        // Populate Profile Modal
        if (profilePetAvatar) profilePetAvatar.textContent = isAdmin ? "👑" : (customer.petEmoji || "🐶");
        if (profileUserName) profileUserName.textContent = customer.name;
        if (profileUserEmail) profileUserEmail.textContent = customer.email;
        if (profileUserTier) {
          profileUserTier.textContent = isAdmin ? "👑 Store Administrator" : `⭐ ${customer.memberTier || "VIP Paw Member"}`;
          if (isAdmin) {
            profileUserTier.style.background = "linear-gradient(135deg, #FF6B35, #FFD13B)";
            profileUserTier.style.color = "#ffffff";
            profileUserTier.style.fontWeight = "700";
          } else {
            profileUserTier.style.background = "";
            profileUserTier.style.color = "";
            profileUserTier.style.fontWeight = "";
          }
        }
        if (profilePetDisplay) {
          profilePetDisplay.textContent = isAdmin
            ? "Petchup Store Manager 🐾"
            : customer.petName
              ? `${customer.petName} (${customer.petType === "cat" ? "Cat" : "Dog"})`
              : "Paw Lover 🐾";
        }
        refreshCustomerOrderCount(customer);
      } else {
        refreshCustomerOrderCount(null);
        // Logged Out
        if (headerUserBtn) {
          headerUserBtn.classList.remove("is-logged-in");
          headerUserBtn.removeAttribute("title");
        }
        if (userBtnIcon) userBtnIcon.textContent = "👤";
        if (userBtnText) userBtnText.textContent = "Sign In";
        if (userBadgeDiscount) {
          userBadgeDiscount.hidden = false;
          userBadgeDiscount.textContent = "20% OFF";
          userBadgeDiscount.style.background = "";
          userBadgeDiscount.style.color = "";
        }

        if (mobileUserBtnText) {
          mobileUserBtnText.textContent = "Customer Sign In (20% Off)";
        }
      }
    }

    function openAuthModal(mode = "signin") {
      if (customerAuthModal) {
        customerAuthModal.hidden = false;
        switchTab(mode);
      }
    }

    function closeAuthModal() {
      if (customerAuthModal) customerAuthModal.hidden = true;
    }

    function switchTab(mode) {
      if (mode === "register") {
        if (tabSignIn) {
          tabSignIn.classList.remove("active");
          tabSignIn.setAttribute("aria-selected", "false");
        }
        if (tabRegister) {
          tabRegister.classList.add("active");
          tabRegister.setAttribute("aria-selected", "true");
        }
        if (loginForm) loginForm.hidden = true;
        if (registerForm) registerForm.hidden = false;
        if (authSwitchPrompt) {
          authSwitchPrompt.innerHTML = `Already have an account? <a class="auth-switch-link" id="auth-switch-to-sign">Sign In Here</a>`;
          const switchSign = document.getElementById("auth-switch-to-sign");
          if (switchSign) switchSign.addEventListener("click", () => switchTab("signin"));
        }
        if (regName) regName.focus();
      } else {
        if (tabRegister) {
          tabRegister.classList.remove("active");
          tabRegister.setAttribute("aria-selected", "false");
        }
        if (tabSignIn) {
          tabSignIn.classList.add("active");
          tabSignIn.setAttribute("aria-selected", "true");
        }
        if (registerForm) registerForm.hidden = true;
        if (loginForm) loginForm.hidden = false;
        if (authSwitchPrompt) {
          authSwitchPrompt.innerHTML = `Don't have an account yet? <a class="auth-switch-link" id="auth-switch-to-reg">Sign Up Free</a>`;
          const switchReg = document.getElementById("auth-switch-to-reg");
          if (switchReg) switchReg.addEventListener("click", () => switchTab("register"));
        }
        if (loginEmail) loginEmail.focus();
      }
    }

    function openProfileModal() {
      if (customerProfileModal) customerProfileModal.hidden = false;
    }

    function closeProfileModal() {
      if (customerProfileModal) customerProfileModal.hidden = true;
    }

    function openCelebrationModal(customer) {
      if (!celebrationModal) return;

      if (celebrationWelcomeTitle) {
        celebrationWelcomeTitle.textContent = `Welcome to the Petchup Family, ${customer.name}! 🎉`;
      }
      if (celebrationWelcomeSub) {
        celebrationWelcomeSub.textContent = `We're thrilled to welcome you${customer.petName ? " and " + customer.petName : ""} with a VIP first-order gift!`;
      }
      if (celebrationCode) {
        celebrationCode.textContent = customer.firstDiscountCode || "FIRSTPAW20";
      }

      // Load active announcement
      const activeAnn = window.PetchupStore.getActiveAnnouncement();
      if (activeAnn) {
        if (celebrationAnnPill) celebrationAnnPill.textContent = activeAnn.pill || "📢 LIVE ANNOUNCEMENT";
        if (celebrationAnnText) celebrationAnnText.textContent = `${activeAnn.text} 🚚`;
      }

      celebrationModal.hidden = false;
    }

    function closeCelebrationModal() {
      if (celebrationModal) celebrationModal.hidden = true;
      const current = window.PetchupStore.getCurrentCustomer();
      if (current) {
        window.PetchupStore.markCustomerWelcomeSeen(current.id);
      }
    }

    // 4. Forgot Password Flow
    function openForgotPasswordModal() {
      closeAuthModal();
      if (forgotPasswordModal) {
        forgotPasswordModal.hidden = false;
        if (forgotEmail) {
          forgotEmail.value = loginEmail ? loginEmail.value : "";
          forgotEmail.focus();
        }
        if (forgotFeedback) forgotFeedback.hidden = true;
      }
    }

    function closeForgotPasswordModal() {
      if (forgotPasswordModal) forgotPasswordModal.hidden = true;
    }

    if (btnForgotPasswordTrigger) {
      btnForgotPasswordTrigger.addEventListener("click", openForgotPasswordModal);
    }
    if (forgotModalClose) {
      forgotModalClose.addEventListener("click", closeForgotPasswordModal);
    }
    if (btnForgotBackToLogin) {
      btnForgotBackToLogin.addEventListener("click", () => {
        closeForgotPasswordModal();
        openAuthModal("signin");
      });
    }

    if (forgotPasswordForm) {
      forgotPasswordForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = forgotEmail.value.trim();
        const submitBtn = document.getElementById("btn-forgot-submit");
        const originalBtnText = submitBtn ? submitBtn.innerHTML : "";

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = "Sending reset link... ✉️";
        }

        try {
          if (window.PetchupSupabase && window.PetchupSupabase.isConfigured()) {
            const res = await window.PetchupSupabase.sendPasswordResetEmail(email);
            if (forgotFeedback) {
              forgotFeedback.hidden = false;
              if (res.success) {
                forgotFeedback.className = "forgot-feedback feedback-success";
                forgotFeedback.textContent = "✅ Password reset link has been sent to your email! Please check your inbox and spam folder.";
              } else {
                forgotFeedback.className = "forgot-feedback feedback-error";
                forgotFeedback.textContent = `❌ ${res.error || "Could not send reset email. Please verify the email address."}`;
              }
            }
          } else {
            if (forgotFeedback) {
              forgotFeedback.hidden = false;
              forgotFeedback.className = "forgot-feedback feedback-success";
              forgotFeedback.textContent = `✅ Password reset instructions sent to ${email} (Demo mode)!`;
            }
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
          }
        }
      });
    }

    // 5. Header Button Click
    if (headerUserBtn) {
      headerUserBtn.addEventListener("click", () => {
        const customer = window.PetchupStore.getCurrentCustomer();
        if (customer) {
          openProfileModal();
        } else {
          openAuthModal("signin");
        }
      });
    }

    if (mobileUserBtn) {
      mobileUserBtn.addEventListener("click", () => {
        const mobileNav = document.getElementById("mobile-nav");
        if (mobileNav) mobileNav.hidden = true;
        const customer = window.PetchupStore.getCurrentCustomer();
        if (customer) {
          openProfileModal();
        } else {
          openAuthModal("signin");
        }
      });
    }

    // Modal Close buttons
    if (customerAuthClose) customerAuthClose.addEventListener("click", closeAuthModal);
    if (customerProfileClose) customerProfileClose.addEventListener("click", closeProfileModal);

    // Tab buttons
    if (tabSignIn) tabSignIn.addEventListener("click", () => switchTab("signin"));
    if (tabRegister) tabRegister.addEventListener("click", () => switchTab("register"));
    if (authSwitchToReg) authSwitchToReg.addEventListener("click", () => switchTab("register"));

    // Login Form Submit
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = loginEmail.value.trim();
        const pass = loginPassword.value.trim();
        const submitBtn = loginForm.querySelector("button[type='submit']");
        const originalText = submitBtn ? submitBtn.innerHTML : "";

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = "Signing in... 🐾";
        }

        try {
          const result = await window.PetchupStore.loginCustomer(email, pass);
          if (!result.success) {
            alert(result.message);
            loginEmail.focus();
            return;
          }

          closeAuthModal();
          loginEmail.value = "";
          loginPassword.value = "";
          updateUIForCustomer();

          if (result.customer && (result.customer.email.toLowerCase() === "canamoaries13@gmail.com" || result.customer.role === "admin")) {
            showToast(`👑 Welcome Aries! Store Administrator recognized.`);
          } else if (result.isFirstTime) {
            openCelebrationModal(result.customer);
          } else {
            showToast(`🐾 Welcome back, ${result.customer.name}!`);
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
          }
        }
      });
    }

    // Register Form Submit
    if (registerForm) {
      registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const pass = regPassword.value.trim();

        if (pass.length < 8) {
          alert("Password must be at least 8 characters long.");
          regPassword.focus();
          return;
        }

        const data = {
          name: regName.value.trim(),
          email: regEmail.value.trim(),
          password: pass,
          petName: regPetName.value.trim(),
          petType: regPetType.value
        };

        const submitBtn = registerForm.querySelector("button[type='submit']");
        const originalText = submitBtn ? submitBtn.innerHTML : "";

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = "Creating account... 🎁";
        }

        try {
          const result = await window.PetchupStore.registerCustomer(data);
          if (!result.success) {
            alert(result.message);
            return;
          }

          closeAuthModal();
          regName.value = "";
          regEmail.value = "";
          regPassword.value = "";
          regPetName.value = "";
          updateUIForCustomer();

          if (result.emailConfirmationRequired) {
            alert(
              `🎉 Account created! Please check your email inbox (${data.email}) to confirm your account.\n\nTip: You can turn off 'Confirm email' in your Supabase Auth settings if you prefer instant activation.`
            );
          } else {
            openCelebrationModal(result.customer);
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
          }
        }
      });
    }

    // Celebration Modal actions
    if (btnCopyCelebrationCode) {
      btnCopyCelebrationCode.addEventListener("click", () => {
        const code = celebrationCode ? celebrationCode.textContent.trim() : "FIRSTPAW20";
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(() => {
            btnCopyCelebrationCode.textContent = "Copied! ✨";
            window.PetchupStore.applyDiscount(code);
            showToast(`🎉 Coupon ${code} copied & applied!`);
            setTimeout(() => {
              btnCopyCelebrationCode.textContent = "Copy Code 📋";
            }, 2000);
          }).catch(() => {
            window.PetchupStore.applyDiscount(code);
            showToast(`🎉 Coupon ${code} applied to cart!`);
          });
        } else {
          window.PetchupStore.applyDiscount(code);
          showToast(`🎉 Coupon ${code} applied to cart!`);
        }
      });
    }

    if (btnClaimDiscountCart) {
      btnClaimDiscountCart.addEventListener("click", () => {
        const code = celebrationCode ? celebrationCode.textContent.trim() : "FIRSTPAW20";
        window.PetchupStore.applyDiscount(code);
        closeCelebrationModal();
        openCart();
        showToast(`🎉 20% OFF Welcome Discount Applied to your Cart!`);
      });
    }

    if (btnStartShopping) {
      btnStartShopping.addEventListener("click", () => {
        const code = celebrationCode ? celebrationCode.textContent.trim() : "FIRSTPAW20";
        window.PetchupStore.applyDiscount(code);
        closeCelebrationModal();
        if (window.location.pathname.includes("shop.html")) {
          const shopGrid = document.getElementById("shop-grid");
          if (shopGrid) shopGrid.scrollIntoView({ behavior: "smooth" });
        } else {
          window.location.href = "shop.html";
        }
      });
    }

    // Profile actions
    if (profileApplyCodeBtn) {
      profileApplyCodeBtn.addEventListener("click", () => {
        window.PetchupStore.applyDiscount("FIRSTPAW20");
        closeProfileModal();
        openCart();
        showToast("🎉 FIRSTPAW20 (20% OFF) applied to your cart!");
      });
    }

    if (btnProfileReopenWelcome) {
      btnProfileReopenWelcome.addEventListener("click", () => {
        closeProfileModal();
        const current = window.PetchupStore.getCurrentCustomer();
        if (current) openCelebrationModal(current);
      });
    }

    if (btnCustomerLogout) {
      btnCustomerLogout.addEventListener("click", async () => {
        await window.PetchupStore.logoutCustomer();
        closeProfileModal();
        updateUIForCustomer();
        showToast("Logged out of customer account. See you soon! 🐾");
      });
    }

    // Customer Orders Logic
    async function refreshCustomerOrderCount(customer) {
      if (!profileOrderCount) return;
      try {
        const c = customer || window.PetchupStore.getCurrentCustomer();
        const orders = await window.PetchupStore.getCustomerOrders(c?.email, c?.id);
        profileOrderCount.textContent = orders.length;
      } catch (_) {
        profileOrderCount.textContent = "0";
      }
    }

    function openCustomerOrdersModal() {
      if (customerProfileModal) customerProfileModal.hidden = true;
      if (customerOrdersModal) {
        customerOrdersModal.hidden = false;
        renderCustomerOrders();
      }
    }

    function closeCustomerOrdersModal() {
      if (customerOrdersModal) customerOrdersModal.hidden = true;
    }

    async function renderCustomerOrders() {
      if (!customerOrdersContainer) return;
      customerOrdersContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--color-ink-muted);">
          <div style="font-size: 2.2rem; display: inline-block; animation: pulse-dot 1.5s infinite;">🐾</div>
          <p style="margin-top: 8px; font-weight: 600;">Fetching your fur baby's orders...</p>
        </div>
      `;

      const customer = window.PetchupStore.getCurrentCustomer();
      if (ordersModalSubtitle) {
        ordersModalSubtitle.textContent = customer
          ? `Orders for ${customer.name}${customer.petName ? " & " + customer.petName : ""}`
          : "Your recent purchases on this device";
      }

      let orders = [];
      try {
        orders = await window.PetchupStore.getCustomerOrders(customer?.email, customer?.id);
      } catch (err) {
        console.warn("Error fetching customer orders:", err);
        orders = window.PetchupStore.getOrders();
      }

      if (profileOrderCount) profileOrderCount.textContent = orders.length;

      if (!orders || orders.length === 0) {
        customerOrdersContainer.innerHTML = `
          <div class="order-empty-state" style="text-align: center; padding: 2.5rem 1rem;">
            <div style="font-size: 3.5rem; margin-bottom: 12px;">🦴</div>
            <h4 style="margin: 0 0 6px; font-size: 1.2rem; font-family: var(--font-display); color: var(--color-ink);">No Pet Orders Yet!</h4>
            <p style="margin: 0 auto 18px; max-width: 320px; font-size: 0.9rem; color: var(--color-ink-muted); line-height: 1.5;">
              Your fur baby is waiting for yummy crunchies and fun toys. Explore the shop to place your first haul!
            </p>
            <a href="shop.html" class="btn btn-primary btn-pill" id="btn-empty-shop-now" style="display: inline-block;">
              Shop Pet Goodies 🛒
            </a>
          </div>
        `;
        const shopNowBtn = document.getElementById("btn-empty-shop-now");
        if (shopNowBtn) {
          shopNowBtn.addEventListener("click", () => {
            closeCustomerOrdersModal();
          });
        }
        return;
      }

      let html = `<div class="orders-list-stack" style="display: flex; flex-direction: column; gap: 14px;">`;

      orders.forEach((ord) => {
        const meta = window.PetchupStore.getOrderStatusMeta(ord.status);
        const dateStr = ord.created_at
          ? new Date(ord.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })
          : "Recently";

        const itemsList = Array.isArray(ord.items) ? ord.items : [];
        const itemsSummaryHTML = itemsList
          .map(
            (it) => `
          <div class="order-item-row" style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed rgba(41, 27, 37, 0.08); font-size: 0.88rem;">
            <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 70%;">
              <span style="font-size: 1.2rem;">${it.img || "🦴"}</span>
              <span style="color: var(--color-ink); font-weight: 500;" title="${it.name}">${it.name}</span>
              <span style="color: var(--color-ink-muted); font-size: 0.8rem;">×${it.qty || 1}</span>
            </div>
            <div style="font-weight: 700; color: var(--color-ink);">
              ₱${(Number(it.price || 0) * (it.qty || 1)).toFixed(2)}
            </div>
          </div>
        `
          )
          .join("");

        const discountBadge = ord.discount_code
          ? `<span class="order-discount-pill" style="font-size: 0.74rem; background: rgba(255, 107, 53, 0.12); color: var(--color-orange); padding: 2px 8px; border-radius: 999px; font-weight: 700;">Code: ${ord.discount_code} (-₱${Number(ord.discount_amount || 0).toFixed(2)})</span>`
          : "";

        html += `
          <div class="order-receipt-card" data-order-id="${ord.id}" style="background: #ffffff; border: 1.5px solid rgba(41, 27, 37, 0.08); border-radius: 16px; padding: 16px 18px; box-shadow: 0 4px 12px rgba(41, 27, 37, 0.04); transition: transform 0.2s ease, box-shadow 0.2s ease;">
            <div class="order-card-top" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
              <div>
                <span style="font-family: monospace; font-size: 0.82rem; font-weight: 700; color: var(--color-ink-muted); background: #FAF7F2; padding: 2px 7px; border-radius: 6px; border: 1px solid rgba(41, 27, 37, 0.08);">
                  #${ord.id}
                </span>
                <span style="font-size: 0.78rem; color: var(--color-ink-muted); margin-left: 8px;">${dateStr}</span>
              </div>
              <span class="status-pill ${meta.pillClass}">
                <span class="status-indicator"></span>
                <span>${meta.emoji} ${meta.label}</span>
              </span>
            </div>

            <div class="order-items-wrapper" style="margin-bottom: 12px;">
              ${itemsSummaryHTML}
            </div>

            <div class="order-card-footer" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; padding-top: 8px; border-top: 1px solid rgba(41, 27, 37, 0.06);">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 0.85rem; color: var(--color-ink-muted);">Total:</span>
                <strong style="font-size: 1.15rem; color: var(--color-ink); font-family: var(--font-display);">₱${Number(ord.total || 0).toFixed(2)}</strong>
                ${discountBadge}
              </div>
              <button type="button" class="btn btn-outline btn-pill btn-sm btn-reorder" data-order-id="${ord.id}" style="font-size: 0.8rem; padding: 5px 12px; font-weight: 700; border-color: var(--color-teal); color: var(--color-teal);">
                Reorder Items 🛒
              </button>
            </div>
          </div>
        `;
      });

      html += `</div>`;
      customerOrdersContainer.innerHTML = html;

      // Attach reorder listeners
      customerOrdersContainer.querySelectorAll(".btn-reorder").forEach((btn) => {
        btn.addEventListener("click", () => {
          const ordId = btn.getAttribute("data-order-id");
          const targetOrd = orders.find((o) => o.id === ordId);
          if (!targetOrd || !targetOrd.items || targetOrd.items.length === 0) return;

          let addedCount = 0;
          targetOrd.items.forEach((it) => {
            const qtyToAdd = it.qty || 1;
            const existing = cart.find((c) => c.id === it.id);
            if (existing) {
              existing.qty += qtyToAdd;
            } else {
              cart.push({
                id: it.id,
                name: it.name,
                price: it.price,
                qty: qtyToAdd,
                img: it.img || "🦴"
              });
            }
            addedCount += qtyToAdd;
          });

          saveCart(cart);
          renderCart();
          closeCustomerOrdersModal();
          openCart();
          showToast(`🎉 Re-added ${addedCount} item${addedCount > 1 ? "s" : ""} to your cart!`);
        });
      });
    }

    if (btnProfileViewOrders) btnProfileViewOrders.addEventListener("click", openCustomerOrdersModal);
    if (customerOrdersClose) customerOrdersClose.addEventListener("click", closeCustomerOrdersModal);
    if (customerOrdersDone) customerOrdersDone.addEventListener("click", closeCustomerOrdersModal);
    if (btnRefreshCustomerOrders) btnRefreshCustomerOrders.addEventListener("click", renderCustomerOrders);

    // Close on backdrop click
    [customerAuthModal, celebrationModal, customerProfileModal, customerOrdersModal, forgotPasswordModal].forEach((modal) => {
      if (!modal) return;
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.hidden = true;
          if (modal === celebrationModal) {
            const current = window.PetchupStore.getCurrentCustomer();
            if (current) window.PetchupStore.markCustomerWelcomeSeen(current.id);
          }
        }
      });
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (customerAuthModal && !customerAuthModal.hidden) closeAuthModal();
        if (customerProfileModal && !customerProfileModal.hidden) closeProfileModal();
        if (customerOrdersModal && !customerOrdersModal.hidden) closeCustomerOrdersModal();
        if (celebrationModal && !celebrationModal.hidden) closeCelebrationModal();
        if (forgotPasswordModal && !forgotPasswordModal.hidden) closeForgotPasswordModal();
      }
    });

    // Listen to orders updated across tabs
    window.addEventListener("petchup:orders-updated", () => {
      refreshCustomerOrderCount();
      if (customerOrdersModal && !customerOrdersModal.hidden) {
        renderCustomerOrders();
      }
    });

    // Listen to customer auth changes across tabs
    window.addEventListener("petchup:customer-updated", updateUIForCustomer);
    window.addEventListener("storage", (e) => {
      if (e.key === "petchup_current_customer") {
        updateUIForCustomer();
      }
    });

    // Handle Password Recovery flow from URL
    if (window.location.hash.includes("type=recovery") || window.location.search.includes("type=recovery")) {
      setTimeout(async () => {
        const newPass = prompt("🔐 Enter your new PETCHUP password (min. 8 characters):");
        if (newPass && newPass.length >= 8) {
          if (window.PetchupSupabase) {
            const res = await window.PetchupSupabase.updatePassword(newPass);
            if (res.success) {
              alert("✨ Your password has been successfully updated! You are now logged in.");
              updateUIForCustomer();
            } else {
              alert("Could not update password: " + res.error);
            }
          }
        }
      }, 500);
    }

    // Initial check
    updateUIForCustomer();
  }

  /* ==========================================================================
     SPOTLIGHT CARDS (Pointer-Tracking Radial Glow from spotlight_card.md)
     ========================================================================== */
  function initSpotlightCards() {
    const cards = document.querySelectorAll(".pop-feature-card[data-glow], .plp-hero-card[data-glow]");
    if (!cards.length) return;

    cards.forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
        card.style.setProperty("--xp", (x / rect.width).toFixed(3));
        card.style.setProperty("--yp", (y / rect.height).toFixed(3));
      });

      card.addEventListener("pointerleave", () => {
        card.style.removeProperty("--mouse-x");
        card.style.removeProperty("--mouse-y");
      });
    });
  }

  /* ==========================================================================
     INITIALIZATION
     ========================================================================== */
  document.addEventListener("DOMContentLoaded", () => {
    initAnnouncementBanner();
    initCartSystem();
    initFeaturedProducts();
    initProductListingPage();
    initPromoForm();
    initMobileNav();
    initCustomerAuthAndCelebration();
    initSpotlightCards();
  });
})();
