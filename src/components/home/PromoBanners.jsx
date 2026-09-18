import React from 'react';
import { Link } from 'react-router-dom';

export default function PromoBanners() {
  return (
    <section className="insp-banners-section" aria-label="Pet Essentials Banners">
      <div className="insp-container">
        <div className="insp-banners-grid">
          {/* Dog Banner */}
          <div className="insp-banner-card insp-banner-dog">
            <div className="insp-banner-content">
              <span className="insp-doodle-heart dog-heart" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF5A36" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </span>
              <h3 className="insp-banner-title">
                For your <span className="highlight-dog">goodest</span> friend.
              </h3>
              <p className="insp-banner-sub">
                Everything for more wagging tails.
              </p>
              <Link to="/shop?pet=dog" className="insp-banner-btn dog-btn">
                Shop dog essentials <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
            <div className="insp-banner-visual">
              <img
                src="/images/banner_dog_card.png"
                alt="Happy puppy with tennis ball"
                className="insp-banner-img"
                loading="lazy"
              />
            </div>
          </div>

          {/* Cat Banner */}
          <div className="insp-banner-card insp-banner-cat">
            <div className="insp-banner-content">
              <span className="insp-doodle-heart cat-heart" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E65100" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </span>
              <h3 className="insp-banner-title">
                For your <span className="highlight-cat">little boss</span>.
              </h3>
              <p className="insp-banner-sub">
                Toys, care and comfort for curious cats.
              </p>
              <Link to="/shop?pet=cat" className="insp-banner-btn cat-btn">
                Shop cat essentials <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
            <div className="insp-banner-visual">
              <img
                src="/images/banner_cat_card.png"
                alt="Fluffy kitten with play yarn"
                className="insp-banner-img"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
