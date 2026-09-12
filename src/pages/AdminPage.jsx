import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useOrders } from '../context/OrdersContext';
import { useCart } from '../context/CartContext';
import MetricsRibbon from '../components/admin/MetricsRibbon';
import ProductModal from '../components/admin/ProductModal';
import AnnouncementModal from '../components/admin/AnnouncementModal';
import { formatPeso, getOrderStatusMeta } from '../lib/constants';
import { getSavedUrl, getSavedKey, saveCredentials, isConfigured } from '../lib/supabase';

// Shared soft "play" card treatment — mirrors the rounded, softly-shadowed
// cards used across the landing page (category cards, product cards, hero
// spotlight card) instead of the old hard-edged pop-art boxes.
const CARD_STYLE = {
  background: '#fff',
  border: '2px solid var(--play-border)',
  borderRadius: '20px',
  boxShadow: '0 6px 20px rgba(45, 49, 66, 0.05)'
};

export default function AdminPage() {
  const { user, isAdmin, login, logout } = useAuth();
  const {
    products,
    announcements,
    addProduct,
    updateProduct,
    deleteProduct,
    addAnnouncement,
    updateAnnouncement,
    toggleAnnouncementActive,
    deleteAnnouncement,
    syncFromSupabase
  } = useStore();

  const { orders, updateOrderStatus, deleteOrder, clearAllOrders, openInvoice } = useOrders();
  const { showToast } = useCart();

  // Admin login form state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active admin tab
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'announcements' | 'orders' | 'sync'

  // Product modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Announcement modal state
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState(null);

  // Supabase settings state
  const [sbUrl, setSbUrl] = useState(getSavedUrl());
  const [sbKey, setSbKey] = useState(getSavedKey());
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  // Product table search
  const [productSearch, setProductSearch] = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    const res = await login(adminEmail, adminPassword);
    setIsLoggingIn(false);

    if (!res.success) {
      setLoginError(res.error || "Invalid administrator credentials");
    }
  };

  // If not admin, show secure login barrier
  if (!isAdmin) {
    return (
      <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'var(--font-play)' }}>
        <div style={{
          background: '#fff',
          border: '2px solid var(--play-border)',
          borderRadius: '26px',
          boxShadow: '0 20px 50px rgba(45, 49, 66, 0.14)',
          maxWidth: '440px',
          width: '100%',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--play-yellow) 0%, #FFE197 100%)',
            padding: '28px 24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '42px', marginBottom: '8px' }}>🔐</div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--play-charcoal)' }}>
              Store Administrator Access
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#5b5342', fontWeight: 600 }}>
              Please authenticate to access the PETCHUP management console.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} style={{ padding: '24px' }}>
            {loginError && (
              <div style={{
                background: '#FFE8EA',
                color: '#B82531',
                border: '1.5px solid #FFC4CA',
                borderRadius: '14px',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '16px'
              }}>
                ⚠️ {loginError}
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                Admin Email
              </label>
              <input
                type="email"
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="canamoaries13@gmail.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                Admin Password
              </label>
              <input
                type="password"
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-pill btn-full"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? "Verifying..." : "Sign In to Admin 🚀"}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Link to="/" style={{ fontSize: '13px', color: '#64748b', textDecoration: 'underline' }}>
                ← Return to Store
              </Link>
            </div>
          </form>
        </div>
      </main>
    );
  }

  // Admin save product
  const handleSaveProduct = (productData) => {
    if (editingProduct) {
      return updateProduct(editingProduct.id, productData);
    } else {
      return addProduct(productData);
    }
  };

  // Admin save announcement
  const handleSaveAnnouncement = (annData) => {
    if (editingAnn) {
      return updateAnnouncement(editingAnn.id, annData);
    } else {
      return addAnnouncement(annData);
    }
  };

  const runAdminAction = (action) => Promise.resolve(action).catch((error) => {
    showToast(error.message || 'The change could not be saved. Please try again.');
  });

  // Filter products for table
  const filteredProducts = products.filter(p => {
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)) || p.category.toLowerCase().includes(q);
  });

  const TABS = [
    { key: 'products', label: `📦 Products Catalog (${products.length})` },
    { key: 'announcements', label: `📢 Announcements (${announcements.length})` },
    { key: 'orders', label: `🛍️ Orders Manager (${orders.length})` },
    { key: 'sync', label: '☁️ Supabase Cloud' }
  ];

  return (
    <main className="admin-page-main" style={{ padding: '32px 0 80px', fontFamily: 'var(--font-play)' }}>
      <div className="play-wrap">
        {/* Top Admin Header Bar */}
        <div style={{
          ...CARD_STYLE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          borderRadius: '24px',
          padding: '20px 28px',
          marginBottom: '24px'
        }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--play-purple)' }}>
              Store Management Console
            </span>
            <h1 style={{ margin: '2px 0 0', fontSize: '24px', fontWeight: 900, color: 'var(--play-charcoal)' }}>
              ⚙️ Admin Dashboard
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/shop" className="btn btn-outline btn-pill" style={{ fontSize: '13px' }}>
              🛍️ View Live Shop
            </Link>
            <button
              type="button"
              className="btn btn-pill"
              onClick={logout}
              style={{
                background: '#FFE8EA',
                border: '1.5px solid #FFC4CA',
                color: '#B82531',
                fontWeight: 700,
                fontSize: '13px'
              }}
            >
              🚪 Exit Admin
            </button>
          </div>
        </div>

        {/* 6-Metric Ribbon */}
        <MetricsRibbon
          products={products}
          announcements={announcements}
          orders={orders}
        />

        {/* Tab Navigation (pill style, matches shop toolbar filters) */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 20px',
                borderRadius: '9999px',
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-play)',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                ...(activeTab === tab.key
                  ? {
                      border: '1.5px solid transparent',
                      background: 'linear-gradient(135deg, var(--play-orange) 0%, #FF834E 100%)',
                      color: '#fff',
                      boxShadow: '0 4px 14px rgba(255, 107, 53, 0.32)'
                    }
                  : {
                      border: '1.5px solid var(--play-border)',
                      background: '#FAFAFA',
                      color: 'var(--play-charcoal)'
                    })
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Products Manager */}
        {activeTab === 'products' && (
          <div style={{ ...CARD_STYLE, padding: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', maxWidth: '320px', borderRadius: '999px' }}
                placeholder="Search catalog products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />

              <button
                type="button"
                className="btn btn-primary btn-pill"
                onClick={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
              >
                ➕ Add New Product
              </button>
            </div>

            <div style={{ overflowX: 'auto', border: '1.5px solid var(--play-border)', borderRadius: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#FAFAFA', borderBottom: '1.5px solid var(--play-border)', fontSize: '12px', color: 'var(--play-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 14px' }}>Product</th>
                    <th style={{ padding: '12px 14px' }}>SKU</th>
                    <th style={{ padding: '12px 14px' }}>Category</th>
                    <th style={{ padding: '12px 14px' }}>Price (PHP)</th>
                    <th style={{ padding: '12px 14px' }}>Stock</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product.id} style={{ borderBottom: '1px solid var(--play-border)', fontSize: '14px' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '22px' }}>{product.img || "🐾"}</span>
                          <div>
                            <strong style={{ color: 'var(--play-charcoal)', display: 'block' }}>{product.name}</strong>
                            {product.badge && (
                              <span style={{ fontSize: '11px', background: '#FFF7D6', padding: '2px 8px', borderRadius: '999px', border: '1px solid #FDE68A', color: '#B45309', fontWeight: 700 }}>
                                {product.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--play-muted)' }}>
                        {product.sku || "N/A"}
                      </td>
                      <td style={{ padding: '12px 14px', textTransform: 'capitalize', color: '#475569' }}>
                        {product.category}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--play-charcoal)' }}>
                        {formatPeso(product.price)}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: product.inStock ? '#D8F8F0' : '#FFE8EA',
                          color: product.inStock ? '#059669' : '#B82531'
                        }}>
                          {product.inStock ? `${product.stockQuantity ?? 10} in stock` : "Out of stock"}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-pill"
                            style={{ fontSize: '12px', padding: '4px 10px' }}
                            onClick={() => {
                              setEditingProduct(product);
                              setIsProductModalOpen(true);
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-pill"
                            style={{ fontSize: '12px', padding: '4px 10px', color: '#B82531', borderColor: '#FFC4CA' }}
                            onClick={() => {
                              if (confirm(`Delete ${product.name} from catalog?`)) {
                                runAdminAction(deleteProduct(product.id));
                              }
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Announcements Manager */}
        {activeTab === 'announcements' && (
          <div style={{ ...CARD_STYLE, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--play-charcoal)' }}>
                  Top Announcement Ribbons
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--play-muted)' }}>
                  Manage the promotional ribbons displayed at the very top of all store pages.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-pill"
                onClick={() => {
                  setEditingAnn(null);
                  setIsAnnModalOpen(true);
                }}
              >
                ➕ Create Announcement
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {announcements.map(ann => (
                <div
                  key={ann.id}
                  style={{
                    border: `1.5px solid ${ann.isActive ? '#FFD4AD' : 'var(--play-border)'}`,
                    borderRadius: '18px',
                    padding: '18px',
                    background: ann.isActive ? '#FFF9F0' : '#FAFAFA',
                    boxShadow: '0 4px 14px rgba(45, 49, 66, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ flex: '1 1 300px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 800,
                      background: 'var(--play-charcoal)',
                      color: '#fff',
                      marginBottom: '6px'
                    }}>
                      {ann.pill}
                    </span>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--play-charcoal)' }}>
                      {ann.text}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--play-muted)', marginTop: '4px' }}>
                      Link: {ann.link} ({ann.linkText})
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => runAdminAction(toggleAnnouncementActive(ann.id))}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '999px',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                        background: ann.isActive ? '#D8F8F0' : '#F1F1F1',
                        color: ann.isActive ? '#059669' : 'var(--play-muted)'
                      }}
                    >
                      {ann.isActive ? '🟢 Active Banner' : '⚪ Make Active'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-pill"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                      onClick={() => {
                        setEditingAnn(ann);
                        setIsAnnModalOpen(true);
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-pill"
                      style={{ fontSize: '12px', padding: '6px 12px', color: '#B82531', borderColor: '#FFC4CA' }}
                      onClick={() => {
                        if (confirm("Delete this announcement?")) {
                          runAdminAction(deleteAnnouncement(ann.id));
                        }
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Orders Manager */}
        {activeTab === 'orders' && (
          <div style={{ ...CARD_STYLE, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--play-charcoal)' }}>
                  Customer Orders &amp; Fulfillment
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--play-muted)' }}>
                  Real-time transaction log with status updates and official invoice receipts.
                </p>
              </div>

              {orders.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Clear all recorded transactions? This cannot be undone.")) {
                      runAdminAction(clearAllOrders());
                    }
                  }}
                  style={{
                    background: '#FFE8EA',
                    border: '1.5px solid #FFC4CA',
                    color: '#B82531',
                    padding: '6px 14px',
                    borderRadius: '999px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  ⚠️ Clear All Orders
                </button>
              )}
            </div>

            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '54px', marginBottom: '12px' }}>🎾</div>
                <h4 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: 'var(--play-charcoal)' }}>
                  No customer orders recorded yet!
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--play-muted)', maxWidth: '420px', margin: '0 auto' }}>
                  The transaction registry is currently blank. When customers complete checkout on the shop, orders will appear here automatically.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1.5px solid var(--play-border)', borderRadius: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#FAFAFA', borderBottom: '1.5px solid var(--play-border)', fontSize: '12px', color: 'var(--play-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '12px 14px' }}>Order ID &amp; Date</th>
                      <th style={{ padding: '12px 14px' }}>Customer</th>
                      <th style={{ padding: '12px 14px' }}>Items</th>
                      <th style={{ padding: '12px 14px' }}>Total (PHP)</th>
                      <th style={{ padding: '12px 14px' }}>Fulfillment Status</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => {
                      const statusMeta = getOrderStatusMeta(order.status);
                      return (
                        <tr key={order.id} style={{ borderBottom: '1px solid var(--play-border)', fontSize: '14px' }}>
                          <td style={{ padding: '12px 14px' }}>
                            <strong style={{ color: 'var(--play-charcoal)', display: 'block' }}>#{order.id}</strong>
                            <span style={{ fontSize: '12px', color: 'var(--play-muted)' }}>
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--play-charcoal)' }}>{order.customer_name || "Guest"}</div>
                            <div style={{ fontSize: '12px', color: 'var(--play-muted)' }}>{order.customer_email || "N/A"}</div>
                            {order.pet_name && (
                              <div style={{ fontSize: '11px', color: 'var(--play-coral)' }}>🐶 {order.pet_name}</div>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ fontSize: '13px', color: '#475569' }}>
                              {order.item_count || (order.items || []).reduce((s, it) => s + (it.qty || 1), 0)} items
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--play-coral)' }}>
                            {formatPeso(order.total)}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <select
                              value={order.status || 'pending'}
                              onChange={(e) => runAdminAction(updateOrderStatus(order.id, e.target.value))}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '999px',
                                border: '1.5px solid var(--play-border)',
                                fontWeight: 700,
                                fontSize: '12px',
                                background: '#FAFAFA',
                                fontFamily: 'var(--font-play)'
                              }}
                            >
                              <option value="pending">🕒 Pending</option>
                              <option value="processing">📦 Processing</option>
                              <option value="shipped">🚚 Shipped</option>
                              <option value="delivered">🎉 Delivered</option>
                              <option value="cancelled">❌ Cancelled</option>
                            </select>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                              <button
                                type="button"
                                className="btn btn-outline btn-pill"
                                style={{ fontSize: '12px', padding: '4px 10px' }}
                                onClick={() => openInvoice(order)}
                              >
                                📄 Receipt
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline btn-pill"
                                style={{ fontSize: '12px', padding: '4px 10px', color: '#B82531', borderColor: '#FFC4CA' }}
                                onClick={() => {
                                  if (confirm(`Delete order #${order.id}?`)) {
                                    runAdminAction(deleteOrder(order.id));
                                  }
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Cloud Sync & Settings */}
        {activeTab === 'sync' && (
          <div style={{ ...CARD_STYLE, padding: '24px', maxWidth: '680px' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800, color: 'var(--play-charcoal)' }}>
              ☁️ Supabase Cloud Synchronization
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--play-muted)' }}>
              Connect your Postgres database and cloud storage bucket.
            </p>

            {syncStatusMsg && (
              <div style={{
                background: syncStatusMsg.includes('Success') ? '#D8F8F0' : '#FFE8EA',
                color: syncStatusMsg.includes('Success') ? '#059669' : '#B82531',
                border: '1.5px solid',
                borderColor: syncStatusMsg.includes('Success') ? '#A7F3D0' : '#FFC4CA',
                borderRadius: '14px',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '16px'
              }}>
                {syncStatusMsg}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                Supabase Project URL
              </label>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={sbUrl}
                onChange={(e) => setSbUrl(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                Supabase Anon Public API Key
              </label>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={sbKey}
                onChange={(e) => setSbKey(e.target.value)}
              />
            </div>

            <p style={{ margin: '0 0 20px', fontSize: '12px', lineHeight: 1.5, color: 'var(--play-muted)' }}>
              ⚠️ These are saved only in this browser's local storage, so anyone with access to this device can view or change them. Only paste your project's public <strong>anon / publishable</strong> key here — never a service-role or secret key.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary btn-pill"
                onClick={() => {
                  saveCredentials(sbUrl, sbKey);
                  setSyncStatusMsg("Successfully updated credentials!");
                }}
              >
                💾 Save Credentials
              </button>

              <button
                type="button"
                className="btn btn-outline btn-pill"
                onClick={async () => {
                  setSyncStatusMsg("Syncing from Supabase...");
                  await syncFromSupabase();
                  setSyncStatusMsg("Successfully synced catalog from Supabase cloud!");
                }}
              >
                🔄 Sync Catalog Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        initialProduct={editingProduct}
      />

      <AnnouncementModal
        isOpen={isAnnModalOpen}
        onClose={() => setIsAnnModalOpen(false)}
        onSave={handleSaveAnnouncement}
        initialAnn={editingAnn}
      />

    </main>
  );
}
