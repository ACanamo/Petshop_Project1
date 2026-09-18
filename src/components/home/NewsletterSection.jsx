import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const { showToast } = useCart();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    showToast(`🎉 Thanks for joining the pack, ${email}! Check your inbox for your welcome discount.`);
    setEmail('');
  };

  return (
    <section className="insp-newsletter-section" aria-label="Newsletter subscription">
      <div className="insp-container">
        <div className="insp-newsletter-card">
          {/* Left Content */}
          <div className="insp-newsletter-content">
            <div className="insp-newsletter-icon" aria-hidden="true">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="3" fill="#FFFFFF" fillOpacity="0.2"/>
                <path d="M22 6L12 13L2 6" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="2" y="4" width="20" height="16" rx="3" stroke="#FFFFFF" strokeWidth="2"/>
              </svg>
            </div>
            <div className="insp-newsletter-text">
              <h2 className="insp-newsletter-title">A little joy in your inbox.</h2>
              <p className="insp-newsletter-sub">Pet tips, new arrivals and little things to love.</p>
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
                Join the pack
              </button>
            </div>
          </form>

          {/* Sparkle Accent */}
          <div className="insp-newsletter-sparkle" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="#FFFFFF" fillOpacity="0.8"/>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
