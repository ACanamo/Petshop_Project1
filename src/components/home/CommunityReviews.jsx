import React from 'react';

const REVIEWS = [
  {
    id: 'rev-1',
    quote: 'A happy little shopping stop for our fur babies.',
    author: 'Customer name',
    avatar: '/images/review_avatar_dog.png',
    pet: 'Golden Retriever'
  },
  {
    id: 'rev-2',
    quote: 'Love finding food, toys and care essentials in one place.',
    author: 'Customer name',
    avatar: '/images/review_avatar_cat.png',
    pet: 'Tabby Cat'
  },
  {
    id: 'rev-3',
    quote: 'Our next favorite toy is waiting here.',
    author: 'Customer name',
    avatar: '/images/review_avatar_pup.png',
    pet: 'Maltese Puppy'
  }
];

export default function CommunityReviews() {
  return (
    <section className="insp-reviews-section" id="community" aria-labelledby="community-heading">
      <div className="insp-container">
        {/* Header */}
        <div className="insp-reviews-header">
          <h2 id="community-heading" className="insp-section-title">
            Happy pets. Happy people.
            <span className="insp-sparkle" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="#FF6B35"/>
              </svg>
            </span>
          </h2>
          <p className="insp-section-sub">Stories from our pet-loving community.</p>
        </div>

        {/* 3 Review Cards */}
        <div className="insp-reviews-grid">
          {REVIEWS.map(item => (
            <div key={item.id} className="insp-review-card">
              {/* Quote Mark */}
              <div className="insp-quote-icon" aria-hidden="true">
                <svg width="28" height="22" viewBox="0 0 28 22" fill="#FF6B35">
                  <path d="M7.7 0C3.45 0 0 3.45 0 7.7C0 14.3 5.5 19.8 11 22L12.1 19.8C8.8 18.7 6.6 15.4 6.6 12.1C7 12.1 7.35 12.1 7.7 12.1C11.95 12.1 15.4 8.65 15.4 4.4C15.4 2 11.95 0 7.7 0ZM20.3 0C16.05 0 12.6 3.45 12.6 7.7C12.6 14.3 18.1 19.8 23.6 22L24.7 19.8C21.4 18.7 19.2 15.4 19.2 12.1C19.6 12.1 19.95 12.1 20.3 12.1C24.55 12.1 28 8.65 28 4.4C28 2 24.55 0 20.3 0Z"/>
                </svg>
              </div>

              <span className="insp-review-tag">Sample review</span>

              <p className="insp-review-quote">
                "{item.quote}"
              </p>

              <div className="insp-review-author-wrap">
                <img
                  src={item.avatar}
                  alt={item.pet}
                  className="insp-review-avatar"
                  loading="lazy"
                />
                <span className="insp-review-author">{item.author}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
