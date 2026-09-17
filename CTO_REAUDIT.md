**PETCHUP — CTO re-audit | 17 September 2026**

**Decision: retain the architecture, but hold an unrestricted customer checkout launch.** The React/Supabase foundation is appropriate for this application. The immediate investment should be transaction correctness, customer-data isolation, and deployment verification. The current code can still create duplicate orders, overwrite stock after a sale, and restock delivered goods through ordinary admin actions.

Reviewed source revision: `1177553`. This report supersedes the current-state claims in `CTO_AUDIT.md`; that earlier report and `REMEDIATION_PLAN.md` describe an older implementation. Findings below use R identifiers to distinguish them from the earlier A identifiers. No application or database fixes were applied during this audit.

| Dimension | CTO assessment |
| --- | --- |
| Architecture | Keep React, Vite, and Supabase. Domain contexts and route splitting are reasonable. Move transaction rules and authoritative aggregates into the database; reduce competing browser caches. |
| Security and privacy | Database access controls have useful foundations. Session cleanup is incomplete, and deployment of the retired inventory RPC restriction is unverified. |
| Order and inventory integrity | Release blockers remain in retries, admin stock writes, and fulfillment transitions. |
| Commercial completeness | Order capture exists. Payment collection/reconciliation and delivery details are not represented in the inspected flow. Confirm whether this is intentionally a demo or manually fulfilled pilot. |
| Engineering assurance | Six focused helper tests and the production build pass. Critical database behavior and full customer journeys have no automated release gate in the repository. |
| Operations and scale | Appropriate to a small pilot after fixes. Environment isolation, migration history, monitoring ownership, and restore evidence remain unestablished. |

P1 means resolve before real customer transactions. P2 means address in the next delivery cycle, or before the affected capability is relied on. A conditional P0 concern remains only if the previously vulnerable inventory RPC is still deployed; the current source removes it.

**Prioritized findings**

**R01 — P1: saving product details can undo a completed sale's stock deduction.**

Evidence: `src/context/StoreContext.jsx:209`, especially the full-row upsert at `:240` and `stock_quantity` at `:249`; `src/components/admin/ProductModal.jsx:65` submits the previously loaded stock alongside every edit.

Example: an admin loads stock 10; a customer buys one, leaving 9; the admin edits the description and saves. The cached value 10 is written back. Checkout row locks cannot prevent a later stale assignment. An isolated execution of the actual `updateProduct` source confirmed that even a description-only update submits cached inventory.

Action: update only changed descriptive fields. Handle inventory adjustments separately with a transactional adjustment or a version-checked stock count, recording actor and reason. Backend/frontend owner. Acceptance: a concurrent sale and description edit leave stock at 9; conflicting inventory counts require reconciliation.

**R02 — P1: fulfillment transitions still manufacture stock, and orders can be erased.**

Evidence: `supabase_schema.sql:1055` prevents only reopening cancelled orders; `:1061` restores inventory on cancellation from any other state. `src/pages/AdminPage.jsx:624` offers cancellation and backward transitions for delivered/shipped orders. Direct order DELETE is permitted to admins at `supabase_schema.sql:352`; single and bulk delete remain at `src/context/OrdersContext.jsx:212` and `:238`.

Example: mark an order delivered, then cancelled. Its goods return to available stock without a physical return. Delivered → pending → delete also restores stock. The earlier direct deletion bug was narrowed to pending/processing, but the transition path still defeats that protection. Hard deletion also removes operational history.

Action: define allowed transitions in the database, require explicit return receipt before restocking fulfilled goods, and archive orders instead of deleting them. Make order snapshots immutable through normal client writes. Backend/operations owner. Acceptance: invalid transitions fail through both UI and direct API; repeated cancellation restores once; archival never changes stock.

**R03 — P1: timeout followed by retry can create two orders.**

Evidence: `src/lib/placeOrder.js:5` races the RPC against six seconds; `src/components/cart/CartDrawer.jsx:117` re-enables checkout after failure. `supabase_schema.sql:786` accepts no idempotency key and generates a new order ID on every call at `:796`.

The fabricated local-success path is fixed. However, the first request can commit while its response is delayed, and a shopper's second click creates a second transaction. A mock-server reproduction with the real helper confirmed two writes after timeout and manual retry. This is not a live database concurrency test. The instruction to check history is also weakened because opening customer history does not refresh it (`src/components/orders/OrderHistoryModal.jsx:11`).

Action: persist an attempt key, bind it to the payload, enforce uniqueness per customer atomically, and reconcile unknown outcomes against that key. Frontend/backend owner. Acceptance: delayed responses, reloads, and simultaneous retries produce exactly one order and one deduction.

**R04 — P1: logout cleanup does not fully isolate customer data.**

Evidence: `src/context/OrdersContext.jsx:16` loads a shared persistent order cache; `:37` clears it only on a truthy-user → no-user transition. `:83` accepts asynchronous responses without checking whether the initiating session is still current. `:89` merges old disk/state records indefinitely. Logout does not clear `selectedInvoiceOrder`; `src/components/orders/InvoiceModal.jsx:17` renders that object without an auth check. `src/context/AuthContext.jsx:127` similarly allows a late profile lookup to restore user state after sign-out.


Consequences: a request started before logout can repopulate names, emails, and order details afterward; an open invoice can survive session expiry; a reload with an already-expired session can retain the shared order cache because the user starts as null. Cloud-deleted orders also survive the merge. These are browser retention/session-lifecycle problems, not evidence of a database RLS bypass.

Action: tie requests and state to an immutable user ID/session generation, discard stale responses, close all sensitive overlays on session changes, remove the legacy cache, and treat server results as authoritative. Frontend owner. Acceptance: admin/customer/logout/account-switch tests with delayed responses show no previous account's data.

**R05 — P1: checkout can accept a different price from the one shown to the shopper.**

Evidence: `src/context/CartContext.jsx:247` totals stored cart prices; `src/components/orders/OrderHistoryModal.jsx:29` reorders historical prices. `src/components/cart/CartDrawer.jsx:304` displays that total on the checkout button. The server instead reads current catalog prices at `supabase_schema.sql:870`; `src/context/OrdersContext.jsx:154` sends neither an expected total nor a quote/version to validate.

Example: a saved basket shows 100, the catalog changes to 120, and checkout records 120 without a price-change confirmation. The server-side invoice snapshot is now correct, but the customer has not approved the revised order value. No card charge is implemented in this repository, so this finding concerns order acceptance rather than a demonstrated overcharge.

Action: provide a current server quote and require re-confirmation when price, discount, or availability changes. Validate the accepted quote atomically at placement. Frontend/backend owner. Acceptance: a price change between cart creation and submission cannot silently change the accepted total.

**R06 — P1: important fixes exist in files without deployment or regression evidence.**

Evidence: `sql/README.md:3` explicitly says deployment and live verification of the direct-inventory restriction are pending. `supabase_schema.sql:1038` drops the old RPC; `sql/disable_direct_inventory_rpc.sql` provides a separate denial stub. The application test suite consists of six tests in `tests/placeOrder.test.js`, using mocked RPC responses. No application CI workflow, database transaction/RLS suite, or browser journey suite was found.

Do not label the old public inventory exploit an active defect in current source. Verify deployed definitions/grants before closing it operationally. Also note that `sql/verify_direct_inventory_rpc.sql` expects the stub to exist, whereas the bootstrap schema drops it: the verifier is specific to the standalone hotfix route, not a universal fresh-install check.

Action: establish a versioned migration baseline, inspect deployed privileges, and gate releases on builds plus focused database and browser tests. Engineering/platform owner. Acceptance: anonymous/customer inventory calls are denied; customer A cannot access B's orders; duplicate lines and concurrent last-item orders preserve stock; R01–R05 regression scenarios pass against an isolated backend.

**R07 — P1 for a delivery-commerce launch: payment and fulfillment requirements are incomplete.**

Evidence: the order table at `supabase_schema.sql:79` has no delivery address, payment method/status, or payment reference. `src/components/cart/CartDrawer.jsx:72` submits directly without collecting fulfillment details. `src/components/orders/OrderHistoryModal.jsx:212` labels totals “Total Paid,” while new orders are merely pending. The storefront advertises doorstep shipping in `src/pages/HomePage.jsx:53`.

An online payment gateway is not mandatory if cash on delivery, collection, or another manual process is intentional. That process still needs an explicit customer choice, the required contact/delivery information, and recorded payment state.

Action: product/operations owner defines the launch model; engineering implements only that model and removes unsupported payment claims. Acceptance: operations can fulfill and reconcile a test order end to end using captured information. This is a scope gap conditional on the intended business model, not a claim that an external manual process does not exist.

**R08 — P2: cart merging and persistence still disagree.**

Evidence: `src/context/CartContext.jsx:62` takes the larger cloud/local quantity but only persists items absent from the cloud at `:67`. For cloud quantity 1 and guest quantity 3, isolated execution confirmed that the UI shows 3 and sends no update. Writes at `:120`, `:139`, and `:205` have no sequencing, so older upserts can arrive after quantity changes or cart clearing. Cleanup at `:88` also does not cover a direct user-A → user-B change.

Action: define merge semantics, persist the entire resulting change set once, scope cart ownership, and serialize/coalesce writes with recoverable failure state. Frontend owner. Acceptance: merged quantities survive a fresh session; late writes cannot resurrect cleared items; account switches do not transfer carts. Returned API errors are now logged, which closes part of the earlier finding.

**R09 — P2: “Store Revenue” is still an order-value estimate.**

Evidence: `src/components/admin/MetricsRibbon.jsx:13` now excludes cancelled and flagged fallback orders, but sums every other status, including pending, at `:15`. Input comes from the browser order cache, whose merge retains stale/deleted records.

Action: separate placed order value, fulfilled value, and collected payments; compute authoritative aggregates server-side once the payment/fulfillment model is defined. Product/backend owner. Acceptance: pending, paid, cancelled, refunded, and archived fixtures produce independently reconciled totals. Until then, label the existing metric as order value rather than revenue.

**R10 — P2: frontend authorization and session initialization disagree with the backend.**

Evidence: `src/context/AuthContext.jsx:38` grants frontend admin status by hardcoded email or app metadata as well as profile role; `supabase_schema.sql:182` uses only the profile role. `src/components/auth/ProtectedRoute.jsx:10` redirects before session restoration is complete. The local login branch at `src/context/AuthContext.jsx:207` checks no password and can be reached for a non-email identifier, although normal email-form validation limits that route.

Action: use profile role consistently, introduce a completed-auth-initialization state, and isolate/remove demo authentication from production. Frontend owner. Acceptance: refreshing `/admin` with a valid session works; demotion removes the UI privilege; production cannot authenticate through local records. These UI issues do not independently grant backend privileges under the inspected RLS rules.

**R11 — P2: environment setup and schema replay are unsafe deployment defaults.**

Evidence: `src/lib/supabase.js:4` defaults missing environment variables to a concrete backend. `supabase_schema.sql:506` re-promotes a hardcoded email every time setup runs. Most application table privileges depend on project defaults rather than explicit grants; the repository has no migration history/runner.

Action: require explicit environment configuration, separate staging, make privileged bootstrap a deliberate one-time operation, and define least-privilege grants in migrations. Platform owner. Acceptance: missing variables fail clearly; a fresh isolated database supports intended access; subsequent migrations do not re-promote a demoted admin. Supabase distinguishes table grants from RLS policies, so both need verification on each environment. [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security).

**R12 — P2: data loading and operational visibility need a production baseline.**

Evidence: `src/context/StoreContext.jsx:53` and `src/context/OrdersContext.jsx:75` load broad result sets without pagination; order caches accumulate old records. `src/lib/errorLog.js:24` sends logs only for authenticated sessions, using the same backend that may be failing. No alerting, recovery drill, deployment rollback procedure, or operational ownership document was found.

Action: paginate catalogs/history, move aggregate calculations to the server, and record monitoring/incident/backup owners. Test a restore into an isolated environment and record measured recovery time and data loss window. Platform/backend owner. Acceptance: representative-volume queries are complete and usable; a simulated checkout outage raises an actionable alert; a restore drill succeeds. Hosted dashboard settings were not inspected, so absence of these controls in production is not established.

**R13 — P2: dialogs lack keyboard focus management.**

Evidence: `src/components/cart/CartDrawer.jsx:144`, `src/components/orders/InvoiceModal.jsx:39`, and `src/components/orders/OrderHistoryModal.jsx:56` declare modal semantics, but no focus trap, initial-focus placement, background inertness, or return-focus implementation was found. Escape handling exists.

Action: use a shared accessible dialog primitive. Frontend owner. Acceptance: keyboard focus stays inside the active dialog, returns to its trigger, and nested invoice/history flows work with a screen reader. This is source review; no browser accessibility audit was performed.

**R14 — P2: the schema's advertised upload limits are not applied on a fresh install.**

Evidence: `supabase_schema.sql:161` creates the product-images bucket first without size/type restrictions. The later insert at `:395` specifies 10 MB and allowed image types, but its conflict action at `:403` updates only `public`. The bucket already exists at that point, so those limit values are not applied by this script. Existing bucket settings are likewise left unchanged.

Action: explicitly set and verify bucket limits on both creation and upgrade. Backend owner. Acceptance: oversized and unsupported uploads are rejected by Storage itself. Uploads are admin-restricted in the current policies; this is not a finding of unrestricted public upload access.

**What has improved since the earlier audit**

| Earlier finding | Current source status |
| --- | --- |
| A01: public stock RPC | Removed by bootstrap; denial hotfix and verifier supplied. Live deployment remains unverified. |
| A02: fabricated checkout confirmation | Fixed; only a returned server order confirms success. Retry idempotency remains R03. |
| A03: duplicate-line overselling | Aggregation, sorted product locking, and a nonnegative stock constraint are now present (`supabase_schema.sql:103`, `:829`, `:904`). Database tests remain necessary. |
| A04: delivered-order deletion restocks | Direct-delete trigger now limits restoration to pending/processing. Transition loopholes and hard deletion remain R02. |
| A05: shared order retention | Ordinary logout cleanup added; incomplete lifecycle handling remains R04. |
| A06: guest basket replaced on login | Merge added; persistence/account-boundary defects remain R08. |
| A07: cancelled/fallback revenue | Those records are now filtered. Revenue semantics remain R09. |
| A08: client-controlled invoice lines | New orders now snapshot catalog names/prices on the server (`supabase_schema.sql:864`). Historical rows are not repaired by this change. Customer quote mismatch remains R05. |
| A09: no application tests | Six checkout-helper tests added; meaningful integration coverage and CI remain R06. |
| A10–A12, A14 | Role/init, configuration, pagination, and dialog concerns remain in R10–R13. |
| A13: cart error handling | Returned write errors now logged; sequencing and recovery remain R08. |

Preserve the useful foundations: RLS on application tables, customer ownership policies, restricted profile update columns, the security-invoker customer view, admin-only catalog/storage mutations, auth-derived checkout identity, server-calculated totals, atomic checkout, and the unique customer/coupon redemption key. The database is the right authority; client caches should not become competing records of truth. Function privilege assumptions were checked against [Supabase's function documentation](https://supabase.com/docs/guides/database/functions).

**Delivery order and ownership**

| Stage | Work | Exit evidence |
| --- | --- | --- |
| Immediate deployment check | Platform/backend owner verifies actual function grants and deployed schema; contain the old inventory RPC immediately if it is still exposed. | Recorded read-only checks demonstrate the deployed restriction, not just a changed SQL file. |
| Transaction and privacy release gate | Backend/frontend owners resolve R01–R05 and add their database/browser regressions under R06. | Concurrent sales/admin edits preserve stock; retries produce one order; fulfilled goods restock only through returns; session changes isolate data; accepted totals match confirmed quotes. |
| Controlled pilot gate | Product/operations owner decides R07, and engineering implements truthful payment/order reporting. Platform owner records staging separation, migration procedure, rollback steps, and successful restore evidence. | A test customer order can be placed, fulfilled, reconciled, and recovered by the responsible operators. |
| Next delivery cycle | Address cart persistence, auth consistency, pagination, dialogs, and upload limits. | R08–R14 acceptance checks pass with representative data and keyboard testing. |

Do not spend the next cycle on a framework rewrite or additional presentation features ahead of these gates. For this project, concentrated frontend and Postgres ownership is more valuable than adding services. Calendar estimates should follow confirmation of the deployed schema and the intended fulfillment model.

**Verification and limits**

| Check | Result |
| --- | --- |
| `npm.cmd test` | Passed: 6 tests, 0 failures. Covers the checkout helper with mocked RPC responses. |
| `npm.cmd run build` | Passed with Vite 8.3.0; 4,644 modules transformed. Main JS 271.10 kB / 79.70 kB gzip; auth chunk 269.53 kB / 74.08 kB gzip; CSS 146.96 kB / 26.42 kB gzip. These are build sizes, not user performance measurements. |
| `npm.cmd audit --json --fetch-retries=0 --fetch-timeout=15000` | Completed successfully after network approval: 0 known reported vulnerabilities. This does not establish application security or absence of unknown dependency defects. |
| Targeted in-memory reproductions | Confirmed duplicate writes after timeout/manual retry with the real helper; cached stock submission from the actual product-update function; missing persistence from the actual cart-merge updater. Mocked dependencies, no customer/backend requests. |
| Source and configuration review | Reviewed auth/cart/orders/store contexts, checkout, admin controls/metrics, order dialogs, SQL policies/functions/triggers, deployment configuration, and existing remediation files. |
| Not verified | Live schema/grants, hosted Auth settings, production headers, backups, deployed logs, browser journeys, SQL execution, and load/performance behavior. No connected Supabase administration tool or local PostgreSQL/Supabase/Docker executable was available. |
| Workspace changes | Added this report; production build regenerated ignored `dist/` artifacts. Application source and SQL unchanged. |
