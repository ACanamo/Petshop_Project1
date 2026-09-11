import React, { useEffect } from 'react';
import { useOrders } from '../../context/OrdersContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatPeso, getOrderStatusMeta } from '../../lib/constants';
import { useNavigate } from 'react-router-dom';

export default function OrderHistoryModal() {
  const { isOrderHistoryOpen, closeOrderHistory, customerOrders, openInvoice } = useOrders();
  const { addToCart, openCart, showToast } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOrderHistoryOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeOrderHistory();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOrderHistoryOpen, closeOrderHistory]);

  if (!isOrderHistoryOpen) return null;

  const handleReorder = (order) => {
    if (!order.items || order.items.length === 0) return;
    order.items.forEach(item => {
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        img: item.img || "🐾"
      }, item.qty || 1);
    });
    closeOrderHistory();
    openCart();
    showToast(`🎉 Re-added ${order.items.length} items to your cart!`);
  };

  return (
    <div className="order-history-modal-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) closeOrderHistory();
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
      <div className="order-history-modal-card" role="dialog" aria-modal="true" aria-labelledby="order-history-title" style={{
        background: '#fff',
        borderRadius: '24px',
        border: '3px solid #1e293b',
        boxShadow: '6px 6px 0px #1e293b',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'var(--color-peach, #ffb38a)',
          borderBottom: '3px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 id="order-history-title" style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
              📦 My Order History
            </h3>
            <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>
              {user ? `Customer: ${user.name} (${user.email})` : "Guest Orders"}
            </span>
          </div>
          <button
            type="button"
            onClick={closeOrderHistory}
            style={{
              background: '#fff',
              border: '2px solid #1e293b',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              cursor: 'pointer'
            }}
            aria-label="Close order history"
          >
            ✕
          </button>
        </div>

        {/* Orders Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {customerOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '54px', marginBottom: '12px' }}>🎾</div>
              <h4 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: '#1e293b' }}>
                No orders placed yet!
              </h4>
              <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '360px', margin: '0 auto 20px' }}>
                When you purchase crunchy feeds, squeaky toys, or cozy leashes, your orders and tracking status will appear right here.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-pill"
                onClick={() => {
                  closeOrderHistory();
                  navigate('/shop');
                }}
              >
                Browse Shop Catalog 🛍️
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {customerOrders.map(order => {
                const statusMeta = getOrderStatusMeta(order.status);
                return (
                  <div
                    key={order.id}
                    style={{
                      border: '2px solid #1e293b',
                      borderRadius: '16px',
                      padding: '16px',
                      background: '#f8fafc',
                      boxShadow: '3px 3px 0px #1e293b'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                      borderBottom: '1px solid #e2e8f0',
                      paddingBottom: '10px',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <strong style={{ fontSize: '15px', color: '#1e293b' }}>
                          Order #{order.id}
                        </strong>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          📅 {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <span
                        className={`status-pill ${statusMeta.pillClass}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontWeight: 700,
                          fontSize: '12px',
                          border: '2px solid #1e293b'
                        }}
                      >
                        {statusMeta.emoji} {statusMeta.label}
                      </span>
                    </div>

                    {/* Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                      {(order.items || []).map((it, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '13px',
                            color: '#334155'
                          }}
                        >
                          <span>{it.img || "🐾"} {it.name} &times; {it.qty}</span>
                          <strong>{formatPeso((it.price || 0) * (it.qty || 1))}</strong>
                        </div>
                      ))}
                    </div>

                    {/* Pricing summary & actions */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      paddingTop: '10px',
                      borderTop: '1px dashed #cbd5e1'
                    }}>
                      <div>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>Total Paid: </span>
                        <strong style={{ fontSize: '16px', color: 'var(--color-coral, #e63946)' }}>
                          {formatPeso(order.total)}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-pill"
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                          onClick={() => openInvoice(order)}
                        >
                          📄 View Receipt
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-pill"
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                          onClick={() => handleReorder(order)}
                        >
                          🔄 Reorder All
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
