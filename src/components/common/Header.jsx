import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GearIcon as Gear,
  UserCircleIcon as UserCircle,
  PackageIcon as Package,
  SignOutIcon as SignOut,
  HouseIcon as House,
  StorefrontIcon as Storefront,
  ForkKnifeIcon as ForkKnife,
  PawPrintIcon as PawPrint,
  DropIcon as Drop,
  PillIcon as Pill,
  ShoppingCartSimpleIcon as ShoppingCartSimple,
  CaretDownIcon as CaretDown,
  MagnifyingGlassIcon as MagnifyingGlass
} from '@phosphor-icons/react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrdersContext';

export default function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { totalCount, openCart } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const { openOrderHistory } = useOrders();
  const location = useLocation();
  const navigate = useNavigate();

  // Playful bump on the cart button whenever an item is added
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

  // Close dropdown on outside click
  const dropdownRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

  const toggleMobileNav = () => setMobileNavOpen(prev => !prev);
  const closeMobileNav = () => setMobileNavOpen(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      closeMobileNav();
    }
  };

  const navItems = [
    { key: 'home', to: '/', label: 'Home', isActive: location.pathname === '/' },
    { key: 'shop', to: '/shop', label: 'Shop All', isActive: location.pathname === '/shop' && !location.search },
    { key: 'feeds', to: '/shop?cat=feeds', label: 'Feeds', isActive: location.search.includes('feeds') },
    { key: 'accessories', to: '/shop?cat=accessories', label: 'Accessories', isActive: location.search.includes('accessories') },
    { key: 'grooming', to: '/shop?cat=grooming', label: 'Grooming', isActive: location.search.includes('grooming') },
    { key: 'wellness', to: '/shop?cat=wellness', label: 'Wellness', isActive: location.search.includes('wellness') }
  ];

  if (isAdmin) {
    navItems.push({
      key: 'admin',
      to: '/admin',
      label: 'Admin',
      isActive: location.pathname === '/admin'
    });
  }

  return (
    <header className="petchup-header" id="site-header">
      <div className="petchup-header-inner">
        {/* Brand Logo */}
        <Link to="/" className="petchup-logo-wrap" aria-label="PETCHUP Home" onClick={closeMobileNav}>
          <svg className="petchup-paw-logo" viewBox="0 0 24 24" width="28" height="28" fill="#E85923" aria-hidden="true">
            <ellipse cx="6.5" cy="8.5" rx="2.4" ry="3.4" />
            <ellipse cx="17.5" cy="8.5" rx="2.4" ry="3.4" />
            <ellipse cx="10" cy="5" rx="2.2" ry="3.1" />
            <ellipse cx="14" cy="5" rx="2.2" ry="3.1" />
            <path d="M12 10.5 C8.5 10.5 6.2 13.5 6.7 17.2 C7.1 19.8 9.5 21.2 12 21.2 C14.5 21.2 16.9 19.8 17.3 17.2 C17.8 13.5 15.5 10.5 12 10.5 Z" />
          </svg>
          <span className="petchup-logo-text">PETCHUP</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="petchup-nav" aria-label="Main Navigation">
          <ul className="petchup-nav-list">
            {navItems.map(item => (
              <li key={item.key} className="petchup-nav-item">
                <Link
                  to={item.to}
                  className={`petchup-nav-link ${item.isActive ? 'active' : ''}`}
                >
                  {item.label}
                  {item.isActive && <span className="petchup-nav-indicator" />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="petchup-search-bar" role="search">
          <MagnifyingGlass size={16} weight="bold" className="search-icon" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            aria-label="Search products"
          />
        </form>

        {/* Actions (User & Cart) */}
        <div className="petchup-header-actions">
          {/* User Account / Profile Dropdown */}
          <div className="petchup-user-wrap" ref={dropdownRef}>
            {user ? (
              <>
                <button
                  type="button"
                  className="petchup-user-pill"
                  onClick={() => setUserDropdownOpen(prev => !prev)}
                  aria-expanded={userDropdownOpen}
                  aria-label="User Account Menu"
                >
                  <span className="user-avatar-circle">{user.petEmoji || "🐰"}</span>
                  <span className="user-pill-name">{user.name.split(' ')[0]}</span>
                  <CaretDown size={12} weight="bold" className="user-pill-caret" aria-hidden="true" />
                </button>

                {userDropdownOpen && (
                  <div className="petchup-dropdown-menu">
                    <div className="dropdown-user-header">
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                      {user.petName && (
                        <div className="dropdown-pet-tag">
                          Companion: {user.petName}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="dropdown-menu-item"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        openOrderHistory();
                      }}
                    >
                      <Package size={16} weight="bold" aria-hidden="true" /> My Orders
                    </button>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="dropdown-menu-item dropdown-admin-link"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <Gear size={16} weight="bold" aria-hidden="true" /> Admin Dashboard
                      </Link>
                    )}

                    <button
                      type="button"
                      className="dropdown-menu-item signout"
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        await logout();
                        navigate('/login');
                      }}
                    >
                      <SignOut size={16} weight="bold" aria-hidden="true" /> Sign Out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                type="button"
                className="petchup-user-pill guest"
                onClick={() => navigate('/login')}
                aria-label="Sign in"
              >
                <span className="user-avatar-circle">👤</span>
                <span className="user-pill-name">Sign In</span>
              </button>
            )}
          </div>

          {/* Cart Pill Button with Framer Motion spring */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            className={`petchup-cart-btn ${cartBump ? 'is-bumping' : ''}`}
            id="cart-toggle-btn"
            onClick={openCart}
            aria-label={`Open Cart (${totalCount} items)`}
          >
            <ShoppingCartSimple size={18} weight="bold" className="cart-svg-icon" aria-hidden="true" />
            <span className="cart-label">Cart</span>
            <AnimatePresence mode="popLayout">
              {totalCount > 0 && (
                <motion.span
                  key={totalCount}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="cart-counter-badge"
                  id="cart-counter"
                >
                  {totalCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            className={`petchup-mobile-toggle ${mobileNavOpen ? 'is-active' : ''}`}
            id="nav-toggle"
            aria-expanded={mobileNavOpen}
            aria-label="Toggle navigation menu"
            onClick={toggleMobileNav}
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`petchup-mobile-drawer ${mobileNavOpen ? 'open' : ''}`}>
        <form onSubmit={handleSearchSubmit} className="mobile-search-form">
          <MagnifyingGlass size={16} weight="bold" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <ul className="mobile-drawer-links">
          {navItems.map(item => (
            <li key={item.key}>
              <Link to={item.to} onClick={closeMobileNav} className={item.isActive ? 'active' : ''}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mobile-drawer-footer">
          {user ? (
            <>
              <button
                type="button"
                className="mobile-btn"
                onClick={() => { closeMobileNav(); openOrderHistory(); }}
              >
                <Package size={16} weight="bold" /> My Orders
              </button>
              <button
                type="button"
                className="mobile-btn danger"
                onClick={async () => { closeMobileNav(); await logout(); navigate('/login'); }}
              >
                <SignOut size={16} weight="bold" /> Sign Out
              </button>
            </>
          ) : (
            <button
              type="button"
              className="mobile-btn primary"
              onClick={() => { closeMobileNav(); navigate('/login'); }}
            >
              <UserCircle size={16} weight="bold" /> Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
