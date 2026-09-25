import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { formatPeso } from '../../lib/constants';

export default function FeaturedProducts() {
  const { addToCart } = useCart();
  const { products, openProductView } = useStore();
  const [favorites, setFavorites] = useState({});
  const [addedIds, setAddedIds] = useState({});

  const toggleFavorite = (e, id) => {
    e.stopPropagation();
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAdd = (e, product) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAddedIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [product.id]: false }));
    }, 1200);
  };

  // Admin-selected highlights (isFeatured = true); fallback to first 4 products if none selected yet
  const highlightedProducts = Array.isArray(products) ? products.filter(p => p.isFeatured) : [];
  const displayItems = highlightedProducts.length > 0
    ? highlightedProducts
    : (Array.isArray(products) ? products.slice(0, 4) : []);

  return (
    <section className="insp-featured-section" id="essentials" aria-labelledby="essentials-heading">
      <div className="insp-container">
        {/* Section Header */}
        <div className="insp-featured-header">
          <div className="insp-featured-title-group">
            <span className="insp-section-eyebrow">CURATED HIGHLIGHTS</span>
            <h2 id="essentials-heading" className="insp-section-title">
              Little things. Big moments.
            </h2>
            <p className="insp-section-sub">Everyday staples chosen for performance, health and joy.</p>
          </div>

          <div className="insp-featured-actions">
            <div className="insp-view-all-box">
              <Link to="/shop" className="insp-view-all-link">
                View all essentials <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="insp-products-grid">
          {displayItems.map(item => {
            const isFav = !!favorites[item.id];
            const isAdded = !!addedIds[item.id];
            const coverImg = (Array.isArray(item.images) && item.images[0]) || item.imageUrl || '';
            const unitLabel = item.unit || item.categoryLabel || item.category || '';

            return (
              <article
                key={item.id}
                className="insp-product-card"
                onClick={() => typeof openProductView === 'function' && openProductView(item)}
                style={{ cursor: 'pointer' }}
              >
                {/* Favorite Heart Button */}
                <button
                  type="button"
                  className={`insp-card-fav ${isFav ? 'is-fav' : ''}`}
                  onClick={(e) => toggleFavorite(e, item.id)}
                  aria-label={isFav ? `Remove ${item.name} from wishlist` : `Add ${item.name} to wishlist`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={isFav ? "#E85923" : "none"} stroke="#E85923" strokeWidth="2">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </button>

                {/* Product Image Frame */}
                <div className="insp-card-img-frame">
                  {coverImg ? (
                    <img
                      src={coverImg}
                      alt={item.name}
                      className="insp-product-img"
                      loading="lazy"
                    />
                  ) : (
                    <div className="insp-product-placeholder">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="3"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Product Meta */}
                <div className="insp-card-meta">
                  <h3 className="insp-product-name">{item.name}</h3>
                  {unitLabel && <span className="insp-product-unit">{unitLabel}</span>}
                  <div className="insp-product-price">{formatPeso(item.price)}</div>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  className={`insp-add-cart-btn ${isAdded ? 'is-added' : ''}`}
                  onClick={(e) => handleAdd(e, item)}
                  aria-label={`Add ${item.name} to cart`}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  <span>{isAdded ? 'Added to cart' : 'Add to cart'}</span>
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
