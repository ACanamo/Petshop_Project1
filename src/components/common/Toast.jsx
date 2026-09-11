import React from 'react';
import { useCart } from '../../context/CartContext';

export default function Toast() {
  const { toastMessage } = useCart();

  return (
    <div
      className={`toast ${toastMessage ? 'is-active' : ''}`}
      id="toast"
      role="status"
      aria-live="polite"
    >
      <span id="toast-message">{toastMessage}</span>
    </div>
  );
}
