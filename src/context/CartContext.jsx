import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { readJSON, writeJSON } from '../lib/storage';
import { supabase, isConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { logError } from '../lib/errorLog';

const CartContext = createContext();

const STORAGE_KEY_CART = "petchup_cart";
const STORAGE_KEY_DISCOUNT = "petchup_active_discount";

function rowToItem(row) {
  return {
    id: row.product_id,
    name: row.name,
    price: Number(row.price),
    img: row.img || "🐾",
    imageUrl: row.image_url || "",
    qty: row.qty
  };
}

export function CartProvider({ children }) {
  const { user } = useAuth();

  const [cart, setCart] = useState(() => readJSON(STORAGE_KEY_CART, []));

  const [activeDiscount, setActiveDiscount] = useState(() => readJSON(STORAGE_KEY_DISCOUNT, null));

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  // A signed-in shopper's cart lives in the `cart_items` table (see
  // supabase_schema.sql), keyed by user id, so it follows them across
  // logout/login and devices instead of the guest-only localStorage copy
  // below. Load it the moment a user becomes available — right after
  // login, or on page load if a session was already active.
  useEffect(() => {
    if (!isConfigured() || !user) return;
    let active = true;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', user.id);
        if (!active || error || !Array.isArray(data)) return;
        const cloudItems = data.map(rowToItem);

        // Seamlessly merge guest cart with cloud cart on login
        setCart(prevCart => {
          if (!prevCart || prevCart.length === 0) return cloudItems;
          const mergedMap = new Map();
          for (const item of cloudItems) {
            mergedMap.set(item.id, { ...item });
          }
          for (const guestItem of prevCart) {
            if (mergedMap.has(guestItem.id)) {
              const existing = mergedMap.get(guestItem.id);
              existing.qty = Math.max(existing.qty, guestItem.qty);
            } else {
              mergedMap.set(guestItem.id, { ...guestItem });
              syncItemToCloud(guestItem);
            }
          }
          return Array.from(mergedMap.values());
        });
      } catch (err) {
        logError('CartContext.loadCart', err);
      }
    })();

    return () => { active = false; };
  }, [user?.id]);

  // The cart shown on screen shouldn't leak to whoever uses this device
  // next, so clear the local/guest view the moment a session ends or switches.
  const prevUserRef = useRef(user);
  useEffect(() => {
    if (prevUserRef.current?.id !== user?.id) {
      setCart([]);
      setActiveDiscount(null);
      setIsCartOpen(false);
    }
    prevUserRef.current = user;
  }, [user]);

  // Listen for global session cleared event
  useEffect(() => {
    const handleSessionCleared = () => {
      setCart([]);
      setActiveDiscount(null);
      setIsCartOpen(false);
    };

    window.addEventListener('petchup_session_cleared', handleSessionCleared);
    return () => window.removeEventListener('petchup_session_cleared', handleSessionCleared);
  }, []);

  useEffect(() => {
    writeJSON(STORAGE_KEY_CART, cart);
  }, [cart]);

  useEffect(() => {
    if (activeDiscount) {
      writeJSON(STORAGE_KEY_DISCOUNT, activeDiscount);
    } else {
      localStorage.removeItem(STORAGE_KEY_DISCOUNT);
    }
  }, [activeDiscount]);

  const showToast = (message) => {
    setToastMessage(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Saved-cart write-throughs below are fire-and-forget: the on-screen
  // state updates immediately, and the Supabase row (which is what
  // actually reappears at next login) catches up in the background. A
  // failure just means that one change doesn't stick for next time — not
  // worth blocking the UI over.
  const syncItemToCloud = async (item) => {
    if (!isConfigured() || !user) return;
    try {
      const { error } = await supabase.from('cart_items').upsert({
        user_id: user.id,
        product_id: item.id,
        name: item.name,
        price: item.price,
        img: item.img,
        image_url: item.imageUrl,
        qty: item.qty,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,product_id' });
      if (error) logError('CartContext.syncItemToCloud', error);
    } catch (err) {
      logError('CartContext.syncItemToCloud', err);
    }
  };

  const removeItemFromCloud = async (productId) => {
    if (!isConfigured() || !user) return;
    try {
      const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id).eq('product_id', productId);
      if (error) logError('CartContext.removeItemFromCloud', error);
    } catch (err) {
      logError('CartContext.removeItemFromCloud', err);
    }
  };

  const addToCart = (product, qty = 1) => {
    const existingIdx = cart.findIndex(item => item.id === product.id);
    const newItem = existingIdx !== -1
      ? { ...cart[existingIdx], qty: cart[existingIdx].qty + qty }
      : {
          id: product.id,
          name: product.name,
          price: product.price,
          img: product.img || "🐾",
          imageUrl: product.imageUrl || "",
          qty
        };

    setCart(prev => {
      const idx = prev.findIndex(item => item.id === product.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = newItem;
        return updated;
      }
      return [...prev, newItem];
    });

    showToast(`🎉 Added ${product.name} to cart!`);
    syncItemToCloud(newItem);
  };

  const removeFromCart = (index) => {
    const removed = cart[index];
    setCart(prev => prev.filter((_, i) => i !== index));
    if (removed) {
      showToast(`Removed ${removed.name} from cart`);
      removeItemFromCloud(removed.id);
    }
  };

  const updateQty = (index, newQty) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    const current = cart[index];
    if (!current) return;
    const updatedItem = { ...current, qty: newQty };

    setCart(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = updatedItem;
      }
      return updated;
    });

    syncItemToCloud(updatedItem);
  };

  const clearCart = () => {
    setCart([]);
    if (isConfigured() && user) {
      supabase.from('cart_items').delete().eq('user_id', user.id).then(({ error }) => {
        if (error) logError('CartContext.clearCart', error);
      });
    }
  };

  const applyDiscount = (rawCode) => {
    if (!rawCode) return { success: false, message: "Please enter a code" };
    const code = rawCode.trim().toUpperCase();

    let discountObj = null;
    if (code === "FIRSTPAW20" || code === "WELCOME20") {
      discountObj = { code, percent: 20, label: "First-Time Member 20% OFF 🎉" };
    } else if (code === "FIRSTPAW15" || code === "PAWTY15") {
      discountObj = { code, percent: 15, label: "15% Special Offer Discount 🐾" };
    } else if (code === "MEOW10" || code === "WOOF10") {
      discountObj = { code, percent: 10, label: "10% Paw Perks Discount 🦴" };
    } else {
      return {
        success: false,
        message: "Coupon not found! Try code FIRSTPAW15 for 15% off or FIRSTPAW20 for 20% off."
      };
    }

    setActiveDiscount(discountObj);
    showToast(`🎉 Coupon ${discountObj.code} (-${discountObj.percent}%) applied!`);
    return { success: true, discount: discountObj };
  };

  const removeDiscount = () => {
    setActiveDiscount(null);
    showToast("Coupon removed.");
  };

  const updateCartItems = (newItems) => {
    setCart(newItems);
    if (isConfigured() && user && Array.isArray(newItems)) {
      newItems.forEach(item => syncItemToCloud(item));
    }
  };

  const clearPurchasedItems = (purchasedItemIds = []) => {
    if (!purchasedItemIds || purchasedItemIds.length === 0) {
      clearCart();
      return;
    }
    const idSet = new Set(purchasedItemIds);
    setCart(prev => prev.filter(it => !idSet.has(it.id)));
    if (isConfigured() && user) {
      for (const id of idSet) {
        removeItemFromCloud(id);
      }
    }
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen(prev => !prev);

  // Computations
  const subtotal = cart.reduce((sum, it) => sum + (it.price * it.qty), 0);
  const discountAmount = activeDiscount ? (subtotal * activeDiscount.percent) / 100 : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount);
  const totalCount = cart.reduce((sum, it) => sum + it.qty, 0);

  return (
    <CartContext.Provider value={{
      cart,
      activeDiscount,
      isCartOpen,
      toastMessage,
      subtotal,
      discountAmount,
      grandTotal,
      totalCount,
      addToCart,
      removeFromCart,
      updateQty,
      clearCart,
      clearPurchasedItems,
      updateCartItems,
      applyDiscount,
      removeDiscount,
      openCart,
      closeCart,
      toggleCart,
      showToast
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
