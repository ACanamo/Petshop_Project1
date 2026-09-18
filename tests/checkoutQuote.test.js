import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { obtainAuthoritativeQuote } from '../src/lib/checkoutQuote.js';

describe('checkout quote validation', () => {
  const catalog = [
    { id: 'p1', name: 'Crunchies', price: 30.00, stockQuantity: 10, img: '🥩' },
    { id: 'p2', name: 'Leash', price: 15.00, stockQuantity: 2, img: '🌈' }
  ];

  test('returns valid quote when cart matches catalog prices and stock is available', () => {
    const cart = [{ id: 'p1', name: 'Crunchies', price: 30.00, qty: 2 }];
    const quote = obtainAuthoritativeQuote(cart, catalog);

    assert.equal(quote.isValid, true);
    assert.equal(quote.hasPriceChanges, false);
    assert.equal(quote.subtotal, 60.00);
    assert.equal(quote.total, 60.00);
  });

  test('detects price increases and requires shopper review', () => {
    // In-cart price was 25.00, but live catalog price moved to 30.00
    const cart = [{ id: 'p1', name: 'Crunchies', price: 25.00, qty: 2 }];
    const quote = obtainAuthoritativeQuote(cart, catalog);

    assert.equal(quote.isValid, true);
    assert.equal(quote.hasPriceChanges, true);
    assert.equal(quote.priceChanges.length, 1);
    assert.equal(quote.priceChanges[0].oldPrice, 25.00);
    assert.equal(quote.priceChanges[0].newPrice, 30.00);
    assert.equal(quote.total, 60.00); // authoritative total
  });

  test('detects when requested quantity exceeds available catalog stock', () => {
    // Requested 5 leashes, only 2 in stock
    const cart = [{ id: 'p2', name: 'Leash', price: 15.00, qty: 5 }];
    const quote = obtainAuthoritativeQuote(cart, catalog);

    assert.equal(quote.isValid, false);
    assert.equal(quote.unavailableItems.length, 1);
    assert.match(quote.unavailableItems[0], /only 2 available/);
  });

  test('correctly calculates discount codes', () => {
    const cart = [{ id: 'p1', name: 'Crunchies', price: 30.00, qty: 1 }];
    const quote = obtainAuthoritativeQuote(cart, catalog, 'SAVE10', 10);

    assert.equal(quote.subtotal, 30.00);
    assert.equal(quote.discountAmount, 3.00);
    assert.equal(quote.total, 27.00);
  });
});
