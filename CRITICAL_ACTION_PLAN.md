**PETCHUP — critical action plan | 17 September 2026**

**Objective: make customer orders, inventory, and account data trustworthy before production checkout launches.** This is the implementation priority list based on [CTO_REAUDIT.md](CTO_REAUDIT.md). It supersedes the older sequencing in [REMEDIATION_PLAN.md](REMEDIATION_PLAN.md). It is a plan, not a record of completed fixes or deployed changes.

Keep the current React/Supabase architecture. Complete the work in the order below. Owners are responsibilities that can be held by the same developer; they do not imply additional hiring. Completion requires the acceptance evidence, not just a code change.

**Implementation update:** Atomic checkout hardening, a focused upgrade patch, and local PostgreSQL rollback/access tests are now implemented; see [sql/README.md](sql/README.md). Live deployment and permission/concurrency verification remain pending. Step 1 is not operationally closed, and the broader release blockers below are not marked complete.

| Order | Priority | Outcome | Audit coverage | Owner |
| --- | --- | --- | --- | --- |
| 1 | Immediate; P0 if the old vulnerability is live | Verify and close unauthorized inventory access | R06 | Backend/platform |
| 2 | Prerequisite | Establish isolated staging, reproducible migrations, and automated checks | R06, R11 | Platform/engineering |
| 3 | Release blocker | Product edits cannot overwrite sold inventory | R01 | Frontend/backend |
| 4 | Release blocker | Cancellation and archival preserve inventory and order history | R02 | Backend/frontend/operations |
| 5 | Release blocker | Logout and account switches isolate customer data | R04; essential parts of R08, R10 | Frontend |
| 6 | Release blocker | Checkout retries create one order at the accepted price | R03, R05 | Backend/frontend |
| 7 | Launch decision and implementation | Orders can actually be fulfilled and payments reconciled | R07; truthful labels from R09 | Product/operations/engineering |
| 8 | Final release gate | Verify deployment, reconcile historical exceptions, and run a controlled pilot | R01–R07; operational basics from R12 | Engineering/operations |

**1. Verify live inventory protection first**

Inspect the intended database's deployed function definitions, owners, execution privileges, and checkout permissions. The current source removes the old `deduct_product_stock` RPC, but its deployment has not been verified.

If the old mutating function remains callable by anonymous visitors or ordinary customers, restrict it immediately using the focused patch in `sql/disable_direct_inventory_rpc.sql`. Do not rerun the entire bootstrap schema as an emergency patch. Verify normal authenticated checkout still works and that the deployed frontend no longer calls the retired RPC. If compatibility cannot be maintained safely, keep checkout temporarily unavailable while deploying the matching versions.

The existing `sql/verify_direct_inventory_rpc.sql` verifies the denial-stub deployment. A database where the function is absent needs an absence-aware check; absence must not be mistaken for a failed security fix.

**Done when:** recorded checks show that anonymous/customer calls cannot deduct inventory outside checkout, anonymous checkout is denied, and legitimate authenticated checkout remains available. Until inspected, mark deployed security as unverified, not fixed or definitely vulnerable.

**2. Establish the environment and test foundation**

Require explicit backend configuration in `src/lib/supabase.js` and `.env.example`; remove the fallback to a concrete shared project. Set up an isolated staging database and identify which frontend deployment points to it. Establish versioned migrations from the actual deployed baseline, explicit intended grants, and a separate one-time admin bootstrap. Routine schema upgrades must not re-promote a demoted admin.

Add CI that runs the production build, existing helper tests, and isolated database/browser tests. Add each regression test with its fix in steps 3–6. Start with anonymous, customer A, customer B, and admin access checks; preserve coverage of server pricing, duplicate quantities, and competing last-item purchases. Database test fixtures must use staging/test infrastructure.

Verify a restorable backup and document migration/rollback responsibilities before production schema changes. This preparation must not delay emergency containment in step 1.

**Done when:** missing configuration fails clearly; staging is separate; a fresh test database can be reproduced; access tests run automatically; migrations do not change admin membership unexpectedly; recovery evidence is recorded.

**3. Separate product editing from inventory adjustment**

Change `src/context/StoreContext.jsx` and `src/components/admin/ProductModal.jsx` so descriptive edits update only the fields actually edited. Remove cached stock from ordinary product-save payloads. Use update rather than full-row upsert for existing products, and report missing/conflicting records instead of silently recreating them.

Create a separate admin inventory adjustment operation. For additions/removals, apply a delta transactionally. For a physical stock count, reject a stale count using a version check and require reconciliation. Record the actor, reason, and adjustment; enforce authorization in the database. Ensure ordinary client product edits cannot bypass this inventory path.

**Done when:** load stock 10 in the admin editor, sell one unit, then save a description change: stock remains 9. Competing stock adjustments do not silently overwrite each other. Customer calls to admin adjustment operations fail.

**4. Enforce the order lifecycle in the database**

Define permitted transitions with operations before implementation. The minimum launch rule is that only eligible unfulfilled orders can be cancelled and automatically restocked. Shipped/delivered orders cannot be moved backward to gain cancellation privileges. Returned goods require an explicit received-return process before restocking; if returns are not implemented at launch, reject that automated operation.

Replace individual/bulk hard-delete actions with archival in `src/context/OrdersContext.jsx` and `src/pages/AdminPage.jsx`. Restrict direct DELETE and arbitrary order mutations at the database boundary. Keep customer identity, purchased item snapshots, and financial amounts immutable through normal client operations. Store transition/archival history. Use consistent product locking across checkout, cancellation, returns, and adjustments.

Implement these changes through focused migrations rather than replaying `supabase_schema.sql` against production.

**Done when:** delivered → cancelled and delivered → pending → delete are rejected through direct API calls as well as the UI. Repeated/concurrent cancellation restores stock exactly once. Archiving any order changes no stock, preserves its history, and does not silently cancel an active fulfillment obligation.

**5. Make session changes clear all customer state**

Update `AuthContext.jsx`, `OrdersContext.jsx`, and the cart/order overlays. Track the current account/session generation for asynchronous work; ignore responses from an earlier session. Remove the legacy shared order cache and use server-authoritative, account-scoped state. Match order ownership by immutable user ID, not email. Clear orders, invoices, confirmation dialogs, account carts, and discounts on logout, expiry, and direct account switches.

Handle startup with an already-expired session. Add an auth-initialization state before protected-route redirects, use the same profile-role authority as the database, and remove demo login from production paths. Coordinate cart account ownership with guest merging so another account's basket is never treated as a guest basket. Persist merged quantities and ensure queued cart writes cannot restore items after checkout clearing.

**Done when:** an admin opens an invoice, signs out, and another customer signs in without seeing prior data. Delayed order/profile requests cannot repopulate the old session. Reloading with an expired session exposes no cached customer data. Genuine guest baskets survive login without transferring another account's items.

**6. Deliver one coherent checkout contract: accepted price plus safe retries**

Design quoting and idempotency together so the checkout API does not require two incompatible redesigns. Main files: `src/lib/placeOrder.js`, `src/context/OrdersContext.jsx`, `src/components/cart/CartDrawer.jsx`, order history, and versioned database migrations.

1. Obtain an authoritative quote for current items, quantities, prices, discounts, and availability. Show changes to the shopper before they accept.
2. Generate and persist a checkout-attempt key scoped to the authenticated account and bound to the accepted request/quote. Keep it across timeout, reload, and retry.
3. In the database transaction, enforce unique attempts and validate the accepted quote against locked catalog state before inserting the order or deducting stock. Reject changed payloads that reuse the same key.
4. For an already committed attempt, return its original order without repricing, re-redeeming its coupon, or deducting again. Concurrent identical requests must resolve to that same order.
5. Represent submitting, confirmed, rejected, and unknown outcomes explicitly. Reconcile unknown attempts using an owner-only lookup; do not create a fresh attempt merely because a response timed out.
6. Clear purchased cart items only after confirmed success. Discard old-session responses, preserve new items added during submission, and refresh customer history when opened.

**Done when:** simultaneous retries, a response delayed beyond six seconds, and reload after a lost response produce one order and one deduction. Reusing a key with changed contents fails. A price moving from 100 to 120 requires acceptance before recording 120. A rejected/changed quote creates no order, deduction, or coupon redemption.

**7. Define the minimum viable fulfillment and payment process**

Product/operations must decide whether launch means delivery, pickup, cash on delivery, manual payment, or online payment. Record that decision before implementing this step; no payment-provider selection is assumed.

Capture only the contact, address/pickup, and payment details required for the selected model. Keep order fulfillment status separate from payment status. For manual payment/COD, record who confirmed collection and when. If online payments are selected, verify provider events server-side, handle retries idempotently, and reconcile failed/refunded payments before enabling that method.

Replace unsupported “Total Paid” claims with order totals until payment is recorded. Label the existing aggregate as order value; report collected payments only from authoritative payment records. Pending orders must not be represented as collected revenue. Shipping promises must match the process operations can execute.

**Done when:** an operator can fulfill a test order using captured information, record collection correctly, and distinguish pending, fulfilled, cancelled, paid, and refunded outcomes. The customer sees accurate order/payment labels. This step may be limited to a documented manual pilot; an online gateway is not automatically required.

**8. Verify and release a controlled pilot**

Review historical inventory anomalies, possible duplicate orders, and stale invoice/fulfillment records before declaring data reliable. Reconcile against actual fulfillment/payment evidence. Do not automatically deduplicate similar orders, invent historical prices, or correct stock without operational confirmation.

Deploy reviewed migrations and compatible frontend changes in a coordinated order. Ensure every callable checkout version enforces the new integrity rules; retire legacy overloads rather than leaving a bypass for old clients. Require refresh or pause checkout during incompatible changes. Record deployed revisions and verification results.

Run controlled production checks, then monitor checkout failures/unknown outcomes and inventory discrepancies. Assign an incident owner, a way to pause checkout, and an alert path that remains usable when the application backend is failing. A rollback must preserve accepted orders and must not re-enable the retired inventory vulnerability.

**Launch checklist — all required:**

- [ ] Deployed inventory/RLS permissions are verified for each role.
- [ ] Product edits cannot reverse stock deductions.
- [ ] Cancellation, archival, and returns preserve stock and history.
- [ ] Session expiry/account switching leaves no previous customer data.
- [ ] Retries return one order; confirmed totals match accepted prices.
- [ ] Selected fulfillment/payment process works end to end.
- [ ] Build, helper tests, database tests, and critical browser journeys pass.
- [ ] Historical exceptions have an operational resolution or documented containment.
- [ ] Backup/restore, deployment recovery, monitoring, and incident ownership are verified.

**Dependencies and scope control**

Step 1 is immediate. Step 2 supports every later change; tests grow with each fix. Steps 3–4 establish consistent inventory rules. Step 5 protects checkout/session state before step 6 is finalized. Decide the business model for step 7 early, then implement it against the corrected transaction model. Step 8 requires all applicable launch checks.

After these blockers, finish pagination, server reporting, dialog accessibility, and enforced upload limits from R09/R12–R14. They remain tracked work; this plan focuses first on defects that threaten customer privacy, inventory, accepted orders, and the ability to fulfill them. Estimate delivery dates after deployed-state access and the launch model are confirmed.
