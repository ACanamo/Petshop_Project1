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
        padding: '64px 0',
        background: 'var(--color-yellow-tint, #fff9e6)',
        borderTop: '3px solid #1e293b',
        borderBottom: '3px solid #1e293b'
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
            <div id="trust" style={{
              background: '#fff',
              border: '2px solid #1e293b',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '4px 4px 0px #1e293b',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌱</div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: '#1e293b' }}>
                100% Wholesome Ingredients
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                Whole proteins, organic ancient grains, and zero artificial preservatives or fillers.
              </p>
            </div>

            <div id="shipping" style={{
              background: '#fff',
              border: '2px solid #1e293b',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '4px 4px 0px #1e293b',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚡</div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: '#1e293b' }}>
                Lightning Zoomies Dispatch
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                Orders ship in under 24 hours. Fast, tracked doorstep delivery across all regions.
              </p>
            </div>

            <div id="vet" style={{
              background: '#fff',
              border: '2px solid #1e293b',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '4px 4px 0px #1e293b',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🩺</div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: '#1e293b' }}>
                Vet-Approved Nutrition
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                Formulated alongside leading animal nutritionists for optimal vitality and shiny coats.
              </p>
            </div>

            <div id="returns" style={{
              background: '#fff',
              border: '2px solid #1e293b',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '4px 4px 0px #1e293b',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🤝</div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: '#1e293b' }}>
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
      <section className="play-testimonials-section" id="testimonials" style={{ padding: '64px 0' }}>
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
            <div style={{
              background: '#fff',
              border: '2px solid #1e293b',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '4px 4px 0px #1e293b'
            }}>
              <div style={{ color: '#f59e0b', fontSize: '18px', marginBottom: '8px' }}>★★★★★</div>
              <p style={{ fontSize: '14px', color: '#334155', fontStyle: 'italic', marginBottom: '16px' }}>
                "My Golden Retriever Milo used to be so finicky with dry kibble. He devoured the Salmon Crunchies in two minutes! Plus the delivery in Manila was super fast."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🐶</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', color: '#1e293b' }}>Bianca &amp; Milo</strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Verified Pet Parent</span>
                </div>
              </div>
            </div>

            <div style={{
              background: '#fff',
              border: '2px solid #1e293b',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '4px 4px 0px #1e293b'
            }}>
              <div style={{ color: '#f59e0b', fontSize: '18px', marginBottom: '8px' }}>★★★★★</div>
              <p style={{ fontSize: '14px', color: '#334155', fontStyle: 'italic', marginBottom: '16px' }}>
                "The rainbow climbing-rope leash is virtually indestructible. Our energetic Husky pulled on every other leash, but this one is comfortable on my hands and holds strong."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🐕</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', color: '#1e293b' }}>Rafael &amp; Ghost</strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Verified Pet Parent</span>
                </div>
              </div>
            </div>

            <div style={{
              background: '#fff',
              border: '2px solid #1e293b',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '4px 4px 0px #1e293b'
            }}>
              <div style={{ color: '#f59e0b', fontSize: '18px', marginBottom: '8px' }}>★★★★★</div>
              <p style={{ fontSize: '14px', color: '#334155', fontStyle: 'italic', marginBottom: '16px' }}>
                "The Wild Alaskan Salmon Oil worked miracles on our cat Cleo's dry coat. Within two weeks her fur is silky soft and shiny. Petchup is our go-to shop now!"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🐱</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', color: '#1e293b' }}>Camille &amp; Cleo</strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Verified Pet Parent</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Bold Call to Action Banner */}
      <section style={{
        padding: '60px 0',
        background: 'var(--color-orange, #ff6b35)',
        color: '#fff',
        borderTop: '3px solid #1e293b',
        borderBottom: '3px solid #1e293b',
        textAlign: 'center'
      }}>
        <div className="play-wrap">
          <h2 style={{ fontSize: '2.4rem', fontWeight: 900, margin: '0 0 12px', color: '#fff', textShadow: '2px 2px 0px #1e293b' }}>
            Ready To Make Your Pet Smile? 🐾
          </h2>
          <p style={{ fontSize: '1.1rem', maxWidth: '520px', margin: '0 auto 28px', color: '#fff', fontWeight: 600 }}>
            Join over 12,000 pet parents and treat your fur baby to whole nutrition and indestructible fun!
          </p>
          <Link to="/shop" className="btn btn-pill" style={{
            background: 'var(--color-yellow, #ffd166)',
            color: '#1e293b',
            fontSize: '1.1rem',
            padding: '14px 32px',
            border: '3px solid #1e293b',
            boxShadow: '4px 4px 0px #1e293b',
            fontWeight: 800,
            textDecoration: 'none',
            display: 'inline-block'
          }}>
            Explore Full Catalog 🚀
          </Link>
        </div>
      </section>
    </main>
  );
}
