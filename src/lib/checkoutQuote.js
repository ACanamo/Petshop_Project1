/**
 * PETCHUP — CHECKOUT QUOTING & PRICE VALIDATION
 *
 * Compares in-cart prices against authoritative catalog prices before submission.
 * Detects catalog price changes and stock availability issues so the shopper
 * explicitly accepts any changes before an order is placed.
 */

export function obtainAuthoritativeQuote(cartItems, catalogProducts, discountCode = '', discountPercent = 0) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return {
      isValid: false,
      hasChanges: false,
      error: 'Your cart is empty.',
      items: [],
      subtotal: 0,
      discountAmount: 0,
      total: 0
    };
  }

  const catalogMap = new Map((catalogProducts || []).map(p => [p.id, p]));
  const quotedItems = [];
  const priceChanges = [];
  const unavailableItems = [];
  let subtotal = 0;

  for (const item of cartItems) {
    const catalogItem = catalogMap.get(item.id);

    if (!catalogItem) {
      unavailableItems.push(item.name || item.id);
      continue;
    }

    const livePrice = Number(catalogItem.price);
    const inCartPrice = Number(item.price);
    const qty = Math.max(1, parseInt(item.qty, 10) || 1);

    if (livePrice !== inCartPrice) {
      priceChanges.push({
        id: item.id,
        name: catalogItem.name,
        oldPrice: inCartPrice,
        newPrice: livePrice
      });
    }

    if (catalogItem.stockQuantity !== undefined && catalogItem.stockQuantity < qty) {
      unavailableItems.push(
        `${catalogItem.name} (only ${catalogItem.stockQuantity} available, ${qty} requested)`
      );
    }

    quotedItems.push({
      ...item,
      name: catalogItem.name,
      price: livePrice,
      qty,
      img: catalogItem.img || item.img || '🐾',
      imageUrl: catalogItem.imageUrl || item.imageUrl || ''
    });

    subtotal += livePrice * qty;
  }

  const discountAmount = discountPercent > 0 ? (subtotal * (discountPercent / 100)) : 0;
  const total = Math.max(0, subtotal - discountAmount);

  return {
    isValid: unavailableItems.length === 0,
    hasPriceChanges: priceChanges.length > 0,
    priceChanges,
    unavailableItems,
    items: quotedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    discountCode
  };
}
