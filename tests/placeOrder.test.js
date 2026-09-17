import test from 'node:test';
import assert from 'node:assert/strict';
import { placeOrder } from '../src/lib/placeOrder.js';

const params = { p_pet_name: 'Buddy', p_items: [{ id: 'food', qty: 1 }], p_discount_code: '' };

function clientReturning(result) {
  const calls = [];
  return {
    calls,
    rpc(name, args) {
      calls.push({ name, args });
      return typeof result === 'function' ? result() : Promise.resolve(result);
    }
  };
}

test('returns the server order using only the transactional checkout RPC', async () => {
  const order = { id: 'ord-server', total: 42, status: 'pending' };
  const client = clientReturning({ data: order, error: null });
  assert.strictEqual(await placeOrder(client, params), order);
  assert.deepEqual(client.calls, [{ name: 'place_order', args: params }]);
});

test('stock or permission rejection never becomes a local success or a second mutation', async () => {
  const client = clientReturning({ data: null, error: { message: 'Not enough stock' } });
  await assert.rejects(placeOrder(client, params), /Not enough stock/);
  assert.deepEqual(client.calls, [{ name: 'place_order', args: params }]);
});

test('network rejection leaves the outcome unconfirmed without retrying', async () => {
  const client = clientReturning(() => Promise.reject(new Error('Network failed')));
  await assert.rejects(placeOrder(client, params), /Check order history before trying again/);
  assert.equal(client.calls.length, 1);
});

test('empty or malformed server results cannot confirm an order', async () => {
  for (const response of [null, { data: null }, { data: {} }]) {
    await assert.rejects(placeOrder(clientReturning(response), params), /couldn't confirm/);
  }
});

test('a delayed server success after timeout cannot trigger another stock deduction', async () => {
  let resolveRequest;
  const request = new Promise(resolve => { resolveRequest = resolve; });
  const client = clientReturning(() => request);
  await assert.rejects(placeOrder(client, params, 5), /couldn't confirm/);
  resolveRequest({ data: { id: 'ord-delayed' }, error: null });
  await request;
  assert.deepEqual(client.calls, [{ name: 'place_order', args: params }]);
});

test('a late rejected request is handled after the timeout', async () => {
  let rejectRequest;
  const client = clientReturning(() => new Promise((_, reject) => { rejectRequest = reject; }));
  await assert.rejects(placeOrder(client, params, 5), /couldn't confirm/);
  rejectRequest(new Error('Late connection failure'));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(client.calls.length, 1);
});
