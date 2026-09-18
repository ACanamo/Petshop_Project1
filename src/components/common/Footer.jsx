import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="insp-footer" id="site-footer">
      <div className="insp-container">
        {/* Main Footer Grid */}
        <div className="insp-footer-main">
          {/* Brand Info */}
          <div className="insp-footer-col insp-footer-brand">
            <Link to="/" className="insp-footer-logo-link">
              <span className="insp-footer-logo-icon" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#FF5A36">
                  <path d="M12 14c-1.66 0-3 1.34-3 3 0 1.3.84 2.4 2 2.82V21a1 1 0 0 0 2 0v-1.18c1.16-.42 2-1.52 2-2.82 0-1.66-1.34-3-3-3z"/>
                  <circle cx="6.5" cy="11.5" r="2"/>
                  <circle cx="9.5" cy="7.5" r="2"/>
                  <circle cx="14.5" cy="7.5" r="2"/>
                  <circle cx="17.5" cy="11.5" r="2"/>
                </svg>
              </span>
              <span className="insp-footer-brand-name">PETCHUP</span>
            </Link>
            <p className="insp-footer-tagline">Good things for the pets you love.</p>
          </div>

          {/* Shop Column */}
          <div className="insp-footer-col">
            <h4 className="insp-footer-heading">Shop</h4>
            <ul className="insp-footer-links">
              <li><Link to="/shop?cat=feeds">Feeds</Link></li>
              <li><Link to="/shop?cat=accessories">Accessories</Link></li>
              <li><Link to="/shop?cat=grooming">Grooming</Link></li>
              <li><Link to="/shop?cat=wellness">Wellness</Link></li>
            </ul>
          </div>

          {/* Help Column */}
          <div className="insp-footer-col">
            <h4 className="insp-footer-heading">Help</h4>
            <ul className="insp-footer-links">
              <li><Link to="/contact">Contact us</Link></li>
              <li><Link to="/shipping">Shipping &amp; returns</Link></li>
              <li><Link to="/faqs">FAQs</Link></li>
            </ul>
          </div>

          {/* Visit Us & Socials */}
          <div className="insp-footer-col">
            <h4 className="insp-footer-heading">Visit us</h4>
            <p className="insp-footer-note">Store details coming soon</p>
            <div className="insp-footer-socials" aria-label="Social media links">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="insp-social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="insp-social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="insp-social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="insp-social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z"></path>
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor"></polygon>
                </svg>
              </a>
            </div>
          </div>

          {/* Script Quote Badge */}
          <div className="insp-footer-badge-wrap">
            <div className="insp-footer-script-badge">
              <span>A happier,</span>
              <span>brighter world</span>
              <span>for pets <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF5A36" strokeWidth="2" style={{ display: 'inline', verticalAlign: 'middle' }}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="insp-footer-bottom">
          <p className="insp-footer-copy">&copy; {new Date().getFullYear()} PETCHUP</p>
          <div className="insp-footer-legal">
            <Link to="/privacy">Privacy policy</Link>
            <span className="insp-footer-legal-sep">|</span>
            <Link to="/terms">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
