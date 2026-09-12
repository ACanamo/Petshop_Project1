import React, { useEffect } from 'react';

export default function OrderSuccessModal({ order, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!order) return null;

  return (
    <div
      className="order-success-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(30, 41, 59, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 2400
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-success-title"
        style={{
          background: 'var(--play-cream, #FFFDF9)',
          borderRadius: '28px',
          border: 'none',
          boxShadow: 'none',
          width: '100%',
          maxWidth: '400px',
          overflow: 'hidden',
          position: 'relative',
          animation: 'modalSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          textAlign: 'center'
        }}
      >
        <div style={{
          padding: '36px 24px 24px',
          background: 'linear-gradient(135deg, var(--play-orange, #FF6B35) 0%, #FF834E 100%)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎉</div>
          <h3 id="order-success-title" style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#fff' }}>
            Order Confirmed!
          </h3>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
            Thank you for shopping at PETCHUP!
          </p>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255, 107, 53, 0.1)',
            color: 'var(--play-orange, #FF6B35)',
            fontWeight: 700,
            fontSize: '13px',
            padding: '8px 18px',
            borderRadius: '999px',
            marginBottom: '16px'
          }}>
            Order #{order.id}
          </div>

          <p style={{ margin: '0 0 22px', fontSize: '14px', color: 'var(--play-charcoal, #2D3142)', fontWeight: 600 }}>
            Your fur baby will love it! 🐾
          </p>

          <button
            type="button"
            className="btn-pop-yellow"
            onClick={onClose}
            style={{ width: '100%', boxSizing: 'border-box', border: 'none', cursor: 'pointer' }}
          >
            Awesome, Thanks! 🐾
          </button>
        </div>
      </div>
    </div>
  );
}
