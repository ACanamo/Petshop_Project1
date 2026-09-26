import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, PawPrint, ShoppingCartSimple } from '@phosphor-icons/react';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { formatPeso } from '../../lib/constants';

function FeaturedCard({ product }) {
  const { addToCart, cart } = useCart();
  const { openProductView } = useStore();
  const [added, setAdded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const timer = useRef();
  const image = product.images?.[0] || product.imageUrl;
  const quantity = cart.find(item => item.id === product.id)?.qty || 0;
  const available = product.inStock && (typeof product.stockQuantity !== 'number' || quantity < product.stockQuantity);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => setImageFailed(false), [image]);
  function add() {
    if (!available) return;
    addToCart(product, 1);
    setAdded(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 1500);
  }
  return <article className="pg-product">
    <button className="pg-product-photo" type="button" onClick={() => openProductView(product)} aria-label={`View details for ${product.name}`}>
      {image && !imageFailed ? <img src={image} alt={product.name} loading="lazy" width="250" height="250" onError={() => setImageFailed(true)} /> : <PawPrint size={65} weight="duotone" aria-hidden="true" />}
      {!product.inStock && <span className="pg-stock-label">Out of stock</span>}
    </button>
    <div className="pg-product-info"><button className="pg-product-name" type="button" onClick={() => openProductView(product)}>{product.name}</button><p>{product.unit || product.categoryLabel || product.category}</p><strong>{formatPeso(product.price)}</strong></div>
    <button className={`pg-product-add ${added ? 'is-added' : ''}`} type="button" onClick={add} disabled={!available} aria-label={!product.inStock ? `${product.name} is out of stock` : !available ? `Stock limit reached for ${product.name}` : `Add ${product.name} to cart`}>
      {added ? <Check size={19} aria-hidden="true" /> : <ShoppingCartSimple size={19} aria-hidden="true" />}<span>{!product.inStock ? 'Out of stock' : !available ? 'Stock limit reached' : added ? 'Added to cart' : 'Add to cart'}</span>
    </button>
  </article>;
}

export default function FeaturedProducts() {
  const { products, loading } = useStore();
  const highlights = products.filter(product => product.isFeatured);
  const displayItems = (highlights.length ? highlights : products).slice(0, 8);
  return <section className="pg-featured pg-wrap" id="essentials" aria-labelledby="essentials-heading">
    <div className="pg-section-head"><div><h2 id="essentials-heading">Featured favorites</h2><p>Little things for a whole lot of tail wags.</p></div><Link className="pg-text-link" to="/shop">View all products <ArrowRight size={19} aria-hidden="true" /></Link></div>
    {loading && !displayItems.length ? <p role="status">Finding their next favorites…</p> : displayItems.length ? <div className="pg-products">{displayItems.map(product => <FeaturedCard key={product.id} product={product} />)}</div> : <p>New favorites are on their way. <Link to="/shop">Browse the shop</Link>.</p>}
  </section>;
}
