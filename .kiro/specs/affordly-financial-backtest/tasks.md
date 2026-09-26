# Affordly Financial Backtest — Implementation Tasks

**Spec:** affordly-financial-backtest  
**Phase:** 5 — Implementation Task Breakdown  
**Status:** Approved — Phase 5  
**Approved requirements:** `requirements.md` (Approved — Phase 3)  
**Approved design:** `design.md` (Approved — Phase 4)

---

## Overview

10 required tasks + 1 conditional FIAT task, organized into five checkpoints:

| Checkpoint | Tasks | Milestone |
|---|---|---|
| **A — Foundation** | Task 1 | Repository migrated, quality tooling ready |
| **B — Financial engine** | Task 2 | Pure analysis logic works and is tested |
| **C — Demo product** | Tasks 3–5 | Complete usable Demo Mode application |
| **D — Plaid Sandbox** | Tasks 6–8 | External API path works through the same engine |
| **E — Submission ready** | Tasks 9–10 | Polish, documentation, and deployment complete |

> **Task 11 (CONDITIONAL):** Apply Nymbus FIAT components and tokens — only if private Nexus
> registry access becomes available before submission. Does not block any other task.

---

## Task 1 — Development Foundation and Package Manager Migration

**Checkpoint:** A  
**Status:** ✅ Complete  
**Dependencies:** None  
**Design ref:** §3 (Technology Stack — pnpm migration)

Prepare the existing repository for feature implementation without building product
functionality. Validate that all quality checks pass before a single product file is created.

### Subtasks

- [ ] **1.1 Migrate npm → pnpm**
  - Keep `package-lock.json` temporarily.
  - Run `pnpm import` to generate `pnpm-lock.yaml` from the existing lockfile.
  - Run `pnpm install` and verify no errors.
  - Remove `package-lock.json` — only `pnpm-lock.yaml` may remain.
  - Add `"packageManager": "pnpm@<installed-version>"` to `package.json`.

- [ ] **1.2 Install approved feature dependencies**
  - `plaid` (Plaid Node SDK — server-side only)
  - `react-plaid-link`
  - `vitest`
  - `@testing-library/react`
  - `@testing-library/user-event`
  - `jsdom` (or `happy-dom` — choose one test DOM implementation)
  > Do not install `@nymbus/fiat` or `@nymbus/fiat-tokens` — registry access is pending.
  > Do not install Recharts.

- [ ] **1.3 Configure Vitest**
  - Create `vitest.config.ts` (or inline in `vite.config.ts` if appropriate).
  - Configure `node` environment for `src/lib/**` (analysis, adapters, utils).
  - Configure `jsdom` environment for `src/components/**`.
  - Add `test` and `test:coverage` scripts to `package.json`.

- [ ] **1.4 Verify baseline quality checks**
  - `pnpm install` — clean, no lockfile conflicts.
  - `pnpm build` — production build passes (existing placeholder page).
  - `pnpm lint` — no ESLint errors.
  - `pnpm type-check` (add script alias for `tsc --noEmit` if not present).
  - Foundation-only test verification: `pnpm test -- --passWithNoTests` — confirms Vitest
    is configured and runnable with zero test files. Do not configure `passWithNoTests: true`
    permanently; use the flag only for this one-time foundation check. Once Task 2 creates
    real tests, `pnpm test` (without the flag) must pass actual tests and will fail if the
    test suite is unexpectedly empty.

### Acceptance Criteria

- [ ] `pnpm-lock.yaml` exists; `package-lock.json` does not.
- [ ] `package.json` declares `"packageManager"`.
- [ ] All four quality checks (`install`, `build`, `lint`, `type-check`) pass.
- [ ] `pnpm test -- --passWithNoTests` runs cleanly (foundation-only; flag not used again after Task 2).
- [ ] `.env.local` is not committed (confirm `.gitignore` coverage).

---

## Task 2 — Pure Financial Domain and Analysis Engine

**Checkpoint:** B  
**Status:** ✅ Complete  
**Dependencies:** Task 1  
**Requirements ref:** §4–5 (Calculation, Status), §8 (Month Detail), §§6 definitions  
**Design ref:** §5 (Domain Model), §6 (Analysis Pipeline)

Build and test the source-independent financial core. This code must contain zero imports from
React, Next.js, or Plaid. It is the product's most critical code path.

### Subtasks

- [ ] **2.1 Define normalized domain types** (`src/lib/analysis/types.ts`)
  - `NormalizedTransaction`, `FinancialHistory` (with `firstSupportedMonth: MonthKey | null`)
  - `MonthlyAggregation`, `MonthStatus`, `SimulatedMonth`, `BacktestResult`
  - Typed eligibility/ineligible result type
  - **Do not** include `AffordlyErrorCode`, `ApiErrorResponse`, or `PlaidConnectResponse`
    in this module — those are API boundary types introduced in Task 6.

- [ ] **2.2 Implement date and currency utilities** (`src/lib/utils/date.ts`, `currency.ts`)
  - `monthKeyAt(today, offsetMonths)` — UTC-safe month key generation
  - `formatMonthLabel(monthKey)` — "March 2026" format
  - `formatCurrency(amount)` — US dollar formatting with sign
  - `parseCurrencyInput(raw)` — validate and parse user input (handles empty, zero, negative,
    non-numeric, non-finite, sub-cent precision)

- [ ] **2.3 Implement complete month selection** (`src/lib/analysis/months.ts`)
  - Uses `history.firstSupportedMonth` directly — does NOT infer coverage from transaction
    presence. Adapters set this; the engine consumes it.
  - Contiguous window from `firstSupportedMonth` through M-1.
  - Zero-transaction months within the window are valid (cashFlow = $0).
  - No sparse sequences — the result is always contiguous.
  - Returns `MonthKey[]` or `{ ineligible: true }` when < 3 supported months or when
    `firstSupportedMonth` is null.

- [ ] **2.4 Implement monthly cash-flow aggregation** (`src/lib/analysis/aggregation.ts`)
  - `cashIn`, `cashOut`, `cashFlow = cashIn - cashOut`.
  - `topTransactions`: top-3 by `|amount|` regardless of direction (bidirectional).
  - Handles zero-transaction months without failure.

- [ ] **2.5 Implement simulation and status classification** (`src/lib/analysis/simulation.ts`)
  - `simulatedCashFlow = cashFlow - proposedPayment`
  - Status rules per Req 5.1: `< 0` → negative, `≥ 0 AND < cushion` → below-cushion,
    `≥ cushion` → above-cushion.
  - Boundary conditions: exact zero, exact-equal-to-cushion verified.

- [ ] **2.6 Implement backtest runner** (`src/lib/analysis/index.ts`)
  - Orchestrates: select months → aggregate → simulate → classify → summarize.
  - Returns `BacktestResult` or `{ ineligible: true }`.

- [ ] **2.7 Write unit tests** (`src/__tests__/analysis/`)
  - `months.test.ts`: current month excluded; conservative boundary exclusion (M-4 boundary →
    M-3/M-2/M-1 eligible; M-3 boundary → M-2/M-1 ineligible); zero-transaction
    interior month included; contiguous results; ineligible when < 3 months; normal 6-month case.
  - `aggregation.test.ts`: standard case; zero inflow; zero outflow; zero transactions;
    top-3 bidirectional (large inflow competes with large outflow); fewer than 3 transactions.
  - `simulation.test.ts`: all three status cases; exact-zero simulated with zero/positive cushion;
    simulated exactly equals cushion; zero cushion (no Below Cushion possible).
  - `backtest.test.ts`: end-to-end produces correct counts; ineligible result propagated.

### Acceptance Criteria

- [ ] `pnpm test` passes all analysis unit tests.
- [ ] Zero React/Next.js/Plaid imports in `src/lib/analysis/` or `src/lib/utils/`.
- [ ] Conservative boundary correctness — two cases verified by test:
  - **Eligible:** Earliest transaction in M-4 → M-4 is boundary/excluded;
    supported months are M-3, M-2, M-1 (exactly 3) → analysis eligible.
  - **Ineligible:** Earliest transaction in M-3 → M-3 is boundary/excluded;
    only M-2 and M-1 remain (2 months) → return `ineligible`.
- [ ] Status boundary conditions verified by test: `sim=0, cushion=0` → above-cushion;
  `sim=0, cushion>0` → below-cushion; `sim=cushion>0` → above-cushion.
- [ ] `pnpm type-check` passes with no errors in analysis modules.

---

## Task 3 — Deterministic Demo Mode Dataset and Adapter

**Checkpoint:** C (begins)  
**Status:** ✅ Complete  
**Design ref:** §8 (Demo Mode Design), §7.1 (Demo Adapter)

Build the authored sample dataset and adapter so the application has a complete, testable
financial history before Plaid is touched.

### Subtasks

- [ ] **3.1 Author the deterministic demo dataset** (`src/lib/demo/dataset.ts`)
  - 6 months of relative-offset transactions (M-1 through M-6, dates computed from today).
  - `DEMO_DEFAULT_PAYMENT = 475`, `DEMO_DEFAULT_CUSHION = 300`.
  - Expected outcomes with defaults: M-1 Below Cushion (+$145), M-2 Above Cushion (+$505),
    M-3 Negative (-$155), M-4 Above Cushion (+$775), M-5 Below Cushion (+$235),
    M-6 Above Cushion (+$405) — all three status states represented (Req 1.3).
  - M-1 includes annual car insurance outflow to explain the tight month in detail view.
  - M-4 includes a bonus inflow to explain the strong month in detail view.
  - Dataset contains only posted-equivalent transactions (Req 1.7).

- [ ] **3.2 Implement demo adapter** (`src/lib/adapters/demo.ts`)
  - `getDemoHistory()` → `FinancialHistory` with `source: 'demo'`.
  - Sets `firstSupportedMonth = monthKeyAt(today, 6)` (M-6) — explicitly guarantees all
    six months. The engine never needs to infer Demo's coverage from transaction presence.

- [ ] **3.3 Write a dataset integration test**
  - Confirm `runBacktest(getDemoHistory(), 475, 300)` produces exactly the expected status
    distribution: 1 Negative, 2 Below Cushion, 3 Above Cushion.
  - Confirm M-1 has the correct top-3 transactions for detail view.
  - Confirm `getDemoHistory()` always uses current-relative month keys (not hardcoded dates).

### Acceptance Criteria

- [ ] `runBacktest(getDemoHistory(), 475, 300)` returns `BacktestResult` with correct counts.
- [ ] All three status states present in the default experience (Req 1.3).
- [ ] Month dates are current-relative — opening the app at different dates produces different
  calendar labels but the same relative structure.
- [ ] Dataset test passes in `pnpm test`.

---

## Task 4 — Mobile-Primary Application Shell and Provisional UI Layer

**Checkpoint:** C (continues)  
**Status:** ✅ Complete  
**Design ref:** §2.3 (Interim Strategy), §2.4 (Provisional Policy), §10 (File Structure)

Establish the application structure and the thin presentation abstraction layer. Optimized for
mobile (375px) while serving an equally complete desktop experience. All visual values are
provisional and centralized for later FIAT replacement.

### Subtasks

- [ ] **4.1 Update `src/app/globals.css`**
  - Replace the existing `@theme` block with provisional semantic token definitions.
  - Mark all values `/* PROVISIONAL — replace with @nymbus/fiat-tokens values */`.
  - Include `--color-status-negative-*`, `--color-status-below-cushion-*`,
    `--color-status-above-cushion-*` — labeled provisional, awaiting FIAT guidance.
  - Do not hardcode Tailwind color class names in components; use CSS variables.

- [ ] **4.2 Implement `ThemeProviderWrapper.tsx`** (`src/components/ThemeProviderWrapper.tsx`)
  - `"use client"` — currently a transparent pass-through.
  - Comment noting future replacement with `ClientThemeProvider` from `@nymbus/fiat`.

- [ ] **4.3 Update `layout.tsx`**
  - Wrap `{children}` with `ThemeProviderWrapper`.
  - Update metadata: title `"Affordly"`, description reflecting product purpose.

- [ ] **4.4 Implement local UI primitives** (`src/components/ui/`)
  - `Button.tsx` — primary action button, semantic `<button>`, accessible label, focus ring.
  - `Badge.tsx` — general-purpose label badge; accepts `variant` for future FIAT mapping.
  - `StatusBadge.tsx` — wraps `Badge` for Negative/Below Cushion/Above Cushion;
    uses CSS variables for color; always renders a distinct text label.
  - `CurrencyInput.tsx` — `<input type="text" inputMode="decimal">`; explicit `<label>`;
    validates and formats; accepts `error`, `hint`, and `onChange` props.
  - `Card.tsx` — surface container with semantic structure.
  - `Spinner.tsx` — loading indicator with accessible `aria-label`.

### Acceptance Criteria

- [ ] Application loads in browser with no console errors.
- [ ] Responsive at 375px: no horizontal scrolling, no clipped content.
- [ ] All `ui/` components render with semantic HTML and visible focus states.
- [ ] `CurrencyInput` accepts `inputMode="decimal"` for correct mobile keyboard.
- [ ] `StatusBadge` renders text label as primary distinction (not just color).
- [ ] No FIAT token names fabricated — all provisional values clearly labeled.
- [ ] `pnpm build` and `pnpm type-check` pass.

---

## Task 5 — Core Affordly Interaction Experience (Demo Mode)

**Checkpoint:** C (completes)  
**Status:** ✅ Complete  
**Design ref:** §§11–13 (UI Components, UX Design, State)

Build the complete Demo Mode product experience. At the end of this task, Affordly is a
working, reviewable product — without any Plaid dependency.

### Subtasks

- [ ] **5.1 Implement `AffordlyApp.tsx`** (`"use client"`)
  - All state: `dataMode`, `plaidStatus`, `plaidError`, `accountOptions`, `financialHistory`,
    `proposedPayment`, `cushionTarget`, `expandedMonthKey`.
  - `useMemo`-derived `backtestResult` — recalculates on any input change.
  - Initialize with `getDemoHistory()`, `DEMO_DEFAULT_PAYMENT`, `DEMO_DEFAULT_CUSHION`.
  - Delegates all rendering to specialized components.

- [ ] **5.2 Implement `InputPanel.tsx`**
  - Contains both `CurrencyInput` instances (payment and cushion).
  - 200ms debounce before committing a valid value to parent state.
  - Uses `useRef<ReturnType<typeof setTimeout>>` — no third-party debounce library.
  - Commits immediately on blur.
  - Calls `setProposedPayment(null)` / `setCushionTarget(null)` while input is invalid or empty.

- [ ] **5.3 Implement `DataModeBar.tsx`**
  - Demo indicator showing current mode (not labeled as "fallback" — Req 1.6).
  - "Connect Plaid Sandbox" button (placeholder; wired in Task 7).
  - "Use Demo Data" link visible only in Plaid Mode, Plaid error states, and
    account-selection state — not while already in Demo Mode where it would do nothing.

- [ ] **5.4 Implement `BacktestSummary.tsx`**
  - Renders count-based summary with retrospective language (conditional-past tense).
  - When `backtestResult` is null: renders input prompt, not an error state.
  - References current `proposedPayment` and `cushionTarget` values in copy.

- [ ] **5.5 Implement `MonthCardList.tsx`**
  - Date range label showing actual analyzed period (Req 6.5, 10.7).
  - Maps `backtestResult.months` (M-1 first, M-6 last — Req 6.4) to `MonthCard`.
  - Renders nothing (or prompt) when `backtestResult` is null.

- [ ] **5.6 Implement `MonthCard.tsx`**
  - Always visible: month name + year, original cash flow, simulated cash flow,
    `StatusBadge`.
  - Expandable detail section (controlled state; one card expanded at a time):
    - Total cash in, total cash out.
    - Original and simulated cash flow.
    - Up to 3 largest transactions by `|amount|` (bidirectional) with description and amount.
    - Indicator: "N largest transactions this month" (Req 8.4).
  - Factual only — no inferred explanations, no AI commentary (Req 8.6).
  - Accessible expand/collapse (keyboard operable, correct ARIA).

- [ ] **5.7 Implement `Disclosure.tsx`**
  - Retrospective disclaimer visible in main analysis view without navigation (Req 12.1).
  - Not styled as warning or error — informational treatment (Req 12.6).

- [ ] **5.8 Wire full Demo Mode in `page.tsx`**
  - `page.tsx` is a Server Component that imports and renders `AffordlyApp`.
  - Verify complete Demo Mode workflow renders correctly.

- [ ] **5.9 Write component interaction tests** (`src/__tests__/components/AffordlyApp.test.tsx`)
  - Renders Demo results on initial load without user action (Req 1.1).
  - Valid payment change (after debounce) → results update.
  - Cushion change → statuses recalculate.
  - Zero payment → validation error shown; results not updated.
  - Negative payment → validation error shown.
  - Empty payment → results hidden; prompt shown.
  - Month card expand → detail visible.
  - Month card collapse → detail hidden.

### Acceptance Criteria

- [ ] Complete Demo Mode workflow functions end-to-end in browser.
- [ ] Mobile (375px): all content accessible, no horizontal scrolling (Req 14.8).
- [ ] Desktop (≥768px): same functionality, more spacious single-column layout (Req 14.9).
- [ ] Payment input debounces: results do not update on every keystroke; update fires ~200ms
  after typing stops (Req 12.6 / design §12.6).
- [ ] Validation: zero, negative, non-numeric inputs show errors without updating results.
- [ ] Month detail shows only factual cash-in, cash-out, and transaction descriptions/amounts.
- [ ] No affordability verdict language in any visible copy (Reqs 12.3–12.5).
- [ ] Retrospective language uses conditional-past tense throughout (Req 12.2).
- [ ] Disclosure visible in main view without navigation (Req 12.1).
- [ ] All component interaction tests pass.
- [ ] `pnpm build`, `pnpm lint`, `pnpm type-check` all pass.

---

## Task 6 — Plaid Sandbox Server Integration

**Checkpoint:** D (begins)  
**Status:** ✅ Complete  
**Requirements ref:** §9 (Plaid Integration), §10 (Account Selection), §11 (Loading/Errors)  
**Design ref:** §9 (Plaid Sandbox Architecture), §7.2 (Plaid Adapter)

Task 6 depends on Task 2 for the normalized domain types (`NormalizedTransaction`,
`FinancialHistory`, `AffordlyErrorCode`, etc.) that the Plaid adapter and API routes produce.
It is independent of Tasks 3–5 (Demo/UI) and may be implemented in parallel with that work.

> **Important:** Verify actual Plaid Node SDK types and method signatures against the
> pseudocode in `design.md`. If field names, method signatures, or transaction structures
> differ materially from the design, **stop and document the discrepancy** before proceeding.
> Do not silently change architecture.

### Subtasks

- [ ] **6.1 Verify environment credentials**
  - Confirm `.env.local` contains `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV=sandbox`.
  - Confirm `.env.local` is gitignored and not staged.

- [ ] **6.2 Implement `POST /api/plaid/link-token`**
    (`src/app/api/plaid/link-token/route.ts`)
  - Read credentials from `process.env` (never from client request).
  - Validate `sessionId` from request body (non-empty string, ≤ 64 chars).
  - Call Plaid `linkTokenCreate` with:
    - `user.client_user_id: validatedSessionId`
    - `products: ['transactions']`
    - `transactions.days_requested: 210`
    - `country_codes: ['US']`
  - Return `{ linkToken: string }` on success.
  - Return `ApiErrorResponse` with `code: 'connection_failed'` on error (no raw Plaid details).

- [ ] **6.3 Implement `POST /api/plaid/connect`**
- [ ] **6.3 Implement `POST /api/plaid/connect`**
    (`src/app/api/plaid/connect/route.ts`)
  - Exchange `publicToken` → `accessToken` via `itemPublicTokenExchange`.
  - Fetch accounts via `accountsGet`.
  - Filter checking accounts: `type === 'depository' && subtype === 'checking'`.
  - Return `{ code: 'no_checking_account' }` if zero checking accounts found.
  - Call `transactionsSync` without cursor (initial call), paginating until `has_more === false`.
  - Build reconciliation map on each page: apply `added` (set), `modified` (set), `removed`
    (delete) to `Map<transaction_id, transaction>`.
  - **Handle `TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION`:** If Plaid returns this error
    during pagination, transaction data changed mid-sequence. Discard the partial accumulation,
    reset the map, and restart the complete pagination loop from the original cursor (undefined
    for the initial no-cursor snapshot). This cleanly rebuilds the reconciliation state.
    Apply a bounded restart limit against pathological repeated mutations; after exhausting
    that limit, surface through the existing `connection_failed` path — do not expose the
    raw Plaid error code to the user.
  - Check `transactions_update_status`; apply bounded readiness retry if not
    `HISTORICAL_UPDATE_COMPLETE` (provisional constants: 3 attempts × 1500ms — validate
    against actual Sandbox behavior).
  - After bounded retry, apply the readiness/eligibility distinction (see §6.6 below):
    - If currently retrieved data supports ≥ 3 conservative complete months: proceed with
      available partial window (3–5 months).
    - If fewer than 3 supported months currently available: return `{ code: 'history_preparing' }`.
  - Extract `reconciledTransactions = Array.from(transactionMap.values())`.
  - For each eligible checking account: call `normalizePlaidTransactions(reconciledTransactions, accountId)`.
  - Return `PlaidConnectResponse` with normalized account data.
  - `accessToken` must not appear in the response; it goes out of scope when the handler returns.

- [ ] **6.4 Implement Plaid adapter** (`src/lib/adapters/plaid.ts`)
  - `normalizePlaidTransactions(reconciledTransactions, accountId)`:
    - Filter by `account_id`.
    - Filter `pending === false` (verify the correct SDK field name for posted status).
    - Map: `amount = -(plaidAmount)` (sign flip), `description = merchant_name ?? name`,
      `date`, `id = transaction_id`.
  - The adapter computes `firstSupportedMonth`: find the earliest transaction date,
    treat that calendar month as the boundary, return the following month as
    `firstSupportedMonth`. Set to `null` if no transactions are available.
  - API boundary types (`AffordlyErrorCode`, `ApiErrorResponse`, `PlaidConnectResponse`,
    `CheckingAccountOption`) are introduced here or in a co-located `src/lib/api/types.ts`.
    They must NOT be in `src/lib/analysis/types.ts`.

- [ ] **6.5 Write adapter and reconciliation tests**
    (`src/__tests__/adapters/plaid.test.ts`)
  - Sign convention: Plaid `amount: 75.50` → normalized `-75.50`.
  - Sign convention: Plaid `amount: -3000` → normalized `+3000`.
  - `pending: true` → excluded; `pending: false` → included.
  - `modified` transaction replaces prior representation.
  - `removed` transaction disappears from output.
  - Pending→posted via `modified` update → exactly one normalized transaction (no duplicate).
  - Account ID filter: only the selected account's transactions appear.
  - Pagination-mutation restart: when a mutation-during-pagination error occurs, the
    pagination restarts from the original cursor and the partial reconciliation state is
    discarded (testable via a pure reconciliation helper or mocked Plaid client).

### Acceptance Criteria

- [ ] `POST /api/plaid/link-token` returns a valid Plaid Sandbox link token.
- [ ] `POST /api/plaid/connect` successfully exchanges a public token and returns normalized data.
- [ ] No `accessToken` or raw Plaid error codes in any API response.
- [ ] `PLAID_SECRET` not accessible in any client-side module (Next.js server/client boundary).
- [ ] Reconciliation: modified replaces, removed disappears, no duplicates.
- [ ] Pending transactions excluded from normalized output.
- [ ] Pagination-mutation restart: when `TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION` occurs,
  pagination restarts from the original cursor with a fresh reconciliation map.
- [ ] Readiness/eligibility distinction applied correctly:
  - Update not complete + ≥ 3 supported months → proceed with partial window.
  - Update not complete + < 3 supported months → return `history_preparing`.
  - Update complete + < 3 supported months → return normalized data; analysis engine
    classifies as insufficient history (not a server error).
- [ ] All adapter tests pass.

---

## Task 7 — Plaid Sandbox Client Flow

**Checkpoint:** D (completes)  
**Status:** ✅ Complete  
**Requirements ref:** §§9–11 (Plaid, History, Loading/Error)  
**Design ref:** §9.5 (Account Selection Flow), §§11–13 (Components, UX, State)

Connect the server integration to the existing Demo Mode experience. Plaid Sandbox data must
enter the same normalized model and analysis engine as Demo Mode — no separate code paths.

### Subtasks

- [ ] **7.1 Implement session UUID management** (in `PlaidConnector.tsx` or `AffordlyApp.tsx`)
  - On Plaid initiation: check `sessionStorage.getItem('affordly-session-id')`.
  - If absent: generate `crypto.randomUUID()`, store in `sessionStorage`.
  - Reuse across reconnection attempts within the same session.
  - Send `{ sessionId }` to `/api/plaid/link-token`.

- [ ] **7.2 Implement `PlaidConnector.tsx`**
  - Fetches link token from `/api/plaid/link-token`.
  - Wraps `usePlaidLink` from `react-plaid-link`.
  - `onSuccess`: receives `public_token`, POSTs to `/api/plaid/connect`, parses response.
  - `onExit` (user cancel, no `error`): calls `onCancelled` — no error message shown (Req 11.2).
  - `onExit` (with `error`): calls `onError` with safe message.

- [ ] **7.3 Wire Plaid flow into `AffordlyApp`**
  - `plaidStatus` transitions: idle → linking → loading → selecting-account | ready | error.
  - On successful connect with one checking account: auto-select, run analysis.
  - On successful connect with multiple: set `accountOptions`, set status `selecting-account`.
  - On error/cancel: set error state or return to `idle`.

- [ ] **7.4 Implement `AccountSelector.tsx`** (inline, not a modal)
  - Radio-style list with large touch targets (≥ 44px height per item).
  - Shows account `name` and `mask` per account.
  - Includes "Use Demo Data instead" link.
  - Mobile-friendly: full-width options, clear typography.

- [ ] **7.5 Update `DataModeBar.tsx`**
  - Wire "Connect Plaid Sandbox" button to trigger `PlaidConnector`.
  - Show Plaid Sandbox data mode indicator once connected (Req 9.6).
  - Wire "Use Demo Data" link to reset to Demo Mode from any Plaid state.

- [ ] **7.6 Implement all Plaid loading and error UI**
  - Loading: spinner + blocked interaction during Plaid connection (Req 11.1).
  - Error states: non-technical messages for each `AffordlyErrorCode` (Req 11.3).
  - `history_preparing`: shown when update is not complete AND < 3 supported months currently
    available. Specific message with retry option and Demo Mode fallback.
  - `no_checking_account`: specific message with Demo Mode fallback.
  - **Insufficient history (distinct from `history_preparing`):** When the server returns
    normalized data but the analysis engine's `selectCompleteMonths()` returns `ineligible`
    (< 3 supported complete months, with update complete), this is a client-side state —
    not a `history_preparing` server error. Show a distinct explanation that the connected
    account does not have sufficient history for analysis, with Demo Mode fallback (Req 11.4).
  - User cancel: no visible error — silent return to idle/Demo (Req 11.2).

- [ ] **7.7 Write Plaid client state tests** (extend `AffordlyApp.test.tsx`)
  - Plaid API error → Demo Mode content visible and "Use Demo Data" available (Req 1.5).
  - User cancel → no error message; Demo Mode active (Req 11.2).

### Acceptance Criteria

- [ ] Plaid Sandbox Link modal opens and completes a full connection in the browser.
- [ ] Plaid Sandbox data flows through the same analysis engine as Demo Mode.
- [ ] Loading state shown during Plaid connection (no stale results during fetch — Req 11.1).
- [ ] User cancel: no error message; Demo Mode remains active (Req 11.2).
- [ ] API error: non-technical message + "Use Demo Data" option (Req 11.3).
- [ ] Multiple checking accounts: inline selector visible on mobile and desktop.
- [ ] Plaid Sandbox mode indicator visible when connected (Req 9.6).
- [ ] `sessionStorage` UUID is reused on reconnection (no fresh UUID per attempt).
- [ ] No Plaid `access_token` visible in browser DevTools network tab (only `publicToken`
  sent to server; normalized data returned — never the access token).
- [ ] Component tests pass.

---

## Task 8 — Cross-Mode Validation and Product-Boundary Review

**Checkpoint:** D (validation)  
**Status:** ✅ Complete  
**Requirements ref:** All §§1–14 (full requirements against implementation)  
**Design ref:** §8 (Cross-mode validation)

A focused verification and fix pass. This is not new feature development — it is a structured
review of the complete implementation against the approved requirements. Fix any defects
discovered as part of this task.

### Subtasks

- [ ] **8.1 Verify data mode consistency**
  - Construct a `FinancialHistory` from Plaid data using known Sandbox transactions.
  - Confirm identical input to `runBacktest()` produces identical output from Demo and Plaid paths.

- [ ] **8.2 Verify sign normalization end-to-end**
  - Trace a known Plaid Sandbox debit (positive Plaid amount) through the adapter and confirm
    it appears as negative cash out in the month aggregation.

- [ ] **8.3 Verify posted-only filter**
  - Check that any `pending: true` transactions in the Sandbox response are excluded from
    the analysis. Verify with the Plaid Node SDK's actual field structure.

- [ ] **8.4 Verify conservative boundary month exclusion**
  - Use a Sandbox account or mock data where the earliest transaction is within the candidate
    analysis window. Confirm the boundary month is excluded and the month after it is the first
    supported month.

- [ ] **8.5 Verify partial-window scenarios**
  - 3 available months → analysis runs; date range accurately labeled.
  - Fewer than 3 months → backtest blocked; correct message shown (Req 10.3).

- [ ] **8.6 Verify payment and cushion edge cases in the UI**
  - Zero payment → rejected with message; results not updated (Req 2.5).
  - Negative payment → rejected (Req 2.6).
  - Zero cushion → valid; only Negative and Above Cushion states possible (Req 3.7).
  - `simulated = 0, cushion = 0` → Above Cushion.
  - `simulated = cushion` (positive) → Above Cushion.

- [ ] **8.7 Verify product-boundary language (semantic review)**
  - Review all rendered product copy for statements that:
    - claim the user **can** afford the proposed payment,
    - claim the user **cannot** afford the proposed payment,
    - call the payment or result **safe** or **unsafe**,
    - call a result **good** or **bad**,
    - recommend **accepting or rejecting** a financing offer,
    - use **future-certain language** when describing simulated results (e.g., "your balance
      will be" instead of "would have been"),
    - imply that historical results **guarantee** future outcomes.
  - Allowed boundary language includes:
    - "does not predict future performance" (required disclaimer — Req 12.1),
    - "historical analysis", "based on historical data",
    - the product name "Affordly".
  - Verify the summary and month cards use conditional-past tense throughout (Req 12.2).
  - Fix any violations found during this review.

- [ ] **8.8 Fix defects found during this pass**
  - Treat as part of this task; do not open new scope.

### Acceptance Criteria

- [ ] Demo Mode and Plaid Mode produce identical `BacktestResult` for identical input data.
- [ ] No raw Plaid error codes, `access_token`, or `PLAID_SECRET` visible in any client state,
  network response, or browser console.
- [ ] All payment/cushion boundary conditions produce correct behavior in the browser.
- [ ] No affordability verdict, recommendation, or predictive claim appears in rendered product
  copy. Required disclaimer language ("does not predict future performance") is present and
  informational, not an error state.
- [ ] No horizontal scrolling on critical content at 375px viewport.
- [ ] `pnpm test` passes after all fixes.

---

## Task 9 — UX Polish and Accessibility Pass

**Checkpoint:** E (begins)  
**Status:** ✅ Complete  
**Dependencies:** Tasks 5, 7  
**Requirements ref:** §14 (Visual Design, Responsiveness, Accessibility)  
**Design ref:** §12 (UX and Visual Design), §2.4 (Provisional Policy)

A contained visual and accessibility improvement pass. Focus on correct interaction and
readability — not on custom aesthetics that will later conflict with FIAT. Provisional
visual tokens remain in place; do not elaborate them.

### Subtasks

- [x] **9.1 Mobile layout review (375px)**
  - All content reachable without horizontal scrolling.
  - Touch targets: all interactive elements ≥ 44px height/width (inputs, buttons, card headers).
  - Month card expand area covers the full card header width, not just a small icon.

- [x] **9.2 Keyboard navigation**
  - Tab through all interactive elements in logical order.
  - Expand/collapse month cards with Enter/Space.
  - Activate buttons with Enter/Space.
  - Plaid connect and account selector keyboard operable.

- [x] **9.3 Focus states**
  - All interactive elements have a visible focus ring (Req 14.6).
  - Focus ring is distinguishable from the default border/outline.

- [x] **9.4 Accessible labels and roles**
  - All `CurrencyInput` instances have explicit `<label>` elements (Req 14.5).
  - `StatusBadge` has accessible text content (not just icon).
  - `Spinner` has `aria-label` or `aria-live` announcement.
  - `AccountSelector` uses correct radio semantics or equivalent.

- [x] **9.5 Monetary display consistency**
  - All amounts formatted identically using `formatCurrency`.
  - Dollar signs present on all monetary values (Req 2.9).

- [x] **9.6 State distinction**
  - Empty/loading/error/success states are visually distinct (Req 14.10).
  - Status labels (Negative, Below Cushion, Above Cushion) remain text-primary distinction
    even if color is not rendered.

- [x] **9.7 Desktop adaptation**
  - Payment and cushion inputs flow side-by-side at ≥ 768px where appropriate.
  - Max-width container centered with adequate horizontal padding.
  - Month cards remain vertical (sequential — no grid).

### Acceptance Criteria

- [x] Keyboard-only user can complete a full analysis, expand a month card, and return to Demo Mode.
- [x] All inputs have visible, programmatically associated labels (verified with browser
  accessibility inspector).
- [x] No horizontal scrolling at 375px for any core content.
- [x] Status states distinguishable by text label alone (color is additive, not primary).
- [x] `pnpm lint` — no ESLint errors (including accessibility rules if configured).
- [x] `pnpm build` — no TypeScript errors.

---

## Task 10 — Documentation, Deployment, and Assessment Readiness

**Checkpoint:** E (completes)  
**Dependencies:** Tasks 8, 9  
**Design ref:** §10 (File Structure), §16 (Security), product-direction.md Assumptions

The final required increment. This produces the README, confirms deployment, and validates the
repository is clean for submission.

### Subtasks

- [x] **10.1 Write `README.md`** (replace the current Next.js default)
  - What Affordly is and why the problem matters.
  - Primary user and the vehicle-financing scenario.
  - How the historical backtest works (monthly cash flow, simulation, status classification).
  - Demo Mode: how to experience it immediately.
  - Plaid Sandbox integration: how to connect, what it demonstrates.
  - Important product limitations (from `docs/product/product-direction.md` §14).
  - Local development setup: prerequisites, `pnpm install`, environment variables.
  - How to run: `pnpm dev`, `pnpm test`, `pnpm build`.
  - Live demo URL (once deployed in 10.4).
  - Key product decisions: retrospective framing, mobile-primary design, client-side analysis.
  - Key technical decisions: pnpm, transactions/sync, client-side engine, conservative boundary.
  - Nymbus FIAT status: package name confirmed, access pending, interim strategy explained.
  - What would be done with more time (FIAT integration, more test coverage, production Plaid,
    session persistence, deeper analysis window, anomaly surfacing).

- [x] **10.2 Run full quality and security checks**
  - `pnpm lint` — no errors.
  - `pnpm type-check` — no TypeScript errors.
  - `pnpm test` — all tests pass.
  - `pnpm build` — production build succeeds.
  - Confirm `.env.local` is not tracked by git.
  - Confirm no Plaid credentials or Nexus tokens in any committed file.
  - Confirm `pnpm-lock.yaml` is committed; `package-lock.json` absent.
  - Confirm `.env.example` has correct placeholder keys only.

- [x] **10.3 Review complete implementation diff and commit**
  - Review the full `git diff` relative to the last committed state.
  - Confirm only intended application files are staged.
  - Stop for human review before committing (checkpoint human-gate behavior applies).
  - Commit stable application and documentation to `main`.

- [ ] **10.4 Deploy to Vercel**
  - Confirm `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV=sandbox` are set in Vercel
    environment variables (project settings, not committed to repo).
  - Push to `main` (or allow the previous commit to trigger Vercel auto-deployment).
  - Verify Vercel deployment succeeds.

- [ ] **10.5 Smoke-test the deployed app**
  - Mobile: open on phone or in DevTools 375px emulation.
    - Demo Mode loads immediately with backtest results visible.
    - Payment input updates results.
    - Month detail expands.
    - Plaid Sandbox connects and produces analysis.
  - Desktop: verify same functionality, wider layout.
  - Confirm no console errors in production build.

- [ ] **10.6 Finalize README and make submission commit**
  - Add deployed live URL to README (now that it is known).
  - Final commit for submission.
  - Push to `main`.
  - Confirm working tree is clean and `main` is synchronized with `origin/main`.

### Acceptance Criteria

- [ ] README covers all assessment-required content listed above.
- [ ] Live URL serves a functional Demo Mode immediately on load.
- [ ] Plaid Sandbox path works on the deployed URL.
- [ ] All quality checks pass (`type-check`, `lint`, `test`, `build`).
- [ ] Repository contains no secrets, no npm lockfile, no FIAT placeholder APIs.
- [ ] `git status` is clean and `main` is synchronized with `origin/main` after final push.
- [ ] `git log --oneline` shows clean, meaningful commit history reflecting the spec-driven workflow.

---

## Task 11 (CONDITIONAL) — Apply Nymbus FIAT Components and Tokens

**Status:** ⚠ CONDITIONAL — do not begin until Nymbus VPN/Nexus registry access is confirmed.  
**Dependencies:** Tasks 5, 7, 9 (complete feature implementation)  
**Design ref:** §2.1 (Confirmed from official documentation), §2.3 (Interim Strategy)

This task is not required for submission. If FIAT access becomes available before the
submission deadline, treat this as a separate contained enhancement after Tasks 1–10 are
stable. Do not start this task until private registry access is confirmed working.

### Subtasks

- [ ] **11.1** Install `@nymbus/fiat` and `@nymbus/fiat-tokens` via the private Nexus registry.
  Confirm installation succeeds before proceeding.

- [ ] **11.2** Add `@import "@nymbus/fiat-tokens/tokens.css"` to `globals.css`.
  Remove the provisional `@theme` token block that it replaces.

- [ ] **11.3** Add FIAT `dist/` directory to Tailwind content scanning
  (`./node_modules/@nymbus/fiat/dist/**/*.js`).

- [ ] **11.4** Replace `ThemeProviderWrapper.tsx` pass-through with `ClientThemeProvider`
  from `@nymbus/fiat`.

- [ ] **11.5** Replace `ui/Button.tsx` with the verified `Button` from `@nymbus/fiat`.
  Inspect actual API before replacing; do not guess at props.

- [ ] **11.6** Replace `ui/Badge.tsx` and `StatusBadge.tsx` with the verified `Badge`
  from `@nymbus/fiat`. Verify badge semantics do not imply pass/fail judgments for status
  states; if they do, retain the local wrapper.

- [ ] **11.7** Review full FIAT component catalog for any additional applicable patterns
  (loading, informational banners, form controls, account selection).

- [ ] **11.8** Run visual review on mobile (375px) and desktop after FIAT integration.

- [ ] **11.9** Run full validation suite: `pnpm test`, `pnpm lint`, `pnpm type-check`,
  `pnpm build`. Fix any failures.

### Acceptance Criteria

- [ ] `@nymbus/fiat` and `@nymbus/fiat-tokens` install cleanly.
- [ ] Application builds and all tests pass with FIAT packages.
- [ ] `ClientThemeProvider` wraps the application root.
- [ ] All provisional CSS variable values replaced by verified FIAT token values.
- [ ] No fabricated FIAT token names or component API assumptions used.
- [ ] Mobile and desktop visual review passes.

---

## Implementation Order Summary

```
Task 1  ─────────────────────────────────────────────────── Foundation (Checkpoint A)
Task 2  ─────────────────────────────────────────────────── Financial engine (Checkpoint B)

After Task 2, two parallel paths:
  Path A:  Tasks 3 → 4 → 5                                  Demo product (Checkpoint C)
  Path B:  Task 6                                            Plaid server (independent)

Task 7  ◄─── Both paths complete (Tasks 5 + 6)              Plaid client (Checkpoint D)
Task 8  ◄─── Tasks 5 + 7 complete                           Cross-mode validation
Task 9  ──── Tasks 5 + 7 complete (parallel with Task 8)    UX polish
Task 10 ◄─── Tasks 8 + 9 complete                           Submission (Checkpoint E)
Task 11 ◄─── Optional, after Tasks 5–9, if FIAT access arrives
```

**Key dependencies:**
- Task 6 depends on Tasks 1 **and 2** (requires normalized domain types from Task 2).
- Task 6 is independent of Tasks 3–5 (Demo/UI) and may proceed in parallel after Task 2.
- Tasks 3 and 4 can be worked in parallel after Task 2.
- Task 5 requires Tasks 3 and 4.
- Task 7 requires both Task 5 and Task 6.
- Tasks 8 and 9 are independent of each other; both require Tasks 5 and 7.
- Task 10 requires Tasks 8 and 9.

---

## Checkpoint Human-Gate Behavior

When implementation begins, **do not execute all tasks in one uninterrupted batch**.

At each checkpoint, stop for human review:

| Checkpoint | After completing | Stop and… |
|---|---|---|
| A — Foundation | Task 1 | Run acceptance checks; report results; await review before Task 2 |
| B — Financial engine | Task 2 | Run tests; report results; await review before Tasks 3/4/6 |
| C — Demo product | Task 5 | Demo full workflow; report; await review before Task 6 server work (if not already done) and Task 7 |
| D — Plaid Sandbox | Tasks 7 + 8 | Full Demo+Plaid workflow; report; await review before Task 9 |
| E — Submission | Tasks 9 + 10 | Full validation; report; await explicit submission approval |

At each stop:
1. Run the checkpoint's acceptance checks.
2. Report results and any deviations from the approved design.
3. If a material SDK or architectural discrepancy is found, stop and report rather than
   silently changing the architecture.
4. Do not commit or push without explicit instruction.
5. Await human review before beginning the next checkpoint.
