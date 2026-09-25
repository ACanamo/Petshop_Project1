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
          <span className="insp-reviews-eyebrow">TESTIMONIALS</span>
          <h2 id="community-heading" className="insp-section-title">
            Loved by companions &amp; their humans.
          </h2>
          <p className="insp-section-sub">Real stories from our dedicated community of pet parents.</p>
        </div>

        {/* 3 Review Cards */}
        <div className="insp-reviews-grid">
          {REVIEWS.map(item => (
            <div key={item.id} className="insp-review-card">
              {/* Star Rating */}
              <div className="insp-review-stars" aria-label="5 out of 5 stars">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#E85923" stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>

              <blockquote className="insp-review-quote">
                &ldquo;{item.quote}&rdquo;
              </blockquote>

              <div className="insp-review-author-wrap">
                <img
                  src={item.avatar}
                  alt={item.pet}
                  className="insp-review-avatar"
                  loading="lazy"
                />
                <div>
                  <span className="insp-review-author">{item.author}</span>
                  <span className="insp-review-pet-name">{item.pet}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
