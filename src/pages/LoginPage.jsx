import React, { useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/auth/PasswordInput';
import { getPasswordStrength, MIN_PASSWORD_SCORE } from '../lib/passwordStrength';
import {
  WarningIcon,
  PawPrintIcon as PawPrint,
  DogIcon as Dog,
  CatIcon as Cat,
  BoneIcon as Bone,
  BowlFoodIcon as BowlFood
} from '@phosphor-icons/react';

const RESEND_COOLDOWN_SECONDS = 30;

// Scattered, low-opacity paw prints behind the brand copy — a cheap way to
// give the panel texture without shipping an illustration asset. Positions
// are hand-picked (not randomized) so the layout doesn't jump between
// renders/reloads.
const PAW_PRINTS = [
  { top: '6%', left: '72%', size: 34, rotate: -18 },
  { top: '22%', left: '10%', size: 22, rotate: 12 },
  { top: '48%', left: '82%', size: 26, rotate: 30 },
  { top: '68%', left: '18%', size: 30, rotate: -8 },
  { top: '85%', left: '58%', size: 20, rotate: 20 },
  { top: '38%', left: '46%', size: 18, rotate: -25 }
];

// A sparser, larger-scale version scattered across the whole page behind
// the card — ties the brand panel's texture to the rest of the background
// instead of it feeling like an isolated decoration.
const PAGE_PAW_PRINTS = [
  { top: '8%', left: '8%', size: 60, rotate: -20 },
  { top: '14%', left: '88%', size: 44, rotate: 15 },
  { top: '78%', left: '6%', size: 50, rotate: 25 },
  { top: '85%', left: '80%', size: 64, rotate: -10 },
  { top: '45%', left: '4%', size: 32, rotate: 8 },
  { top: '55%', left: '94%', size: 36, rotate: -30 }
];

export default function LoginPage() {
  const { user, login, register, resetPassword, resendConfirmation, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // 'login' and 'register' are the two switcher tabs; 'forgot' is a
  // sub-view reached from "Forgot password?" inside the login tab.
  const [view, setView] = useState(searchParams.get('tab') === 'register' ? 'register' : 'login');

  // Sign In state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Create Account state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPetName, setRegPetName] = useState('');
  const [regPetType, setRegPetType] = useState('dog');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] = useState(false);

  // Resend confirmation cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSubmitting, setResendSubmitting] = useState(false);
  const resendTimerRef = useRef(null);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const passwordStrength = getPasswordStrength(regPassword);
  const isPasswordStrongEnough = passwordStrength.score >= MIN_PASSWORD_SCORE;

  // Already signed in — nothing to log in for, so bounce onward instead of
  // showing the form (also covers landing here straight after a fresh login).
  if (user) {
    const fromPath = location.state?.from?.pathname;
    return <Navigate to={fromPath && fromPath !== '/login' ? fromPath : '/'} replace />;
  }

  const switchTab = (tab) => {
    setView(tab);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const goPastLogin = () => {
    const fromPath = location.state?.from?.pathname;
    navigate(fromPath && fromPath !== '/login' ? fromPath : '/', { replace: true });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const res = await login(loginEmail, loginPassword);
    if (!res.success) {
      setErrorMessage(res.error || 'Invalid email or password');
      return;
    }

    goPastLogin();
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
      setErrorMessage(res.error || 'Registration failed');
      return;
    }

    if (res.requiresEmailConfirmation) {
      setRegisteredEmail(regEmail);
      setRequiresEmailConfirmation(true);
      setSuccessMessage("Check your email to confirm your account, then sign in.");
      switchTab('login');
      return;
    }

    goPastLogin();
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setForgotSubmitting(true);

    const res = await resetPassword(forgotEmail);
    setForgotSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Could not send the reset email.');
    } else {
      setSuccessMessage("If an account exists for that email, a reset link is on its way.");
    }
  };

  const handleResendConfirmation = async () => {
    if (resendCooldown > 0 || resendSubmitting || !registeredEmail) return;
    setResendSubmitting(true);
    try {
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
    } finally {
      setResendSubmitting(false);
    }
  };

  return (
    <main className="login-page-main">
      <div className="login-page-pattern" aria-hidden="true">
        {PAGE_PAW_PRINTS.map((p, i) => (
          <PawPrint
            key={i}
            weight="fill"
            size={p.size}
            style={{ top: p.top, left: p.left, transform: `rotate(${p.rotate}deg)` }}
          />
        ))}
      </div>

      <div className="login-split-card">
        {/* Brand panel — carries the pet-shop identity so the card doesn't
            read as a generic auth template. Hidden on very small screens
            via CSS becoming a compact top strip instead of a side column. */}
        <div className="login-brand-panel">
          <div className="login-brand-pattern" aria-hidden="true">
            {PAW_PRINTS.map((p, i) => (
              <PawPrint
                key={i}
                weight="fill"
                size={p.size}
                style={{ top: p.top, left: p.left, transform: `rotate(${p.rotate}deg)` }}
              />
            ))}
          </div>

          <span className="login-brand-badge">
            <PawPrint size={14} weight="fill" aria-hidden="true" /> PETCHUP
          </span>

          <div>
            <h2 className="login-brand-heading">
              {view === 'register' ? "Join the fur family 🐾" : "Happy pets start with a happy login 🐾"}
            </h2>
            <p className="login-brand-copy">
              {view === 'register'
                ? "Create an account and get an instant 20% OFF coupon on your first order."
                : "Sign in to track orders, save your pet's profile, and get first dibs on new treats & deals."}
            </p>

            <div className="login-icon-cluster" aria-hidden="true">
              <span className="login-icon-chip chip-a"><Dog size={20} weight="fill" /></span>
              <span className="login-icon-chip chip-b"><Cat size={20} weight="fill" /></span>
              <span className="login-icon-chip chip-c"><Bone size={20} weight="fill" /></span>
              <span className="login-icon-chip chip-d"><BowlFood size={20} weight="fill" /></span>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="login-form-panel">
          <div className="login-form-inner">
            {view !== 'forgot' && (
              <div className="login-tab-switcher" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === 'login'}
                  className={`login-tab-btn ${view === 'login' ? 'is-active' : ''}`}
                  onClick={() => switchTab('login')}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === 'register'}
                  className={`login-tab-btn ${view === 'register' ? 'is-active' : ''}`}
                  onClick={() => switchTab('register')}
                >
                  Create Account
                </button>
              </div>
            )}

            <h1 className="login-heading">
              {view === 'login' ? 'Welcome Back!' : view === 'register' ? 'Join The Fur Family!' : 'Reset Your Password'}
            </h1>
            <p className="login-subtitle">
              {view === 'login'
                ? 'Sign in to continue to PETCHUP'
                : view === 'register'
                  ? 'Create an account & get an instant 20% OFF coupon'
                  : "We'll email you a link to get back in"}
            </p>

            {errorMessage && (
              <div role="alert" className="login-alert login-alert-error">
                <WarningIcon size={16} weight="bold" aria-hidden="true" style={{ flexShrink: 0 }} />
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="login-alert login-alert-success">
                {successMessage}
              </div>
            )}

            {requiresEmailConfirmation && view === 'login' && (
              <button
                type="button"
                className="login-forgot-link"
                disabled={resendCooldown > 0 || resendSubmitting}
                onClick={handleResendConfirmation}
                style={{ marginBottom: '16px', color: (resendCooldown > 0 || resendSubmitting) ? 'var(--play-muted, #6B7082)' : undefined, cursor: (resendCooldown > 0 || resendSubmitting) ? 'not-allowed' : 'pointer' }}
              >
                {resendSubmitting
                  ? "Sending…"
                  : resendCooldown > 0
                    ? `Didn't get the email? Resend in ${resendCooldown}s`
                    : "Didn't get the email? Resend confirmation"}
              </button>
            )}

            {view === 'login' && (
              <form onSubmit={handleLoginSubmit}>
                <div className="login-field">
                  <label>Email</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. alex@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="login-field">
                  <label>Password</label>
                  <PasswordInput
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    inputStyle={{ borderRadius: '14px' }}
                  />
                </div>

                <button
                  type="button"
                  className="login-forgot-link"
                  onClick={() => switchTab('forgot')}
                >
                  Forgot password?
                </button>

                <button type="submit" className="login-cta-btn" disabled={loading}>
                  {loading ? "Signing In..." : "Sign In 🐾"}
                </button>
              </form>
            )}

            {view === 'register' && (
              <form onSubmit={handleRegisterSubmit}>
                <div className="login-field">
                  <label>Your Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Maria Santos"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                  />
                </div>

                <div className="login-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="maria@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="login-field">
                  <label>Password (8+ characters)</label>
                  <PasswordInput
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    minLength={8}
                    required
                    inputStyle={{ borderRadius: '14px' }}
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

                <div style={{ display: 'flex', gap: '10px' }} className="login-field">
                  <div style={{ flex: 2 }}>
                    <label>Pet's Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Milo"
                      value={regPetName}
                      onChange={(e) => setRegPetName(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1.5 }}>
                    <label>Pet Type</label>
                    <select
                      className="form-input"
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

                <button type="submit" className="login-cta-btn" disabled={loading || !isPasswordStrongEnough}>
                  {loading ? "Creating Account..." : "Create Account & Get 20% OFF 🎉"}
                </button>
              </form>
            )}

            {view === 'forgot' && (
              <form onSubmit={handleForgotSubmit}>
                <div className="login-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. alex@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <button type="submit" className="login-cta-btn" disabled={forgotSubmitting} style={{ marginBottom: '14px' }}>
                  {forgotSubmitting ? "Sending..." : "Send Reset Link 📧"}
                </button>

                <button
                  type="button"
                  className="login-forgot-link"
                  style={{ textAlign: 'center', margin: 0 }}
                  onClick={() => switchTab('login')}
                >
                  ← Back to Sign In
                </button>
              </form>
            )}

            <Link to="/" className="login-return-link">
              ← Return to Store
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
