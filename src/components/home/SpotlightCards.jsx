import React from 'react';
import { Link } from 'react-router-dom';

const categories = [
  {
    id: 'feeds',
    title: 'Feeds',
    link: '/shop?cat=feeds',
    image: '/images/hd_category_feeds.jpg',
    bgColor: '#F6D3C2',
    alt: 'Feeds — ceramic bowl with nutritious dry kibbles'
  },
  {
    id: 'accessories',
    title: 'Accessories',
    link: '/shop?cat=accessories',
    image: '/images/hd_category_accessories.jpg',
    bgColor: '#FAD89A',
    alt: 'Accessories — chew rope, collar, and ball'
  },
  {
    id: 'grooming',
    title: 'Grooming',
    link: '/shop?cat=grooming',
    image: '/images/hd_category_grooming.jpg',
    bgColor: '#F2C8CD',
    alt: 'Grooming — towel, brush, and shampoo'
  },
  {
    id: 'wellness',
    title: 'Wellness',
    link: '/shop?cat=wellness',
    image: '/images/hd_category_wellness.jpg',
    bgColor: '#C9E0D0',
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

        {/* 4 HD Category Cards */}
        <div className="needs-grid">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={cat.link}
              className="needs-hd-card"
              style={{ backgroundColor: cat.bgColor }}
              aria-label={`Shop ${cat.title}`}
            >
              {/* Card Header (Title & Arrow) */}
              <div className="needs-hd-card-header">
                <h3 className="needs-hd-card-title">{cat.title}</h3>
                <span className="needs-hd-card-arrow" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </div>

              {/* HD Product Photo */}
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
