import React, { useState, useRef, useLayoutEffect, useCallback, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrdersContext';

export default function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { totalCount, openCart } = useCart();
  const { user, isAdmin, openAuth, logout } = useAuth();
  const { openOrderHistory } = useOrders();
  const location = useLocation();

  // Playful bump on the cart icon whenever an item is added.
  const [cartBump, setCartBump] = useState(false);
  const prevTotalCount = useRef(totalCount);
  const bumpTimer = useRef(null);

  useEffect(() => {
    if (totalCount > prevTotalCount.current) {
      setCartBump(true);
      window.clearTimeout(bumpTimer.current);
      bumpTimer.current = window.setTimeout(() => setCartBump(false), 500);
    }
    prevTotalCount.current = totalCount;
    return () => window.clearTimeout(bumpTimer.current);
  }, [totalCount]);

  const toggleMobileNav = () => setMobileNavOpen(prev => !prev);
  const closeMobileNav = () => setMobileNavOpen(false);

  // Desktop nav items — a single source of truth drives both the links and
  // the sliding "glide" highlight pill behind the hovered/active item.
  const navItems = [
    { key: 'home', to: '/', label: 'Home', isActive: location.pathname === '/' },
    { key: 'shop', to: '/shop', label: 'Shop All', isActive: location.pathname === '/shop' && !location.search },
    { key: 'feeds', to: '/shop?cat=feeds', label: 'Feeds', isActive: location.search.includes('feeds') },
    { key: 'accessories', to: '/shop?cat=accessories', label: 'Accessories', isActive: location.search.includes('accessories') },
    { key: 'grooming', to: '/shop?cat=grooming', label: 'Grooming', isActive: location.search.includes('grooming') },
    { key: 'wellness', to: '/shop?cat=wellness', label: 'Wellness', isActive: location.search.includes('wellness') }
  ];
  if (isAdmin) {
    navItems.push({ key: 'admin', to: '/admin', label: '⚙️ Admin Panel', isActive: location.pathname === '/admin' });
  }

  const [hoveredKey, setHoveredKey] = useState(null);
  const activeItem = navItems.find(item => item.isActive);
  const glideKey = hoveredKey || activeItem?.key || null;

  const navTrackRef = useRef(null);
  const itemRefs = useRef({});
  const [glideStyle, setGlideStyle] = useState({ opacity: 0 });

  const measureGlide = useCallback(() => {
    const track = navTrackRef.current;
    const el = glideKey ? itemRefs.current[glideKey] : null;
    if (!track || !el) {
      setGlideStyle({ opacity: 0 });
      return;
    }
    const trackRect = track.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setGlideStyle({
      opacity: 1,
      width: elRect.width,
      transform: `translateX(${elRect.left - trackRect.left}px)`
    });
  }, [glideKey]);

  useLayoutEffect(() => {
    measureGlide();
  }, [measureGlide, navItems.length]);

  useLayoutEffect(() => {
    window.addEventListener('resize', measureGlide);
    return () => window.removeEventListener('resize', measureGlide);
  }, [measureGlide]);

  return (
    <header className="site-header play-header" id="site-header">
      <div className="wrap header-inner header-row">
        {/* Brand Logo */}
        <Link to="/" className="brand brand-logo" aria-label="PETCHUP Home" onClick={closeMobileNav}>
          <span className="logo-mark" aria-hidden="true">🐾</span>
          <span className="logo-text">PETCHUP</span>
        </Link>

        {/* Desktop Navigation — glossy 3D pill track with a sliding highlight */}
        <nav className="desktop-nav main-nav" aria-label="Primary Navigation">
          <div className="nav-pill-track" ref={navTrackRef} onMouseLeave={() => setHoveredKey(null)}>
            <span className="nav-pill-glide" style={glideStyle} aria-hidden="true" />
            <ul className="nav-list">
              {navItems.map(item => (
                <li key={item.key}>
                  <Link
                    to={item.to}
                    ref={(el) => { itemRefs.current[item.key] = el; }}
                    className={`nav-link ${item.isActive ? 'is-active' : ''} ${glideKey === item.key ? 'is-glided' : ''}`}
                    onMouseEnter={() => setHoveredKey(item.key)}
                    onFocus={() => setHoveredKey(item.key)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Header Actions */}
        <div className="header-actions">
          {/* User Auth / Profile Dropdown */}
          <div className="user-profile-menu" style={{ position: 'relative' }}>
            {user ? (
              <div className="user-btn-wrap">
                <button
                  type="button"
                  className="btn btn-outline btn-pill header-user-btn"
                  onClick={() => setUserDropdownOpen(prev => !prev)}
                  aria-expanded={userDropdownOpen}
                  aria-label="User Account Menu"
                >
                  <span className="user-avatar-mini">{user.petEmoji || "🐾"}</span>
                  <span className="user-name-short">{user.name.split(' ')[0]}</span>
                  <span className="dropdown-caret">▾</span>
                </button>

                {userDropdownOpen && (
                  <div className="user-dropdown-menu" style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: '#fff',
                    border: '3px solid #1e293b',
                    borderRadius: '16px',
                    boxShadow: '4px 4px 0px #1e293b',
                    padding: '12px',
                    minWidth: '220px',
                    zIndex: 1000
                  }}>
                    <div className="user-dropdown-header" style={{ paddingBottom: '8px', borderBottom: '2px dashed #e2e8f0', marginBottom: '8px' }}>
                      <strong style={{ display: 'block', fontSize: '14px', color: '#1e293b' }}>{user.name}</strong>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{user.email}</span>
                      {user.petName && (
                        <div style={{ fontSize: '11px', marginTop: '4px', color: 'var(--color-coral)' }}>
                          Pet: {user.petEmoji || "🐶"} {user.petName}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="dropdown-item-btn"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        openOrderHistory();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '8px 10px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      📦 My Order History
                    </button>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          fontWeight: 600,
                          fontSize: '13px',
                          color: 'var(--color-purple)',
                          textDecoration: 'none'
                        }}
                      >
                        ⚙️ Admin Dashboard
                      </Link>
                    )}

                    <button
                      type="button"
                      className="dropdown-item-btn"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '8px 10px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '13px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        textAlign: 'left',
                        marginTop: '4px',
                        borderTop: '1px solid #f1f5f9'
                      }}
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-outline btn-pill header-auth-btn"
                onClick={() => openAuth('login')}
              >
                <span>👤</span>
                <span className="auth-btn-label">Sign In</span>
              </button>
            )}
          </div>

          {/* Cart Drawer Toggle */}
          <button
            type="button"
            className={`btn btn-primary btn-pill cart-toggle-btn ${cartBump ? 'is-bumping' : ''}`}
            id="cart-toggle-btn"
            onClick={openCart}
            aria-label={`Open Cart (${totalCount} items)`}
          >
            <svg className="cart-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="20" r="1" />
              <circle cx="19" cy="20" r="1" />
              <path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.5h7.9a2 2 0 0 0 1.9-1.4L21 8H7" />
            </svg>
            <span className="cart-btn-label">Cart</span>
            {totalCount > 0 && (
              <span className={`cart-counter ${cartBump ? 'bump' : ''}`} id="cart-counter" aria-label={`${totalCount} items in cart`}>
                {totalCount}
              </span>
            )}
          </button>

          {/* Mobile Nav Toggle */}
          <button
            type="button"
            className={`nav-toggle mobile-menu-toggle ${mobileNavOpen ? 'is-active' : ''}`}
            id="nav-toggle"
            aria-expanded={mobileNavOpen}
            aria-label="Toggle navigation menu"
            onClick={toggleMobileNav}
          >
            <span className="nav-toggle-bar bar"></span>
            <span className="nav-toggle-bar bar"></span>
            <span className="nav-toggle-bar bar"></span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <nav
        className={`mobile-nav ${mobileNavOpen ? 'is-open' : ''}`}
        id="mobile-nav"
        hidden={!mobileNavOpen}
        aria-label="Mobile Navigation"
      >
        <div className="mobile-nav-inner">
          <ul className="mobile-nav-list">
            <li>
              <Link to="/" className="mobile-nav-link" onClick={closeMobileNav}>
                🏠 Home
              </Link>
            </li>
            <li>
              <Link to="/shop" className="mobile-nav-link" onClick={closeMobileNav}>
                🛍️ Shop All
              </Link>
            </li>
            <li>
              <Link to="/shop?cat=feeds" className="mobile-nav-link" onClick={closeMobileNav}>
                🥫 Feeds & Food
              </Link>
            </li>
            <li>
              <Link to="/shop?cat=accessories" className="mobile-nav-link" onClick={closeMobileNav}>
                🎾 Toys & Accessories
              </Link>
            </li>
            <li>
              <Link to="/shop?cat=grooming" className="mobile-nav-link" onClick={closeMobileNav}>
                🛁 Grooming
              </Link>
            </li>
            <li>
              <Link to="/shop?cat=wellness" className="mobile-nav-link" onClick={closeMobileNav}>
                💊 Health & Wellness
              </Link>
            </li>
            {isAdmin && (
              <li>
                <Link to="/admin" className="mobile-nav-link" onClick={closeMobileNav} style={{ color: 'var(--color-purple)' }}>
                  ⚙️ Admin Panel
                </Link>
              </li>
            )}
          </ul>

          <div className="mobile-nav-footer">
            {user ? (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                  {user.petEmoji || "🐾"} Signed in as {user.name}
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-pill btn-full"
                  style={{ marginTop: '8px' }}
                  onClick={() => {
                    closeMobileNav();
                    openOrderHistory();
                  }}
                >
                  📦 My Order History
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-pill btn-full"
                  style={{ marginTop: '8px', color: '#ef4444' }}
                  onClick={() => {
                    closeMobileNav();
                    logout();
                  }}
                >
                  🚪 Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-outline btn-pill btn-full"
                style={{ marginBottom: '12px' }}
                onClick={() => {
                  closeMobileNav();
                  openAuth('login');
                }}
              >
                👤 Sign In / Create Account
              </button>
            )}

            <button
              type="button"
              className="btn btn-primary btn-pill btn-full"
              id="mobile-view-cart-btn"
              onClick={() => {
                closeMobileNav();
                openCart();
              }}
            >
              🛒 View Cart ({totalCount})
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
