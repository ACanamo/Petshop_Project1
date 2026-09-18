-- ============================================================================
-- PETCHUP: ORDER LIFECYCLE & ARCHIVAL INTEGRITY ENFORCEMENT
-- Critical Action Plan — Step 4 (Release Blocker R02)
-- ============================================================================
-- 1. Ensure archival and restocking columns exist on orders table
-- 2. Enforce valid state transitions (delivered/cancelled are terminal)
-- 3. Revoke direct client DELETE permissions to prevent accounting erasure
-- ============================================================================

-- 1. Add archival and idempotency tracking columns if not present
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS restocked boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Create index for quick filtering of active vs archived orders
CREATE INDEX IF NOT EXISTS idx_orders_is_archived ON orders (is_archived);

-- 2. Database-level trigger preventing illegal state transitions
CREATE OR REPLACE FUNCTION enforce_order_status_transition()
RETURNS trigger AS $$
BEGIN
  -- Allow same-status updates (e.g. updating is_archived or notes)
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- 1. Cancelled orders are terminal
  IF OLD.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cancelled orders cannot be reopened because returned inventory may have already been allocated to other shoppers.';
  END IF;

  -- 2. Delivered orders are terminal; cannot be cancelled or moved backward
  IF OLD.status = 'delivered' THEN
    IF NEW.status = 'cancelled' THEN
      RAISE EXCEPTION 'Delivered orders cannot be cancelled. Goods are already in customer possession; an inspected return process is required.';
    END IF;
    RAISE EXCEPTION 'Delivered orders cannot be moved backward to %.', NEW.status;
  END IF;

  -- 3. Shipped orders cannot be cancelled while in transit
  IF OLD.status = 'shipped' THEN
    IF NEW.status = 'cancelled' THEN
      RAISE EXCEPTION 'Shipped orders cannot be cancelled while in transit. Goods must be received and processed through return inspection.';
    END IF;
    IF NEW.status != 'delivered' THEN
      RAISE EXCEPTION 'In-transit orders cannot be moved backward from shipped to %.', NEW.status;
    END IF;
  END IF;

  -- 4. Processing orders can only transition to shipped or cancelled
  IF OLD.status = 'processing' AND NEW.status NOT IN ('shipped', 'cancelled') THEN
    RAISE EXCEPTION 'Processing orders can only transition to shipped or cancelled.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_order_status_transition ON orders;
CREATE TRIGGER trg_enforce_order_status_transition
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION enforce_order_status_transition();

-- 3. Revoke direct client DELETE permissions to prevent loss of financial history
REVOKE DELETE ON orders FROM anon, authenticated;
