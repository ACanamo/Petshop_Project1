import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export default function Footer() {
  const [email, setEmail] = useState('');
  const { showToast } = useCart();

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    showToast(`🎉 Thanks for joining PETCHUP Club, ${email}! Use code FIRSTPAW15 for 15% off!`);
    setEmail('');
  };

  return (
    <footer className="site-footer" id="site-footer">
      <div className="wrap footer-inner">
        {/* Brand Column */}
        <div className="footer-col footer-brand-col">
          <div className="brand footer-brand">
            <span className="logo-mark" aria-hidden="true">🐾</span>
            <span className="logo-text">PETCHUP</span>
          </div>
          <p className="footer-tagline">
            Squeezing pure happiness, wholesome feeds, and tail-wagging joy into every pet home across the Philippines.
          </p>
          <div className="currency-notice" style={{ marginTop: '12px', fontSize: '13px', color: '#64748b' }}>
            🇵🇭 All prices displayed in Philippine Peso (<strong>₱ PHP</strong>).
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="footer-col">
          <h4 className="footer-heading">Explore Catalog</h4>
          <ul className="footer-links">
            <li><Link to="/shop">Shop All Goodies</Link></li>
            <li><Link to="/shop?cat=feeds">Feeds & Wet Food</Link></li>
            <li><Link to="/shop?cat=accessories">Toys & Leashes</Link></li>
            <li><Link to="/shop?cat=grooming">Bath & Fur Care</Link></li>
            <li><Link to="/shop?cat=wellness">Vitamins & Oils</Link></li>
          </ul>
        </div>

        {/* Customer Care Column */}
        <div className="footer-col">
          <h4 className="footer-heading">Pet Parent Care</h4>
          <ul className="footer-links">
            <li><Link to="/#trust">100% Wholesome Guarantee</Link></li>
            <li><Link to="/#shipping">Dispatched in 24 Hours</Link></li>
            <li><Link to="/#returns">Free Hassle-Free Returns</Link></li>
            <li><Link to="/#vet">Vet-Approved Recipes</Link></li>
          </ul>
        </div>

        {/* Newsletter Column */}
        <div className="footer-col footer-newsletter-col">
          <h4 className="footer-heading">Join The Paw Club 🐶🐱</h4>
          <p className="footer-newsletter-desc">
            Sign up for secret flash sales, vet nutrition tips, and an instant <strong>15% OFF coupon</strong>.
          </p>
          <form className="footer-newsletter-form" onSubmit={handleSubscribe}>
            <input
              type="email"
              aria-label="Email address"
              className="form-input newsletter-input"
              placeholder="Enter your email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary btn-pill">
              Join
            </button>
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="wrap footer-bottom-inner">
          <p>© {new Date().getFullYear()} PETCHUP. Lovingly engineered for happy tails and purrs.</p>
          <p className="footer-bottom-badge">🐾 Powered by React + Supabase</p>
        </div>
      </div>
    </footer>
  );
}
