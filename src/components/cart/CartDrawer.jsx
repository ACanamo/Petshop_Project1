import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { XIcon, TrashIcon } from '@phosphor-icons/react';
import { useCart } from '../../context/CartContext';
import { useOrders } from '../../context/OrdersContext';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { formatPeso, normalizeEmoji } from '../../lib/constants';
import { logError } from '../../lib/errorLog';
import OrderSuccessModal from './OrderSuccessModal';

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQty,
    clearCart,
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
  const { syncFromSupabase, deductProductStock } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
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

    setIsSubmitting(true);
    showToast("🚀 Processing your checkout order...");

    try {
      const order = await createOrder({
        customerId: user?.id || null,
        customerName: user?.name || "Guest Pet Parent",
        customerEmail: user?.email || "",
        petName: user?.petName || "",
        items: cart.map(it => ({
          id: it.id,
          name: it.name,
          price: it.price,
          qty: it.qty,
          img: it.img
        })),
        subtotal: subtotal,
        discountCode: activeDiscount?.code || "",
        discountAmount: discountAmount,
        total: grandTotal
      });

      // place_order() already deducts stock atomically in the same DB transaction that
      // created the order, so only run the client-side deduction for the offline
      // fallback path (order never reached Supabase) — otherwise stock gets decremented
      // twice for every normal, successful checkout.
      if (order?._offlineFallback && typeof deductProductStock === 'function') {
        await deductProductStock(cart);
      }

      // Refresh the cached product list from Supabase so the real post-checkout stock shows up
      syncFromSupabase();

      setTimeout(() => {
        setIsSubmitting(false);
        clearCart();
        closeCart();
        setConfirmedOrder(order);
      }, 500);
    } catch (err) {
      setIsSubmitting(false);
      showToast(err.message || "Could not complete checkout. Please try again.");
      // Also logged server-side (not just the toast the customer sees) so
      // an admin can spot patterns — e.g. one product's stock check failing
      // repeatedly is a "restock this now" signal, not just a one-off.
      logError('CartDrawer.handleCheckout', err);
    }
  };

  if (!isCartOpen && !confirmedOrder) return null;

  return (
    <>
      {confirmedOrder && (
        <OrderSuccessModal order={confirmedOrder} onClose={() => setConfirmedOrder(null)} />
      )}

      {isCartOpen && (
        <>
      <div
        className="cart-backdrop is-open"
        id="cart-backdrop"
        onClick={closeCart}
        aria-hidden="true"
      />

      <aside
        className="cart-drawer is-open"
        id="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Cart"
      >
        <div className="cart-drawer-header">
          <h2 className="cart-drawer-title">Your Cart 🛒</h2>
          <button
            type="button"
            className="cart-close-btn"
            id="cart-close-btn"
            onClick={closeCart}
            aria-label="Close cart"
          >
            <XIcon size={18} weight="bold" aria-hidden="true" />
          </button>
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
            <button type="submit" className="btn btn-outline btn-pill cart-promo-btn">
              Apply
            </button>
          </form>

          {activeDiscount && (
            <div className="cart-applied-banner" id="cart-applied-banner">
              <span id="cart-applied-label">
                🎉 {activeDiscount.code} (-{activeDiscount.percent}%) Applied!
              </span>
              <button
                type="button"
                className="cart-remove-discount-btn"
                id="cart-remove-discount-btn"
                onClick={removeDiscount}
                aria-label="Remove coupon"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Cart items list */}
        <div className="cart-items" id="cart-items">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
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
            </div>
          ) : (
            cart.map((item, index) => (
              <div className="cart-item-row" key={`${item.id}-${index}`}>
                <div className="cart-item-emoji">{normalizeEmoji(item.img)}</div>
                <div className="cart-item-info">
                  <strong className="cart-item-title">{item.name}</strong>
                  <div className="cart-item-price">
                    {formatPeso(item.price)} &times; {item.qty}
                  </div>
                  <div className="cart-qty-actions" style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <button
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
                    </button>
                    <span style={{ fontSize: '13px', fontWeight: 600, padding: '0 4px' }}>{item.qty}</span>
                    <button
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
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className="cart-item-remove"
                  onClick={() => removeFromCart(index)}
                  aria-label={`Remove ${item.name}`}
                >
                  <TrashIcon size={17} weight="bold" aria-hidden="true" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Cart Drawer Footer */}
        {cart.length > 0 && (
          <div className="cart-drawer-footer">
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

            <button
              type="button"
              className="btn btn-primary btn-pill btn-full checkout-btn"
              id="checkout-btn"
              onClick={handleCheckout}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : `Checkout Now 🐾 (${formatPeso(grandTotal)})`}
            </button>
          </div>
        )}
      </aside>
        </>
      )}
    </>
  );
}
