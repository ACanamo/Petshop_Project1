// Small client-side password strength heuristic used by the registration
// form's strength meter and as a defense-in-depth guard in AuthContext's
// register(). This is not a substitute for server-side password policy —
// it just stops the weakest passwords and gives the user quick feedback.

const LABELS = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
const COLORS = ['#dc2626', '#f97316', '#eab308', '#22c55e', '#16a34a'];

// The minimum score (out of 4) a password must reach before it's accepted
// anywhere in the app — registration, password reset, and AuthContext's
// defense-in-depth guard. Exported once here so all three stay in sync.
export const MIN_PASSWORD_SCORE = 2;

export function getPasswordStrength(password) {
  const value = password || '';
  let score = 0;

  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  // Cap at 4 so the meter always has a fixed number of segments.
  score = Math.min(score, 4);

  return {
    score,
    label: LABELS[score],
    color: COLORS[score]
  };
}
