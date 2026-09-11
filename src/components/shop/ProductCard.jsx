import React, { useEffect, useRef, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { formatPeso, getBadgeClass, getCategoryTint, getPetLabel, getCategoryLabel, normalizeEmoji } from '../../lib/constants';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [btnText, setBtnText] = useState("Add to Cart 🛒");
  const [imgError, setImgError] = useState(false);
  const [isPopping, setIsPopping] = useState(false);
  const resetButtonTimer = useRef(null);
  const popTimer = useRef(null);

  useEffect(() => () => {
    window.clearTimeout(resetButtonTimer.current);
    window.clearTimeout(popTimer.current);
  }, []);

  const handleAddToCart = () => {
    if (!product.inStock) return;
    addToCart(product, 1);

    setBtnText("Added! ✨");
    window.clearTimeout(resetButtonTimer.current);
    resetButtonTimer.current = window.setTimeout(() => {
      setBtnText("Add to Cart 🛒");
    }, 1200);

    setIsPopping(false);
    window.clearTimeout(popTimer.current);
    // Retrigger the CSS animation even on rapid re-clicks.
    requestAnimationFrame(() => {
      setIsPopping(true);
      popTimer.current = window.setTimeout(() => setIsPopping(false), 450);
    });
  };

  const hasOriginalPrice = product.originalPrice && product.originalPrice > product.price;
  const stars = "★".repeat(Math.round(product.rating || 5));
  const categoryText = `${product.categoryLabel || getCategoryLabel(product.category)}, ${getPetLabel(product.pet)}`;

  return (
    <article
      className={`product-card ${!product.inStock ? 'is-out-of-stock' : ''}`}
      data-id={product.id}
      data-category={product.category}
      data-pet={product.pet}
      data-price={product.price}
    >
      {/* Product Badge */}
      {product.badge && (
        <div className={`product-badge ${product.badgeClass || getBadgeClass(product.badge)}`}>
          {product.badge}
        </div>
      )}

      {/* Out of Stock Overlay */}
      {!product.inStock && (
        <div className="out-of-stock-overlay">
          <span>Out of stock</span>
        </div>
      )}

      {/* Image Wrap */}
      <div className={`product-img-wrap ${product.tintClass || getCategoryTint(product.category)}`}>
        {product.imageUrl && !imgError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="product-real-img"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="product-emoji">{normalizeEmoji(product.img)}</div>
        )}
      </div>

      {/* Product Details */}
      <div className="product-info">
        <span className="product-category">{categoryText}</span>
        <h3 className="product-name">{product.name}</h3>
        {product.desc && <p className="product-desc-short">{product.desc}</p>}

        <div className="product-rating" aria-label={`${product.rating || 5} stars`}>
          <span className="stars" style={{ color: '#f59e0b' }}>{stars}</span>
          <span className="rating-count">({product.ratingCount || 100})</span>
        </div>

        <div className="product-pricing">
          <strong className="product-price">{formatPeso(product.price)}</strong>
          {hasOriginalPrice && (
            <span className="product-original-price">{formatPeso(product.originalPrice)}</span>
          )}
          {product.unit && <span className="product-unit">{product.unit}</span>}
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        className={`btn btn-primary btn-pill btn-full add-to-cart-btn ${isPopping ? 'is-added-pop' : ''}`}
        onClick={handleAddToCart}
        disabled={!product.inStock}
        style={{
          background: btnText.includes("Added") ? "var(--color-teal, #06d6a0)" : undefined,
          transition: "all 0.2s ease"
        }}
      >
        {product.inStock ? btnText : "Out of stock"}
      </button>
    </article>
  );
}
