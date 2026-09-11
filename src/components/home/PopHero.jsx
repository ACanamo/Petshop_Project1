import React, { useRef } from 'react';
import { Link } from 'react-router-dom';

export default function PopHero() {
  const handlePointerMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
    card.style.setProperty("--xp", (x / rect.width).toFixed(3));
    card.style.setProperty("--yp", (y / rect.height).toFixed(3));
  };

  const handlePointerLeave = (e) => {
    const card = e.currentTarget;
    card.style.removeProperty("--mouse-x");
    card.style.removeProperty("--mouse-y");
  };

  return (
    <section className="pop-hero-wrapper" aria-labelledby="pop-hero-heading">
      <div className="pop-hero-container">
        
        {/* Massive Pop-Art 3D Typography Stack */}
        <div className="pop-type-container">
          <div className="pop-text-stack">
            <div className="pop-row-left">
              <h1 id="pop-hero-heading" className="pop-title-word pop-word-yellow">#PETCHUP</h1>
            </div>
            <div className="pop-row-center">
              <span className="pop-title-word pop-word-white">HAPPIEST</span>
            </div>
            <div className="pop-row-right">
              <span className="pop-title-word pop-word-white">PETS &amp; TAILS</span>
            </div>
          </div>

          <p className="pop-hero-support">
            Wholesome natural nutrition, chew-tested gear, and joyful toys delivered straight to your doorstep with lightning zoomies speed! 🐾
          </p>

          <div className="pop-hero-buttons">
            <Link to="/shop?cat=accessories" className="btn-pop-yellow">
              Shop Accessories 🎾
            </Link>
            <Link to="/shop?cat=feeds" className="btn-pop-white">
              Browse Feeds 🥫
            </Link>
          </div>
        </div>

        {/* Floating Glass Pet Profile Card 1 (Bottom Left: Milo) */}
        <div className="pop-glass-card pop-glass-left">
          <div className="pop-glass-avatar">
            <img src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=200&q=80" alt="Milo the Golden Retriever" />
          </div>
          <p className="pop-glass-name">Milo the Golden 🐶</p>
          <p className="pop-glass-meta">Certified Good Boy &middot; 420 Treats Snacked</p>
        </div>

        {/* Floating Glass Pet Profile Card 2 (Top Right: Cleo) */}
        <div className="pop-glass-card pop-glass-right">
          <div className="pop-glass-avatar">
            <img src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=200&q=80" alt="Cleo the Tuxedo Cat" />
          </div>
          <p className="pop-glass-name">Cleo the Tuxedo 🐱</p>
          <p className="pop-glass-meta">VIP Nap Specialist &middot; 1,280 Purrs</p>
        </div>

        {/* Curvy Hand-Drawn Doodle Arrow Left */}
        <div className="pop-doodle-arrow pop-arrow-left" aria-hidden="true">
          <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" stroke="#FFD166" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10,90 C 10,40 40,20 60,50 C 70,65 80,75 95,70" />
            <path d="M80,55 L95,70 L85,85" />
          </svg>
        </div>

        {/* Curvy Hand-Drawn Doodle Arrow Right */}
        <div className="pop-doodle-arrow pop-arrow-right" aria-hidden="true">
          <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" stroke="#FFD166" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M90,10 C 80,60 60,80 40,60 C 20,40 40,20 60,30 C 80,40 70,70 50,80" />
            <path d="M65,75 L50,80 L55,65" />
          </svg>
        </div>

        {/* Continuous Rotating 15% Discount Badge */}
        <div className="pop-spin-badge-wrap">
          <div
            className="pop-spin-badge"
            title="Claim 15% Off with code FIRSTPAW15"
            onClick={() => {
              const el = document.getElementById('site-footer');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="pop-spin-ring">
              <svg viewBox="0 0 100 100" width="100%" height="100%">
                <path id="popCirclePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
                <text fontSize="10.5" fontWeight="900" letterSpacing="0.16em" fill="#2D3142">
                  <textPath href="#popCirclePath" startOffset="0%">
                    • 15% OFF FIRST ORDER • CODE: FIRSTPAW15 • 
                  </textPath>
                </text>
              </svg>
            </div>
            <div className="pop-spin-center">🐾</div>
          </div>
        </div>

      </div>

      {/* Bottom Features Section (Rounded Sheet) with Spotlight pointer glow */}
      <div className="pop-features-sheet">
        <div className="pop-features-grid">
          
          {/* Card 1: Fast Delivery (Orange Glow) */}
          <div
            className="pop-feature-card"
            data-glow
            data-glow-color="orange"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          >
            <h3 className="pop-feature-title">FAST ZOOMIES<br />DELIVERY 🚀</h3>
            <p className="pop-feature-desc">Dispatched within 24h straight to the pet bowl</p>
            
            <div className="pop-pill-graphic-1">
              <div className="pop-graphic-pill-1">
                <span className="pop-graphic-icon-1">⚡</span>
                <div className="pop-graphic-text-1">
                  <div className="pop-graphic-title-1">Zoomies Dispatch</div>
                  <div className="pop-graphic-sub-1">Leaves warehouse in 24h</div>
                </div>
              </div>
              <div className="pop-graphic-badge-1">FREE over ₱45</div>
            </div>

            {/* Connecting Arrow to Card 2 */}
            <div className="pop-card-connector-1" aria-hidden="true">
              <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" stroke="#2D3142" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20,80 Q 40,20 80,40" />
                <path d="M60,20 L80,40 L50,60" />
              </svg>
            </div>
          </div>

          {/* Card 2: Vet Approved (Teal Glow) */}
          <div
            className="pop-feature-card"
            data-glow
            data-glow-color="teal"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          >
            <h3 className="pop-feature-title">VET-APPROVED<br />NUTRITION 🩺</h3>
            <p className="pop-feature-desc">100% human-grade, zero artificial junk</p>

            <div className="pop-pill-graphic-2">
              <div className="pop-graphic-pill-2">
                <span className="pop-graphic-badge-2">Grade A+</span>
                <span className="pop-graphic-label-2">Certified Feeds</span>
              </div>
              <div className="pop-floating-pill-2" aria-hidden="true">✓</div>
            </div>

            {/* Connecting Arrow to Card 3 */}
            <div className="pop-card-connector-2" aria-hidden="true">
              <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" stroke="#2D3142" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20,80 Q 40,20 80,40" />
                <path d="M60,20 L80,40 L50,60" />
              </svg>
            </div>
          </div>

          {/* Card 3: Guarantee (Yellow Glow) */}
          <div
            className="pop-feature-card"
            data-glow
            data-glow-color="yellow"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          >
            <h3 className="pop-feature-title">30-DAY TAIL-WAG<br />GUARANTEE 🐾</h3>
            <p className="pop-feature-desc">Chew-tested gear &amp; total meal happiness</p>

            <div className="pop-pill-graphic-3">
              <span className="pop-graphic-title-3">Happiness Rate</span>
              <span className="pop-graphic-stat-3">99.8% Wags</span>
              <div className="pop-bubble-tail-3"></div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
