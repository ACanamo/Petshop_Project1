/**
 * PETCHUP — ORDER LIFECYCLE STATE MACHINE
 *
 * Enforces business logic and inventory safety across all order state transitions.
 * Prevents invalid backwards transitions, accidental restock of delivered goods,
 * and double cancellations.
 */

export const ORDER_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

const ALLOWED_TRANSITIONS = {
  pending: ['pending', 'processing', 'cancelled'],
  processing: ['processing', 'shipped', 'cancelled'],
  shipped: ['shipped', 'delivered'],
  delivered: ['delivered'],
  cancelled: ['cancelled']
};

/**
 * Returns the list of permitted next statuses for a given current status.
 */
export function getAllowedTransitions(currentStatus = 'pending') {
  const status = (currentStatus || 'pending').toLowerCase();
  return ALLOWED_TRANSITIONS[status] || [status];
}

/**
 * Checks whether an order is in a final, immutable terminal state.
 */
export function isTerminalStatus(status) {
  const s = (status || '').toLowerCase();
  return s === 'delivered' || s === 'cancelled';
}

/**
 * Validates a proposed state transition. Throws a descriptive error if forbidden.
 */
export function validateOrderTransition(currentStatus, newStatus) {
  const current = (currentStatus || 'pending').toLowerCase();
  const next = (newStatus || '').toLowerCase();

  if (current === next) return true;

  if (current === 'cancelled') {
    throw new Error(
      "Cancelled orders cannot be reopened because returned inventory may have already been allocated to other shoppers."
    );
  }

  if (current === 'delivered') {
    if (next === 'cancelled') {
      throw new Error(
        "Delivered orders cannot be cancelled. Goods are already in customer possession; an inspected return process is required."
      );
    }
    throw new Error(
      `Completed orders cannot be moved backward from 'delivered' to '${next}'.`
    );
  }

  if (current === 'shipped') {
    if (next === 'cancelled') {
      throw new Error(
        "Shipped orders cannot be cancelled while in transit. Goods must be received and processed through return inspection."
      );
    }
    if (next !== 'delivered') {
      throw new Error(
        `In-transit orders cannot be moved backward from 'shipped' to '${next}'.`
      );
    }
  }

  const allowed = getAllowedTransitions(current);
  if (!allowed.includes(next)) {
    throw new Error(
      `Illegal order transition: cannot change order status from '${current}' to '${next}'.`
    );
  }

  return true;
}
