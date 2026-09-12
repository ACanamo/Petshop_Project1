import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { readJSON, writeJSON } from '../lib/storage';

const CartContext = createContext();

const STORAGE_KEY_CART = "petchup_cart";
const STORAGE_KEY_DISCOUNT = "petchup_active_discount";

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => readJSON(STORAGE_KEY_CART, []));

  const [activeDiscount, setActiveDiscount] = useState(() => readJSON(STORAGE_KEY_DISCOUNT, null));

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

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

  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.id === product.id);
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          qty: updated[existingIdx].qty + qty
        };
        return updated;
      } else {
        return [...prev, {
          id: product.id,
          name: product.name,
          price: product.price,
          img: product.img || "🐾",
          imageUrl: product.imageUrl || "",
          qty: qty
        }];
      }
    });

    showToast(`🎉 Added ${product.name} to cart!`);
  };

  const removeFromCart = (index) => {
    setCart(prev => {
      const removed = prev[index];
      const updated = prev.filter((_, i) => i !== index);
      if (removed) showToast(`Removed ${removed.name} from cart`);
      return updated;
    });
  };

  const updateQty = (index, newQty) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    setCart(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], qty: newQty };
      }
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
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
