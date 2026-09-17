import React from 'react';
import { Link } from 'react-router-dom';

export default function PopHero() {
  return (
    <section className="warm-hero-section" aria-labelledby="hero-title">
      {/* Decorative floating paw marks */}
      <div className="hero-bg-paw paw-tl" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="34" height="34" fill="#F48A5E" opacity="0.18">
          <ellipse cx="6.5" cy="8.5" rx="2.2" ry="3.1" />
          <ellipse cx="17.5" cy="8.5" rx="2.2" ry="3.1" />
          <ellipse cx="10" cy="5" rx="2.0" ry="2.8" />
          <ellipse cx="14" cy="5" rx="2.0" ry="2.8" />
          <path d="M12 10.5 C8.5 10.5 6.5 13.5 7 17 C7.5 19.5 9.5 21 12 21 C14.5 21 16.5 19.5 17 17 C17.5 13.5 15.5 10.5 12 10.5 Z" />
        </svg>
      </div>

      <div className="hero-bg-paw paw-bl" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="#F48A5E" opacity="0.18">
          <ellipse cx="6.5" cy="8.5" rx="2.2" ry="3.1" />
          <ellipse cx="17.5" cy="8.5" rx="2.2" ry="3.1" />
          <ellipse cx="10" cy="5" rx="2.0" ry="2.8" />
          <ellipse cx="14" cy="5" rx="2.0" ry="2.8" />
          <path d="M12 10.5 C8.5 10.5 6.5 13.5 7 17 C7.5 19.5 9.5 21 12 21 C14.5 21 16.5 19.5 17 17 C17.5 13.5 15.5 10.5 12 10.5 Z" />
        </svg>
      </div>

      <div className="hero-bg-paw paw-mid" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="#F48A5E" opacity="0.14">
          <ellipse cx="6.5" cy="8.5" rx="2.2" ry="3.1" />
          <ellipse cx="17.5" cy="8.5" rx="2.2" ry="3.1" />
          <ellipse cx="10" cy="5" rx="2.0" ry="2.8" />
          <ellipse cx="14" cy="5" rx="2.0" ry="2.8" />
          <path d="M12 10.5 C8.5 10.5 6.5 13.5 7 17 C7.5 19.5 9.5 21 12 21 C14.5 21 16.5 19.5 17 17 C17.5 13.5 15.5 10.5 12 10.5 Z" />
        </svg>
      </div>

      <div className="hero-inner">
        {/* Left Column: Heading & CTAs */}
        <div className="hero-content">
          <div className="hero-kicker-wrap">
            <span className="hero-kicker-text">FOR THE LOVE OF PETS</span>
            <span className="hero-kicker-spark" aria-hidden="true">
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                <line x1="3" y1="2" x2="11" y2="1.5" stroke="#E85923" strokeWidth="2.4" strokeLinecap="round" />
                <line x1="1" y1="7" x2="13" y2="6" stroke="#E85923" strokeWidth="2.4" strokeLinecap="round" />
                <line x1="4" y1="12" x2="11" y2="11" stroke="#E85923" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </span>
          </div>

          <h1 id="hero-title" className="hero-display-heading">
            <span className="heading-row">Good days.</span>
            <span className="heading-row coral-accent">Happy pets.</span>
            <span className="heading-row">Start here.</span>
          </h1>

          <p className="hero-subtext">
            Food, toys and everyday essentials for your favorite companions.
          </p>

          <div className="hero-cta-group">
            <Link to="/shop" className="hero-cta-btn-primary">
              <span>Shop all</span>
              <span className="cta-arrow" aria-hidden="true">→</span>
            </Link>
            <Link to="/shop?cat=feeds" className="hero-cta-btn-secondary">
              Browse feeds
            </Link>
          </div>
        </div>

        {/* Right Column: Imagery & Floating Card */}
        <div className="hero-media-wrapper">
          <div className="hero-image-stage">
            {/* The photo composition of golden retriever, cat, backdrop circles, and doodles */}
            <img
              src="/images/hero_pets_scene.png"
              alt="Golden Retriever dog and tuxedo cat sitting happily together"
              className="hero-main-photo"
              loading="eager"
            />

            {/* Daily essentials floating button overlay */}
            <Link
              to="/shop?cat=feeds"
              className="daily-essentials-hotspot"
              title="Browse Daily Essentials"
              aria-label="Browse Daily Essentials"
            >
              <span className="hotspot-pill">
                Daily essentials <span className="hotspot-arrow" aria-hidden="true">→</span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
