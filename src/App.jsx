import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { CartProvider } from './context/CartContext';
import { OrdersProvider } from './context/OrdersContext';

import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Toast from './components/common/Toast';
import CartDrawer from './components/cart/CartDrawer';
import OrderHistoryModal from './components/orders/OrderHistoryModal';
import InvoiceModal from './components/orders/InvoiceModal';
import ProductQuickViewModal from './components/shop/ProductQuickViewModal';
import SessionExpiryNotice from './components/common/SessionExpiryNotice';
import ErrorBoundary from './components/common/ErrorBoundary';

import ProtectedRoute from './components/auth/ProtectedRoute';

// HomePage stays eager — it's the default "/" route, so splitting it out
// wouldn't reduce time-to-first-render, only add a network round trip. The
// others are only needed once someone navigates to them.
import HomePage from './pages/HomePage';

const ShopPage = lazy(() => import('./pages/ShopPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

import './styles/main.css';

function RouteEffects() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (hash) {
        document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname, hash]);

  return null;
}

function PageFallback() {
  return <div className="route-loading" role="status">Loading Petchup…</div>;
}

// The full site footer competes with the login card
// for attention (and the footer's dark block makes the page look like it
// ends mid-thought) on a page whose only job is getting someone signed in,
// so it is hidden there — everywhere else it renders as usual.
function ConditionalFooter() {
  const { pathname } = useLocation();
  if (pathname === '/login') return null;
  return <Footer />;
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <CartProvider>
          <OrdersProvider>
            <BrowserRouter>
              <div className="app-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <RouteEffects />
                <SessionExpiryNotice />
                <Header />

                <div style={{ flex: 1 }}>
                  <ErrorBoundary>
                    <Suspense fallback={<PageFallback />}>
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/shop" element={<ShopPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute>} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Suspense>
                  </ErrorBoundary>
                </div>

                <ConditionalFooter />

                {/* Modals, Drawers & Overlays */}
                <CartDrawer />
                <OrderHistoryModal />
                <InvoiceModal />
                <ProductQuickViewModal />
                <Toast />
              </div>
            </BrowserRouter>
          </OrdersProvider>
        </CartProvider>
      </StoreProvider>
    </AuthProvider>
  );
}
