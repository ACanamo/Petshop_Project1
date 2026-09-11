import React, { useEffect } from 'react';
import { useOrders } from '../../context/OrdersContext';
import { formatPeso, getOrderStatusMeta } from '../../lib/constants';

export default function InvoiceModal() {
  const { selectedInvoiceOrder, closeInvoice } = useOrders();

  useEffect(() => {
    if (!selectedInvoiceOrder) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeInvoice();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedInvoiceOrder, closeInvoice]);

  if (!selectedInvoiceOrder) return null;

  const order = selectedInvoiceOrder;
  const statusMeta = getOrderStatusMeta(order.status);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="invoice-modal-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) closeInvoice();
    }} style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(30, 41, 59, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 2200
    }}>
      <div className="invoice-modal-card" role="dialog" aria-modal="true" aria-labelledby="invoice-title" style={{
        background: '#fff',
        borderRadius: '24px',
        border: '3px solid #1e293b',
        boxShadow: '6px 6px 0px #1e293b',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Invoice Modal Header */}
        <div style={{
          padding: '20px 24px',
          background: 'var(--color-yellow, #ffd166)',
          borderBottom: '3px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1e293b' }}>
              OFFICIAL RECEIPT & INVOICE
            </span>
            <h3 id="invoice-title" style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
              🐾 PETCHUP STORE
            </h3>
          </div>
          <button
            type="button"
            onClick={closeInvoice}
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
            aria-label="Close invoice"
          >
            ✕
          </button>
        </div>

        {/* Invoice Printable Body */}
        <div className="printable-invoice" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Order Details Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px dashed #cbd5e1',
            paddingBottom: '16px',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>Invoice For:</div>
              <strong style={{ fontSize: '15px', color: '#1e293b' }}>{order.customer_name || "Pet Parent"}</strong>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{order.customer_email || "N/A"}</div>
              {order.pet_name && (
                <div style={{ fontSize: '12px', color: 'var(--color-coral)', marginTop: '2px' }}>
                  Fur Baby: 🐶 {order.pet_name}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>Order ID:</div>
              <strong style={{ fontSize: '14px', color: '#1e293b' }}>#{order.id}</strong>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {new Date(order.created_at).toLocaleDateString()}
              </div>
              <div style={{ marginTop: '4px' }}>
                <span style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: '#e2e8f0',
                  color: '#1e293b'
                }}>
                  {statusMeta.emoji} {statusMeta.label}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #1e293b', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>
                <th style={{ padding: '8px 4px' }}>Item</th>
                <th style={{ padding: '8px 4px', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '8px 4px', textAlign: 'right' }}>Price</th>
                <th style={{ padding: '8px 4px', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((it, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                  <td style={{ padding: '10px 4px', color: '#1e293b' }}>
                    <span style={{ marginRight: '6px' }}>{it.img || "🐾"}</span>
                    <strong>{it.name}</strong>
                  </td>
                  <td style={{ padding: '10px 4px', textAlign: 'center', color: '#64748b' }}>
                    {it.qty}
                  </td>
                  <td style={{ padding: '10px 4px', textAlign: 'right', color: '#64748b' }}>
                    {formatPeso(it.price || 0)}
                  </td>
                  <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>
                    {formatPeso((it.price || 0) * (it.qty || 1))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Calculations Breakdown */}
          <div style={{
            background: '#f8fafc',
            border: '2px solid #1e293b',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '13px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Subtotal:</span>
              <strong>{formatPeso(order.subtotal || order.total)}</strong>
            </div>

            {order.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                <span>Discount ({order.discount_code || "COUPON"}):</span>
                <strong>-{formatPeso(order.discount_amount)}</strong>
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: '2px dashed #cbd5e1',
              fontSize: '16px',
              color: '#1e293b'
            }}>
              <strong>Grand Total (PHP):</strong>
              <strong style={{ color: 'var(--color-coral, #e63946)' }}>{formatPeso(order.total)}</strong>
            </div>
          </div>
        </div>

        {/* Invoice Footer Actions */}
        <div style={{
          padding: '16px 24px',
          background: '#f8fafc',
          borderTop: '2px solid #1e293b',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            type="button"
            className="btn btn-outline btn-pill"
            onClick={handlePrint}
          >
            🖨️ Print Receipt
          </button>
          <button
            type="button"
            className="btn btn-primary btn-pill"
            onClick={closeInvoice}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
