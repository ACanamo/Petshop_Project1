const UNCONFIRMED_MESSAGE = "We couldn't confirm your order. Your cart has been kept. Check order history before trying again.";

// A missing response does not mean the database rolled back. Never synthesize
// an order, retry the write, or deduct stock separately when the outcome is unknown.
export async function placeOrder(client, params, timeoutMs = 12000) {
  let timer;
  let response;
  try {
    const callRpc = async () => {
      let res = await client.rpc('place_order', params);
      // If the deployed schema doesn't have the 4-arg attempt_key overload, fall back to 3-arg contract
      if (res?.error?.code === 'PGRST202' && params?.p_attempt_key !== undefined) {
        const { p_attempt_key, ...params3Args } = params;
        res = await client.rpc('place_order', params3Args);
      }
      return res;
    };

    response = await Promise.race([
      callRpc(),
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
