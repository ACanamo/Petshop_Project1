import React from 'react';
import PopHero from '../components/home/PopHero';
import SpotlightCards from '../components/home/SpotlightCards';
import FeaturedGrid from '../components/home/FeaturedGrid';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <main id="main-content">
      {/* 1. Pop-Art 3D Hero */}
      <PopHero />

      {/* 2. Spotlight Category Highlights */}
      <SpotlightCards />

      {/* 3. Curated Best-Sellers Grid */}
      <FeaturedGrid />

      {/* 4. Trust Pillars & Brand Strip */}
      <section className="play-trust-section" id="why-us" style={{
        padding: '72px 0',
        background: 'var(--color-yellow-tint, #fff9e6)'
      }}>
        <div className="play-wrap">
          <div className="play-section-head" style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="play-section-pill">Why Pet Parents Choose Petchup</span>
            <h2 className="play-section-title" style={{ fontSize: '2rem', marginTop: '8px' }}>
              The Petchup Gold Standard 🐾
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px'
          }}>
            <div id="trust" className="play-soft-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌱</div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: 'var(--play-charcoal, #2D3142)' }}>
                100% Wholesome Ingredients
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                Whole proteins, organic ancient grains, and zero artificial preservatives or fillers.
              </p>
            </div>

            <div id="shipping" className="play-soft-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚡</div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: 'var(--play-charcoal, #2D3142)' }}>
                Lightning Zoomies Dispatch
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                Orders ship in under 24 hours. Fast, tracked doorstep delivery across all regions.
              </p>
            </div>

            <div id="vet" className="play-soft-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🩺</div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: 'var(--play-charcoal, #2D3142)' }}>
                Vet-Approved Nutrition
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                Formulated alongside leading animal nutritionists for optimal vitality and shiny coats.
              </p>
            </div>

            <div id="returns" className="play-soft-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🤝</div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: 'var(--play-charcoal, #2D3142)' }}>
                Tail-Wag Guarantee
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                If your pet doesn't lick their bowl clean or love their toy, returns are 100% free and easy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Customer Testimonials */}
      <section className="play-testimonials-section" id="testimonials" style={{ padding: '72px 0' }}>
        <div className="play-wrap">
          <div className="play-section-head" style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="play-section-pill">Loved by 12,000+ Pets</span>
            <h2 className="play-section-title" style={{ fontSize: '2rem', marginTop: '8px' }}>
              Happy Tales &amp; Wagging Tails 💬
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            <div className="play-soft-card">
              <div style={{ color: '#f59e0b', fontSize: '18px', marginBottom: '8px' }}>★★★★★</div>
              <p style={{ fontSize: '14px', color: '#334155', fontStyle: 'italic', marginBottom: '16px' }}>
                "My Golden Retriever Milo used to be so finicky with dry kibble. He devoured the Salmon Crunchies in two minutes! Plus the delivery in Manila was super fast."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🐶</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', color: 'var(--play-charcoal, #2D3142)' }}>Bianca &amp; Milo</strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Verified Pet Parent</span>
                </div>
              </div>
            </div>

            <div className="play-soft-card">
              <div style={{ color: '#f59e0b', fontSize: '18px', marginBottom: '8px' }}>★★★★★</div>
              <p style={{ fontSize: '14px', color: '#334155', fontStyle: 'italic', marginBottom: '16px' }}>
                "The rainbow climbing-rope leash is virtually indestructible. Our energetic Husky pulled on every other leash, but this one is comfortable on my hands and holds strong."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🐕</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', color: 'var(--play-charcoal, #2D3142)' }}>Rafael &amp; Ghost</strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Verified Pet Parent</span>
                </div>
              </div>
            </div>

            <div className="play-soft-card">
              <div style={{ color: '#f59e0b', fontSize: '18px', marginBottom: '8px' }}>★★★★★</div>
              <p style={{ fontSize: '14px', color: '#334155', fontStyle: 'italic', marginBottom: '16px' }}>
                "The Wild Alaskan Salmon Oil worked miracles on our cat Cleo's dry coat. Within two weeks her fur is silky soft and shiny. Petchup is our go-to shop now!"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🐱</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', color: 'var(--play-charcoal, #2D3142)' }}>Camille &amp; Cleo</strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Verified Pet Parent</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Bold Call to Action Banner */}
      <section style={{
        padding: '72px 0',
        background: 'linear-gradient(135deg, var(--play-orange, #FF6B35) 0%, #FF834E 100%)',
        color: '#fff',
        textAlign: 'center'
      }}>
        <div className="play-wrap">
          <h2 style={{ fontSize: '2.4rem', fontWeight: 900, margin: '0 0 12px', color: '#fff' }}>
            Ready To Make Your Pet Smile? 🐾
          </h2>
          <p style={{ fontSize: '1.1rem', maxWidth: '520px', margin: '0 auto 28px', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
            Join over 12,000 pet parents and treat your fur baby to whole nutrition and indestructible fun!
          </p>
          <Link to="/shop" className="btn-pop-yellow">
            Explore Full Catalog 🚀
          </Link>
        </div>
      </section>
    </main>
  );
}
