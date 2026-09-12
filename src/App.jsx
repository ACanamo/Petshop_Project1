import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { CartProvider } from './context/CartContext';
import { OrdersProvider } from './context/OrdersContext';

import TopBanner from './components/common/TopBanner';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Toast from './components/common/Toast';
import CartDrawer from './components/cart/CartDrawer';
import AuthModal from './components/auth/AuthModal';
import OrderHistoryModal from './components/orders/OrderHistoryModal';
import InvoiceModal from './components/orders/InvoiceModal';
import ProductQuickViewModal from './components/shop/ProductQuickViewModal';

import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';

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

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <CartProvider>
          <OrdersProvider>
            <BrowserRouter>
              <div className="app-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <RouteEffects />
                <TopBanner />
                <Header />

                <div style={{ flex: 1 }}>
                  <Suspense fallback={<PageFallback />}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/shop" element={<ShopPage />} />
                      <Route path="/admin" element={<AdminPage />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </div>

                <Footer />

                {/* Modals, Drawers & Overlays */}
                <CartDrawer />
                <AuthModal />
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
