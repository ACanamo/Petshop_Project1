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

        {/* Right Column: Imagery & Seamless Blended Stage */}
        <div className="hero-media-wrapper">
          <div className="hero-image-stage">
            {/* Backdrop Shape 1: Warm Peach Circle behind dog */}
            <div className="stage-shape-peach" aria-hidden="true" />

            {/* Backdrop Shape 2: Sunny Yellow Disc behind cat */}
            <div className="stage-shape-sun" aria-hidden="true" />

            {/* Decorative Doodle Paw */}
            <div className="stage-doodle-paw" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="38" height="38" fill="#FDBA74" opacity="0.38">
                <ellipse cx="6.5" cy="8.5" rx="2.2" ry="3.1" />
                <ellipse cx="17.5" cy="8.5" rx="2.2" ry="3.1" />
                <ellipse cx="10" cy="5" rx="2.0" ry="2.8" />
                <ellipse cx="14" cy="5" rx="2.0" ry="2.8" />
                <path d="M12 10.5 C8.5 10.5 6.5 13.5 7 17 C7.5 19.5 9.5 21 12 21 C14.5 21 16.5 19.5 17 17 C17.5 13.5 15.5 10.5 12 10.5 Z" />
              </svg>
            </div>

            {/* Decorative Doodle Hearts */}
            <div className="stage-doodle-hearts" aria-hidden="true">
              <svg width="52" height="42" viewBox="0 0 52 42" fill="none">
                <path
                  d="M12 5 C8 1, 1 5, 2 13 C3 19, 13 25, 14 26 C15 25, 25 19, 26 13 C27 5, 20 1, 16 5 C15 6, 13 6, 12 5 Z"
                  stroke="#E85923"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  transform="rotate(-10 14 14)"
                />
                <path
                  d="M36 15 C33 12, 28 14, 29 19 C30 23, 37 28, 38 29 C39 28, 46 23, 47 19 C48 14, 43 12, 40 15 C39 16, 37 16, 36 15 Z"
                  stroke="#E85923"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  transform="rotate(12 38 20)"
                />
              </svg>
            </div>

            {/* Handwritten script label "For dogs & cats" */}
            <div className="stage-script-tag" aria-hidden="true">
              <span className="script-label">For dogs &amp; cats</span>
              <svg className="script-underline" viewBox="0 0 110 14" fill="none">
                <path d="M4 6 Q 55 13, 106 4" stroke="#2D3142" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </div>

            {/* Grounding Contact Shadow */}
            <div className="stage-ground-shadow" aria-hidden="true" />

            {/* HD Pets Cutout with transparent background */}
            <img
              src="/images/hero_pets_hd_cutout.png"
              alt="Happy golden retriever dog and tuxedo cat sitting side by side"
              className="hero-main-photo-cutout"
              loading="eager"
            />

            {/* Floating Daily Essentials Card */}
            <Link
              to="/shop?cat=feeds"
              className="daily-essentials-card-link"
              title="Browse Daily Essentials"
              aria-label="Browse Daily Essentials"
            >
              <div className="daily-essentials-card">
                <div className="essentials-img-wrap">
                  {/* Subtle sparkle rays on the right of the bag */}
                  <div className="essentials-sparkles" aria-hidden="true">
                    <svg width="22" height="30" viewBox="0 0 22 30" fill="none">
                      <line x1="2" y1="6" x2="16" y2="2" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="4" y1="15" x2="20" y2="15" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="2" y1="24" x2="16" y2="28" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <img
                    src="/images/daily_essentials_cutout.png"
                    alt="Nutritious pet food pouch and bowl of kibble"
                    className="essentials-photo"
                    loading="eager"
                  />
                </div>
                <div className="essentials-btn-wrap">
                  <span className="hotspot-pill">
                    Daily essentials <span className="hotspot-arrow" aria-hidden="true">→</span>
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
