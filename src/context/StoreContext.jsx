import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { DEFAULT_PRODUCTS, DEFAULT_ANNOUNCEMENTS } from '../lib/constants';
import { readJSON, writeJSON } from '../lib/storage';
import { logError } from '../lib/errorLog';

const StoreContext = createContext();

const STORAGE_KEY_PRODUCTS = "petchup_products";
const STORAGE_KEY_ANNOUNCEMENTS = "petchup_announcements";

// Ensures every product has an `images` gallery array, derived from a
// legacy single `imageUrl` when needed, so older cached/seed records
// (which predate multi-image support) work the same as new ones.
function normalizeProductImages(product) {
  if (Array.isArray(product.images) && product.images.length > 0) return product;
  return {
    ...product,
    images: product.imageUrl ? [product.imageUrl] : []
  };
}

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(() => {
    const parsed = readJSON(STORAGE_KEY_PRODUCTS, null);
    if (Array.isArray(parsed)) {
      const legacyIds = ["p13-balm", "p14-catnip", "p15-treats"];
      const cleaned = parsed.filter(p => !legacyIds.includes(p.id));
      if (cleaned.length > 0) return cleaned.map(normalizeProductImages);
    }
    return DEFAULT_PRODUCTS.map(normalizeProductImages);
  });

  const [announcements, setAnnouncements] = useState(() => {
    const parsed = readJSON(STORAGE_KEY_ANNOUNCEMENTS, null);
    if (Array.isArray(parsed)) return parsed;
    return DEFAULT_ANNOUNCEMENTS;
  });

  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const openProductView = (product) => setSelectedProduct(product);
  const closeProductView = () => setSelectedProduct(null);

  // Sync with Supabase Cloud
  const syncFromSupabase = async () => {
    if (!isConfigured()) return;
    setLoading(true);

    try {
      // 1. Products
      const { data: cloudProds, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (prodErr) throw prodErr;
      if (Array.isArray(cloudProds)) {
        const mapped = cloudProds.map(row => ({
          id: row.id,
          sku: row.sku || ("SKU-" + row.id.toUpperCase()),
          name: row.name,
          category: row.category,
          categoryLabel: row.category_label,
          pet: row.pet,
          price: parseFloat(row.price),
          originalPrice: parseFloat(row.original_price || 0),
          stockQuantity: typeof row.stock_quantity === 'number' ? row.stock_quantity : (row.in_stock ? 10 : 0),
          imageUrl: row.image_url || "",
          images: Array.isArray(row.images) && row.images.length > 0
            ? row.images
            : (row.image_url ? [row.image_url] : []),
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
          isFeatured: Boolean(row.is_featured),
          priceHistory: Array.isArray(row.price_history) ? row.price_history : []
        }));
        setProducts(mapped);
        writeJSON(STORAGE_KEY_PRODUCTS, mapped);
      }

      // 2. Announcements
      const { data: cloudAnns, error: annErr } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (annErr) throw annErr;
      if (Array.isArray(cloudAnns)) {
        const mapped = cloudAnns.map(row => ({
          id: row.id,
          pill: row.pill,
          title: row.title || "",
          text: row.text || row.message || "",
          link: row.link || "/shop",
          linkText: row.link_text || "Shop Deals →",
          startDate: row.start_date || "",
          endDate: row.end_date || "",
          isActive: Boolean(row.is_active),
          createdAt: (row.created_at || "").split('T')[0]
        }));
        setAnnouncements(mapped);
        writeJSON(STORAGE_KEY_ANNOUNCEMENTS, mapped);
      }
    } catch (err) {
      logError('StoreContext.syncFromSupabase', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncFromSupabase();
  }, []);

  // Save to localStorage when state changes
  const saveProductsList = (newList) => {
    setProducts(newList);
    writeJSON(STORAGE_KEY_PRODUCTS, newList);
  };

  const saveAnnouncementsList = (newList) => {
    setAnnouncements(newList);
    writeJSON(STORAGE_KEY_ANNOUNCEMENTS, newList);
  };

  // Product Actions
  const addProduct = async (productData) => {
    const currentPrice = parseFloat(productData.price) || 9.99;
    const stockQty = typeof productData.stockQuantity === 'number'
      ? productData.stockQuantity
      : parseInt(productData.stockQuantity, 10) || 10;

    const images = Array.isArray(productData.images)
      ? productData.images.map(url => url.trim()).filter(Boolean)
      : (productData.imageUrl ? [productData.imageUrl] : []);

    const newProduct = {
      id: "prod-" + Date.now(),
      sku: productData.sku ? productData.sku.trim().toUpperCase() : ("SKU-" + Date.now().toString().slice(-6)),
      name: productData.name.trim(),
      category: productData.category || "accessories",
      categoryLabel: productData.categoryLabel || "Pet Goodies",
      pet: productData.pet || "all",
      price: currentPrice,
      originalPrice: parseFloat(productData.originalPrice) || 0,
      stockQuantity: stockQty,
      images,
      imageUrl: images[0] || "",
      unit: productData.unit || "",
      rating: parseFloat(productData.rating) || 5,
      ratingCount: parseInt(productData.ratingCount, 10) || 1,
      popularity: parseInt(productData.popularity, 10) || 90,
      img: productData.img || "🐾",
      badge: productData.badge ? productData.badge.trim() : "",
      badgeClass: productData.badgeClass || "",
      tintClass: productData.tintClass || "bg-yellow-tint",
      desc: productData.desc ? productData.desc.trim() : "Lovingly prepared for happy pets.",
      inStock: stockQty > 0 && productData.inStock !== false,
      isFeatured: Boolean(productData.isFeatured),
      priceHistory: [{
        price: currentPrice,
        changed_at: new Date().toISOString(),
        note: "Initial product listing"
      }]
    };

    if (isConfigured()) {
      const { error } = await supabase.from('products').upsert({
          id: newProduct.id,
          sku: newProduct.sku,
          name: newProduct.name,
          category: newProduct.category,
          category_label: newProduct.categoryLabel,
          pet: newProduct.pet,
          price: newProduct.price,
          original_price: newProduct.originalPrice,
          stock_quantity: newProduct.stockQuantity,
          in_stock: newProduct.inStock,
          image_url: newProduct.imageUrl,
          images: newProduct.images,
          unit: newProduct.unit,
          rating: newProduct.rating,
          rating_count: newProduct.ratingCount,
          popularity: newProduct.popularity,
          img: newProduct.img,
          badge: newProduct.badge,
          badge_class: newProduct.badgeClass,
          tint_class: newProduct.tintClass,
          desc: newProduct.desc,
          is_featured: newProduct.isFeatured,
          price_history: newProduct.priceHistory
        });
      if (error) throw error;
    }

    const updatedList = [newProduct, ...products];
    saveProductsList(updatedList);

    return newProduct;
  };

  const updateProduct = async (id, updates) => {
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const current = products[idx];
    // Descriptive updates cannot alter live inventory or in_stock state.
    // Inventory adjustments must go through adjustProductStock.
    const {
      stockQuantity: _omitStockQty,
      stock_quantity: _omitStock_quantity,
      inStock: _omitInStock,
      in_stock: _omitIn_stock,
      ...descriptiveUpdates
    } = updates;

    const updated = {
      ...current,
      ...descriptiveUpdates,
      // Preserve current live in-memory stock and inStock status
      stockQuantity: current.stockQuantity,
      inStock: current.inStock
    };

    if (Array.isArray(descriptiveUpdates.images)) {
      updated.images = descriptiveUpdates.images.map(url => url.trim()).filter(Boolean);
      updated.imageUrl = updated.images[0] || "";
    }

    if (descriptiveUpdates.price !== undefined && parseFloat(descriptiveUpdates.price) !== parseFloat(current.price)) {
      const history = Array.isArray(current.priceHistory) ? [...current.priceHistory] : [];
      history.push({
        price: parseFloat(descriptiveUpdates.price),
        changed_at: new Date().toISOString(),
        note: descriptiveUpdates.priceNote || "Price updated by store admin"
      });
      updated.priceHistory = history;
    }

    if (isConfigured()) {
      const dbPayload = {
        sku: updated.sku,
        name: updated.name,
        category: updated.category,
        category_label: updated.categoryLabel,
        pet: updated.pet,
        price: updated.price,
        original_price: updated.originalPrice,
        image_url: updated.imageUrl,
        images: updated.images,
        unit: updated.unit,
        rating: updated.rating,
        rating_count: updated.ratingCount,
        popularity: updated.popularity,
        img: updated.img,
        badge: updated.badge,
        badge_class: updated.badgeClass,
        tint_class: updated.tintClass,
        desc: updated.desc,
        is_featured: updated.isFeatured !== undefined ? Boolean(updated.isFeatured) : Boolean(current.isFeatured),
        price_history: updated.priceHistory,
        updated_at: new Date().toISOString()
      };

      // Use UPDATE rather than UPSERT so a missing record fails clearly
      // instead of silently recreating it, and stock_quantity is untouched.
      const { data, error } = await supabase
        .from('products')
        .update(dbPayload)
        .eq('id', id)
        .select('id, stock_quantity, in_stock');

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error(`Product not found: cannot update non-existent product '${id}'.`);
      }

      // Sync latest live DB stock without overwriting it
      if (data[0]) {
        updated.stockQuantity = data[0].stock_quantity;
        updated.inStock = data[0].in_stock;
      }
    }

    const updatedList = [...products];
    updatedList[idx] = updated;
    saveProductsList(updatedList);

    return updated;
  };

  const adjustProductStock = async (id, { delta = 0, newQuantity = null, reason = "Manual inventory adjustment" } = {}) => {
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Product ${id} not found.`);

    const current = products[idx];
    let targetQty;
    if (typeof newQuantity === 'number') {
      targetQty = Math.max(0, parseInt(newQuantity, 10));
    } else {
      targetQty = Math.max(0, (current.stockQuantity || 0) + parseInt(delta, 10));
    }

    const targetInStock = targetQty > 0;

    if (isConfigured()) {
      const { data, error } = await supabase
        .from('products')
        .update({
          stock_quantity: targetQty,
          in_stock: targetInStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('id, stock_quantity, in_stock');

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error(`Product not found: cannot adjust inventory for '${id}'.`);
      }
      targetQty = data[0].stock_quantity;
    }

    const updated = {
      ...current,
      stockQuantity: targetQty,
      inStock: targetQty > 0
    };

    const updatedList = [...products];
    updatedList[idx] = updated;
    saveProductsList(updatedList);

    return updated;
  };

  const deleteProduct = async (id) => {
    if (isConfigured()) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    }

    const updatedList = products.filter(p => p.id !== id);
    saveProductsList(updatedList);
  };

  const toggleProductFeatured = async (id) => {
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const current = products[idx];
    const nextFeatured = !current.isFeatured;

    const updated = { ...current, isFeatured: nextFeatured };
    const updatedList = [...products];
    updatedList[idx] = updated;
    saveProductsList(updatedList);

    if (isConfigured()) {
      try {
        const { error } = await supabase
          .from('products')
          .update({
            is_featured: nextFeatured,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) {
          logError('toggleProductFeatured', error);
          saveProductsList(products);
          throw error;
        }
      } catch (err) {
        saveProductsList(products);
        throw err;
      }
    }

    return updated;
  };

  // Announcement Actions
  const addAnnouncement = async (data) => {
    let list = [...announcements];
    if (data.isActive) {
      list = list.map(a => ({ ...a, isActive: false }));
    }

    const newAnn = {
      id: "ann-" + Date.now(),
      pill: data.pill ? data.pill.trim() : "📢 ANNOUNCEMENT",
      text: data.text.trim(),
      link: data.link ? data.link.trim() : "/shop",
      linkText: data.linkText ? data.linkText.trim() : "Learn More →",
      title: data.title?.trim() || "",
      startDate: data.startDate || "",
      endDate: data.endDate || "",
      isActive: Boolean(data.isActive),
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (isConfigured()) {
      const { error } = await supabase.from('announcements').upsert({
          id: newAnn.id,
          pill: newAnn.pill,
          text: newAnn.text,
          link: newAnn.link,
          link_text: newAnn.linkText,
          title: newAnn.title,
          start_date: newAnn.startDate || null,
          end_date: newAnn.endDate || null,
          is_active: newAnn.isActive
        });
      if (error) throw error;
    }

    const updatedList = [newAnn, ...list];
    saveAnnouncementsList(updatedList);

    return newAnn;
  };

  const updateAnnouncement = async (id, updates) => {
    let list = [...announcements];
    if (updates.isActive) {
      list = list.map(a => (a.id !== id ? { ...a, isActive: false } : a));
    }

    const idx = list.findIndex(a => a.id === id);
    if (idx === -1) return null;

    list[idx] = { ...list[idx], ...updates };

    if (isConfigured()) {
      const { error } = await supabase.from('announcements').upsert({
          id: list[idx].id,
          pill: list[idx].pill,
          text: list[idx].text,
          link: list[idx].link,
          link_text: list[idx].linkText,
          title: list[idx].title || "",
          start_date: list[idx].startDate || null,
          end_date: list[idx].endDate || null,
          is_active: list[idx].isActive
        });
      if (error) throw error;
    }

    saveAnnouncementsList(list);

    return list[idx];
  };

  const toggleAnnouncementActive = async (id) => {
    const target = announcements.find(a => a.id === id);
    if (!target) return;
    const willBeActive = !target.isActive;

    const list = announcements.map(a => ({
      ...a,
      isActive: a.id === id ? willBeActive : false
    }));

    if (isConfigured()) {
      for (const ann of list) {
        const { error } = await supabase
          .from('announcements')
          .update({ is_active: ann.isActive, updated_at: new Date().toISOString() })
          .eq('id', ann.id);
        if (error) throw error;
      }
    }

    saveAnnouncementsList(list);
  };

  const deleteAnnouncement = async (id) => {
    if (isConfigured()) {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
    }

    const list = announcements.filter(a => a.id !== id);
    saveAnnouncementsList(list);
  };

  const today = new Date().toISOString().slice(0, 10);
  const activeAnnouncement = announcements.find(a => (
    a.isActive && (!a.startDate || a.startDate <= today) && (!a.endDate || a.endDate >= today)
  )) || null;

  return (
    <StoreContext.Provider value={{
      products,
      announcements,
      activeAnnouncement,
      loading,
      addProduct,
      updateProduct,
      adjustProductStock,
      deleteProduct,
      toggleProductFeatured,
      addAnnouncement,
      updateAnnouncement,
      toggleAnnouncementActive,
      deleteAnnouncement,
      syncFromSupabase,
      selectedProduct,
      openProductView,
      closeProductView
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within a StoreProvider");
  return context;
}
