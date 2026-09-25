import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { XIcon, TrashIcon } from '@phosphor-icons/react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useOrders } from '../../context/OrdersContext';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { formatPeso, normalizeEmoji } from '../../lib/constants';
import { logError } from '../../lib/errorLog';
import { obtainAuthoritativeQuote } from '../../lib/checkoutQuote';
import OrderSuccessModal from './OrderSuccessModal';

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQty,
    clearCart,
    clearPurchasedItems,
    updateCartItems,
    subtotal,
    discountAmount,
    grandTotal,
    activeDiscount,
    applyDiscount,
    removeDiscount,
    showToast
  } = useCart();

  const { createOrder } = useOrders();
  const { user } = useAuth();
  const { syncFromSupabase, products } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Lock body scroll when open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  // Reset confirmed order and close cart on session clear or logout
  useEffect(() => {
    const handleSessionCleared = () => {
      setConfirmedOrder(null);
      closeCart();
    };
    window.addEventListener('petchup_session_cleared', handleSessionCleared);
    return () => window.removeEventListener('petchup_session_cleared', handleSessionCleared);
  }, [closeCart]);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;
    const res = applyDiscount(promoCodeInput);
    if (res.success) {
      setPromoCodeInput('');
    } else {
      showToast(res.message);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast("Add some goodies to your cart first!");
      return;
    }

    if (!user) {
      showToast("Please sign up or log in to complete your checkout!");
      closeCart();
      navigate('/login?tab=register', { state: { from: location } });
      return;
    }

    // 1. Authoritative quoting & price validation
    const quote = obtainAuthoritativeQuote(
      cart,
      products,
      activeDiscount?.code,
      activeDiscount?.percent
    );

    if (!quote.isValid) {
      showToast(`Items unavailable in requested quantity: ${quote.unavailableItems.join(', ')}`);
      return;
    }

    // Price change acceptance: if catalog price moved, update cart and require explicit re-acceptance
    if (quote.hasPriceChanges) {
      updateCartItems(quote.items);
      try {
        sessionStorage.removeItem(`petchup_attempt_${user.id}`);
      } catch (_) {}
      showToast("Prices have updated in our catalog. Please review your updated total before completing checkout.");
      return;
    }

    // 2. Client-persisted attempt key scoped to user & accepted quote
    const quoteFingerprint = JSON.stringify({
      items: quote.items.map(i => ({ id: i.id, qty: i.qty, price: i.price })),
      discount: quote.discountCode || '',
      total: quote.total
    });

    const storageKey = `petchup_attempt_${user.id}`;
    let attemptRecord;
    try {
      attemptRecord = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    } catch (_) {
      attemptRecord = null;
    }

    let attemptKey;
    if (attemptRecord && attemptRecord.fingerprint === quoteFingerprint && attemptRecord.key) {
      attemptKey = attemptRecord.key;
    } else {
      attemptKey = 'att_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)) + '_' + Date.now();
      try {
        sessionStorage.setItem(storageKey, JSON.stringify({ key: attemptKey, fingerprint: quoteFingerprint }));
      } catch (_) {}
    }

    setIsSubmitting(true);
    showToast("🚀 Processing your checkout order...");

    try {
      const purchasedItemIds = quote.items.map(it => it.id);

      const order = await createOrder({
        customerId: user?.id || null,
        customerName: user?.name || "Guest Pet Parent",
        customerEmail: user?.email || "",
        petName: user?.petName || "",
        items: quote.items.map(it => ({
          id: it.id,
          name: it.name,
          price: it.price,
          qty: it.qty,
          img: it.img
        })),
        subtotal: quote.subtotal,
        discountCode: quote.discountCode,
        discountAmount: quote.discountAmount,
        total: quote.total,
        attemptKey
      });

      // Refresh cached product list from Supabase
      syncFromSupabase();

      // Confirmed success: clean up attempt key and remove purchased items
      try {
        sessionStorage.removeItem(storageKey);
      } catch (_) {}

      setTimeout(() => {
        setIsSubmitting(false);
        clearPurchasedItems(purchasedItemIds);
        closeCart();
        setConfirmedOrder(order);
      }, 500);
    } catch (err) {
      setIsSubmitting(false);
      showToast(err.message || "Could not complete checkout. Please try again.");
      logError('CartDrawer.handleCheckout', err);
    }
  };

  if (!isCartOpen && !confirmedOrder) return null;

  return (
    <>
      {confirmedOrder && (
        <OrderSuccessModal order={confirmedOrder} onClose={() => setConfirmedOrder(null)} />
      )}

      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              key="cart-backdrop"
              className="cart-backdrop"
              id="cart-backdrop"
              onClick={closeCart}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0.15 : 0.28,
                ease: [0.16, 1, 0.3, 1]
              }}
            />

            <motion.aside
              key="cart-drawer-panel"
              className="cart-drawer"
              id="cart-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Shopping Cart"
              initial={{
                transform: shouldReduceMotion ? 'translateX(0%)' : 'translateX(100%)',
                opacity: shouldReduceMotion ? 0 : 1
              }}
              animate={{
                transform: 'translateX(0%)',
                opacity: 1
              }}
              exit={{
                transform: shouldReduceMotion ? 'translateX(0%)' : 'translateX(100%)',
                opacity: shouldReduceMotion ? 0 : 1
              }}
              transition={{
                type: 'spring',
                damping: 32,
                stiffness: 350,
                mass: 0.85
              }}
            >
              <div className="cart-drawer-header">
                <h2 className="cart-drawer-title">Your Cart 🛒</h2>
                <motion.button
                  whileHover={{ scale: 1.12, rotate: 90 }}
                  whileTap={{ scale: 0.88 }}
                  transition={{ duration: 0.16 }}
                  type="button"
                  className="cart-close-btn"
                  id="cart-close-btn"
                  onClick={closeCart}
                  aria-label="Close cart"
                >
                  <XIcon size={18} weight="bold" aria-hidden="true" />
                </motion.button>
              </div>

              {/* Promo code coupon input */}
              <div className="cart-promo-section">
                <form className="cart-promo-form" id="cart-promo-form" onSubmit={handleApplyPromo}>
                  <input
                    type="text"
                    className="cart-promo-input"
                    id="cart-promo-input"
                    placeholder="Promo code (e.g. FIRSTPAW15)"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    aria-label="Promo code coupon"
                  />
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="btn btn-outline btn-pill cart-promo-btn"
                  >
                    Apply
                  </motion.button>
                </form>

                <AnimatePresence>
                  {activeDiscount && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, transform: 'translateY(-6px)' }}
                      animate={{ opacity: 1, height: 'auto', transform: 'translateY(0px)' }}
                      exit={{ opacity: 0, height: 0, transform: 'translateY(-6px)' }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="cart-applied-banner"
                      id="cart-applied-banner"
                      style={{ overflow: 'hidden' }}
                    >
                      <span id="cart-applied-label">
                        🎉 {activeDiscount.code} (-{activeDiscount.percent}%) Applied!
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        type="button"
                        className="cart-remove-discount-btn"
                        id="cart-remove-discount-btn"
                        onClick={removeDiscount}
                        aria-label="Remove coupon"
                      >
                        Remove
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cart items list */}
              <div className="cart-items" id="cart-items">
                <AnimatePresence mode="popLayout" initial={false}>
                  {cart.length === 0 ? (
                    <motion.div
                      key="empty-cart"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="cart-empty-state"
                    >
                      <div className="empty-emoji">🎾</div>
                      <p className="empty-title">Your cart is empty!</p>
                      <p className="empty-sub">
                        Add some crunchy feeds, squeaky toys, or cozy leashes to get started.
                      </p>
                      <Link
                        to="/shop"
                        onClick={closeCart}
                        className="btn btn-primary btn-pill"
                        style={{ marginTop: '18px', display: 'inline-flex' }}
                      >
                        Continue Shopping 🐾
                      </Link>
                    </motion.div>
                  ) : (
                    cart.map((item, index) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95, transform: 'translateY(8px)' }}
                        animate={{ opacity: 1, scale: 1, transform: 'translateY(0px)' }}
                        exit={{ opacity: 0, scale: 0.9, transform: 'translateX(24px)' }}
                        transition={{
                          layout: { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
                          opacity: { duration: 0.2 },
                          transform: { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
                        }}
                        className="cart-item-row"
                        key={item.id}
                      >
                        <div className="cart-item-emoji">{normalizeEmoji(item.img)}</div>
                        <div className="cart-item-info">
                          <strong className="cart-item-title">{item.name}</strong>
                          <div className="cart-item-price">
                            {formatPeso(item.price)} &times; {item.qty}
                          </div>
                          <div className="cart-qty-actions" style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                            <motion.button
                              whileTap={{ scale: 0.88 }}
                              type="button"
                              style={{
                                padding: '2px 8px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                background: '#f8fafc',
                                cursor: 'pointer',
                                fontWeight: 700
                              }}
                              onClick={() => updateQty(index, item.qty - 1)}
                              aria-label="Decrease quantity"
                            >
                              -
                            </motion.button>
                            <span style={{ fontSize: '13px', fontWeight: 600, padding: '0 4px', minWidth: '18px', textAlign: 'center', display: 'inline-block' }}>{item.qty}</span>
                            <motion.button
                              whileTap={{ scale: 0.88 }}
                              type="button"
                              style={{
                                padding: '2px 8px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                background: '#f8fafc',
                                cursor: 'pointer',
                                fontWeight: 700
                              }}
                              onClick={() => updateQty(index, item.qty + 1)}
                              aria-label="Increase quantity"
                            >
                              +
                            </motion.button>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.15, color: '#e85923' }}
                          whileTap={{ scale: 0.88 }}
                          type="button"
                          className="cart-item-remove"
                          onClick={() => removeFromCart(index)}
                          aria-label={`Remove ${item.name}`}
                        >
                          <TrashIcon size={17} weight="bold" aria-hidden="true" />
                        </motion.button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {/* Cart Drawer Footer */}
              <AnimatePresence>
                {cart.length > 0 && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, transform: 'translateY(12px)' }}
                    animate={{ opacity: 1, transform: 'translateY(0px)' }}
                    exit={{ opacity: 0, transform: 'translateY(12px)' }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="cart-drawer-footer"
                  >
                    <div className="cart-summary-row">
                      <span>Subtotal:</span>
                      <strong id="cart-subtotal">{formatPeso(subtotal)}</strong>
                    </div>

                    {activeDiscount && (
                      <div className="cart-discount-row" id="cart-discount-row" style={{ color: '#16a34a' }}>
                        <span id="cart-discount-desc">Discount ({activeDiscount.percent}% OFF):</span>
                        <strong id="cart-discount-amount">-{formatPeso(discountAmount)}</strong>
                      </div>
                    )}

                    {activeDiscount && (
                      <div className="cart-total-row" id="cart-total-row">
                        <span>Final Total:</span>
                        <strong id="cart-final-total" className="cart-final-total-highlight">
                          {formatPeso(grandTotal)}
                        </strong>
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      className="btn btn-primary btn-pill btn-full checkout-btn"
                      id="checkout-btn"
                      onClick={handleCheckout}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Processing..." : `Checkout Now 🐾 (${formatPeso(grandTotal)})`}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
