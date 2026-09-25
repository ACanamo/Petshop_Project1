import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function PromoBanners() {
  const [likedDog, setLikedDog] = useState(false);
  const [likedCat, setLikedCat] = useState(false);

  return (
    <section className="insp-banners-section" aria-label="Curated Companion Collections">
      <div className="insp-container">
        <div className="insp-banners-grid">
          {/* Canine Collection Banner */}
          <div className="insp-banner-card insp-banner-dog">
            <div className="insp-banner-content">
              <span className="insp-banner-tag">CANINE EDIT</span>
              <h3 className="insp-banner-title">
                For your loyal companion.
              </h3>
              <p className="insp-banner-sub">
                Nutrient-rich nutrition, durable hardware, and everyday play essentials.
              </p>
              <Link to="/shop?pet=dog" className="insp-banner-btn">
                Shop Canine Collection <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
            <div className="insp-banner-visual">
              <img
                src="/images/banner_puppy_hd.jpg"
                alt="Golden retriever puppy with tennis ball"
                className="insp-banner-img"
                loading="lazy"
              />
            </div>
          </div>

          {/* Feline Collection Banner */}
          <div className="insp-banner-card insp-banner-cat">
            <div className="insp-banner-content">
              <span className="insp-banner-tag">FELINE EDIT</span>
              <h3 className="insp-banner-title">
                For your curious companion.
              </h3>
              <p className="insp-banner-sub">
                Gentle grooming, interactive toys, and cozy resting essentials.
              </p>
              <Link to="/shop?pet=cat" className="insp-banner-btn">
                Shop Feline Collection <span aria-hidden="true">&rarr;</span>
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
