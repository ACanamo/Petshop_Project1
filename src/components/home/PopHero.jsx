import React from 'react';
import { Link } from 'react-router-dom';

export default function PopHero() {
  return (
    <section className="warm-hero-section" aria-labelledby="hero-title">
      <div className="hero-inner">
        {/* Left Column: Heading & CTAs */}
        <div className="hero-content">
          <div className="hero-kicker-wrap">
            <span className="hero-kicker-pill">CURATED PET CARE</span>
            <span className="hero-kicker-text">Elevated Everyday Living</span>
          </div>

          <h1 id="hero-title" className="hero-display-heading">
            <span className="heading-row">Good days.</span>
            <span className="heading-row coral-accent">Happy companions.</span>
            <span className="heading-row">Thoughtfully made.</span>
          </h1>

          <p className="hero-subtext">
            Nutritious feeds, durable gear, and gentle care essentials crafted for the pets you love.
          </p>

          <div className="hero-cta-group">
            <Link to="/shop" className="hero-cta-btn-primary">
              <span>Explore collection</span>
              <span className="cta-arrow" aria-hidden="true">&rarr;</span>
            </Link>
            <Link to="/shop?cat=feeds" className="hero-cta-btn-secondary">
              Browse feeds
            </Link>
          </div>
        </div>

        {/* Right Column: Imagery & Architectural Stage */}
        <div className="hero-media-wrapper">
          <div className="hero-image-stage">
            {/* Architectural Ambient Backdrop */}
            <div className="stage-shape-ambient" aria-hidden="true" />

            {/* Subtle Stage Frame Accent */}
            <div className="stage-frame-accent" aria-hidden="true" />

            {/* Grounding Contact Shadow */}
            <div className="stage-ground-shadow" aria-hidden="true" />

            {/* HD Pets Cutout with transparent background */}
            <img
              src="/images/hero_pets_hd_cutout.png"
              alt="Golden retriever dog and tuxedo cat sitting side by side"
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
                  <img
                    src="/images/daily_essentials_cutout.png"
                    alt="Nutritious pet food pouch and bowl of kibble"
                    className="essentials-photo"
                    loading="eager"
                  />
                </div>
                <div className="essentials-btn-wrap">
                  <span className="hotspot-pill">
                    Daily essentials <span className="hotspot-arrow" aria-hidden="true">&rarr;</span>
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

