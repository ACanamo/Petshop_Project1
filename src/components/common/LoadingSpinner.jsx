import React from 'react';

// Reuses the same `.route-loading` treatment already used for the
// top-level route-change fallback, so loading states look consistent
// across the app. Pass `compact` when embedding inside a smaller
// container (a modal, a panel) where 45vh of height would be too tall.
export default function LoadingSpinner({ label = "Loading…", compact = false }) {
  return (
    <div className={`route-loading ${compact ? 'loading-inline' : ''}`} role="status">
      {label}
    </div>
  );
}
