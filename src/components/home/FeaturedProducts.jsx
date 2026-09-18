import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatPeso } from '../../lib/constants';

const FEATURED_ITEMS = [
  {
    id: 'insp-prod-food',
    name: 'Everyday Dog Food',
    pet: 'dog',
    category: 'feeds',
    unit: '1 kg',
    price: 349,
    imageUrl: '/images/prod_dog_food.png',
    img: '🥩',
    inStock: true
  },
  {
    id: 'insp-prod-rope',
    name: 'Soft Rope Toy',
    pet: 'dog',
    category: 'accessories',
    unit: 'One size',
    price: 149,
    imageUrl: '/images/prod_rope_toy.png',
    img: '🪢',
    inStock: true
  },
  {
    id: 'insp-prod-shampoo',
    name: 'Gentle Pet Shampoo',
    pet: 'all',
    category: 'grooming',
    unit: '250 ml',
    price: 229,
    imageUrl: '/images/prod_shampoo.png',
    img: '🧴',
    inStock: true
  },
  {
    id: 'insp-prod-bowl',
    name: 'Ceramic Pet Bowl',
    pet: 'all',
    category: 'accessories',
    unit: 'Medium',
    price: 299,
    imageUrl: '/images/prod_ceramic_bowl.png',
    img: '🥣',
    inStock: true
  }
];

export default function FeaturedProducts() {
  const { addToCart } = useCart();
  const [activeFilter, setActiveFilter] = useState('all');
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

  const filteredItems = FEATURED_ITEMS.filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'dog') return item.pet === 'dog' || item.pet === 'all';
    if (activeFilter === 'cat') return item.pet === 'cat' || item.pet === 'all';
    return true;
  });

  return (
    <section className="insp-featured-section" id="essentials" aria-labelledby="essentials-heading">
      <div className="insp-container">
        {/* Section Header */}
        <div className="insp-featured-header">
          <div className="insp-featured-title-group">
            <h2 id="essentials-heading" className="insp-section-title">
              Little things. Big tail wags.
              <span className="insp-sparkle" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="#FF6B35"/>
                  <circle cx="18" cy="4" r="1.5" fill="#FFB020"/>
                </svg>
              </span>
            </h2>
            <p className="insp-section-sub">Discover everyday essentials.</p>
          </div>

          <div className="insp-featured-actions">
            {/* Filter Tabs */}
            <div className="insp-filter-pills" role="tablist" aria-label="Filter products by pet">
              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === 'all'}
                className={`insp-pill ${activeFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === 'dog'}
                className={`insp-pill ${activeFilter === 'dog' ? 'is-active' : ''}`}
                onClick={() => setActiveFilter('dog')}
              >
                For dogs
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === 'cat'}
                className={`insp-pill ${activeFilter === 'cat' ? 'is-active' : ''}`}
                onClick={() => setActiveFilter('cat')}
              >
                For cats
              </button>
            </div>

            {/* View all link */}
            <div className="insp-view-all-box">
              <span className="insp-sample-note">Sample products &amp; prices</span>
              <Link to="/shop" className="insp-view-all-link">
                View all products <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="insp-products-grid">
          {filteredItems.map(item => {
            const isFav = !!favorites[item.id];
            const isAdded = !!addedIds[item.id];

            return (
              <article key={item.id} className="insp-product-card">
                {/* Favorite Heart Button */}
                <button
                  type="button"
                  className={`insp-card-fav ${isFav ? 'is-fav' : ''}`}
                  onClick={(e) => toggleFavorite(e, item.id)}
                  aria-label={isFav ? `Remove ${item.name} from wishlist` : `Add ${item.name} to wishlist`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={isFav ? "#FF5A36" : "none"} stroke="#FF5A36" strokeWidth="2">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </button>

                {/* Product Image Frame */}
                <div className="insp-card-img-frame">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="insp-product-img"
                    loading="lazy"
                  />
                </div>

                {/* Product Meta */}
                <div className="insp-card-meta">
                  <h3 className="insp-product-name">{item.name}</h3>
                  <span className="insp-product-unit">{item.unit}</span>
                  <div className="insp-product-price">{formatPeso(item.price)}</div>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  className={`insp-add-cart-btn ${isAdded ? 'is-added' : ''}`}
                  onClick={(e) => handleAdd(e, item)}
                  aria-label={`Add ${item.name} to cart`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  <span>{isAdded ? 'Added! ✨' : 'Add to cart'}</span>
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
