import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal() {
  const { isAuthOpen, authMode, closeAuth, login, register, loading } = useAuth();
  const [activeTab, setActiveTab] = useState(authMode);

  // Sign In state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPetName, setRegPetName] = useState('');
  const [regPetType, setRegPetType] = useState('dog');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!isAuthOpen) return;
    setActiveTab(authMode);
    setErrorMessage('');
    setSuccessMessage('');

    // AuthModal stays mounted (it just renders null when closed), so form
    // state would otherwise carry over from the last time it was open —
    // e.g. a signed-out user reopening "Sign In" would still see the
    // previous email/password filled in.
    setLoginEmail('');
    setLoginPassword('');
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegPetName('');
    setRegPetType('dog');

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeAuth();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authMode, isAuthOpen]);

  if (!isAuthOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const res = await login(loginEmail, loginPassword);
    if (!res.success) {
      setErrorMessage(res.error || "Login failed");
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (regPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    const res = await register({
      name: regName,
      email: regEmail,
      password: regPassword,
      petName: regPetName,
      petType: regPetType
    });

    if (!res.success) {
      setErrorMessage(res.error || "Registration failed");
    } else {
      setSuccessMessage(res.requiresEmailConfirmation
        ? "Check your email to confirm your account, then sign in."
        : "Account created successfully! Welcome to Petchup!");
      if (res.requiresEmailConfirmation) setActiveTab('login');
    }
  };

  return (
    <div className="auth-modal-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) closeAuth();
    }} style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(30, 41, 59, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 2000
    }}>
      <div className="auth-modal-card" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" style={{
        background: 'var(--play-cream, #FFFDF9)',
        borderRadius: '28px',
        border: 'none',
        boxShadow: 'none',
        width: '100%',
        maxWidth: '460px',
        overflow: 'hidden',
        position: 'relative',
        animation: 'modalSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuth}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.28)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            cursor: 'pointer',
            zIndex: 10
          }}
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div style={{
          padding: '32px 24px 20px',
          background: 'linear-gradient(135deg, var(--play-orange, #FF6B35) 0%, #FF834E 100%)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '36px', marginBottom: '6px' }}>🐾</div>
          <h3 id="auth-modal-title" style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#fff' }}>
            {activeTab === 'login' ? 'Welcome Back!' : 'Join The Fur Family!'}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
            {activeTab === 'login'
              ? 'Sign in to access your saved pets & order history'
              : 'Create an account & get an instant 20% OFF coupon'}
          </p>

          {/* Tab Switcher */}
          <div style={{
            display: 'flex',
            gap: '4px',
            background: 'rgba(255,255,255,0.22)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            padding: '4px',
            borderRadius: '999px',
            marginTop: '18px',
            border: '1px solid rgba(255,255,255,0.35)'
          }}>
            <button
              type="button"
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: '999px',
                border: 'none',
                background: activeTab === 'login' ? '#fff' : 'transparent',
                color: activeTab === 'login' ? 'var(--play-charcoal, #2D3142)' : 'rgba(255,255,255,0.85)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onClick={() => {
                setActiveTab('login');
                setErrorMessage('');
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: '999px',
                border: 'none',
                background: activeTab === 'register' ? '#fff' : 'transparent',
                color: activeTab === 'register' ? 'var(--play-charcoal, #2D3142)' : 'rgba(255,255,255,0.85)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onClick={() => {
                setActiveTab('register');
                setErrorMessage('');
              }}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {errorMessage && (
            <div style={{
              background: '#fee2e2',
              color: '#b91c1c',
              border: '1.5px solid #f3a5a5',
              borderRadius: '14px',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '16px'
            }}>
              ⚠️ {errorMessage}
            </div>
          )}

          {successMessage && (
            <div style={{
              background: '#dcfce7',
              color: '#15803d',
              border: '1.5px solid #86efac',
              borderRadius: '14px',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '16px'
            }}>
              {successMessage}
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Email or Username
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', boxSizing: 'border-box', borderRadius: '14px' }}
                  placeholder="e.g. alex@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Password
                </label>
                <input
                  type="password"
                  className="form-input"
                  style={{ width: '100%', boxSizing: 'border-box', borderRadius: '14px' }}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-pop-yellow"
                disabled={loading}
                style={{ width: '100%', boxSizing: 'border-box', border: 'none', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? "Signing In..." : "Sign In 🐾"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                  Your Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', boxSizing: 'border-box', borderRadius: '14px' }}
                  placeholder="e.g. Maria Santos"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-input"
                  style={{ width: '100%', boxSizing: 'border-box', borderRadius: '14px' }}
                  placeholder="maria@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                  Password (8+ characters)
                </label>
                <input
                  type="password"
                  className="form-input"
                  style={{ width: '100%', boxSizing: 'border-box', borderRadius: '14px' }}
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                    Pet's Name
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '100%', boxSizing: 'border-box', borderRadius: '14px' }}
                    placeholder="e.g. Milo"
                    value={regPetName}
                    onChange={(e) => setRegPetName(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1.5 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                    Pet Type
                  </label>
                  <select
                    className="form-input"
                    style={{ width: '100%', boxSizing: 'border-box', borderRadius: '14px' }}
                    value={regPetType}
                    onChange={(e) => setRegPetType(e.target.value)}
                  >
                    <option value="dog">🐶 Dog</option>
                    <option value="cat">🐱 Cat</option>
                    <option value="bird">🦜 Bird</option>
                    <option value="other">🐾 Other</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="btn-pop-yellow"
                disabled={loading}
                style={{ width: '100%', boxSizing: 'border-box', border: 'none', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? "Creating Account..." : "Create Account & Get 20% OFF 🎉"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
