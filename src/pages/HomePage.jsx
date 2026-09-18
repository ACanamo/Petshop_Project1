import React from 'react';
import PopHero from '../components/home/PopHero';
import SpotlightCards from '../components/home/SpotlightCards';
import FeaturedProducts from '../components/home/FeaturedProducts';
import PromoBanners from '../components/home/PromoBanners';
import CommunityReviews from '../components/home/CommunityReviews';
import StoreLocation from '../components/home/StoreLocation';
import NewsletterSection from '../components/home/NewsletterSection';

export default function HomePage() {
  return (
    <main id="main-content" className="insp-home-main">
      {/* 1. HD Pop-Art Hero Section */}
      <PopHero />

      {/* 2. Spotlight Categories: "What does your pet need?" */}
      <SpotlightCards />

      {/* 3. Featured Essentials: "Little things. Big tail wags." */}
      <FeaturedProducts />

      {/* 4. Dual Promo Banners: Dog & Cat Essentials */}
      <PromoBanners />

      {/* 5. Community Reviews: "Happy pets. Happy people." */}
      <CommunityReviews />

      {/* 6. Store Location: "Come say hello, in person." */}
      <StoreLocation />

      {/* 7. Newsletter Section: "A little joy in your inbox." */}
      <NewsletterSection />
    </main>
  );
}
