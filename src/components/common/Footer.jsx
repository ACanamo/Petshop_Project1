import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, PawPrint } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrdersContext';
import { useCart } from '../../context/CartContext';

export default function Footer() {
  const { user } = useAuth();
  const { openOrderHistory } = useOrders();
  const { openCart } = useCart();
  return <footer className="pg-footer" id="site-footer"><div className="pg-wrap"><div className="pg-footer-grid">
    <div><Link className="pg-wordmark" to="/" aria-label="Petchup home">petchup<PawPrint size={25} weight="fill" aria-hidden="true" /></Link><p>A happy little place for<br />pets and their people.</p></div>
    <nav aria-label="Footer shopping"><h2>Find their favorites</h2><Link to="/shop?cat=feeds">Food & treats</Link><Link to="/shop?cat=accessories">Toys & accessories</Link><Link to="/shop?cat=grooming">Grooming</Link><Link to="/shop?cat=wellness">Wellness</Link></nav>
    <nav aria-label="Footer help"><h2>Around Petchup</h2><Link to="/#about">Our little world</Link><Link to="/#help">Shopping help</Link><button type="button" onClick={openCart}>Your cart</button>{user ? <button type="button" onClick={openOrderHistory}>Your orders</button> : <Link to="/login">Sign in / Create account</Link>}</nav>
    <div className="pg-footer-note">More love<br />for every kind<br />of little paw.<Heart size={30} aria-hidden="true" /></div>
  </div><div className="pg-footer-bottom"><span>© {new Date().getFullYear()} Petchup</span><span>Good pets. Brighter days. <PawPrint size={14} aria-hidden="true" /></span></div></div></footer>;
}
