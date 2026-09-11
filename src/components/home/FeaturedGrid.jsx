import React from 'react';
import { useStore } from '../../context/StoreContext';
import ProductCard from '../shop/ProductCard';

export default function FeaturedGrid() {
  const { products } = useStore();
  const featured = products.slice(0, 6);

  return (
    <section className="play-featured-section" id="featured" aria-labelledby="featured-heading">
      <div className="play-wrap">
        <div className="play-section-head">
          <span className="play-section-pill">Curated Best-Sellers</span>
          <h2 id="featured-heading" className="play-section-title">Most-Loved Treats &amp; Toys ⭐</h2>
          <p className="play-section-sub">
            These top-rated picks are guaranteed to get tails wagging and purrs rumbling!
          </p>
        </div>

        <div className="play-featured-grid products-grid" id="featured-products-grid">
          {featured.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
