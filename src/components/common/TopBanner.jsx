import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';

export default function TopBanner() {
  const { activeAnnouncement } = useStore();

  const legacyPath = (activeAnnouncement?.link || '').replace(/\.html(?=\?|#|$)/, '');
  const normalizedPath = legacyPath === 'index' || legacyPath === '/index'
    ? '/'
    : legacyPath.startsWith('/') ? legacyPath : `/${legacyPath}`;

  const messageText = 'A little more love for every paw.';

  return (
    <aside className="top-banner warm-coral-banner" id="site-banner" aria-label="Announcement">
      <div className="banner-inner-centered">
        <span className="banner-heart" aria-hidden="true">🤍</span>
        <span className="banner-text">{messageText}</span>
        <span className="banner-heart" aria-hidden="true">🤍</span>
      </div>
    </aside>
  );
}
