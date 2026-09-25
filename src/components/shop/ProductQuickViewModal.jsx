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
  const [brokenThumbnails, setBrokenThumbnails] = useState({});
  const [btnText, setBtnText] = useState('');
  const resetButtonTimer = useRef(null);

  useEffect(() => {
    // Reset per-product UI state whenever a new product is opened.
    setQty(1);
    setActiveImageIndex(0);
    setImgError(false);
    setBrokenThumbnails({});
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
  const savingsAmount = hasOriginalPrice ? product.originalPrice - product.price : 0;
  const savingsPercent = hasOriginalPrice ? Math.round((savingsAmount / product.originalPrice) * 100) : 0;

  const ratingNum = typeof product.rating === 'number' ? product.rating : 5;
  const stars = "★".repeat(Math.round(ratingNum));
  const ratingCount = product.ratingCount || 142;

  const stockQuantity = typeof product.stockQuantity === 'number' ? product.stockQuantity : null;
  const maxQty = stockQuantity && stockQuantity > 0 ? stockQuantity : 99;

  // Sanitize image list to filter out empty strings, nulls, or invalid URLs
  const validImages = (Array.isArray(product.images) ? product.images : [])
    .filter(url => typeof url === 'string' && url.trim().length > 0 && !url.includes('undefined'));
  
  const images = validImages.length > 0
    ? validImages
    : (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.trim().length > 0 ? [product.imageUrl] : []);

  const activeImage = images[activeImageIndex] || images[0] || '';

  const getPerks = (cat) => {
    switch (cat) {
      case 'feeds':
        return ['100% Real Nutrition', 'Shiny Coat & Gut Health', 'Fresh Batch Assurance'];
      case 'grooming':
        return ['Hypoallergenic & Gentle', 'Botanical Extracts', 'Sensitive Skin Safe'];
      case 'wellness':
        return ['Vet Recommended', 'Active Vitality Formula', 'Third-Party Tested'];
      default:
        return ['Premium Materials', 'Quality Approved', 'Reliable Dispatch'];
    }
  };

  const perks = getPerks(product.category);

  const handleAddToCart = () => {
    if (!product.inStock) return;
    addToCart(product, qty);
    setBtnText('Added to Cart');
    window.clearTimeout(resetButtonTimer.current);
    resetButtonTimer.current = window.setTimeout(() => setBtnText(''), 1500);
  };

  return (
    <div
      className="petchup-qv-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeProductView();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
        className="petchup-qv-card"
      >
        {/* Modern Floating Frosted Close Button */}
        <button
          type="button"
          onClick={closeProductView}
          className="petchup-qv-close-btn"
          aria-label="Close quick view"
        >
          <XIcon size={18} weight="bold" aria-hidden="true" />
        </button>

        {/* Modal Main Body */}
        <div className="petchup-qv-body">
          {/* Left Column: Image Gallery */}
          <div className="petchup-qv-gallery">
            <div className="petchup-qv-main-image-wrap">
              {/* Floating Badge */}
              {product.badge && (
                <div className="petchup-qv-badge">
                  {product.badge}
                </div>
              )}

              {/* Main Image Display or Fallback */}
              {activeImage && !imgError ? (
                <img
                  src={activeImage}
                  alt={product.name}
                  className="petchup-qv-main-img"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="petchup-qv-emoji-fallback">
                  <div className="petchup-qv-emoji-icon">
                    {normalizeEmoji(product.img) || '🐾'}
                  </div>
                </div>
              )}

              {/* Gallery image count indicator */}
              {images.length > 1 && (
                <div className="petchup-qv-counter">
                  {activeImageIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {images.length > 1 && (
              <div className="petchup-qv-thumbnails">
                {images.map((url, idx) => {
                  if (brokenThumbnails[idx]) return null;
                  const isActive = idx === activeImageIndex;
                  return (
                    <button
                      key={url + idx}
                      type="button"
                      onClick={() => {
                        setActiveImageIndex(idx);
                        setImgError(false);
                      }}
                      className={`petchup-qv-thumb-btn ${isActive ? 'is-active' : ''}`}
                      aria-label={`View photo ${idx + 1}`}
                      aria-current={isActive}
                    >
                      <img
                        src={url}
                        alt=""
                        className="petchup-qv-thumb-img"
                        onError={() => setBrokenThumbnails(prev => ({ ...prev, [idx]: true }))}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Editorial Product Details */}
          <div className="petchup-qv-info">
            {/* Category & Pet Pill Eyebrow */}
            <div className="petchup-qv-eyebrow">
              <span>{product.categoryLabel || getCategoryLabel(product.category)}</span>
              <span>&bull;</span>
              <span>{getPetLabel(product.pet)}</span>
            </div>

            {/* Product Title */}
            <h2 id="quick-view-title" className="petchup-qv-title">
              {product.name}
            </h2>

            {/* Rating & Verified Buyer Social Proof */}
            <div className="petchup-qv-rating-row">
              <span className="petchup-qv-stars">{stars}</span>
              <span className="petchup-qv-rating-score">{ratingNum.toFixed(1)}</span>
              <span className="petchup-qv-rating-count">({ratingCount} reviews)</span>
              <span className="petchup-qv-verified-chip">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                Verified Favorite
              </span>
            </div>

            {/* Price & Savings Row */}
            <div className="petchup-qv-price-row">
              <span className="petchup-qv-price-current">
                {formatPeso(product.price)}
              </span>
              {hasOriginalPrice && (
                <>
                  <span className="petchup-qv-price-original">
                    {formatPeso(product.originalPrice)}
                  </span>
                  <span className="petchup-qv-save-badge">
                    Save {savingsPercent}% ({formatPeso(savingsAmount)})
                  </span>
                </>
              )}
              {product.unit && (
                <span style={{ fontSize: '0.85rem', color: '#7D736A', fontWeight: 600 }}>
                  {product.unit}
                </span>
              )}
            </div>

            {/* Description */}
            {product.desc && (
              <p className="petchup-qv-desc">
                {product.desc}
              </p>
            )}

            {/* Value Perk Chips */}
            <div className="petchup-qv-perks">
              {perks.map((perk, i) => (
                <span key={i} className="petchup-qv-perk-chip">
                  {perk}
                </span>
              ))}
            </div>

            {/* Stock Availability */}
            <div className="petchup-qv-stock-row">
              <span
                className={`petchup-qv-stock-dot ${product.inStock ? 'in-stock' : 'out-of-stock'}`}
                aria-hidden="true"
              />
              <span style={{ color: product.inStock ? '#166534' : '#991B1B' }}>
                {product.inStock
                  ? (stockQuantity ? `In Stock (${stockQuantity} available)` : 'In Stock & Ready to Ship')
                  : 'Currently Out of Stock'}
              </span>
            </div>

            {/* Bottom Interactive Actions Bar */}
            <div className="petchup-qv-action-bar">
              {/* Quantity Stepper */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#171412' }}>Qty</span>
                <div className="petchup-qv-stepper">
                  <button
                    type="button"
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    disabled={!product.inStock || qty <= 1}
                    className="petchup-qv-stepper-btn"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="petchup-qv-stepper-val">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                    disabled={!product.inStock || qty >= maxQty}
                    className="petchup-qv-stepper-btn"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart CTA */}
              <button
                type="button"
                className={`petchup-qv-add-btn ${btnText ? 'is-success' : ''}`}
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                {!product.inStock ? (
                  'Out of Stock'
                ) : btnText ? (
                  btnText
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                    <span>Add to Cart &bull; {formatPeso(product.price * qty)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
