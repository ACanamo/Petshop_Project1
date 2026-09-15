import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useCart } from '../../context/CartContext';
import { formatPeso, getBadgeClass, getCategoryTint, getPetLabel, getCategoryLabel, normalizeEmoji } from '../../lib/constants';
import { XIcon } from '@phosphor-icons/react';

export default function ProductQuickViewModal() {
  const { selectedProduct, closeProductView } = useStore();
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [btnText, setBtnText] = useState('');
  const resetButtonTimer = useRef(null);

  useEffect(() => {
    // Reset per-product UI state whenever a new product is opened.
    setQty(1);
    setActiveImageIndex(0);
    setImgError(false);
    setBtnText('');
    window.clearTimeout(resetButtonTimer.current);
  }, [selectedProduct]);

  useEffect(() => {
    if (!selectedProduct) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeProductView();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProduct, closeProductView]);

  useEffect(() => () => window.clearTimeout(resetButtonTimer.current), []);

  if (!selectedProduct) return null;

  const product = selectedProduct;
  const hasOriginalPrice = Boolean(product.originalPrice) && product.originalPrice > product.price;
  const stars = "★".repeat(Math.round(product.rating || 5));
  const stockQuantity = typeof product.stockQuantity === 'number' ? product.stockQuantity : null;
  const maxQty = stockQuantity && stockQuantity > 0 ? stockQuantity : 99;
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : (product.imageUrl ? [product.imageUrl] : []);
  const activeImage = images[activeImageIndex] || images[0] || '';

  const handleAddToCart = () => {
    if (!product.inStock) return;
    addToCart(product, qty);
    setBtnText('Added! ✨');
    window.clearTimeout(resetButtonTimer.current);
    resetButtonTimer.current = window.setTimeout(() => setBtnText(''), 1400);
  };

  return (
    <div
      className="quick-view-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeProductView();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(30, 41, 59, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 2100
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
        className="quick-view-card"
        style={{
          background: 'var(--play-cream, #FFFDF9)',
          borderRadius: '28px',
          border: 'none',
          boxShadow: 'none',
          width: '100%',
          maxWidth: '940px',
          maxHeight: '92vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          animation: 'modalSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header strip */}
        <div style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, var(--play-orange, #FF6B35) 0%, #FF834E 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.9)' }}>
            {product.categoryLabel || getCategoryLabel(product.category)} &middot; {getPetLabel(product.pet)}
          </span>
          <button
            type="button"
            onClick={closeProductView}
            aria-label="Close quick view"
            style={{
              background: 'rgba(255, 255, 255, 0.28)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <XIcon size={16} weight="bold" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="quick-view-body" style={{ display: 'flex', flex: '1 1 auto', minHeight: 0, overflowY: 'auto', minWidth: 0 }}>
          {/* Image side */}
          <div className="quick-view-image-col" style={{
            flex: '0 0 48%',
            minWidth: 0,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ position: 'relative' }}>
              {product.badge && (
                <div className={`product-badge ${product.badgeClass || getBadgeClass(product.badge)}`} style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 1 }}>
                  {product.badge}
                </div>
              )}
              <div
                className={`product-img-wrap ${product.tintClass || getCategoryTint(product.category)}`}
                style={{ width: '100%', height: 'auto', aspectRatio: '1 / 1', margin: 0 }}
              >
                {activeImage && !imgError ? (
                  <img
                    src={activeImage}
                    alt={product.name}
                    className="product-real-img"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="product-emoji">{normalizeEmoji(product.img)}</div>
                )}
              </div>
            </div>

            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {images.map((url, idx) => (
                  <button
                    key={url + idx}
                    type="button"
                    onClick={() => {
                      setActiveImageIndex(idx);
                      setImgError(false);
                    }}
                    aria-label={`View image ${idx + 1}`}
                    aria-current={idx === activeImageIndex}
                    style={{
                      width: '56px',
                      height: '56px',
                      flexShrink: 0,
                      padding: 0,
                      borderRadius: '10px',
                      border: idx === activeImageIndex ? '2px solid var(--play-orange, #FF6B35)' : '2px solid rgba(45,49,66,0.12)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: 'var(--play-cream, #FFFDF9)'
                    }}
                  >
                    <img
                      src={url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info side */}
          <div style={{ flex: '1 1 auto', minWidth: 0, padding: '28px', display: 'flex', flexDirection: 'column' }}>
            <h2 id="quick-view-title" style={{ margin: '0 0 10px', fontSize: '1.75rem', fontWeight: 800, color: 'var(--play-charcoal, #2D3142)', lineHeight: 1.25 }}>
              {product.name}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
              <span style={{ color: '#f59e0b', fontSize: '17px', letterSpacing: '1px' }}>{stars}</span>
              <span style={{ fontSize: '14px', color: 'var(--play-muted, #6B7082)' }}>({product.ratingCount || 100})</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '16px' }}>
              <strong style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--play-charcoal, #2D3142)' }}>
                {formatPeso(product.price)}
              </strong>
              {hasOriginalPrice && (
                <span style={{ fontSize: '1rem', color: 'var(--play-muted, #6B7082)', textDecoration: 'line-through' }}>
                  {formatPeso(product.originalPrice)}
                </span>
              )}
              {product.unit && <span style={{ fontSize: '0.85rem', color: 'var(--play-muted, #6B7082)' }}>{product.unit}</span>}
            </div>

            {product.desc && (
              <p style={{ fontSize: '1rem', color: 'var(--play-muted, #6B7082)', lineHeight: 1.65, marginBottom: '18px' }}>
                {product.desc}
              </p>
            )}

            <div style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '20px',
              color: product.inStock ? '#16a34a' : '#ef4444'
            }}>
              {product.inStock
                ? (stockQuantity ? `✓ In Stock (${stockQuantity} left)` : '✓ In Stock')
                : '✕ Out of Stock'}
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--play-charcoal, #2D3142)' }}>Quantity</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', border: '1px solid rgba(45,49,66,0.15)', borderRadius: '999px', padding: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    disabled={!product.inStock || qty <= 1}
                    aria-label="Decrease quantity"
                    style={{ width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: '#f1efe9', fontWeight: 700, cursor: 'pointer' }}
                  >
                    −
                  </button>
                  <span style={{ minWidth: '28px', textAlign: 'center', fontWeight: 700, fontSize: '14px' }}>{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                    disabled={!product.inStock || qty >= maxQty}
                    aria-label="Increase quantity"
                    style={{ width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: '#f1efe9', fontWeight: 700, cursor: 'pointer' }}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="btn-pop-yellow"
                onClick={handleAddToCart}
                disabled={!product.inStock}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  border: 'none',
                  opacity: product.inStock ? 1 : 0.6,
                  cursor: product.inStock ? 'pointer' : 'not-allowed'
                }}
              >
                {!product.inStock ? 'Out of Stock' : (btnText || `Add to Cart 🛒 (${formatPeso(product.price * qty)})`)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
