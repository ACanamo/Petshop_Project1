import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const { showToast } = useCart();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    showToast(`Thank you for joining Petchup, ${email}! Check your inbox for your welcome discount.`);
    setEmail('');
  };

  return (
    <section className="insp-newsletter-section" aria-label="Newsletter subscription">
      <div className="insp-container">
        <div className="insp-newsletter-card">
          {/* Left Content */}
          <div className="insp-newsletter-content">
            <div className="insp-newsletter-icon" aria-hidden="true">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="3" fill="#FFFFFF" fillOpacity="0.12"/>
                <path d="M22 6L12 13L2 6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="2" y="4" width="20" height="16" rx="3" stroke="#FFFFFF" strokeWidth="1.6"/>
              </svg>
            </div>
            <div className="insp-newsletter-text">
              <h2 className="insp-newsletter-title">A little joy in your inbox.</h2>
              <p className="insp-newsletter-sub">Pet wellness tips, new arrivals, and subscriber-only privileges.</p>
            </div>
          </div>

          {/* Right Form */}
          <form className="insp-newsletter-form" onSubmit={handleSubmit}>
            <div className="insp-newsletter-input-wrap">
              <input
                type="email"
                className="insp-newsletter-input"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Email address for pet newsletter"
              />
              <button type="submit" className="insp-newsletter-submit-btn">
                Subscribe
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
