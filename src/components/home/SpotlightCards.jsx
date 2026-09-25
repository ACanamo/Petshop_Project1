import React from 'react';
import { Link } from 'react-router-dom';

const categories = [
  {
    id: 'feeds',
    title: 'Feeds & Nutrition',
    subtitle: 'Wholesome natural recipes',
    link: '/shop?cat=feeds',
    image: '/images/hd_category_feeds.jpg',
    alt: 'Feeds — ceramic bowl with nutritious dry kibbles'
  },
  {
    id: 'accessories',
    title: 'Hardware & Gear',
    subtitle: 'Durable leashes, collars & toys',
    link: '/shop?cat=accessories',
    image: '/images/hd_category_accessories.jpg',
    alt: 'Accessories — chew rope, collar, and ball'
  },
  {
    id: 'grooming',
    title: 'Grooming & Bath',
    subtitle: 'Gentle botanical formulations',
    link: '/shop?cat=grooming',
    image: '/images/hd_category_grooming.jpg',
    alt: 'Grooming — towel, brush, and shampoo'
  },
  {
    id: 'wellness',
    title: 'Daily Wellness',
    subtitle: 'Joint, coat & immune care',
    link: '/shop?cat=wellness',
    image: '/images/hd_category_wellness.jpg',
    alt: 'Wellness — supplements, bowl, and bone'
  }
];

export default function SpotlightCards() {
  return (
    <section className="petchup-needs-section" id="categories" aria-labelledby="needs-heading">
      <div className="needs-container">
        {/* Section Header */}
        <div className="needs-header">
          <div className="needs-title-group">
            <span className="needs-eyebrow">ESSENTIAL CATEGORIES</span>
            <h2 id="needs-heading" className="needs-heading">
              What does your companion need?
            </h2>
          </div>

          <p className="needs-subheading">
            Thoughtfully formulated nutrition, resilient gear, and everyday comfort.
          </p>
        </div>

        {/* 4 Refined Category Cards */}
        <div className="needs-grid">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={cat.link}
              className="needs-hd-card"
              aria-label={`Shop ${cat.title}`}
            >
              {/* Card Header */}
              <div className="needs-hd-card-header">
                <div>
                  <h3 className="needs-hd-card-title">{cat.title}</h3>
                  <span className="needs-hd-card-sub">{cat.subtitle}</span>
                </div>
                <span className="needs-hd-card-arrow" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </div>

              {/* Product Photo */}
              <div className="needs-hd-photo-wrap">
                <img
                  src={cat.image}
                  alt={cat.alt}
                  className="needs-hd-photo"
                  loading="lazy"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

