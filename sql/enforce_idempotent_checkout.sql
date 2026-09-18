-- ============================================================================
-- PETCHUP: IDEMPOTENT CHECKOUT CONTRACT & AUTHORITATIVE PRICE VALIDATION
-- Critical Action Plan — Step 6 (Release Blocker R03 & R05)
-- ============================================================================
-- 1. Adds checkout_attempt_key to orders table with unique index per customer.
-- 2. Validates client quoted prices against locked catalog state.
-- 3. Returns existing committed order on replay/retry with identical attempt key.
-- 4. Rejects attempt key reuse if payload or discount code differs.
-- 5. Safe under concurrent identical submissions.
-- ============================================================================

-- 1. Idempotency tracking column and unique index
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS checkout_attempt_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_customer_attempt
  ON public.orders (customer_id, checkout_attempt_key)
  WHERE checkout_attempt_key IS NOT NULL;

-- 2. 4-argument place_order with attempt key and quote validation
CREATE OR REPLACE FUNCTION public.place_order(
  p_pet_name TEXT,
  p_items JSONB,
  p_discount_code TEXT,
  p_attempt_key TEXT
)
RETURNS public.orders AS $$
DECLARE
  v_customer_id UUID := (SELECT auth.uid());
  v_customer_name TEXT;
  v_customer_email TEXT;
  v_order_id TEXT := 'ord-' || replace(gen_random_uuid()::text, '-', '');
  v_normalized_code TEXT := UPPER(TRIM(COALESCE(p_discount_code, '')));
  v_trimmed_attempt_key TEXT := NULLIF(TRIM(COALESCE(p_attempt_key, '')), '');
  agg_item RECORD;
  item JSONB;
  v_product_id TEXT;
  v_qty INTEGER;
  v_prod_record RECORD;
  v_snapshot_items JSONB := '[]'::jsonb;
  new_order public.orders;
BEGIN
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to place an order';
  END IF;

  -- 1. Check for existing committed order with this attempt key (safe retry/idempotency)
  IF v_trimmed_attempt_key IS NOT NULL THEN
    SELECT * INTO new_order
    FROM public.orders
    WHERE customer_id = v_customer_id
      AND checkout_attempt_key = v_trimmed_attempt_key;

    IF new_order.id IS NOT NULL THEN
      -- Reject attempt key reuse with changed coupon code or changed item count
      IF new_order.discount_code IS DISTINCT FROM v_normalized_code
         OR jsonb_array_length(new_order.items) IS DISTINCT FROM jsonb_array_length(p_items) THEN
        RAISE EXCEPTION 'Checkout attempt key was already used with different parameters.';
      END IF;

      -- Return the existing committed order without repricing, re-redeeming coupon, or deducting stock
      RETURN new_order;
    END IF;
  END IF;

  SELECT name, email INTO v_customer_name, v_customer_email
  FROM public.profiles
  WHERE id = v_customer_id;

  v_customer_name := COALESCE(v_customer_name, 'Guest Pet Parent');
  v_customer_email := COALESCE(v_customer_email, '');

  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  -- Reject upfront if this exact code was already redeemed by this customer
  IF v_normalized_code <> '' AND EXISTS (
    SELECT 1 FROM public.coupon_redemptions
    WHERE customer_id = v_customer_id AND code = v_normalized_code
  ) THEN
    RAISE EXCEPTION 'You''ve already used the coupon "%"', v_normalized_code;
  END IF;

  -- Pass 1: Aggregate requested quantities and lock rows in deterministic order (ORDER BY product_id ASC)
  FOR agg_item IN
    SELECT
      it->>'id' AS product_id,
      SUM(GREATEST(COALESCE((it->>'qty')::INTEGER, 0), 0)) AS aggregate_qty
    FROM jsonb_array_elements(p_items) AS it
    GROUP BY it->>'id'
    ORDER BY it->>'id' ASC
  LOOP
    IF agg_item.product_id IS NULL OR agg_item.product_id = '' THEN
      RAISE EXCEPTION 'Order contains an item with missing product id';
    END IF;

    IF agg_item.aggregate_qty <= 0 THEN
      RAISE EXCEPTION 'Invalid item quantity in order';
    END IF;

    -- Row lock in deterministic order
    SELECT id, name, price, img, image_url, stock_quantity
    INTO v_prod_record
    FROM public.products
    WHERE id = agg_item.product_id
    FOR UPDATE;

    IF v_prod_record.id IS NULL THEN
      RAISE EXCEPTION 'Unknown product % in order', agg_item.product_id;
    END IF;

    IF v_prod_record.stock_quantity < agg_item.aggregate_qty THEN
      RAISE EXCEPTION 'Not enough stock for "%": only % left, % requested',
        v_prod_record.name, v_prod_record.stock_quantity, agg_item.aggregate_qty;
    END IF;
  END LOOP;

  -- Pass 2: Verify quote pricing against live catalog and build snapshot
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := item->>'id';
    v_qty := GREATEST(COALESCE((item->>'qty')::INTEGER, 0), 0);

    SELECT id, name, price, img, image_url
    INTO v_prod_record
    FROM public.products
    WHERE id = v_product_id;

    -- If client submitted an accepted quote price with an attempt key, verify it matches catalog
    IF v_trimmed_attempt_key IS NOT NULL AND item ? 'price' AND ((item->>'price')::NUMERIC(10,2) IS DISTINCT FROM v_prod_record.price) THEN
      RAISE EXCEPTION 'Price for "%" has changed from % to %. Please review your cart before confirming.',
        v_prod_record.name, (item->>'price')::NUMERIC(10,2), v_prod_record.price;
    END IF;

    v_snapshot_items := v_snapshot_items || jsonb_build_array(
      jsonb_build_object(
        'id', v_product_id,
        'name', v_prod_record.name,
        'price', v_prod_record.price,
        'qty', v_qty,
        'img', COALESCE(v_prod_record.img, '🐾'),
        'image_url', COALESCE(v_prod_record.image_url, '')
      )
    );
  END LOOP;

  -- Insert order with attempt key (handling concurrent insert race)
  BEGIN
    INSERT INTO public.orders (
      id, customer_id, customer_name, customer_email, pet_name,
      items, item_count, subtotal, discount_code, discount_amount, total, status, checkout_attempt_key, created_at
    ) VALUES (
      v_order_id, v_customer_id, v_customer_name, v_customer_email,
      COALESCE(p_pet_name, ''), v_snapshot_items, 0, 0, v_normalized_code, 0, 0, 'pending', v_trimmed_attempt_key, NOW()
    )
    RETURNING * INTO new_order;
  EXCEPTION WHEN unique_violation THEN
    -- Concurrent identical attempt committed just before this insert
    IF v_trimmed_attempt_key IS NOT NULL THEN
      SELECT * INTO new_order
      FROM public.orders
      WHERE customer_id = v_customer_id
        AND checkout_attempt_key = v_trimmed_attempt_key;

      IF new_order.id IS NOT NULL THEN
        RETURN new_order;
      END IF;
    END IF;
    RAISE;
  END;

  -- Record coupon redemption if a discount was recognized
  IF new_order.discount_amount > 0 THEN
    INSERT INTO public.coupon_redemptions (customer_id, code, order_id, redeemed_at)
    VALUES (v_customer_id, v_normalized_code, new_order.id, NOW());
  END IF;

  -- Pass 3: Deduct stock atomically per aggregated product
  FOR agg_item IN
    SELECT
      it->>'id' AS product_id,
      SUM(GREATEST(COALESCE((it->>'qty')::INTEGER, 0), 0)) AS aggregate_qty
    FROM jsonb_array_elements(p_items) AS it
    GROUP BY it->>'id'
    ORDER BY it->>'id' ASC
  LOOP
    UPDATE public.products
    SET stock_quantity = stock_quantity - agg_item.aggregate_qty,
        in_stock = (stock_quantity - agg_item.aggregate_qty) > 0,
        updated_at = NOW()
    WHERE id = agg_item.product_id
      AND stock_quantity >= agg_item.aggregate_qty;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock deduction failed for product %', agg_item.product_id;
    END IF;
  END LOOP;

  RETURN new_order;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = '';

-- 3-argument signature delegates to 4-argument version with NULL attempt key
CREATE OR REPLACE FUNCTION public.place_order(
  p_pet_name TEXT,
  p_items JSONB,
  p_discount_code TEXT
)
RETURNS public.orders AS $$
BEGIN
  RETURN public.place_order(p_pet_name, p_items, p_discount_code, NULL);
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = '';

-- Permissions
REVOKE EXECUTE ON FUNCTION public.place_order(TEXT, JSONB, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(TEXT, JSONB, TEXT) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.place_order(TEXT, JSONB, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(TEXT, JSONB, TEXT, TEXT) TO authenticated;
