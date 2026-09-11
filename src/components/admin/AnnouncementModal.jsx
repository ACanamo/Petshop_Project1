import React, { useState, useEffect } from 'react';

export default function AnnouncementModal({ isOpen, onClose, onSave, initialAnn }) {
  const [pill, setPill] = useState('');
  const [text, setText] = useState('');
  const [link, setLink] = useState('/shop');
  const [linkText, setLinkText] = useState('Explore deals →');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialAnn) {
      setPill(initialAnn.pill || '');
      setText(initialAnn.text || '');
      setLink(initialAnn.link || '/shop');
      setLinkText(initialAnn.linkText || 'Explore deals →');
      setIsActive(Boolean(initialAnn.isActive));
    } else {
      setPill('Limited offer');
      setText('');
      setLink('/shop');
      setLinkText('Explore deals →');
      setIsActive(true);
    }
  }, [initialAnn, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      alert("Please provide announcement message text.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        pill: pill.trim() || 'Announcement',
        text: text.trim(),
        link: link.trim() || '/shop',
        linkText: linkText.trim() || 'Explore deals →',
        isActive
      });
      onClose();
    } catch (error) {
      alert(error.message || 'The announcement could not be saved. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="announcement-modal-overlay" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(30, 41, 59, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 2100,
      fontFamily: 'var(--font-play)'
    }}>
      <div className="announcement-modal-card" style={{
        background: '#fff',
        borderRadius: '26px',
        border: '2px solid var(--play-border)',
        boxShadow: '0 24px 60px rgba(45, 49, 66, 0.18)',
        width: '100%',
        maxWidth: '520px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, var(--play-teal) 0%, #20E3B2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#fff' }}>
            {initialAnn ? '📢 Edit Store Announcement' : '📢 Create Announcement Banner'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(45, 49, 66, 0.12)'
            }}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              Badge Pill Text
            </label>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder="e.g. Flash sale, Limited offer"
              value={pill}
              onChange={(e) => setPill(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              Announcement Message *
            </label>
            <textarea
              className="form-input"
              rows={3}
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder="e.g. Get 15% off your order with code FIRSTPAW15 — Dispatched within 24 hours"
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            <div style={{ flex: 1.5 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                Link Target
              </label>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="/shop or /shop?cat=feeds"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                CTA Button Text
              </label>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="Shop Deals →"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="ann-active-check"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <label htmlFor="ann-active-check" style={{ fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
              Publish as active banner right now
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-outline btn-pill"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-pill"
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : initialAnn ? "Save Changes" : "Create Announcement 📢"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
