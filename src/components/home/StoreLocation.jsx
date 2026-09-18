import React from 'react';

export default function StoreLocation() {
  return (
    <section className="insp-store-section" id="visit" aria-labelledby="visit-heading">
      <div className="insp-container">
        {/* Header */}
        <div className="insp-store-header">
          <h2 id="visit-heading" className="insp-section-title">
            Come say hello, in person.
            <span className="insp-sparkle" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="#FF6B35"/>
              </svg>
            </span>
          </h2>
          <p className="insp-section-sub">Visit our shop and find something your pet will love.</p>
        </div>

        {/* 2-Column Content */}
        <div className="insp-store-grid">
          {/* Left Column: Visual Showcase (Map + Shopfront) */}
          <div className="insp-store-visual-wrap">
            <img
              src="/images/store_showcase.png"
              alt="PETCHUP Storefront illustration and location map"
              className="insp-store-showcase-img"
              loading="lazy"
            />
          </div>

          {/* Right Column: Info & Action Card */}
          <div className="insp-store-info-card">
            {/* Corner Decorative Paw */}
            <div className="insp-store-paw-decor" aria-hidden="true">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="#FCE4D6">
                <path d="M12 14c-1.66 0-3 1.34-3 3 0 1.3.84 2.4 2 2.82V21a1 1 0 0 0 2 0v-1.18c1.16-.42 2-1.52 2-2.82 0-1.66-1.34-3-3-3z"/>
                <circle cx="6.5" cy="11.5" r="2"/>
                <circle cx="9.5" cy="7.5" r="2"/>
                <circle cx="14.5" cy="7.5" r="2"/>
                <circle cx="17.5" cy="11.5" r="2"/>
              </svg>
            </div>

            <h3 className="insp-store-title">
              Visit <span className="insp-brand-highlight">PETCHUP</span>
            </h3>

            <ul className="insp-store-details-list">
              <li>
                <span className="insp-detail-icon location-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#FF6B35">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
                  </svg>
                </span>
                <span>Address to be added</span>
              </li>
              <li>
                <span className="insp-detail-icon hours-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </span>
                <span>Store hours to be added</span>
              </li>
              <li>
                <span className="insp-detail-icon phone-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </span>
                <span>Contact number to be added</span>
              </li>
            </ul>

            <div className="insp-store-actions">
              <button
                type="button"
                className="insp-btn-primary"
                onClick={() => window.open('https://maps.google.com', '_blank')}
              >
                Get directions <span aria-hidden="true">&rarr;</span>
              </button>
              <a
                href="#site-footer"
                className="insp-btn-secondary"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>Message us</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
