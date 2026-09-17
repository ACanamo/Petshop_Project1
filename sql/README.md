**A01: disable direct inventory mutation**

The repository fix is implemented. Deployment to the live database and live SQL verification are pending: this workspace has no connected Supabase admin tool, database connection, or Supabase CLI. Frontend unit tests and the production build pass; these do not validate deployed database privileges.

1. Open the intended project's Supabase SQL Editor as the database owner and run all of `disable_direct_inventory_rpc.sql`. Use this focused patch rather than rerunning the entire bootstrap schema. The patch replaces the mutating function with a SECURITY INVOKER function that always raises permission denied, revokes execution from PUBLIC/anon/authenticated, and checks effective client privileges before commit. The two returned permission values must both be `false`.
2. Run all of `verify_direct_inventory_rpc.sql`. It checks the denied body and client execution, and confirms `place_order` remains executable by authenticated users but not anon. Expect the PASS result with no errors. The verification does not create orders or change stock.
3. Deploy the updated frontend. Normal checkout uses `place_order` only. Offline, timeout, and missing-result paths retain the basket and report an unconfirmed outcome; they no longer generate local orders or run stock mutations. Reload any old browser tabs.
4. In staging, place a controlled order and confirm that its stock decreases once, then simulate a delayed response. No local order or separate inventory deduction should occur. This is not a full idempotency fix: automatic retry/reconciliation remains A02 follow-up work. An uncertain order may have committed, so check history before submitting another order.

Do not restore access to the retired RPC to accommodate an old frontend. Keep checkout unavailable temporarily if deployment compatibility requires it. Existing orders and inventory rows are untouched by this patch; historical reconciliation is separate work.

Local checks: `npm.cmd test` and `npm.cmd run build`. SQL verification still requires PostgreSQL/Supabase access.

The restriction follows Supabase's documented [function privilege and security-mode rules](https://supabase.com/docs/guides/database/functions).
