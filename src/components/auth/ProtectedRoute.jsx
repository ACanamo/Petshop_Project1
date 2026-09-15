import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Gate for routes that require a signed-in user (or, with requireAdmin, an
// admin). Unauthenticated visits — including ones that land here right
// after a logout or an expired session — bounce to /login, remembering the
// page they wanted so LoginPage can send them back after signing in.
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  const isAuthorized = requireAdmin ? isAdmin : Boolean(user);

  if (!isAuthorized) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
