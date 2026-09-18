import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateOrderTransition,
  getAllowedTransitions,
  isTerminalStatus,
  ORDER_STATUSES
} from '../src/lib/orderLifecycle.js';

test('valid transitions succeed', () => {
  assert.equal(validateOrderTransition('pending', 'processing'), true);
  assert.equal(validateOrderTransition('pending', 'cancelled'), true);
  assert.equal(validateOrderTransition('processing', 'shipped'), true);
  assert.equal(validateOrderTransition('processing', 'cancelled'), true);
  assert.equal(validateOrderTransition('shipped', 'delivered'), true);
  // Idempotent same-state transitions
  assert.equal(validateOrderTransition('delivered', 'delivered'), true);
  assert.equal(validateOrderTransition('cancelled', 'cancelled'), true);
});

test('delivered orders cannot be cancelled or moved backward', () => {
  assert.throws(
    () => validateOrderTransition('delivered', 'cancelled'),
    /Delivered orders cannot be cancelled/
  );
  assert.throws(
    () => validateOrderTransition('delivered', 'pending'),
    /cannot be moved backward/
  );
  assert.throws(
    () => validateOrderTransition('delivered', 'processing'),
    /cannot be moved backward/
  );
});

test('shipped orders cannot be cancelled in transit or moved backward', () => {
  assert.throws(
    () => validateOrderTransition('shipped', 'cancelled'),
    /Shipped orders cannot be cancelled while in transit/
  );
  assert.throws(
    () => validateOrderTransition('shipped', 'pending'),
    /cannot be moved backward/
  );
  assert.throws(
    () => validateOrderTransition('shipped', 'processing'),
    /cannot be moved backward/
  );
});

test('cancelled orders are terminal and cannot be reopened', () => {
  assert.throws(
    () => validateOrderTransition('cancelled', 'pending'),
    /Cancelled orders cannot be reopened/
  );
  assert.throws(
    () => validateOrderTransition('cancelled', 'processing'),
    /Cancelled orders cannot be reopened/
  );
  assert.throws(
    () => validateOrderTransition('cancelled', 'delivered'),
    /Cancelled orders cannot be reopened/
  );
});

test('isTerminalStatus accurately identifies terminal states', () => {
  assert.equal(isTerminalStatus('delivered'), true);
  assert.equal(isTerminalStatus('cancelled'), true);
  assert.equal(isTerminalStatus('pending'), false);
  assert.equal(isTerminalStatus('processing'), false);
  assert.equal(isTerminalStatus('shipped'), false);
});

test('getAllowedTransitions returns correct available statuses for dropdowns', () => {
  assert.deepEqual(getAllowedTransitions('pending'), ['pending', 'processing', 'cancelled']);
  assert.deepEqual(getAllowedTransitions('processing'), ['processing', 'shipped', 'cancelled']);
  assert.deepEqual(getAllowedTransitions('shipped'), ['shipped', 'delivered']);
  assert.deepEqual(getAllowedTransitions('delivered'), ['delivered']);
  assert.deepEqual(getAllowedTransitions('cancelled'), ['cancelled']);
});
