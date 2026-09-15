import React, { useState } from 'react';

// Drop-in replacement for a plain <input type="password" className="form-input" .../>
// that adds a show/hide toggle. Accepts the same props (value, onChange,
// placeholder, id, required, minLength, etc.) and forwards them to the
// underlying input, plus an optional `inputStyle` for the input's own
// style object (the wrapper needs position:relative for the toggle button).
export default function PasswordInput({ inputStyle, ...inputProps }) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <input
        {...inputProps}
        type={visible ? 'text' : 'password'}
        className="form-input"
        style={{ ...inputStyle, paddingRight: '44px' }}
      />
      <button
        type="button"
        onClick={() => setVisible(prev => !prev)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        style={{
          position: 'absolute',
          top: '50%',
          right: '8px',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          padding: '6px',
          cursor: 'pointer',
          fontSize: '16px',
          lineHeight: 1,
          color: 'var(--play-muted, #6B7082)'
        }}
      >
        {visible ? '🙈' : '👁️'}
      </button>
    </div>
  );
}
