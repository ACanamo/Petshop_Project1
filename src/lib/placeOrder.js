const UNCONFIRMED_MESSAGE = "We couldn't confirm your order. Your cart has been kept. Check order history before trying again.";

// A missing response does not mean the database rolled back. Never synthesize
// an order, retry the write, or deduct stock separately when the outcome is unknown.
export async function placeOrder(client, params, timeoutMs = 6000) {
  let timer;
  let response;
  try {
    response = await Promise.race([
      client.rpc('place_order', params),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(UNCONFIRMED_MESSAGE)), timeoutMs);
      })
    ]);
  } catch (cause) {
    throw new Error(UNCONFIRMED_MESSAGE, { cause });
  } finally {
    clearTimeout(timer);
  }

  if (response?.error) {
    throw new Error(response.error.message || 'The store rejected this order.');
  }
  if (!response?.data?.id) {
    throw new Error(UNCONFIRMED_MESSAGE);
  }
  return response.data;
}
