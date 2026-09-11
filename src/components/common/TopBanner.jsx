import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';

export default function TopBanner() {
  const { activeAnnouncement } = useStore();

  if (!activeAnnouncement) return null;

  const legacyPath = (activeAnnouncement.link || '').replace(/\.html(?=\?|#|$)/, '');
  const normalizedPath = legacyPath === 'index' || legacyPath === '/index'
    ? '/'
    : legacyPath.startsWith('/') ? legacyPath : `/${legacyPath}`;
  const pillText = (activeAnnouncement.pill || '').toUpperCase().includes('PAWTY SALE')
    ? '🎉 PAWTY SALE'
    : activeAnnouncement.pill || 'Special Offer';

  return (
    <aside className="top-banner" id="site-banner" aria-label="Announcement">
      <div className="wrap banner-inner" id="banner-inner">
        <span className="banner-pill">{pillText}</span>
        <span className="banner-text">{activeAnnouncement.text}</span>
        {activeAnnouncement.link && (
          <Link to={normalizedPath} className="banner-link">
            {activeAnnouncement.linkText || "Shop Deals →"}
          </Link>
        )}
      </div>
    </aside>
  );
}
