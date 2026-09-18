import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

describe('session data isolation & state clearing (Step 5)', () => {
  test('scoped storage keys prevent cross-account order data leakage', () => {
    const userA = { id: 'usr-001', name: 'Alice' };
    const userB = { id: 'usr-002', name: 'Bob' };

    const getOrderStorageKey = (userId) => (userId ? `petchup_orders_${userId}` : 'petchup_orders_guest');

    const keyA = getOrderStorageKey(userA.id);
    const keyB = getOrderStorageKey(userB.id);

    assert.notEqual(keyA, keyB);
    assert.equal(keyA, 'petchup_orders_usr-001');
    assert.equal(keyB, 'petchup_orders_usr-002');
  });

  test('asynchronous responses from an older session generation are rejected', () => {
    let currentSessionGeneration = 1;

    function processOrderSyncResponse(responseGeneration, data) {
      if (responseGeneration !== currentSessionGeneration) {
        return null; // Discarded because session changed
      }
      return data;
    }

    // Request initiated in generation 1
    const requestGen = currentSessionGeneration;

    // User logs out or switches accounts before response arrives -> generation increments to 2
    currentSessionGeneration += 1;

    // Delayed response finally arrives with payload from User A
    const staleData = [{ id: 'ord-secret-123', total: 50 }];
    const result = processOrderSyncResponse(requestGen, staleData);

    assert.equal(result, null);
  });

  test('session clearing removes all sensitive customer storage keys', () => {
    const mockStorage = {
      petchup_current_customer: '{"name":"Alice"}',
      petchup_orders: '[{"id":"ord-1"}]',
      petchup_orders_usr_001: '[{"id":"ord-1"}]',
      petchup_cart: '[{"id":"p1"}]',
      petchup_active_discount: '{"code":"FIRSTPAW20"}',
      petchup_attempt_usr_001: 'att_123',
      petchup_products: '[{"id":"p1"}]' // Catalog should be kept
    };

    function clearCustomerSessionStorage(storage) {
      const sensitivePrefixes = [
        'petchup_current_customer',
        'petchup_orders',
        'petchup_cart',
        'petchup_active_discount',
        'petchup_attempt_'
      ];

      for (const key of Object.keys(storage)) {
        if (sensitivePrefixes.some(prefix => key.startsWith(prefix))) {
          delete storage[key];
        }
      }
    }

    clearCustomerSessionStorage(mockStorage);

    // Customer keys must be completely purged
    assert.equal(mockStorage.petchup_current_customer, undefined);
    assert.equal(mockStorage.petchup_orders, undefined);
    assert.equal(mockStorage.petchup_orders_usr_001, undefined);
    assert.equal(mockStorage.petchup_cart, undefined);
    assert.equal(mockStorage.petchup_active_discount, undefined);
    assert.equal(mockStorage.petchup_attempt_usr_001, undefined);

    // Public catalog must survive
    assert.notEqual(mockStorage.petchup_products, undefined);
  });
});
