import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import PasswordInput from './PasswordInput';
import { getPasswordStrength } from '../../lib/passwordStrength';

const MIN_PASSWORD_SCORE = 2;
const RESEND_COOLDOWN_SECONDS = 30;

export default function AuthModal() {
  const { isAuthOpen, authMode, closeAuth, login, register, loading, resetPassword, resendConfirmation } = useAuth();
  const [activeTab, setActiveTab] = useState(authMode); // 'login' | 'register' | 'forgot'

  // Sign In state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPetName, setRegPetName] = useState('');
  const [regPetType, setRegPetType] = useState('dog');
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  // Resend confirmation cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendTimerRef = useRef(null);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] = useState(false);

  const passwordStrength = getPasswordStrength(regPassword);
  const isPasswordStrongEnough = passwordStrength.score >= MIN_PASSWORD_SCORE;

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
    setForgotEmail('');
    setRequiresEmailConfirmation(false);
    setRegisteredEmail('');
    window.clearInterval(resendTimerRef.current);
    setResendCooldown(0);

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

    if (!isPasswordStrongEnough) {
      setErrorMessage("Please choose a stronger password (8+ characters, with a number or mixed case).");
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
      if (res.requiresEmailConfirmation) {
        setRequiresEmailConfirmation(true);
        setRegisteredEmail(regEmail);
        setActiveTab('login');
      }
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setForgotSubmitting(true);

    const res = await resetPassword(forgotEmail);
    setForgotSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "Could not send the reset email.");
    } else {
      setSuccessMessage("If an account exists for that email, a reset link is on its way.");
    }
  };

  const handleResendConfirmation = async () => {
    if (resendCooldown > 0 || !registeredEmail) return;
    const res = await resendConfirmation(registeredEmail);
    if (!res.success) {
      setErrorMessage(res.error || "Could not resend the confirmation email.");
      return;
    }
    setSuccessMessage("Confirmation email resent — check your inbox.");
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    window.clearInterval(resendTimerRef.current);
    resendTimerRef.current = window.setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          window.clearInterval(resendTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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
            {activeTab === 'login' ? 'Welcome Back!' : activeTab === 'register' ? 'Join The Fur Family!' : 'Reset Your Password'}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
            {activeTab === 'login'
              ? 'Sign in to access your saved pets & order history'
              : activeTab === 'register'
                ? 'Create an account & get an instant 20% OFF coupon'
                : "We'll email you a link to get back in"}
          </p>

          {/* Tab Switcher */}
          {activeTab !== 'forgot' && (
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
          )}
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

          {requiresEmailConfirmation && activeTab === 'login' && (
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={resendCooldown > 0}
              style={{
                display: 'block',
                width: '100%',
                background: 'none',
                border: 'none',
                padding: 0,
                marginBottom: '16px',
                fontSize: '12px',
                fontWeight: 700,
                color: resendCooldown > 0 ? 'var(--play-muted, #6B7082)' : 'var(--play-orange, #FF6B35)',
                cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                textAlign: 'left'
              }}
            >
              {resendCooldown > 0
                ? `Didn't get the email? Resend in ${resendCooldown}s`
                : "Didn't get the email? Resend confirmation"}
            </button>
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

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Password
                </label>
                <PasswordInput
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  inputStyle={{ width: '100%', boxSizing: 'border-box', borderRadius: '14px' }}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('forgot');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                style={{
                  display: 'block',
                  marginBottom: '18px',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--play-orange, #FF6B35)',
                  cursor: 'pointer'
                }}
              >
                Forgot password?
              </button>

              <button
                type="submit"
                className="btn-pop-yellow"
                disabled={loading}
                style={{ width: '100%', boxSizing: 'border-box', border: 'none', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? "Signing In..." : "Sign In 🐾"}
              </button>
            </form>
          ) : activeTab === 'register' ? (
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
                <PasswordInput
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  minLength={8}
                  required
                  inputStyle={{ width: '100%', boxSizing: 'border-box', borderRadius: '14px' }}
                />
                {regPassword && (
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[0, 1, 2, 3].map(i => (
                        <span
                          key={i}
                          style={{
                            flex: 1,
                            height: '4px',
                            borderRadius: '2px',
                            background: i < passwordStrength.score ? passwordStrength.color : 'rgba(45, 49, 66, 0.12)'
                          }}
                        />
                      ))}
                    </div>
                    <span style={{ display: 'block', marginTop: '4px', fontSize: '11px', fontWeight: 700, color: passwordStrength.color }}>
                      {passwordStrength.label}
                      {!isPasswordStrongEnough && " — add a number or mix of upper/lowercase"}
                    </span>
                  </div>
                )}
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
                disabled={loading || !isPasswordStrongEnough}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  border: 'none',
                  opacity: (loading || !isPasswordStrongEnough) ? 0.7 : 1,
                  cursor: (loading || !isPasswordStrongEnough) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? "Creating Account..." : "Create Account & Get 20% OFF 🎉"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotSubmit}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-input"
                  style={{ width: '100%', boxSizing: 'border-box', borderRadius: '14px' }}
                  placeholder="e.g. alex@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-pop-yellow"
                disabled={forgotSubmitting}
                style={{ width: '100%', boxSizing: 'border-box', border: 'none', opacity: forgotSubmitting ? 0.7 : 1, cursor: forgotSubmitting ? 'not-allowed' : 'pointer', marginBottom: '14px' }}
              >
                {forgotSubmitting ? "Sending..." : "Send Reset Link 📧"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--play-orange, #FF6B35)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                ← Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
