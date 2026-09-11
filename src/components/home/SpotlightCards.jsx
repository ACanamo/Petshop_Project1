import React from 'react';
import { Link } from 'react-router-dom';

export default function SpotlightCards() {
  const categories = [
    {
      id: 'accessories',
      title: 'Pet Accessories',
      icon: '🎾',
      theme: 'cat-theme-orange',
      image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=800&q=80',
      desc: 'Collars, chew-tested leashes, orthopedic donut beds & interactive chew toys.',
      link: '/shop?cat=accessories'
    },
    {
      id: 'feeds',
      title: 'Pet Feeds & Food',
      icon: '🥫',
      theme: 'cat-theme-yellow',
      image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=800&q=80',
      desc: 'Oven-baked kibbles, slow-braised duck stews, and single-ingredient raw treats.',
      link: '/shop?cat=feeds'
    },
    {
      id: 'grooming',
      title: 'Grooming Essentials',
      icon: '🛁',
      theme: 'cat-theme-teal',
      image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80',
      desc: 'Soothing oatmeal shampoos, gentle de-shedding rakes & organic paw balms.',
      link: '/shop?cat=grooming'
    },
    {
      id: 'wellness',
      title: 'Health & Wellness',
      icon: '💊',
      theme: 'cat-theme-coral',
      image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=800&q=80',
      desc: 'Wild Alaskan salmon coat oil, hip mobility chews & daily gut health probiotics.',
      link: '/shop?cat=wellness'
    }
  ];

  return (
    <section className="play-categories-section" id="categories" aria-labelledby="categories-heading">
      <div className="play-wrap">
        <div className="play-section-head">
          <span className="play-section-pill">Explore by Department</span>
          <h2 id="categories-heading" className="play-section-title">Shop by Category 🌈</h2>
          <p className="play-section-sub">
            From belly-filling feasts to durable walking essentials, we have everything your fur-baby loves.
          </p>
        </div>

        <div className="play-category-grid">
          {categories.map(cat => (
            <Link key={cat.id} to={cat.link} className={`play-cat-card ${cat.theme}`}>
              <div className="play-cat-img-wrap">
                <img src={cat.image} alt={cat.title} className="play-cat-img" loading="lazy" />
              </div>
              <div className="play-cat-header">
                <span className="play-cat-icon">{cat.icon}</span>
                <h3 className="play-cat-title">{cat.title}</h3>
              </div>
              <p className="play-cat-desc">{cat.desc}</p>
              <span className="play-cat-link">Shop {cat.title} &rarr;</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
