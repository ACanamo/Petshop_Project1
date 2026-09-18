import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { useCart } from '../../context/CartContext';
import { XIcon } from '@phosphor-icons/react';

export default function InventoryAdjustModal({ isOpen, onClose, product }) {
  const { adjustProductStock } = useStore();
  const { showToast } = useCart();

  const [mode, setMode] = useState('delta'); // 'delta' or 'exact'
  const [delta, setDelta] = useState(10);
  const [exactQty, setExactQty] = useState(0);
  const [reason, setReason] = useState('Supplier Restock');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setExactQty(product.stockQuantity ?? 0);
      setDelta(10);
      setMode('delta');
      setReason('Supplier Restock');
      setCustomReason('');
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const currentStock = product.stockQuantity ?? 0;
  const computedStock = mode === 'delta'
    ? Math.max(0, currentStock + (parseInt(delta, 10) || 0))
    : Math.max(0, parseInt(exactQty, 10) || 0);

  const finalReason = reason === 'Other' ? (customReason.trim() || 'Manual adjustment') : reason;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (mode === 'delta') {
        const parsedDelta = parseInt(delta, 10);
        if (isNaN(parsedDelta) || parsedDelta === 0) {
          showToast('Please enter a non-zero quantity change.');
          setIsSubmitting(false);
          return;
        }
        await adjustProductStock(product.id, {
          delta: parsedDelta,
          reason: finalReason
        });
      } else {
        const parsedExact = parseInt(exactQty, 10);
        if (isNaN(parsedExact) || parsedExact < 0) {
          showToast('Please enter a valid stock quantity.');
          setIsSubmitting(false);
          return;
        }
        await adjustProductStock(product.id, {
          newQuantity: parsedExact,
          reason: finalReason
        });
      }

      showToast(`✅ Inventory updated for ${product.name}: now ${computedStock} in stock.`);
      onClose();
    } catch (err) {
      showToast(`Error adjusting inventory: ${err.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="product-modal-overlay" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(30, 41, 59, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 2200,
      fontFamily: 'var(--font-play)'
    }}>
      <div className="product-modal-card" style={{
        background: '#fff',
        borderRadius: '24px',
        border: '2px solid var(--play-border)',
        boxShadow: '0 24px 60px rgba(45, 49, 66, 0.22)',
        width: '100%',
        maxWidth: '480px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1.5px solid var(--play-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--play-charcoal)' }}>
              📦 Adjust Inventory
            </h3>
            <span style={{ fontSize: '13px', color: '#64748B', display: 'block', marginTop: '2px' }}>
              {product.name}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748B',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Current Stock Banner */}
          <div style={{
            background: '#F8FAFC',
            borderRadius: '14px',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid #E2E8F0'
          }}>
            <div>
              <span style={{ fontSize: '12px', color: '#64748B', display: 'block', fontWeight: 600 }}>CURRENT STOCK</span>
              <strong style={{ fontSize: '20px', color: 'var(--play-charcoal)' }}>{currentStock} units</strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '12px', color: '#64748B', display: 'block', fontWeight: 600 }}>NEW STOCK</span>
              <strong style={{ fontSize: '20px', color: computedStock > 0 ? '#16A34A' : '#DC2626' }}>
                {computedStock} units
              </strong>
            </div>
          </div>

          {/* Mode Switcher */}
          <div style={{ display: 'flex', gap: '8px', background: '#F1F5F9', padding: '4px', borderRadius: '12px' }}>
            <button
              type="button"
              onClick={() => setMode('delta')}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                background: mode === 'delta' ? '#FFFFFF' : 'transparent',
                color: mode === 'delta' ? 'var(--play-charcoal)' : '#64748B',
                boxShadow: mode === 'delta' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Add / Remove (+ / -)
            </button>
            <button
              type="button"
              onClick={() => setMode('exact')}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                background: mode === 'exact' ? '#FFFFFF' : 'transparent',
                color: mode === 'exact' ? 'var(--play-charcoal)' : '#64748B',
                boxShadow: mode === 'exact' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Set Exact Count
            </button>
          </div>

          {/* Input based on Mode */}
          {mode === 'delta' ? (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                Quantity Adjustment (+ for restock, - for write-off)
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                {[5, 10, 25, 50].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDelta(val)}
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      background: delta === val ? '#FEF3C7' : '#FFFFFF',
                      color: delta === val ? '#B45309' : '#475569',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      cursor: 'pointer'
                    }}
                  >
                    +{val}
                  </button>
                ))}
              </div>
              <input
                type="number"
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                placeholder="e.g. 15 or -2"
                required
              />
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                Exact Physical Count
              </label>
              <input
                type="number"
                min="0"
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={exactQty}
                onChange={(e) => setExactQty(e.target.value)}
                placeholder="0"
                required
              />
            </div>
          )}

          {/* Audit Reason */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              Reason for Adjustment
            </label>
            <select
              className="form-input"
              style={{ width: '100%', boxSizing: 'border-box', marginBottom: reason === 'Other' ? '8px' : '0' }}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="Supplier Restock">🚚 Supplier Restock / New Shipment</option>
              <option value="Physical Inventory Audit">📋 Physical Inventory Audit Reconciliation</option>
              <option value="Damaged or Expired">🗑️ Damaged / Expired / Written Off</option>
              <option value="Customer Return Restock">🔄 Customer Return Restock</option>
              <option value="Other">✏️ Other Reason...</option>
            </select>
            {reason === 'Other' && (
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="Specify reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                required
              />
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ flex: 1, padding: '10px 0', borderRadius: '12px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ flex: 1.5, padding: '10px 0', borderRadius: '12px', fontWeight: 700 }}
            >
              {isSubmitting ? 'Saving...' : 'Confirm Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
