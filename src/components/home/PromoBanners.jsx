import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function PromoBanners() {
  const [likedDog, setLikedDog] = useState(false);
  const [likedCat, setLikedCat] = useState(false);

  return (
    <section className="insp-banners-section" aria-label="Pet Essentials Banners">
      <div className="insp-container">
        <div className="insp-banners-grid">
          {/* Dog Banner */}
          <div className="insp-banner-card insp-banner-dog">
            <div className="insp-banner-content">
              <button
                type="button"
                className={`insp-banner-heart-btn dog-heart ${likedDog ? 'is-liked' : ''}`}
                onClick={() => setLikedDog(prev => !prev)}
                aria-label={likedDog ? "Remove dog essentials from wishlist" : "Add dog essentials to wishlist"}
                title={likedDog ? "Favorited!" : "Favorite"}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill={likedDog ? "#FF5A36" : "none"} stroke="#FF5A36" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
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
                src="/images/banner_puppy_hd.jpg"
                alt="Happy golden retriever puppy with tennis ball"
                className="insp-banner-img"
                loading="lazy"
              />
            </div>
          </div>

          {/* Cat Banner */}
          <div className="insp-banner-card insp-banner-cat">
            <div className="insp-banner-content">
              <button
                type="button"
                className={`insp-banner-heart-btn cat-heart ${likedCat ? 'is-liked' : ''}`}
                onClick={() => setLikedCat(prev => !prev)}
                aria-label={likedCat ? "Remove cat essentials from wishlist" : "Add cat essentials to wishlist"}
                title={likedCat ? "Favorited!" : "Favorite"}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill={likedCat ? "#E65100" : "none"} stroke="#E65100" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
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
                src="/images/banner_kitten_hd.jpg"
                alt="Fluffy kitten with play yarn ball"
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
