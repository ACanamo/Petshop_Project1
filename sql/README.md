**Atomic checkout and direct inventory protection**

Repository implementation and local PostgreSQL tests are complete. Live deployment, hosted permission checks, and multi-session concurrency verification are still pending: this workspace has no connected Supabase administration tool or database credentials. No live orders or inventory were changed.

Checkout uses a single `place_order` database call. It authenticates the caller, locks products in consistent order, validates combined quantities, snapshots catalog prices, inserts the order, records any coupon redemption, and deducts stock. These operations share one transaction. A failed insert or deduction aborts all of them; a deduction affecting no product now also raises an error. The client confirms only a returned server order and never deducts stock separately.

**Deploy to an existing database**

1. Confirm the intended project and take a recoverable backup. Use an isolated staging database first. Compare the deployed tables/columns with this project's schema; the focused patch expects `profiles`, `products`, `orders`, and `coupon_redemptions` to exist. Unknown schema differences require review.
2. Run the entire [enforce_atomic_checkout.sql](enforce_atomic_checkout.sql) as database owner in Supabase SQL Editor. It installs the checkout and validation functions, validates/adds nonnegative inventory protection, blocks direct client order inserts, retires the old seven-argument checkout overload, and replaces direct stock deduction with a denied SECURITY INVOKER stub. The patch is transactional and rerunnable; it does not seed products, promote an admin, or alter existing stock/order rows. It is a standalone deployment patch, not a migration-history entry.
3. Run [verify_direct_inventory_rpc.sql](verify_direct_inventory_rpc.sql) and [verify_atomic_checkout.sql](verify_atomic_checkout.sql). Both must return PASS without errors. These are catalog-only checks, wrapped in read-only transactions; they do not invoke unknown legacy functions or create an order. The direct-inventory verifier accepts an absent RPC as well as the denied stub. Catalog checks establish grants/constraints/trigger configuration, not the behavior of every deployed function or policy.
4. In staging, execute the behavioral checks below. Deploy the frontend version that calls only `place_order`; the current source already does this. Do not grant old clients access to standalone stock mutation. Apply the reviewed patch and both verifiers to the intended live project once staging passes; record the deployment result.

If the patch fails, do not run its remaining statements individually or remove its guardrails. Roll back an open failed transaction, inspect the reported baseline/privilege/data issue, and resolve it before rerunning the whole file. Historical negative stock is deliberately not clamped or silently repaired. A successful test run on a local database does not establish that a particular live database is compatible.

For emergency containment when the full checkout upgrade cannot yet be applied, [disable_direct_inventory_rpc.sql](disable_direct_inventory_rpc.sql) remains the narrower option: it only disables the old stock RPC. That patch alone does not upgrade `place_order` or block direct client order insertion.

**Verification**

Run `npm.cmd test` and `npm.cmd run build`. Current result: 40 passing tests and a successful production build. The pinned PGlite dependency is development-only and is not imported by the application.

`tests/atomicCheckout.test.js` executes the full bootstrap and a simulated legacy upgrade using a real PostgreSQL engine in memory. Only Supabase-owned auth/storage prerequisites are test fixtures. Both installation paths cover:

- Successful order insertion, exact stock deduction, authoritative prices and coupon redemption.
- Invalid items, duplicate-line overselling, insufficient inventory and exhausted stock.
- Injected insert failure, and failure after the order, coupon and first product deduction have already been written: all affected rows roll back.
- A stock update suppressed by a trigger: checkout fails instead of returning an undeducted order.
- Anonymous checkout and direct client inserts denied; the standalone stock RPC denied to visitors, customers and its owner; customer stock updates blocked by RLS.
- Customer order isolation, repeated upgrades, permission verifier success/failure, and full patch rollback when inherited permissions leave a bypass.
- Refusal to silently repair pre-existing negative inventory.

The six existing helper tests also verify that a timeout, network rejection, or missing result never creates a fabricated confirmation or separate inventory deduction.

PGlite has one connection. Hosted Auth/JWT verification, PostgREST, project-specific grants/policies, and simultaneous independent database sessions still require staging checks:

| Staging scenario | Expected result |
| --- | --- |
| Two authenticated customers simultaneously buy the last unit | One order succeeds; the other receives insufficient stock; final stock is zero and exactly one order exists for that unit. |
| Two checkouts list the same products in opposite order | No overselling; checkout product locks follow a consistent order. |
| Customer calls old RPC or tries direct order/stock writes | Standalone deduction/direct insertion denied; no unauthorized stock changes. |
| Mixed basket includes insufficient stock | No order, no coupon redemption, and no deduction for any item. |
| One normal authenticated checkout | One recorded order and the exact ordered quantities deducted. |
| Response is lost after a committed checkout | No local success or second automatic deduction; show an unconfirmed outcome and reconcile history. |

**Limits of this change**

Atomicity means each checkout either saves its order and deductions together or saves neither. It does not make two separately submitted checkout requests the same purchase. Durable retry idempotency remains R03 in `CTO_REAUDIT.md`; a manual retry after a lost response may create another order. Check authoritative order history before resubmitting. Other audit findings, including stale admin stock edits and cancellation rules, remain separate work.

Function privilege handling follows [Supabase's documented security modes and execution grants](https://supabase.com/docs/guides/database/functions). The PostgreSQL tests validate this repository's transaction behavior; they are not a live deployment certification.
