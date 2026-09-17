import React from 'react';
import { Link } from 'react-router-dom';

const categories = [
  {
    id: 'feeds',
    title: 'Feeds',
    link: '/shop?cat=feeds',
    cardImage: '/images/card_feeds.jpg',
    alt: 'Feeds category'
  },
  {
    id: 'accessories',
    title: 'Accessories',
    link: '/shop?cat=accessories',
    cardImage: '/images/card_accessories.jpg',
    alt: 'Accessories category'
  },
  {
    id: 'grooming',
    title: 'Grooming',
    link: '/shop?cat=grooming',
    cardImage: '/images/card_grooming.jpg',
    alt: 'Grooming category'
  },
  {
    id: 'wellness',
    title: 'Wellness',
    link: '/shop?cat=wellness',
    cardImage: '/images/card_wellness.jpg',
    alt: 'Wellness category'
  }
];

export default function SpotlightCards() {
  return (
    <section className="petchup-needs-section" id="categories" aria-labelledby="needs-heading">
      <div className="needs-container">
        {/* Section Header */}
        <div className="needs-header">
          <div className="needs-title-group">
            <h2 id="needs-heading" className="needs-heading">
              What does your pet need?
            </h2>
            <span className="needs-spark" aria-hidden="true">
              <svg width="20" height="15" viewBox="0 0 20 15" fill="none">
                <line x1="3" y1="3" x2="11" y2="2" stroke="#E85923" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="1" y1="8" x2="14" y2="7" stroke="#E85923" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="4" y1="13" x2="12" y2="12" stroke="#E85923" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </span>
          </div>

          <p className="needs-subheading">
            Everything they need for a healthier, happier life.
          </p>
        </div>

        {/* 4 Pastel Category Cards */}
        <div className="needs-grid">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={cat.link}
              className="needs-card-link"
              aria-label={`Shop ${cat.title}`}
            >
              <img
                src={cat.cardImage}
                alt={cat.alt}
                className="needs-card-img"
                loading="lazy"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
