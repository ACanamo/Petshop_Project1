/**
 * PETCHUP — STORE ADMIN JAVASCRIPT
 * Powers the interactive store management dashboard, CRUD operations, and live previews.
 */

(function () {
  "use strict";

  // Elements
  const authModal = document.getElementById("auth-modal-backdrop");
  const authForm = document.getElementById("admin-login-form");
  const authEmail = document.getElementById("auth-email");
  const authPassword = document.getElementById("auth-password");
  const adminAuthError = document.getElementById("admin-auth-error");
  const adminLoginSubmit = document.getElementById("admin-login-submit");
  const logoutBtn = document.getElementById("logout-btn");
  const currentUserName = document.getElementById("current-user-name");

  // Metrics
  const metricTotalProducts = document.getElementById("metric-total-products");
  const metricFeeds = document.getElementById("metric-feeds-count");
  const metricAccessories = document.getElementById("metric-accessories-count");
  const metricAnnouncements = document.getElementById("metric-announcements-count");
  const tabCountProducts = document.getElementById("tab-count-products");
  const tabCountAnnouncements = document.getElementById("tab-count-announcements");

  // Tabs
  const tabButtons = document.querySelectorAll(".admin-tab-btn");
  const tabContents = document.querySelectorAll(".admin-tab-content");

  // Products Table & Filters
  const productsTbody = document.getElementById("admin-products-tbody");
  const productsEmpty = document.getElementById("admin-products-empty");
  const productSearch = document.getElementById("admin-product-search");
  const categoryFilter = document.getElementById("admin-category-filter");
  const petFilter = document.getElementById("admin-pet-filter");
  const stockFilter = document.getElementById("admin-stock-filter");

  // Product Modal & Fields
  const productModal = document.getElementById("product-modal-backdrop");
  const productForm = document.getElementById("product-form");
  const productModalTitle = document.getElementById("product-modal-title");
  const productModalClose = document.getElementById("product-modal-close");
  const productModalCancel = document.getElementById("product-modal-cancel");
  const productModalSubmit = document.getElementById("product-modal-submit");
  const btnOpenAddProduct = document.getElementById("btn-open-add-product");
  const btnQuickAddProduct = document.getElementById("btn-quick-add-product");
  const btnEmptyAddProduct = document.getElementById("btn-empty-add-product");
  const btnViewPriceHistory = document.getElementById("btn-view-price-history");

  const formProductId = document.getElementById("form-product-id");
  const formProductSku = document.getElementById("form-product-sku");
  const formProductStockQty = document.getElementById("form-product-stock-qty");
  const formProductName = document.getElementById("form-product-name");
  const formProductCategory = document.getElementById("form-product-category");
  const formProductPet = document.getElementById("form-product-pet");
  const formProductPrice = document.getElementById("form-product-price");
  const formProductOrigPrice = document.getElementById("form-product-orig-price");
  const formProductImg = document.getElementById("form-product-img");
  const formProductBadge = document.getElementById("form-product-badge");
  const formProductUnit = document.getElementById("form-product-unit");
  const formProductDesc = document.getElementById("form-product-desc");
  const formProductStock = document.getElementById("form-product-stock");
  const presetEmojiBtns = document.querySelectorAll(".preset-emoji-btn");

  // Product Image Upload & Preview Elements
  const productDropzone = document.getElementById("product-dropzone");
  const formProductFile = document.getElementById("form-product-file");
  const formProductImageUrl = document.getElementById("form-product-image-url");
  const productImagePreviewBox = document.getElementById("product-image-preview-box");
  const productImagePreviewThumb = document.getElementById("product-image-preview-thumb");
  const productImagePreviewTitle = document.getElementById("product-image-preview-title");
  const productImagePreviewSize = document.getElementById("product-image-preview-size");
  const btnRemoveProductImage = document.getElementById("btn-remove-product-image");
  let currentUploadedFile = null;

  // Price History Modal Elements
  const priceHistoryModal = document.getElementById("price-history-modal");
  const priceHistoryClose = document.getElementById("price-history-close");
  const priceHistoryProdName = document.getElementById("price-history-prod-name");
  const priceHistoryTableContainer = document.getElementById("price-history-table-container");

  // Announcements Table & Modal Elements
  const announcementsTbody = document.getElementById("admin-announcements-tbody");
  const livePreviewBanner = document.getElementById("live-preview-banner");
  const btnOpenAddAnnouncement = document.getElementById("btn-open-add-announcement");
  const btnQuickAddAnnouncement = document.getElementById("btn-quick-add-announcement");

  const announcementModal = document.getElementById("announcement-modal-backdrop");
  const announcementForm = document.getElementById("announcement-form");
  const announcementModalTitle = document.getElementById("announcement-modal-title");
  const announcementModalClose = document.getElementById("announcement-modal-close");
  const announcementModalCancel = document.getElementById("announcement-modal-cancel");

  const formAnnId = document.getElementById("form-announcement-id");
  const formAnnPill = document.getElementById("form-ann-pill");
  const formAnnTitle = document.getElementById("form-ann-title");
  const formAnnStart = document.getElementById("form-ann-start");
  const formAnnEnd = document.getElementById("form-ann-end");
  const formAnnText = document.getElementById("form-ann-text");
  const formAnnLink = document.getElementById("form-ann-link");
  const formAnnLinkText = document.getElementById("form-ann-link-text");
  const formAnnActive = document.getElementById("form-ann-active");

  // Tools & Sync Elements
  const btnExportData = document.getElementById("btn-export-data");
  const importFileInput = document.getElementById("import-file-input");
  const btnSyncCloudRefresh = document.getElementById("btn-sync-cloud-refresh");

  // Orders Manager Elements
  const tabCountOrders = document.getElementById("tab-count-orders");
  const metricTotalOrders = document.getElementById("metric-total-orders");
  const metricTotalRevenue = document.getElementById("metric-total-revenue");
  const adminOrderSearch = document.getElementById("admin-order-search");
  const adminOrderStatusFilter = document.getElementById("admin-order-status-filter");
  const adminOrderSort = document.getElementById("admin-order-sort");
  const btnRefreshOrders = document.getElementById("btn-refresh-orders");
  const btnClearAllOrders = document.getElementById("btn-clear-all-orders");
  const adminOrdersTbody = document.getElementById("admin-orders-tbody");
  const ordersVisibleCount = document.getElementById("orders-visible-count");
  const ordersRevenueSummary = document.getElementById("orders-revenue-summary");

  // Order Details Modal Elements
  const orderDetailsModal = document.getElementById("order-details-modal-backdrop");
  const orderDetailsClose = document.getElementById("order-details-close");
  const orderDetailsModalCloseBtn = document.getElementById("order-details-modal-close-btn");
  const modalOrderId = document.getElementById("modal-order-id");
  const modalOrderDate = document.getElementById("modal-order-date");
  const modalOrderStatusBadge = document.getElementById("modal-order-status-badge");
  const modalOrderCustomerName = document.getElementById("modal-order-customer-name");
  const modalOrderCustomerEmail = document.getElementById("modal-order-customer-email");
  const modalOrderPetName = document.getElementById("modal-order-pet-name");
  const modalOrderItemsTbody = document.getElementById("modal-order-items-tbody");
  const modalOrderSubtotal = document.getElementById("modal-order-subtotal");
  const modalOrderDiscountRow = document.getElementById("modal-order-discount-row");
  const modalOrderDiscountCode = document.getElementById("modal-order-discount-code");
  const modalOrderDiscountAmount = document.getElementById("modal-order-discount-amount");
  const modalOrderGrandTotal = document.getElementById("modal-order-grand-total");
  const modalOrderChangeStatus = document.getElementById("modal-order-change-status");
  const btnSaveOrderStatus = document.getElementById("btn-save-order-status");
  const btnDeleteOrder = document.getElementById("btn-delete-order");
  const btnPrintInvoice = document.getElementById("btn-print-invoice");
  let currentDetailOrderId = null;

  // Toast
  const toast = document.getElementById("admin-toast");
  const toastMessage = document.getElementById("admin-toast-message");
  let toastTimeout;

  function showToast(msg) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = msg;
    toast.classList.add("is-active");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove("is-active");
    }, 2800);
  }

  /* ==========================================================================
     1. AUTHENTICATION & ROLE MANAGEMENT
     ========================================================================== */
  async function checkAuth() {
    // 1. If Supabase is configured, verify active customer session
    if (window.PetchupSupabase && window.PetchupSupabase.isConfigured()) {
      try {
        const activeCustomer = await window.PetchupSupabase.getActiveSessionCustomer();
        if (activeCustomer && (activeCustomer.role === "admin" || (activeCustomer.email && activeCustomer.email.toLowerCase() === "canamoaries13@gmail.com"))) {
          activeCustomer.role = "admin";
          window.PetchupStore.setCurrentCustomer(activeCustomer);
        }
      } catch (e) {
        console.warn("Could not sync Supabase session in admin:", e);
      }
    }

    const isOwner = window.PetchupStore.isAdmin();
    const auth = window.PetchupStore.getAuth();
    const current = window.PetchupStore.getCurrentCustomer();

    if (isOwner) {
      if (authModal) authModal.hidden = true;
      if (currentUserName) {
        currentUserName.textContent = (current && (current.name ? `${current.name} (${current.email})` : current.email)) || auth.email || "canamoaries13@gmail.com (Store Administrator)";
      }
    } else {
      if (authModal) authModal.hidden = false;
      if (authEmail && !authEmail.value) {
        authEmail.value = "canamoaries13@gmail.com";
      }
      if (authPassword) authPassword.focus();
    }
  }

  // Password Visibility Toggle for Admin Login
  const adminToggleBtns = document.querySelectorAll(".btn-toggle-password");
  adminToggleBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const targetInput = targetId ? document.getElementById(targetId) : null;
      if (!targetInput) return;
      const isPass = targetInput.type === "password";
      targetInput.type = isPass ? "text" : "password";
      btn.textContent = isPass ? "🙈" : "👁️";
    });
  });

  if (authForm) {
    authForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = authEmail ? authEmail.value.trim() : "";
      const pass = authPassword ? authPassword.value.trim() : "";

      if (adminAuthError) adminAuthError.hidden = true;

      if (adminLoginSubmit) {
        adminLoginSubmit.disabled = true;
        adminLoginSubmit.textContent = "Verifying admin access... 🔐";
      }

      try {
        const res = await window.PetchupStore.loginAdmin(email, pass);
        if (res.success) {
          if (authModal) authModal.hidden = true;
          if (authPassword) authPassword.value = "";
          if (currentUserName) currentUserName.textContent = email;
          showToast("👑 Welcome, Store Administrator!");
          renderAll();
        } else {
          if (adminAuthError) {
            adminAuthError.hidden = false;
            adminAuthError.textContent = `❌ ${res.message || "Invalid administrator credentials."}`;
          } else {
            alert(res.message || "Invalid administrator credentials.");
          }
          if (authPassword) authPassword.select();
        }
      } finally {
        if (adminLoginSubmit) {
          adminLoginSubmit.disabled = false;
          adminLoginSubmit.textContent = "Log In as Admin 🔐";
        }
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      window.PetchupStore.logout();
      showToast("Signed out of Admin Mode.");
      checkAuth();
    });
  }

  /* ==========================================================================
     2. TAB NAVIGATION
     ========================================================================== */
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      tabContents.forEach((c) => {
        c.classList.remove("is-active");
        c.hidden = true;
      });

      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      const targetId = btn.dataset.tab;
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add("is-active");
        targetContent.hidden = false;
      }
    });
  });

  /* ==========================================================================
     3. METRICS REFRESH
     ========================================================================== */
  function renderMetrics() {
    const products = window.PetchupStore.getProducts();
    const announcements = window.PetchupStore.getAnnouncements();
    const orders = window.PetchupStore.getOrders();

    const total = products.length;
    const feeds = products.filter((p) => p.category === "feeds").length;
    const accessories = products.filter((p) => p.category === "accessories").length;
    const activeAnn = announcements.filter((a) => a.isActive).length;
    const totalOrdersCount = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    if (metricTotalProducts) metricTotalProducts.textContent = total;
    if (metricFeeds) metricFeeds.textContent = feeds;
    if (metricAccessories) metricAccessories.textContent = accessories;
    if (metricAnnouncements) metricAnnouncements.textContent = activeAnn;
    if (metricTotalOrders) metricTotalOrders.textContent = totalOrdersCount;
    if (metricTotalRevenue) metricTotalRevenue.textContent = `₱${Math.round(totalRevenue).toLocaleString()}`;
    if (tabCountProducts) tabCountProducts.textContent = total;
    if (tabCountAnnouncements) tabCountAnnouncements.textContent = announcements.length;
    if (tabCountOrders) tabCountOrders.textContent = totalOrdersCount;
  }

  /* ==========================================================================
     4. PRODUCT CATALOG MANAGEMENT
     ========================================================================== */
  function renderProductsTable() {
    if (!productsTbody) return;

    const products = window.PetchupStore.getProducts();
    const searchVal = (productSearch?.value || "").toLowerCase().trim();
    const catVal = categoryFilter?.value || "all";
    const petVal = petFilter?.value || "all";
    const stockVal = stockFilter?.value || "all";

    const filtered = products.filter((p) => {
      const matchSearch =
        !searchVal ||
        p.name.toLowerCase().includes(searchVal) ||
        (p.desc && p.desc.toLowerCase().includes(searchVal)) ||
        p.category.toLowerCase().includes(searchVal);
      const matchCat = catVal === "all" || p.category === catVal;
      const matchPet = petVal === "all" || p.pet === petVal || p.pet === "all";
      const matchStock =
        stockVal === "all" ||
        (stockVal === "instock" && p.inStock) ||
        (stockVal === "outofstock" && !p.inStock);

      return matchSearch && matchCat && matchPet && matchStock;
    });

    if (filtered.length === 0) {
      productsTbody.innerHTML = "";
      if (productsEmpty) productsEmpty.hidden = false;
      return;
    }

    if (productsEmpty) productsEmpty.hidden = true;

    productsTbody.innerHTML = filtered
      .map((p) => {
        const petLabel =
          p.pet === "dog" ? "🐶 Dogs" : p.pet === "cat" ? "🐱 Cats" : "🐶 & 🐱 All Pets";
        const badgeHTML = p.badge
          ? `<span class="admin-badge-tag ${p.badgeClass || ""}">${escapeHTML(p.badge)}</span>`
          : `<span class="text-muted">—</span>`;
        const origPriceHTML =
          p.originalPrice && p.originalPrice > p.price
            ? `<div class="orig-price-strike">₱${p.originalPrice.toFixed(2)}</div>`
            : "";

        const cellEmoji = window.PetchupStore && window.PetchupStore.decodeMojibake
          ? window.PetchupStore.decodeMojibake(p.img || "🐾")
          : (p.img || "🐾");

        const imgHTML = p.imageUrl
          ? `<img src="${escapeHTML(p.imageUrl)}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; border: 1px solid var(--color-border); background:#fff;" alt="${escapeHTML(p.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
             <span class="product-cell-emoji" style="display:none;">${escapeHTML(cellEmoji)}</span>`
          : `<span class="product-cell-emoji">${escapeHTML(cellEmoji)}</span>`;

        const skuText = p.sku ? escapeHTML(p.sku) : ("SKU-" + p.id);
        const historyCount = Array.isArray(p.priceHistory) ? p.priceHistory.length : 1;
        const stockQty = p.stockQuantity !== undefined ? p.stockQuantity : (p.inStock ? 10 : 0);

        return `
          <tr data-id="${p.id}" class="${!p.inStock ? "row-out-of-stock" : ""}">
            <td>
              <div class="product-cell-flex">
                ${imgHTML}
                <div>
                  <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                    <strong class="product-cell-name">${escapeHTML(p.name)}</strong>
                    <span style="font-size: 0.72rem; color: var(--color-ink-muted); font-family: monospace; background: #FAF7F2; border: 1px solid var(--color-border); padding: 1px 5px; border-radius: 4px;">${skuText}</span>
                  </div>
                  <div class="product-cell-sub">${escapeHTML(p.desc || "").substring(0, 60)}...</div>
                </div>
              </div>
            </td>
            <td>
              <span class="admin-cat-pill cat-${p.category}">
                ${escapeHTML(p.categoryLabel || window.PetchupStore.getCategoryLabel(p.category))}
              </span>
            </td>
            <td>
              <span class="admin-pet-pill">${petLabel}</span>
            </td>
            <td>
              <div class="price-cell">
                <strong>₱${p.price.toFixed(2)}</strong>
                ${origPriceHTML}
                <button type="button" class="btn-price-history-trigger row-history-btn" data-id="${p.id}" title="View recorded price changes">
                  📈 History (${historyCount})
                </button>
              </div>
            </td>
            <td>${badgeHTML}</td>
            <td>
              <button type="button" 
                      class="stock-toggle-btn ${p.inStock ? "is-instock" : "is-soldout"}" 
                      data-id="${p.id}" 
                      title="Click to toggle In Stock / Out of Stock">
                ${p.inStock ? `🟢 In Stock (${stockQty})` : "🔴 Sold Out (0)"}
              </button>
            </td>
            <td class="text-right">
              <div class="action-btn-group">
                <button type="button" class="action-btn edit-product-btn" data-id="${p.id}" title="Edit Listing">
                  ✏️ Edit
                </button>
                <button type="button" class="action-btn action-delete delete-product-btn" data-id="${p.id}" title="Delete Listing">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    // Attach row events
    productsTbody.querySelectorAll(".stock-toggle-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const prod = window.PetchupStore.getProductById(id);
        if (prod) {
          const newStock = !prod.inStock;
          const newQty = newStock ? (prod.stockQuantity > 0 ? prod.stockQuantity : 10) : 0;
          window.PetchupStore.updateProduct(id, { inStock: newStock, stockQuantity: newQty });
          showToast(`Updated "${prod.name}" to ${newStock ? "In Stock (" + newQty + ")" : "Out of Stock"}`);
          renderProductsTable();
          renderMetrics();
        }
      });
    });

    productsTbody.querySelectorAll(".row-history-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const prod = window.PetchupStore.getProductById(btn.dataset.id);
        if (prod) openPriceHistoryModal(prod);
      });
    });

    productsTbody.querySelectorAll(".edit-product-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        openEditProductModal(btn.dataset.id);
      });
    });

    productsTbody.querySelectorAll(".delete-product-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const prod = window.PetchupStore.getProductById(id);
        if (prod && confirm(`Are you sure you want to delete "${prod.name}" from your catalog?`)) {
          window.PetchupStore.deleteProduct(id);
          showToast(`🗑️ Deleted "${prod.name}"`);
          renderProductsTable();
          renderMetrics();
        }
      });
    });
  }

  // Filter Listeners
  if (productSearch) productSearch.addEventListener("input", renderProductsTable);
  if (categoryFilter) categoryFilter.addEventListener("change", renderProductsTable);
  if (petFilter) petFilter.addEventListener("change", renderProductsTable);
  if (stockFilter) stockFilter.addEventListener("change", renderProductsTable);

  // Preset Emoji picker click
  presetEmojiBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (formProductImg) formProductImg.value = btn.dataset.emoji;
    });
  });

  // Product Image Upload & Preview Handling
  function showImagePreview(src, title = "Image selected", sizeText = "") {
    if (productImagePreviewThumb) productImagePreviewThumb.src = src;
    if (productImagePreviewTitle) productImagePreviewTitle.textContent = title;
    if (productImagePreviewSize) productImagePreviewSize.textContent = sizeText;
    if (productImagePreviewBox) productImagePreviewBox.hidden = false;
  }

  function clearImagePreview() {
    currentUploadedFile = null;
    if (formProductFile) formProductFile.value = "";
    if (formProductImageUrl) formProductImageUrl.value = "";
    if (productImagePreviewBox) productImagePreviewBox.hidden = true;
  }

  function handleFileSelect(file) {
    if (!file || !file.type.startsWith("image/")) {
      alert("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }
    currentUploadedFile = file;
    const objectUrl = URL.createObjectURL(file);
    const sizeKb = (file.size / 1024).toFixed(1) + " KB";
    showImagePreview(objectUrl, file.name, sizeKb);
  }

  if (productDropzone && formProductFile) {
    productDropzone.addEventListener("click", () => formProductFile.click());
    productDropzone.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        formProductFile.click();
      }
    });
    productDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      productDropzone.style.borderColor = "var(--color-primary)";
    });
    productDropzone.addEventListener("dragleave", () => {
      productDropzone.style.borderColor = "";
    });
    productDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      productDropzone.style.borderColor = "";
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });
  }

  if (formProductFile) {
    formProductFile.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  if (formProductImageUrl) {
    formProductImageUrl.addEventListener("input", () => {
      const url = formProductImageUrl.value.trim();
      if (url && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:"))) {
        currentUploadedFile = null;
        showImagePreview(url, "Remote Image URL", "Direct Link");
      } else if (!currentUploadedFile) {
        if (productImagePreviewBox) productImagePreviewBox.hidden = true;
      }
    });
  }

  if (btnRemoveProductImage) {
    btnRemoveProductImage.addEventListener("click", clearImagePreview);
  }

  // Price History Modal
  function openPriceHistoryModal(prod) {
    if (!priceHistoryModal || !prod) return;
    if (priceHistoryProdName) {
      priceHistoryProdName.textContent = `${prod.name} (Current: ₱${prod.price.toFixed(2)})`;
    }
    const history = Array.isArray(prod.priceHistory) && prod.priceHistory.length > 0
      ? prod.priceHistory
      : [{ price: prod.price, changed_at: new Date().toISOString(), note: "Initial catalog listing" }];

    if (priceHistoryTableContainer) {
      priceHistoryTableContainer.innerHTML = `
        <table class="price-history-table">
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>Price</th>
              <th>Reason / Note</th>
            </tr>
          </thead>
          <tbody>
            ${history
              .map((h) => {
                const d = new Date(h.changed_at);
                const dateStr = isNaN(d.getTime()) ? h.changed_at : `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                return `
                  <tr>
                    <td style="color: var(--color-ink-muted); font-size: 0.8rem;">${dateStr}</td>
                    <td><span class="price-chip">₱${parseFloat(h.price).toFixed(2)}</span></td>
                    <td style="color: var(--color-ink-soft); font-size: 0.82rem;">${escapeHTML(h.note || "Price adjustment")}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      `;
    }
    priceHistoryModal.hidden = false;
  }

  if (priceHistoryClose) {
    priceHistoryClose.addEventListener("click", () => {
      if (priceHistoryModal) priceHistoryModal.hidden = true;
    });
  }
  if (priceHistoryModal) {
    priceHistoryModal.addEventListener("click", (e) => {
      if (e.target === priceHistoryModal) priceHistoryModal.hidden = true;
    });
  }

  // Open Add Product Modal
  function openAddProductModal() {
    if (!productModal || !productForm) return;
    productModalTitle.textContent = "Add New Product Listing 🐾";
    formProductId.value = "";
    if (formProductSku) formProductSku.value = "PET-" + Math.floor(1000 + Math.random() * 9000);
    if (formProductStockQty) formProductStockQty.value = "15";
    formProductName.value = "";
    formProductCategory.value = "feeds";
    formProductPet.value = "dog";
    formProductPrice.value = "";
    formProductOrigPrice.value = "";
    formProductImg.value = "🥩";
    formProductBadge.value = "";
    formProductUnit.value = "";
    formProductDesc.value = "";
    formProductStock.checked = true;
    clearImagePreview();

    if (btnViewPriceHistory) btnViewPriceHistory.hidden = true;

    productModal.hidden = false;
    formProductName.focus();
  }

  function fileToDataUrl(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  }

  // Open Edit Product Modal
  function openEditProductModal(id) {
    const prod = window.PetchupStore.getProductById(id);
    if (!prod) return;

    productModalTitle.textContent = `Edit Listing: ${prod.name} ✏️`;
    formProductId.value = prod.id;
    if (formProductSku) formProductSku.value = prod.sku || ("PET-" + prod.id);
    if (formProductStockQty) formProductStockQty.value = prod.stockQuantity !== undefined ? prod.stockQuantity : 10;
    formProductName.value = prod.name;
    formProductCategory.value = prod.category;
    formProductPet.value = prod.pet;
    formProductPrice.value = prod.price;
    formProductOrigPrice.value = prod.originalPrice || "";
    formProductImg.value = window.PetchupStore && window.PetchupStore.cleanProductEmoji
      ? window.PetchupStore.cleanProductEmoji(prod.img, prod.category, prod.id)
      : (prod.img || "🐾");
    formProductBadge.value = prod.badge || "";
    formProductUnit.value = prod.unit || "";
    formProductDesc.value = prod.desc || "";
    formProductStock.checked = prod.inStock !== false;

    clearImagePreview();
    if (prod.imageUrl) {
      if (formProductImageUrl) formProductImageUrl.value = prod.imageUrl;
      showImagePreview(prod.imageUrl, "Current Product Photo", "Saved");
    }

    if (btnViewPriceHistory) {
      btnViewPriceHistory.hidden = false;
      btnViewPriceHistory.onclick = () => openPriceHistoryModal(prod);
    }

    productModal.hidden = false;
    formProductName.focus();
  }

  function closeProductModal() {
    if (productModal) productModal.hidden = true;
  }

  if (btnOpenAddProduct) btnOpenAddProduct.addEventListener("click", openAddProductModal);
  if (btnQuickAddProduct) btnQuickAddProduct.addEventListener("click", openAddProductModal);
  if (btnEmptyAddProduct) btnEmptyAddProduct.addEventListener("click", openAddProductModal);
  if (productModalClose) productModalClose.addEventListener("click", closeProductModal);
  if (productModalCancel) productModalCancel.addEventListener("click", closeProductModal);

  // Save Product Form
  if (productForm) {
    productForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = formProductId.value;
      const sku = formProductSku ? formProductSku.value.trim().toUpperCase() : "";
      const stockQty = formProductStockQty ? parseInt(formProductStockQty.value, 10) : 10;
      let finalImageUrl = formProductImageUrl ? formProductImageUrl.value.trim() : "";

      if (productModalSubmit) {
        productModalSubmit.disabled = true;
        productModalSubmit.textContent = "Saving product... 🐾";
      }

      try {
        // Upload image to Supabase Storage if file chosen, with automatic Data URL fallback
        if (currentUploadedFile) {
          let uploadedUrl = null;
          if (window.PetchupSupabase && window.PetchupSupabase.isConfigured()) {
            productModalSubmit.textContent = "Uploading photo to Supabase Storage... ☁️";
            try {
              const uploadRes = await window.PetchupSupabase.uploadProductImage(currentUploadedFile);
              if (uploadRes && uploadRes.success && (uploadRes.url || uploadRes.publicUrl)) {
                uploadedUrl = uploadRes.url || uploadRes.publicUrl;
              } else {
                console.warn("Storage upload did not return URL, falling back to local image data:", uploadRes ? uploadRes.error : "Unknown");
              }
            } catch (err) {
              console.warn("Storage upload exception:", err);
            }
          }

          if (uploadedUrl) {
            finalImageUrl = uploadedUrl;
          } else {
            // Bulletproof fallback: convert to base64 Data URL so the photo ALWAYS appears!
            productModalSubmit.textContent = "Processing image locally... 📸";
            finalImageUrl = await fileToDataUrl(currentUploadedFile);
          }
        }

        const rawImg = formProductImg.value.trim();
        const cleanImg = window.PetchupStore && window.PetchupStore.cleanProductEmoji
          ? window.PetchupStore.cleanProductEmoji(rawImg, formProductCategory.value, id)
          : (rawImg || "🐾");

        const data = {
          sku: sku,
          stockQuantity: isNaN(stockQty) ? 10 : stockQty,
          name: formProductName.value.trim(),
          category: formProductCategory.value,
          pet: formProductPet.value,
          price: parseFloat(formProductPrice.value) || 0,
          originalPrice: parseFloat(formProductOrigPrice.value) || 0,
          imageUrl: finalImageUrl,
          img: cleanImg,
          badge: formProductBadge.value.trim(),
          unit: formProductUnit.value.trim(),
          desc: formProductDesc.value.trim(),
          inStock: formProductStock.checked && stockQty > 0
        };

        if (!data.name || data.price <= 0) {
          alert("Please enter a valid product name and price!");
          return;
        }

        if (id) {
          window.PetchupStore.updateProduct(id, data);
          showToast(`✨ Updated "${data.name}"`);
        } else {
          window.PetchupStore.addProduct(data);
          showToast(`🎉 Added new product "${data.name}"!`);
        }

        closeProductModal();
        renderProductsTable();
        renderMetrics();
      } finally {
        if (productModalSubmit) {
          productModalSubmit.disabled = false;
          productModalSubmit.textContent = "Save Product 🐾";
        }
      }
    });
  }

  /* ==========================================================================
     5. ANNOUNCEMENTS & BANNERS MANAGEMENT
     ========================================================================== */
  function renderAnnouncements() {
    if (!announcementsTbody) return;

    const announcements = window.PetchupStore.getAnnouncements();
    const today = new Date().toISOString().split("T")[0];

    // Render Live Preview
    if (livePreviewBanner) {
      window.PetchupStore.renderAnnouncementBanner("live-preview-banner");
    }

    announcementsTbody.innerHTML = announcements
      .map((a) => {
        let statusBadge = `<span class="badge-status-expired">⚪ Inactive</span>`;
        if (a.isActive) {
          if (a.startDate && a.startDate > today) {
            statusBadge = `<span class="badge-status-scheduled">⏳ Scheduled (${a.startDate})</span>`;
          } else if (a.endDate && a.endDate < today) {
            statusBadge = `<span class="badge-status-expired">⌛ Expired (${a.endDate})</span>`;
          } else {
            statusBadge = `<span class="badge-status-active">● Active Live</span>`;
          }
        }

        return `
          <tr data-id="${a.id}">
            <td>
              <span class="admin-badge-tag badge-popular">${escapeHTML(a.pill)}</span>
              ${a.title ? `<div style="font-size:0.75rem; color:var(--color-ink-muted); margin-top:2px;">${escapeHTML(a.title)}</div>` : ""}
            </td>
            <td>
              <strong class="ann-copy-text">${escapeHTML(a.text)}</strong>
              ${a.startDate || a.endDate ? `<div style="font-size:0.74rem; color:var(--color-ink-muted); margin-top:2px;">📅 ${a.startDate || 'Now'} → ${a.endDate || 'Ongoing'}</div>` : ''}
            </td>
            <td>
              ${
                a.link
                  ? `<a href="${escapeHTML(a.link)}" target="_blank" class="ann-link-preview">${escapeHTML(
                      a.linkText || a.link
                    )} ↗</a>`
                  : `<span class="text-muted">None</span>`
              }
            </td>
            <td>
              <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
                ${statusBadge}
                <button type="button" 
                        class="btn-text-sm active-toggle-btn" 
                        data-id="${a.id}" 
                        style="font-size:0.75rem; padding:0; text-decoration:underline;">
                  ${a.isActive ? "Deactivate" : "Activate Banner"}
                </button>
              </div>
            </td>
            <td class="text-right">
              <div class="action-btn-group">
                <button type="button" class="action-btn edit-ann-btn" data-id="${a.id}" title="Edit Announcement">
                  ✏️ Edit
                </button>
                <button type="button" class="action-btn action-delete delete-ann-btn" data-id="${a.id}" title="Delete Announcement">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    // Event listeners
    announcementsTbody.querySelectorAll(".active-toggle-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        window.PetchupStore.toggleAnnouncementActive(id);
        showToast("📢 Live banner announcement updated!");
        renderAnnouncements();
        renderMetrics();
      });
    });

    announcementsTbody.querySelectorAll(".edit-ann-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        openEditAnnouncementModal(btn.dataset.id);
      });
    });

    announcementsTbody.querySelectorAll(".delete-ann-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const list = window.PetchupStore.getAnnouncements();
        const item = list.find((a) => a.id === id);
        if (item && confirm(`Delete this announcement: "${item.pill} - ${item.text}"?`)) {
          window.PetchupStore.deleteAnnouncement(id);
          showToast("🗑️ Deleted announcement");
          renderAnnouncements();
          renderMetrics();
        }
      });
    });
  }

  function openAddAnnouncementModal() {
    if (!announcementModal || !announcementForm) return;
    announcementModalTitle.textContent = "Add Store Announcement 📢";
    formAnnId.value = "";
    formAnnPill.value = "🎉 SPECIAL OFFER";
    if (formAnnTitle) formAnnTitle.value = "";
    if (formAnnStart) formAnnStart.value = "";
    if (formAnnEnd) formAnnEnd.value = "";
    formAnnText.value = "";
    formAnnLink.value = "shop.html";
    formAnnLinkText.value = "Shop Deals →";
    formAnnActive.checked = true;

    announcementModal.hidden = false;
    formAnnText.focus();
  }

  function openEditAnnouncementModal(id) {
    const list = window.PetchupStore.getAnnouncements();
    const item = list.find((a) => a.id === id);
    if (!item) return;

    announcementModalTitle.textContent = "Edit Store Announcement 📢";
    formAnnId.value = item.id;
    formAnnPill.value = item.pill;
    if (formAnnTitle) formAnnTitle.value = item.title || "";
    if (formAnnStart) formAnnStart.value = item.startDate || "";
    if (formAnnEnd) formAnnEnd.value = item.endDate || "";
    formAnnText.value = item.text;
    formAnnLink.value = item.link || "shop.html";
    formAnnLinkText.value = item.linkText || "Shop Deals →";
    formAnnActive.checked = Boolean(item.isActive);

    announcementModal.hidden = false;
    formAnnText.focus();
  }

  function closeAnnouncementModal() {
    if (announcementModal) announcementModal.hidden = true;
  }

  if (btnOpenAddAnnouncement) btnOpenAddAnnouncement.addEventListener("click", openAddAnnouncementModal);
  if (btnQuickAddAnnouncement) btnQuickAddAnnouncement.addEventListener("click", openAddAnnouncementModal);
  if (announcementModalClose) announcementModalClose.addEventListener("click", closeAnnouncementModal);
  if (announcementModalCancel) announcementModalCancel.addEventListener("click", closeAnnouncementModal);

  if (announcementForm) {
    announcementForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = formAnnId.value;
      const data = {
        pill: formAnnPill.value.trim(),
        title: formAnnTitle ? formAnnTitle.value.trim() : "",
        startDate: formAnnStart ? formAnnStart.value : "",
        endDate: formAnnEnd ? formAnnEnd.value : "",
        text: formAnnText.value.trim(),
        link: formAnnLink.value.trim(),
        linkText: formAnnLinkText.value.trim(),
        isActive: formAnnActive.checked
      };

      if (!data.text) {
        alert("Please write the announcement text!");
        return;
      }

      if (id) {
        window.PetchupStore.updateAnnouncement(id, data);
        showToast("📢 Announcement updated!");
      } else {
        window.PetchupStore.addAnnouncement(data);
        showToast("🎉 Created new announcement!");
      }

      closeAnnouncementModal();
      renderAnnouncements();
      renderMetrics();
    });
  }

  /* ==========================================================================
     6. TOOLS: EXPORT, IMPORT & CLOUD REFRESH
     ========================================================================== */
  if (btnExportData) {
    btnExportData.addEventListener("click", () => {
      const jsonStr = window.PetchupStore.exportDataJSON();
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `petchup-store-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("💾 Store data backup downloaded!");
    });
  }

  if (importFileInput) {
    importFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (evt) {
        const success = window.PetchupStore.importDataJSON(evt.target.result);
        if (success) {
          showToast("📤 Backup successfully restored!");
          renderAll();
        } else {
          alert("Could not parse JSON backup file. Please ensure it is a valid PETCHUP export file.");
        }
      };
      reader.readAsText(file);
      importFileInput.value = "";
    });
  }

  if (btnSyncCloudRefresh) {
    btnSyncCloudRefresh.addEventListener("click", async () => {
      btnSyncCloudRefresh.disabled = true;
      btnSyncCloudRefresh.textContent = "Syncing from Supabase... ☁️";
      if (window.PetchupStore && window.PetchupStore.syncFromSupabase) {
        await window.PetchupStore.syncFromSupabase();
        renderAll();
        showToast("☁️ Real-time catalog & announcements synced!");
      }
      btnSyncCloudRefresh.disabled = false;
      btnSyncCloudRefresh.textContent = "Sync from Cloud ☁️";
    });
  }

  // Keyboard accessibility
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeProductModal();
      closeAnnouncementModal();
      closeOrderDetailsModal();
    }
  });

  function escapeHTML(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* ==========================================================================
     7. ORDERS MANAGEMENT CONTROLLER
     ========================================================================== */
  function renderOrdersTable() {
    if (!adminOrdersTbody) return;

    let orders = window.PetchupStore.getOrders();
    const searchVal = (adminOrderSearch?.value || "").toLowerCase().trim();
    const statusVal = adminOrderStatusFilter?.value || "all";
    const sortVal = adminOrderSort?.value || "newest";

    // 1. Filter
    let filtered = orders.filter((o) => {
      const matchSearch =
        !searchVal ||
        (o.id && o.id.toLowerCase().includes(searchVal)) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(searchVal)) ||
        (o.customer_email && o.customer_email.toLowerCase().includes(searchVal)) ||
        (o.pet_name && o.pet_name.toLowerCase().includes(searchVal)) ||
        (Array.isArray(o.items) && o.items.some((it) => it.name && it.name.toLowerCase().includes(searchVal)));

      const matchStatus = statusVal === "all" || (o.status || "").toLowerCase() === statusVal;

      return matchSearch && matchStatus;
    });

    // 2. Sort
    filtered.sort((a, b) => {
      if (sortVal === "oldest") {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      } else if (sortVal === "total-high") {
        return (Number(b.total) || 0) - (Number(a.total) || 0);
      } else if (sortVal === "total-low") {
        return (Number(a.total) || 0) - (Number(b.total) || 0);
      }
      // default: newest
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    // 3. Update Counts
    if (ordersVisibleCount) ordersVisibleCount.textContent = filtered.length;
    if (ordersRevenueSummary) {
      const sum = filtered.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
      ordersRevenueSummary.textContent = `Total Value: ₱${sum.toFixed(2)}`;
    }

    // 4. Render Table
    if (filtered.length === 0) {
      const isBlank = orders.length === 0;
      adminOrdersTbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 45px 20px; color: var(--color-ink-muted);">
            <div style="font-size: 2.5rem; margin-bottom: 8px;">📦</div>
            <p style="font-size: 1.05rem; font-weight: 700; color: var(--color-ink); margin: 0 0 4px;">
              ${isBlank ? "No Transactions or Orders Yet" : "No Matching Orders Found"}
            </p>
            <p style="font-size: 0.88rem; margin: 0;">
              ${isBlank ? "When customers place orders, they will appear here in real time." : "Try adjusting your search query or status filter."}
            </p>
          </td>
        </tr>
      `;
      return;
    }

    let rowsHTML = "";
    filtered.forEach((ord) => {
      const meta = window.PetchupStore.getOrderStatusMeta(ord.status);
      const dateStr = ord.created_at
        ? new Date(ord.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })
        : "N/A";

      const items = Array.isArray(ord.items) ? ord.items : [];
      const firstItem = items[0] || null;
      const otherCount = items.length > 1 ? ` +${items.length - 1} more` : "";
      const itemsPreview = firstItem
        ? `${firstItem.img || "🦴"} ${escapeHTML(firstItem.name)} (×${firstItem.qty || 1})${otherCount}`
        : "No items recorded";

      const petBadge = ord.pet_name
        ? `<span style="font-size: 0.75rem; background: rgba(46, 196, 182, 0.12); color: #167D73; padding: 1px 6px; border-radius: 6px; font-weight: 600;">🐾 ${escapeHTML(ord.pet_name)}</span>`
        : "";

      const discountIndicator = ord.discount_code
        ? `<span style="font-size: 0.72rem; color: var(--color-orange); background: rgba(255, 107, 53, 0.1); padding: 1px 5px; border-radius: 4px; font-weight: 700; margin-left: 4px;" title="Coupon applied: ${ord.discount_code}">-${ord.discount_code}</span>`
        : "";

      rowsHTML += `
        <tr data-order-id="${ord.id}">
          <td style="font-family: monospace; font-weight: 700;">
            <button type="button" class="btn-link-order" data-order-id="${ord.id}" style="background: none; border: none; padding: 0; font-family: monospace; font-weight: 700; color: var(--color-orange); cursor: pointer; text-decoration: underline;" title="View order invoice">
              #${escapeHTML(ord.id)}
            </button>
          </td>
          <td style="font-size: 0.85rem; color: var(--color-ink-muted); white-space: nowrap;">
            ${dateStr}
          </td>
          <td>
            <div style="font-weight: 700; color: var(--color-ink);">${escapeHTML(ord.customer_name || "Guest")} ${petBadge}</div>
            <div style="font-size: 0.78rem; color: var(--color-ink-muted);">${escapeHTML(ord.customer_email || "No email")}</div>
          </td>
          <td style="max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.86rem;" title="${escapeHTML(items.map(it => `${it.name} (x${it.qty})`).join(', '))}">
            ${itemsPreview}
          </td>
          <td>
            <strong style="font-size: 0.95rem; color: var(--color-ink);">₱${Number(ord.total || 0).toFixed(2)}</strong>
            ${discountIndicator}
          </td>
          <td>
            <span class="status-pill ${meta.pillClass}">
              <span class="status-indicator"></span>
              <span>${meta.emoji} ${meta.label}</span>
            </span>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <button type="button" class="btn btn-outline btn-pill btn-sm btn-open-order-details" data-order-id="${ord.id}" style="font-size: 0.78rem; padding: 4px 10px;" title="View Details">
              Invoice 🧾
            </button>
            <select class="admin-quick-status-select" data-order-id="${ord.id}" style="font-size: 0.76rem; padding: 3px 6px; border-radius: 6px; border: 1px solid rgba(41, 27, 37, 0.15); background: #ffffff; cursor: pointer;" title="Quick Status Change">
              <option value="pending" ${ord.status === 'pending' ? 'selected' : ''}>🕒 Pending</option>
              <option value="processing" ${ord.status === 'processing' ? 'selected' : ''}>📦 Processing</option>
              <option value="shipped" ${ord.status === 'shipped' ? 'selected' : ''}>🚚 Shipped</option>
              <option value="delivered" ${ord.status === 'delivered' || ord.status === 'completed' ? 'selected' : ''}>🎉 Delivered</option>
              <option value="cancelled" ${ord.status === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
            </select>
          </td>
        </tr>
      `;
    });

    adminOrdersTbody.innerHTML = rowsHTML;

    // Attach row events
    adminOrdersTbody.querySelectorAll(".btn-link-order, .btn-open-order-details").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-order-id");
        openOrderDetailsModal(id);
      });
    });

    adminOrdersTbody.querySelectorAll(".admin-quick-status-select").forEach((select) => {
      select.addEventListener("change", async (e) => {
        const id = select.getAttribute("data-order-id");
        const newStatus = e.target.value;
        await window.PetchupStore.updateOrderStatus(id, newStatus);
        showToast(`Order #${id} status changed to ${newStatus} 🚚`);
        renderMetrics();
        renderOrdersTable();
      });
    });
  }

  function openOrderDetailsModal(orderId) {
    const orders = window.PetchupStore.getOrders();
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) {
      alert("Order not found: " + orderId);
      return;
    }

    currentDetailOrderId = ord.id;
    const meta = window.PetchupStore.getOrderStatusMeta(ord.status);

    if (modalOrderId) modalOrderId.textContent = "#" + ord.id;
    if (modalOrderDate) {
      modalOrderDate.textContent = ord.created_at
        ? new Date(ord.created_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })
        : "Recently";
    }

    if (modalOrderStatusBadge) {
      modalOrderStatusBadge.innerHTML = `
        <span class="status-pill ${meta.pillClass}">
          <span class="status-indicator"></span>
          <span>${meta.emoji} ${meta.label}</span>
        </span>
      `;
    }

    if (modalOrderCustomerName) modalOrderCustomerName.textContent = ord.customer_name || "Guest Pet Parent";
    if (modalOrderCustomerEmail) modalOrderCustomerEmail.textContent = ord.customer_email || "No email provided";
    if (modalOrderPetName) {
      modalOrderPetName.textContent = ord.pet_name ? `${ord.pet_name} 🐾` : "Pet Parent 🐾";
    }

    // Populate Items Table
    if (modalOrderItemsTbody) {
      const items = Array.isArray(ord.items) ? ord.items : [];
      modalOrderItemsTbody.innerHTML = items
        .map(
          (it) => `
        <tr>
          <td style="padding: 10px 14px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.3rem;">${it.img || "🦴"}</span>
              <strong style="color: var(--color-ink);">${escapeHTML(it.name)}</strong>
            </div>
          </td>
          <td style="padding: 10px 14px; text-align: center; font-weight: 700;">
            ${it.qty || 1}
          </td>
          <td style="padding: 10px 14px; text-align: right; color: var(--color-ink-muted);">
            ₱${Number(it.price || 0).toFixed(2)}
          </td>
          <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: var(--color-ink);">
            ₱${(Number(it.price || 0) * (it.qty || 1)).toFixed(2)}
          </td>
        </tr>
      `
        )
        .join("");
    }

    // Populate Financials
    if (modalOrderSubtotal) modalOrderSubtotal.textContent = `₱${Number(ord.subtotal || 0).toFixed(2)}`;
    if (modalOrderDiscountRow) {
      if (ord.discount_code && Number(ord.discount_amount || 0) > 0) {
        modalOrderDiscountRow.style.display = "flex";
        if (modalOrderDiscountCode) modalOrderDiscountCode.textContent = ord.discount_code;
        if (modalOrderDiscountAmount) modalOrderDiscountAmount.textContent = `-₱${Number(ord.discount_amount || 0).toFixed(2)}`;
      } else {
        modalOrderDiscountRow.style.display = "none";
      }
    }
    if (modalOrderGrandTotal) modalOrderGrandTotal.textContent = `₱${Number(ord.total || 0).toFixed(2)}`;

    // Set status select
    if (modalOrderChangeStatus) {
      modalOrderChangeStatus.value = (ord.status || "pending").toLowerCase();
    }

    if (orderDetailsModal) orderDetailsModal.hidden = false;
  }

  function closeOrderDetailsModal() {
    if (orderDetailsModal) orderDetailsModal.hidden = true;
    currentDetailOrderId = null;
  }

  // Hook Order Details Actions
  if (orderDetailsClose) orderDetailsClose.addEventListener("click", closeOrderDetailsModal);
  if (orderDetailsModalCloseBtn) orderDetailsModalCloseBtn.addEventListener("click", closeOrderDetailsModal);

  if (btnSaveOrderStatus) {
    btnSaveOrderStatus.addEventListener("click", async () => {
      if (!currentDetailOrderId || !modalOrderChangeStatus) return;
      const newStatus = modalOrderChangeStatus.value;
      btnSaveOrderStatus.disabled = true;
      btnSaveOrderStatus.textContent = "Saving... ⏳";

      await window.PetchupStore.updateOrderStatus(currentDetailOrderId, newStatus);
      const meta = window.PetchupStore.getOrderStatusMeta(newStatus);
      if (modalOrderStatusBadge) {
        modalOrderStatusBadge.innerHTML = `
          <span class="status-pill ${meta.pillClass}">
            <span class="status-indicator"></span>
            <span>${meta.emoji} ${meta.label}</span>
          </span>
        `;
      }

      showToast(`🎉 Order #${currentDetailOrderId} marked as ${meta.label}!`);
      renderMetrics();
      renderOrdersTable();

      btnSaveOrderStatus.disabled = false;
      btnSaveOrderStatus.textContent = "Save Status 💾";
    });
  }

  if (btnDeleteOrder) {
    btnDeleteOrder.addEventListener("click", async () => {
      if (!currentDetailOrderId) return;
      if (confirm(`Are you sure you want to delete order #${currentDetailOrderId}? This cannot be undone.`)) {
        await window.PetchupStore.deleteOrder(currentDetailOrderId);
        closeOrderDetailsModal();
        showToast("Order removed from store records.");
        renderMetrics();
        renderOrdersTable();
      }
    });
  }

  if (btnPrintInvoice) {
    btnPrintInvoice.addEventListener("click", () => {
      window.print();
    });
  }

  if (adminOrderSearch) adminOrderSearch.addEventListener("input", renderOrdersTable);
  if (adminOrderStatusFilter) adminOrderStatusFilter.addEventListener("change", renderOrdersTable);
  if (adminOrderSort) adminOrderSort.addEventListener("change", renderOrdersTable);

  if (btnRefreshOrders) {
    btnRefreshOrders.addEventListener("click", async () => {
      btnRefreshOrders.disabled = true;
      btnRefreshOrders.textContent = "Syncing... ☁️";
      await window.PetchupStore.getAllOrders();
      renderMetrics();
      renderOrdersTable();
      showToast("☁️ Orders synced with Supabase cloud!");
      btnRefreshOrders.disabled = false;
      btnRefreshOrders.textContent = "🔄 Sync Cloud";
    });
  }

  if (btnClearAllOrders) {
    btnClearAllOrders.addEventListener("click", async () => {
      if (confirm("Are you sure you want to clear all order records? The store will start fresh with 0 orders.")) {
        btnClearAllOrders.disabled = true;
        await window.PetchupStore.clearAllOrders();
        renderMetrics();
        renderOrdersTable();
        showToast("🧹 All order records have been cleared!");
        btnClearAllOrders.disabled = false;
      }
    });
  }

  if (orderDetailsModal) {
    orderDetailsModal.addEventListener("click", (e) => {
      if (e.target === orderDetailsModal) closeOrderDetailsModal();
    });
  }

  function renderAll() {
    renderMetrics();
    renderProductsTable();
    renderAnnouncements();
    renderOrdersTable();
  }

  /* ==========================================================================
     8. SUPABASE CLOUD SYNC & CONTROLLER
     ========================================================================== */
  const sbStatusPill = document.getElementById("sb-status-pill");
  const sbStatusText = document.getElementById("sb-status-text");
  const sbNavStatusDot = document.getElementById("sb-nav-status-dot");
  const sbConfigForm = document.getElementById("supabase-config-form");
  const sbInputUrl = document.getElementById("sb-input-url");
  const sbInputKey = document.getElementById("sb-input-key");
  const btnToggleKeyVis = document.getElementById("btn-toggle-key-vis");
  const btnSaveSbConfig = document.getElementById("btn-save-sb-config");
  const btnTestSbConnection = document.getElementById("btn-test-sb-connection");
  const btnClearSbConfig = document.getElementById("btn-clear-sb-config");
  const sbConnectionFeedback = document.getElementById("sb-connection-feedback");
  const btnPushToSupabase = document.getElementById("btn-push-to-supabase");
  const btnPullFromSupabase = document.getElementById("btn-pull-from-supabase");
  const btnCopySqlSchema = document.getElementById("btn-copy-sql-schema");

  function setSupabaseBadgeStatus(status, text) {
    if (!sbStatusPill || !sbStatusText) return;
    sbStatusPill.className = "sb-status-pill";
    if (status === "connected") {
      sbStatusPill.classList.add("status-connected");
      if (sbNavStatusDot) sbNavStatusDot.className = "sb-nav-status-dot dot-connected";
    } else if (status === "configured") {
      sbStatusPill.classList.add("status-configured");
      if (sbNavStatusDot) sbNavStatusDot.className = "sb-nav-status-dot dot-configured";
    } else if (status === "warning") {
      sbStatusPill.classList.add("status-warning");
      if (sbNavStatusDot) sbNavStatusDot.className = "sb-nav-status-dot dot-warning";
    } else if (status === "error") {
      sbStatusPill.classList.add("status-error");
      if (sbNavStatusDot) sbNavStatusDot.className = "sb-nav-status-dot dot-error";
    } else {
      sbStatusPill.classList.add("status-unconfigured");
      if (sbNavStatusDot) sbNavStatusDot.className = "sb-nav-status-dot dot-unconfigured";
    }
    sbStatusText.textContent = text;
  }

  function initSupabaseAdminUI() {
    if (!window.PetchupSupabase) return;

    const creds = window.PetchupSupabase.getCredentials();
    if (sbInputUrl && creds.url) sbInputUrl.value = creds.url;
    if (sbInputKey && creds.key) sbInputKey.value = creds.key;

    if (window.PetchupSupabase.isConfigured()) {
      setSupabaseBadgeStatus("configured", "Configured (Untested)");
      // Test automatically in background
      testSupabaseConnection(true);
    } else {
      setSupabaseBadgeStatus("unconfigured", "Not Configured");
    }
  }

  async function testSupabaseConnection(silent = false) {
    if (!window.PetchupSupabase) return;

    if (!silent && sbConnectionFeedback) {
      sbConnectionFeedback.hidden = false;
      sbConnectionFeedback.className = "sb-connection-feedback feedback-info";
      sbConnectionFeedback.innerHTML = `<span>⏳ Testing live connection to Supabase...</span>`;
    }

    const res = await window.PetchupSupabase.testConnection();

    if (res.success) {
      setSupabaseBadgeStatus("connected", `Connected (${res.productCount} Products)`);
      if (sbConnectionFeedback) {
        sbConnectionFeedback.hidden = false;
        sbConnectionFeedback.className = "sb-connection-feedback feedback-success";
        sbConnectionFeedback.innerHTML = `
          <strong>✅ Connected Successfully!</strong><br>
          ${escapeHTML(res.message)}
        `;
      }
      if (!silent) showToast("✅ Connected to Supabase!");
    } else if (res.tableMissing) {
      setSupabaseBadgeStatus("warning", "Tables Missing in Supabase");
      if (sbConnectionFeedback) {
        sbConnectionFeedback.hidden = false;
        sbConnectionFeedback.className = "sb-connection-feedback feedback-warning";
        sbConnectionFeedback.innerHTML = `
          <strong>⚠️ Database Tables Not Found!</strong><br>
          Your project was reached, but tables have not been created yet.<br>
          Click <strong>Copy SQL Schema</strong> below and paste it into your <strong>Supabase SQL Editor</strong> to create tables.
        `;
      }
      if (!silent) showToast("⚠️ Tables missing. Run supabase_schema.sql in Supabase!");
    } else {
      setSupabaseBadgeStatus("error", "Connection Failed");
      if (sbConnectionFeedback) {
        sbConnectionFeedback.hidden = false;
        sbConnectionFeedback.className = "sb-connection-feedback feedback-error";
        sbConnectionFeedback.innerHTML = `
          <strong>❌ Connection Failed</strong><br>
          ${escapeHTML(res.error || "Unable to reach Supabase project.")}
        `;
      }
      if (!silent) showToast("❌ Supabase connection failed");
    }
  }

  // Toggle API Key visibility
  if (btnToggleKeyVis && sbInputKey) {
    btnToggleKeyVis.addEventListener("click", () => {
      if (sbInputKey.type === "password") {
        sbInputKey.type = "text";
        btnToggleKeyVis.textContent = "🙈";
      } else {
        sbInputKey.type = "password";
        btnToggleKeyVis.textContent = "👁️";
      }
    });
  }

  // Save Supabase credentials form
  if (sbConfigForm) {
    sbConfigForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const url = sbInputUrl ? sbInputUrl.value.trim() : "";
      const key = sbInputKey ? sbInputKey.value.trim() : "";

      if (!key) {
        alert("Please enter your Supabase Anon Public Key.");
        if (sbInputKey) sbInputKey.focus();
        return;
      }

      const configured = window.PetchupSupabase.saveCredentials(url, key);
      showToast("💾 Saved Supabase credentials!");
      await testSupabaseConnection(false);
    });
  }

  // Live Test button
  if (btnTestSbConnection) {
    btnTestSbConnection.addEventListener("click", () => {
      // Temporarily save inputs before testing
      const url = sbInputUrl ? sbInputUrl.value.trim() : "";
      const key = sbInputKey ? sbInputKey.value.trim() : "";
      if (url && key) {
        window.PetchupSupabase.saveCredentials(url, key);
      }
      testSupabaseConnection(false);
    });
  }

  // Clear credentials
  if (btnClearSbConfig) {
    btnClearSbConfig.addEventListener("click", () => {
      if (confirm("Are you sure you want to clear your saved Supabase credentials?")) {
        window.PetchupSupabase.clearCredentials();
        if (sbInputKey) sbInputKey.value = "";
        setSupabaseBadgeStatus("unconfigured", "Not Configured");
        if (sbConnectionFeedback) sbConnectionFeedback.hidden = true;
        showToast("Cleared Supabase credentials");
      }
    });
  }

  // Push Local Data to Supabase
  if (btnPushToSupabase) {
    btnPushToSupabase.addEventListener("click", async () => {
      if (!window.PetchupSupabase.isConfigured()) {
        alert("Please enter and save your Supabase credentials first!");
        return;
      }

      const originalText = btnPushToSupabase.innerHTML;
      btnPushToSupabase.disabled = true;
      btnPushToSupabase.innerHTML = "Syncing... ⏳";

      try {
        const localProducts = window.PetchupStore.getProducts();
        const localAnnouncements = window.PetchupStore.getAnnouncements();

        const res = await window.PetchupSupabase.syncLocalToCloud(localProducts, localAnnouncements);
        if (res.success) {
          showToast(res.message);
          testSupabaseConnection(true);
        } else {
          alert("Push failed: " + (res.error || "Unknown error"));
        }
      } catch (err) {
        alert("Sync error: " + err.message);
      } finally {
        btnPushToSupabase.disabled = false;
        btnPushToSupabase.innerHTML = originalText;
      }
    });
  }

  // Pull Cloud Data from Supabase
  if (btnPullFromSupabase) {
    btnPullFromSupabase.addEventListener("click", async () => {
      if (!window.PetchupSupabase.isConfigured()) {
        alert("Please enter and save your Supabase credentials first!");
        return;
      }

      const originalText = btnPullFromSupabase.innerHTML;
      btnPullFromSupabase.disabled = true;
      btnPullFromSupabase.innerHTML = "Fetching... ⏳";

      try {
        const res = await window.PetchupStore.syncFromSupabase();
        if (res.synced) {
          showToast(`☁️ Loaded ${res.productsCount} products & ${res.announcementsCount} announcements!`);
          renderAll();
        } else {
          alert("Fetch failed: " + (res.reason || res.error || "Unknown error"));
        }
      } catch (err) {
        alert("Fetch error: " + err.message);
      } finally {
        btnPullFromSupabase.disabled = false;
        btnPullFromSupabase.innerHTML = originalText;
      }
    });
  }

  // Copy SQL Schema button
  if (btnCopySqlSchema) {
    btnCopySqlSchema.addEventListener("click", async () => {
      try {
        const response = await fetch("supabase_schema.sql");
        const sql = await response.text();
        await navigator.clipboard.writeText(sql);
        showToast("📋 Copied supabase_schema.sql to clipboard!");
      } catch (err) {
        showToast("📁 Refer to 'supabase_schema.sql' in your project root.");
      }
    });
  }

  // Initialize
  document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    renderAll();
    initSupabaseAdminUI();

    // Listen for storage changes in other tabs
    window.addEventListener("storage", (e) => {
      if (e.key === "petchup_products" || e.key === "petchup_announcements" || e.key === "petchup_auth") {
        checkAuth();
        renderAll();
      }
    });
  });
})();
