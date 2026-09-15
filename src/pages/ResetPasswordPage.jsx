import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/auth/PasswordInput';
import { getPasswordStrength } from '../lib/passwordStrength';

const MIN_PASSWORD_SCORE = 2;

// Landing page for the link Supabase emails after a "forgot password"
// request. Supabase's client auto-parses the recovery token out of the
// URL on load and establishes a real (if short-lived) authenticated
// session, which is what lets updatePassword() below succeed.
export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [done, setDone] = useState(false);

  const strength = getPasswordStrength(newPassword);
  const isStrongEnough = strength.score >= MIN_PASSWORD_SCORE;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isStrongEnough) {
      setErrorMessage("Please choose a stronger password (8+ characters, with a number or mixed case).");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords don't match.");
      return;
    }

    setIsSubmitting(true);
    const res = await updatePassword(newPassword);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "Could not update the password.");
    } else {
      setDone(true);
    }
  };

  return (
    <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'var(--font-play)' }}>
      <div style={{
        background: '#fff',
        border: '2px solid var(--play-border)',
        borderRadius: '26px',
        boxShadow: '0 20px 50px rgba(45, 49, 66, 0.14)',
        maxWidth: '420px',
        width: '100%',
        padding: '32px 28px'
      }}>
        <div style={{ fontSize: '36px', marginBottom: '10px', textAlign: 'center' }}>🐾</div>
        <h1 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800, textAlign: 'center', color: 'var(--play-charcoal, #2D3142)' }}>
          {done ? "Password Updated!" : "Choose a New Password"}
        </h1>

        {done ? (
          <>
            <p style={{ margin: '8px 0 22px', fontSize: '14px', textAlign: 'center', color: 'var(--play-muted, #6B7082)' }}>
              Your password has been changed. You can now sign in with it.
            </p>
            <Link to="/" className="btn btn-primary btn-pill btn-full" style={{ display: 'flex', justifyContent: 'center' }}>
              Return to Store 🏠
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ margin: '8px 0 20px', fontSize: '13px', textAlign: 'center', color: 'var(--play-muted, #6B7082)' }}>
              This link only works once — set a new password to finish signing back in.
            </p>

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

            <div style={{ marginBottom: '12px' }}>
              <label htmlFor="reset-new-password" style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                New Password
              </label>
              <PasswordInput
                id="reset-new-password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
                inputStyle={{ width: '100%', boxSizing: 'border-box', borderRadius: '14px' }}
              />
              {newPassword && (
                <div style={{ marginTop: '6px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[0, 1, 2, 3].map(i => (
                      <span
                        key={i}
                        style={{
                          flex: 1,
                          height: '4px',
                          borderRadius: '2px',
                          background: i < strength.score ? strength.color : 'rgba(45, 49, 66, 0.12)'
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ display: 'block', marginTop: '4px', fontSize: '11px', fontWeight: 700, color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="reset-confirm-password" style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                Confirm Password
              </label>
              <PasswordInput
                id="reset-confirm-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                inputStyle={{ width: '100%', boxSizing: 'border-box', borderRadius: '14px' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-pill btn-full"
              disabled={isSubmitting}
              style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
