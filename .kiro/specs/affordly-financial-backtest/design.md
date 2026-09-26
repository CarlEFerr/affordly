# Affordly Financial Backtest — Technical and UX Design

**Spec:** affordly-financial-backtest  
**Phase:** 4 — Technical and UX Design  
**Status:** Approved — Phase 4  
**Approved requirements:** `.kiro/specs/affordly-financial-backtest/requirements.md`  
**Product context:** `docs/product/product-direction.md`

---

## 1. Design Goals and Constraints

**Primary goal:** The smallest architecture that fully satisfies the 96 approved requirements, is
comprehensible to a reviewer, and demonstrates genuine technical fluency — not the largest
architecture that could theoretically serve this product.

**Hard constraints from approved requirements:**
- Analysis must run identically for Demo Mode and Plaid Mode data.
- The financial engine must be independent of React, Next.js, and Plaid.
- No authentication, no database, no server-side data persistence.
- Plaid **access token** (server-side secret) must never be returned to client-side code.
- Mobile at approximately 375px is the primary UX consideration; desktop is equally complete.
- Nymbus FIAT Design System (distributed as `@nymbus/fiat`) is the primary visual reference.

**Scope constraint:** This is a ~3-hour MVP demonstrating a product concept. Architectural
sophistication must serve the product, not the resume.

---

## 2. Nymbus FIAT Design System

### 2.1 Confirmed from official documentation

The Nymbus Joy Design System is distributed as the **FIAT** design system. The following
information is verified from the official installation guide:

| Item | Confirmed value |
|---|---|
| Component library package | `@nymbus/fiat` |
| Token package | `@nymbus/fiat-tokens` |
| Theme provider | `ClientThemeProvider` (client component) from `@nymbus/fiat` |
| Global token stylesheet | `@import "@nymbus/fiat-tokens/tokens.css"` |
| Tailwind integration | Add `./node_modules/@nymbus/fiat/dist/**/*.js` to Tailwind content scan |
| Confirmed components | `Button`, `Badge`, `Dialog` (others unverified) |
| Node requirement | ≥ 22 |
| Package manager requirement | pnpm ≥ 11 |
| React requirement | ≥ 19 |
| Tailwind requirement | ≥ 4 |
| Registry | Private Nexus registry (requires Nymbus VPN/Nexus permissions) |

The environment prerequisites are all satisfied: Node v26, React 19.2.8, Tailwind v4. The
only blocker is registry access, which is currently pending.

**Example usage confirmed in documentation:**
```typescript
import { Button, Badge, Dialog } from '@nymbus/fiat';
```

### 2.2 Pending FIAT access — items not yet inspectable

The following visual and interaction decisions cannot be made until the FIAT packages are
installable and the full documentation is accessible in a browser:

- Typography: scale, weights, line heights, font families
- Color system: palette, semantic color token names and values
- Spacing and layout rhythm: tokens, grid system
- Form control patterns: input styling, labels, validation states, error treatment
- Button variants: primary, secondary, ghost, icon-only
- Card and surface patterns: background, border, elevation
- Badge/status patterns: variants, sizes, color semantics
- Alert and informational banner patterns
- Loading and skeleton patterns
- Account selection control pattern
- Mobile and responsive guidance specific to FIAT

**None of these will be invented or approximated as Joy/FIAT values in this design.**

### 2.3 Interim implementation strategy

While FIAT access is pending, the application is built to be design-system-ready without
being design-system-dependent.

**Principle: the financial logic, state, and application structure are completely independent
of the design system. FIAT integration is a presentation-layer concern.**

The interim strategy has three parts:

**1. Local UI primitives (`src/components/ui/`)**

A small set of thin presentation wrappers with stable APIs. Each maps to an anticipated FIAT
component. Provisionally implemented with semantic HTML and Tailwind. Replaced with FIAT
imports at access time — feature components are unchanged.

| Affordly primitive | Anticipated FIAT replacement |
|---|---|
| `ui/Button.tsx` | `Button` from `@nymbus/fiat` |
| `ui/Badge.tsx` | `Badge` from `@nymbus/fiat` |
| `ui/StatusBadge.tsx` | `Badge` variant from `@nymbus/fiat` |
| `ui/CurrencyInput.tsx` | FIAT form input pattern |
| `ui/Disclosure.tsx` | FIAT informational component |
| `ui/Card.tsx` | FIAT surface/card |
| `ui/AccountSelector.tsx` | FIAT select or radio pattern |
| `ui/Spinner.tsx` | FIAT loading pattern |
| `ThemeProviderWrapper.tsx` | `ClientThemeProvider` from `@nymbus/fiat` |

**2. Centralized token surface in `globals.css`**

Tailwind v4's `@theme` block is the token injection point. Provisional semantic values are
defined here; FIAT tokens replace them when available:

```css
/* src/app/globals.css */
@import "tailwindcss";
/* Future: @import "@nymbus/fiat-tokens/tokens.css"; */

@theme inline {
  /* PROVISIONAL — replace with @nymbus/fiat-tokens values when available */
  --color-page-bg: #f9fafb;
  --color-surface: #ffffff;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-border: #e5e7eb;
  --color-focus: #3b82f6;
  --color-info: #3b82f6;

  /* Status descriptors — provisional, non-judgmental, awaiting FIAT guidance */
  /* Do NOT finalize these until FIAT color semantics are inspected */
  --color-status-negative-bg: #fef2f2;
  --color-status-negative-text: #991b1b;
  --color-status-below-cushion-bg: #fffbeb;
  --color-status-below-cushion-text: #92400e;
  --color-status-above-cushion-bg: #f0fdf4;
  --color-status-above-cushion-text: #166534;
}
```

These are explicitly provisional. Values are chosen to be accessible (WCAG AA contrast),
readable, and easy to replace — not to reflect FIAT aesthetics.

**3. ThemeProviderWrapper (`src/components/ThemeProviderWrapper.tsx`)**

A client component wrapper at the layout boundary. Currently a pass-through. Replaced with
`ClientThemeProvider` when FIAT is available, with no changes to any other component:

```typescript
// src/components/ThemeProviderWrapper.tsx — "use client"
// PROVISIONAL: pass-through while @nymbus/fiat is unavailable.
// Replace with ClientThemeProvider import when access is granted.
export default function ThemeProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

### 2.4 Current visual implementation policy

While FIAT access is pending:
1. Prioritize mobile-first hierarchy and usability above visual aesthetics.
2. Use semantic HTML and WCAG AA accessibility throughout.
3. Keep visual styling intentionally clean and restrained — avoid elaborate custom visual
   design that will conflict with FIAT later.
4. Do not commit to specific Tailwind color classes outside of the `@theme` block; prefer
   semantic CSS variables (`bg-[--color-surface]`, `text-[--color-text-primary]`).
5. Focus implementation polish on: spacing, hierarchy, interaction behavior, responsive
   layout, content clarity, and state feedback — these are design-system-independent.

**FIAT integration must not block implementation.** Financial logic, Demo Mode, Plaid
integration, responsive structure, interaction behavior, accessibility, and tests are all
independently implementable before FIAT access arrives. Once access is granted, FIAT
integration is a contained presentation-layer enhancement, not a structural rewrite.

---

## 3. Technology Stack and Decisions

### Approved stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 16.3.6 (App Router) | Already initialized; Vercel-native |
| Language | TypeScript 5, strict mode | Already configured; correct for financial logic |
| Package manager | **pnpm** (migrated from npm) | Required by FIAT installation documentation |
| Styling | Tailwind CSS v4 | Already installed; FIAT-ready via `@theme` |
| Plaid (server) | `plaid` Node SDK | Official SDK for server-side operations |
| Plaid (client) | `react-plaid-link` | Official React wrapper for Plaid Link modal |
| Testing | Vitest + React Testing Library | Fast; appropriate for this scale |

### Package manager migration (npm → pnpm)

The FIAT installation documentation specifies pnpm ≥ 11 as a prerequisite. Migrating the
project before adding FIAT and other feature dependencies ensures a clean single-lockfile
setup and avoids future package-manager conflicts.

**Migration steps (during implementation, before feature dependency installation):**
1. Ensure the required pnpm version is installed: `npm install -g pnpm` (or via corepack)
2. Keep the existing `package-lock.json` temporarily — `pnpm import` reads it to derive
   `pnpm-lock.yaml`.
3. Run `pnpm import` — generates `pnpm-lock.yaml` from the existing npm lockfile.
4. Run `pnpm install` and verify the project builds, lints, and type-checks cleanly.
5. Remove `package-lock.json` — it is now redundant and must not coexist with `pnpm-lock.yaml`.
6. Ensure only `pnpm-lock.yaml` remains as the lockfile in the repository.
7. Add a `"packageManager"` field to `package.json` for reproducibility:
   `"packageManager": "pnpm@<version>"` (using the installed pnpm version).
8. Run `npm run build`, `npm run lint`, and `npx tsc --noEmit` (or their pnpm equivalents)
   to confirm all checks pass under the new package manager.

Do not maintain both lockfiles after migration. The final repository has one package manager
and one lockfile. If `pnpm import` does not behave as expected for the installed pnpm version,
`pnpm install` from `package.json` alone (without import) is an acceptable alternative.

### Deliberate omissions

**Recharts: excluded.** The approved requirements describe month-level cards and a summary
statement — not time-series charts. The month cards communicate variance more clearly than a
chart at mobile widths. A CSS-based visual bar (pure Tailwind) can add magnitude indication
without a library. This is a deliberate scope decision; Recharts can be added later without
architectural change.

**External state libraries: excluded.** React `useState` + `useMemo` are sufficient. The
dataset is small; the derived analysis is instant to recompute; no cross-tree synchronization
exists.

---

## 4. System Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│  Browser (Client)                                        │
│                                                          │
│  ┌──────────────┐    ┌───────────────────────────────┐   │
│  │  Demo Data   │    │  AffordlyApp (React state)    │   │
│  │  (bundled)   │───▶│                               │   │
│  └──────────────┘    │  proposedPayment              │   │
│                      │  cushionTarget                │   │
│  ┌──────────────┐    │  financialHistory             │   │
│  │  Plaid Link  │    │  dataMode                     │   │
│  │  (modal)     │    │  plaidStatus                  │   │
│  └──────┬───────┘    └───────────────┬───────────────┘   │
│         │                            │                   │
│  Plaid Link returns             ┌────▼──────────────┐    │
│  public_token to browser        │  Analysis Engine   │    │
│  (temporary; sent to server)    │  runBacktest()     │    │
│         │                       │  (pure TypeScript) │    │
│         │                       └───────────────────┘    │
└─────────┼────────────────────────────────────────────────┘
          │ public_token sent to server (not an access token)
          │ HTTP POST
┌─────────▼────────────────────────────────────────────────┐
│  Next.js Server (API Routes)                             │
│                                                          │
│  POST /api/plaid/link-token                              │
│    → validate sessionId from request body                │
│    → create Plaid Link token (uses server-side creds)    │
│    → configure days_requested: 210                       │
│                                                          │
│  POST /api/plaid/connect { publicToken }                 │
│    → exchange publicToken → accessToken (server-only)    │
│    → fetch accounts                                      │
│    → transactions/sync (full cursor pagination)          │
│    → handle transaction readiness state                  │
│    → filter posted transactions, normalize               │
│    → return normalized data (access token discarded)     │
└─────────────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────────┐
│  Plaid API (Sandbox)                                     │
│  linkTokenCreate                                         │
│  itemPublicTokenExchange                                 │
│  accountsGet                                             │
│  transactionsSync (with cursor pagination)               │
└──────────────────────────────────────────────────────────┘
```

**Security boundary:** The Plaid `access_token` is created and consumed entirely within the
`/api/plaid/connect` server route. It is never returned to the client. The `public_token`
is a Plaid-issued temporary token that the browser legitimately receives from Plaid Link and
sends to the server for exchange — this is the standard and intended Plaid Link flow.

---

## 5. Financial Domain Model

All types live in `src/lib/analysis/types.ts`. Zero dependencies on React, Next.js, or Plaid.

```typescript
// Month key: "YYYY-MM", e.g. "2026-03"
type MonthKey = string;

// Normalized transaction (source-agnostic)
// Sign convention: positive = cash into checking account (inflow)
//                 negative = cash out of checking account (outflow)
interface NormalizedTransaction {
  id: string;
  date: string;        // "YYYY-MM-DD"
  amount: number;      // positive = cash in; negative = cash out
  description: string;
}

// A checking account option (shown when multiple are available)
interface CheckingAccountOption {
  id: string;
  name: string;
  mask: string;        // last 4 digits, e.g. "4321"
}

// The normalized financial history — the analysis engine's only input.
// firstSupportedMonth carries explicit coverage metadata set by the source adapter.
// The engine must use this field; it must NOT infer coverage from transaction presence.
//
// Demo adapter:  provides firstSupportedMonth = M−6 (all six months guaranteed).
// Plaid adapter: provides firstSupportedMonth = the calendar month AFTER the boundary
//                month (the month containing the earliest retrieved transaction),
//                or null if coverage cannot be established.
interface FinancialHistory {
  source: 'demo' | 'plaid';
  accountName: string; // "Demo Checking Account" or Plaid account name
  transactions: NormalizedTransaction[];
  firstSupportedMonth: MonthKey | null; // earliest month the adapter guarantees is complete
}

// Month-level aggregation (before simulation)
interface MonthlyAggregation {
  monthKey: MonthKey;
  label: string;             // "March 2026"
  cashIn: number;            // sum of positive transaction amounts
  cashOut: number;           // sum of absolute values of negative amounts
  cashFlow: number;          // cashIn - cashOut
  topTransactions: NormalizedTransaction[]; // up to 3, sorted by |amount| descending
}

// Month simulation status — descriptive, not judgmental (Req 5.2)
type MonthStatus = 'negative' | 'below-cushion' | 'above-cushion';

// Fully simulated month result
interface SimulatedMonth extends MonthlyAggregation {
  simulatedCashFlow: number;  // cashFlow - proposedPayment
  status: MonthStatus;
}

// Complete backtest output
interface BacktestResult {
  months: SimulatedMonth[];  // most recent first (M-1 at index 0)
  proposedPayment: number;
  cushionTarget: number;
  countNegative: number;
  countBelowCushion: number;
  countAboveCushion: number;
  totalMonths: number;       // 3, 4, 5, or 6
  periodLabel: string;       // e.g. "April 2026 – September 2026"
}

// API error code — Affordly classifications, not raw Plaid codes
// NOTE: This type lives in the API boundary module (src/app/api/ or a dedicated
// src/lib/api/types.ts introduced in Task 6), NOT in src/lib/analysis/types.ts.
// The analysis engine has no knowledge of server response contracts.
type AffordlyErrorCode =
  | 'no_checking_account'
  | 'history_preparing'    // Sandbox history not yet ready after bounded retry
  | 'connection_failed'    // Plaid API or token exchange failed
  | 'unexpected';

// API error response shape (both routes)
interface ApiErrorResponse {
  error: string;           // user-facing message, non-technical
  code: AffordlyErrorCode;
}

// Response shape from POST /api/plaid/connect (success)
interface PlaidConnectResponse {
  accounts: Array<{
    id: string;
    name: string;
    mask: string;
    transactions: NormalizedTransaction[];
  }>;
}
```

Note: The client determines whether Plaid data has ≥ 3 complete months via the analysis
engine's month selection logic — this is not an API error. The server returns all available
posted transactions; the client's `selectCompleteMonths()` handles eligibility.

---

## 6. Financial Analysis Pipeline

All analysis logic lives in `src/lib/analysis/`. Pure functions — no side effects, no I/O.

### 6.1 Complete Month Selection (`months.ts`)

```
Input:  transactions: NormalizedTransaction[], today: Date
Output: MonthKey[] | { ineligible: true; reason: 'insufficient-history' }
        (ordered most-recent-first when eligible)

Algorithm:
1. Determine the six candidate complete month keys: M-1 through M-6.
   M is derived from today's UTC year/month.
   Complete months are M-1 (most recent) through M-6 (oldest candidate).

2. Read `history.firstSupportedMonth`.
   - If null: return ineligible immediately.
   - This value is provided by the source adapter; the engine does not infer it.
   - Demo adapter: sets `firstSupportedMonth = M−6` (all six months guaranteed).
   - Plaid adapter: sets `firstSupportedMonth` = the month after the boundary month
     (the boundary month is the calendar month of the earliest retrieved transaction).

3. Include the contiguous set of candidate months that are on or after
   `firstSupportedMonth`. Comparison is lexicographic on "YYYY-MM" keys,
   which is equivalent to chronological order.
   - A candidate month within this range is included even if it has zero transactions.
   - The result is always a contiguous sequence — never sparse.
   - If `firstSupportedMonth` predates M-6, all six candidate months are supported.

4. If fewer than 3 supported months: return { ineligible: true }.
5. If 3–5 supported months: return those months (partial window).
6. If 6+ supported months: return the 6 most recent (M-1 through M-6).

Example A — Demo Mode (`firstSupportedMonth = M−6`):
  Today = October 2026 → candidates = ["2026-09".."2026-04"]
  firstSupportedMonth = "2026-04" (M-6)
  All 6 candidates >= "2026-04" → return all 6. ✓

Example B — Plaid with boundary in M-4 (`firstSupportedMonth = M−3`):
  firstSupportedMonth = "2026-07" (M-3)
  "2026-09","2026-08","2026-07" are >=; "2026-06" and older are not.
  → Returns 3 months (eligible).

Example C — Plaid with boundary in M-3 (`firstSupportedMonth = M−2`):
  firstSupportedMonth = "2026-08" (M-2)
  Only "2026-09","2026-08" qualify → 2 months → ineligible.

Example A — history deeper than six months (normal case):
  Today = October 2026 (M = "2026-10")
  Candidates = ["2026-09","2026-08","2026-07","2026-06","2026-05","2026-04"]
  Earliest transaction date = "2026-02-10"
  boundaryMonth = "2026-02" → firstSupportedMonth = "2026-03"
  All six candidates (April through September) are ≥ "2026-03"
  → Returns all 6 candidates (full six-month analysis).

Example B — earliest transaction inside the candidate window:
  Today = October 2026
  Earliest transaction date = "2026-03-18"
  boundaryMonth = "2026-03" → firstSupportedMonth = "2026-04" (April)
  Available = ["2026-09","2026-08","2026-07","2026-06","2026-05","2026-04"] (6 months)
  "2026-04" (April) is included even with zero transactions — within the safe window.
  → Returns 6 months (April through September).

Example C — insufficient history after boundary exclusion:
  Today = October 2026
  Earliest transaction date = "2026-07-20"
  boundaryMonth = "2026-07" → firstSupportedMonth = "2026-08" (August)
  Available = ["2026-09","2026-08"] (2 months only)
  → Returns ineligible (< 3 supported months).
```

**Conservative approximation documented:** The boundary-exclusion rule may conservatively
exclude a month that actually had full coverage (for example, if the earliest transaction
happens to fall late in an otherwise well-covered month). This is intentional — the design
prefers underestimating available history over falsely treating partial data as complete.
The `days_requested: 210` buffer on the link token is specifically sized to push the
boundary month safely before the target analysis window in most cases.

Month key calculation (UTC to avoid timezone edge cases):
```typescript
function monthKeyAt(today: Date, offsetMonths: number): MonthKey {
  const totalMonths = today.getUTCFullYear() * 12 + today.getUTCMonth() - offsetMonths;
  const year = Math.floor(totalMonths / 12);
  const month = totalMonths % 12;
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}
```

### 6.2 Monthly Aggregation (`aggregation.ts`)

```
Input:  transactions: NormalizedTransaction[], monthKey: MonthKey
Output: MonthlyAggregation

Algorithm:
1. Filter transactions where date.slice(0,7) === monthKey.
2. cashFlow = sum of all transaction amounts (positive = in, negative = out).
3. cashIn  = sum of amounts > 0.
4. cashOut = sum of Math.abs(amount) for amounts < 0.
5. topTransactions = sort all month transactions by Math.abs(amount) descending,
   take first min(3, length) entries (Reqs 8.3, 8.5).
   Both large inflows and outflows compete for the same three positions.
6. label = formatMonthLabel(monthKey).
```

Boundary cases (Reqs 4.4, 4.5):
- Zero inflow: cashIn = 0, cashFlow = -(cashOut). Simulation still applies.
- Zero outflow: cashOut = 0, cashFlow = cashIn. Simulation still applies.
- Zero transactions (month in window but no activity): cashIn = 0, cashOut = 0, cashFlow = 0.

### 6.3 Simulation and Classification (`simulation.ts`)

```
Input:  aggregation: MonthlyAggregation, proposedPayment: number, cushionTarget: number
Output: SimulatedMonth

simulatedCashFlow = aggregation.cashFlow - proposedPayment
status = classifyMonth(simulatedCashFlow, cushionTarget)
```

Classification function — canonical status rules (Req 5.1):
```
if simulatedCashFlow < 0:                return 'negative'
if simulatedCashFlow < cushionTarget:    return 'below-cushion'
                                         return 'above-cushion'

Boundary verifications:
  sim=0, cushion=0:  0 >= 0 → 'above-cushion'   ✓ (Req 4.6 / 3.7)
  sim=0, cushion>0:  0 < cushion → 'below-cushion' ✓ (Req 4.6)
  sim=cushion>0:     cushion >= cushion → 'above-cushion' ✓ (Req 4.7)
```

### 6.4 Backtest Runner (`index.ts`)

```
Input:  history: FinancialHistory,
        proposedPayment: number,
        cushionTarget: number,
        today?: Date  (default: new Date())
Output: BacktestResult | { ineligible: true; reason: 'insufficient-history' }

1. selectCompleteMonths(history.transactions, today) → monthKeys or ineligible
2. If ineligible: return { ineligible: true, reason: 'insufficient-history' }
3. For each monthKey: aggregateMonth(transactions, monthKey) → MonthlyAggregation
4. For each aggregation: simulateMonth(aggregation, proposedPayment, cushionTarget) → SimulatedMonth
5. months already in M-1-first order
6. Compute counts and periodLabel
7. Return BacktestResult
```

---

## 7. Source Adapters

Both adapters produce `FinancialHistory`. The analysis engine receives only `FinancialHistory`.

### 7.1 Demo Adapter (`adapters/demo.ts`)

```typescript
export function getDemoHistory(): FinancialHistory {
  return {
    source: 'demo',
    accountName: 'Demo Checking Account',
    transactions: DEMO_DATASET.transactions, // imported from lib/demo/dataset.ts
  };
}
```

### 7.2 Plaid Adapter (`adapters/plaid.ts`)

The adapter's responsibility is normalization only: sign convention flip and posted-transaction
filter. Transaction reconciliation (merging added/modified/removed) is performed by the API
route before calling the adapter, so the adapter always receives the already-reconciled
current transaction state.

Plaid convention: `amount > 0` = debit (outflow); `amount < 0` = credit (inflow).  
Affordly convention: `amount > 0` = inflow; `amount < 0` = outflow.  
Transform: `normalizedAmount = -plaidAmount`

```typescript
// reconciledTransactions: the current snapshot after applying added/modified/removed
// (produced by the API route's reconciliation step — see §9.3)
export function normalizePlaidTransactions(
  reconciledTransactions: PlaidSyncTransaction[],
  accountId: string
): NormalizedTransaction[] {
  return reconciledTransactions
    .filter(t => t.account_id === accountId)
    .filter(t => t.pending === false)       // Req 9.3: posted only
    .map(t => ({
      id: t.transaction_id,
      date: t.date,                         // already "YYYY-MM-DD" from Plaid
      amount: -(t.amount),                  // sign flip: Plaid debit → Affordly outflow
      description: t.merchant_name ?? t.name,
    }));
}
```

The `pending === false` filter is the posted-transaction gate (Req 9.3). Pending→posted
transitions are handled correctly because the reconciliation map always holds the most
recent state of each transaction by ID — a transaction that changes from pending to posted
via a `modified` or `added` update will have `pending: false` in the map and will pass
the filter. No duplicate cash movement occurs.

---

## 8. Demo Mode Design

### 8.1 Dataset location

`src/lib/demo/dataset.ts` — a single exported object. No component imports it directly.
Only `getDemoHistory()` in `adapters/demo.ts` consumes it.

### 8.2 Demo persona

**Persona:** Alex — salaried, mid-30s, variable monthly expenses.  
**Default proposed payment:** $475/month (vehicle financing — primary MVP scenario).  
**Default cushion target:** $300/month.  

The dataset uses relative month offsets calculated at runtime from today. The transactions
are generated with offsets so that when `getDemoHistory()` is called, it produces transaction
dates in the correct historical months regardless of the current date.

**Expected outcomes with defaults ($475 payment, $300 cushion):**

| Offset | Net cash flow | Simulated | Status |
|---|---|---|---|
| M-1 | +$620 | +$145 | Below Cushion |
| M-2 | +$980 | +$505 | Above Cushion |
| M-3 | +$320 | -$155 | Negative |
| M-4 | +$1,250 | +$775 | Above Cushion |
| M-5 | +$710 | +$235 | Below Cushion |
| M-6 | +$880 | +$405 | Above Cushion |

All three status states are present (Req 1.3). M-4's strong month is explained by an
additional large inflow (a bonus deposit) — visible in the month detail, giving the user
a clear answer to "why was that month different?"

### 8.3 Notable transactions for month detail

- **M-1 (tight):** Payroll +$4,200 / Rent -$1,400 / Annual car insurance -$1,680 — the
  large insurance outflow explains why this was a tight month.
- **M-4 (strong):** Payroll +$4,200 / Bonus +$1,400 / Rent -$1,400 — the bonus explains
  the unusually healthy cash flow.

Month detail presents these facts only. No interpretation or explanation is generated by
the application. The user draws their own conclusions (Req 8.6).

### 8.4 Default values

```typescript
export const DEMO_DEFAULT_PAYMENT = 475; // USD
export const DEMO_DEFAULT_CUSHION  = 300; // USD
```

---

## 9. Plaid Sandbox Architecture

### 9.1 Full connection sequence

```
Browser                       Next.js Server                  Plaid API
   │                                │                              │
   │──POST /api/plaid/link-token───▶│                              │
   │                                │  generate ephemeral UUID     │
   │                                │──linkTokenCreate────────────▶│
   │                                │   client_user_id: uuid()     │
   │                                │   days_requested: 210        │
   │                                │   products: ["transactions"] │
   │                                │◀─{ link_token }──────────────│
   │◀─{ linkToken }─────────────────│                              │
   │                                │                              │
   │  [Plaid Link opens in browser] │                              │
   │  [User connects Sandbox item]  │                              │
   │  [Plaid Link calls onSuccess   │                              │
   │   with public_token]           │                              │
   │                                │                              │
   │──POST /api/plaid/connect──────▶│                              │
   │   { publicToken }              │──itemPublicTokenExchange────▶│
   │   (Plaid-issued temp token;    │◀─{ access_token }────────────│
   │    legitimately in browser     │   (stays on server only)     │
   │    after Link completes)       │──accountsGet────────────────▶│
   │                                │◀─{ accounts }────────────────│
   │                                │                              │
   │                                │  identify checking accounts  │
   │                                │  if 0: return error          │
   │                                │                              │
   │                                │──transactionsSync (no cursor)▶│
   │                                │◀─{ added, next_cursor,       │
   │                                │   has_more, update_status }──│
   │                                │  while has_more:             │
   │                                │──transactionsSync (cursor)──▶│
   │                                │◀─{ added, next_cursor,       │
   │                                │   has_more, update_status }──│
   │                                │                              │
   │                                │  check update_status →       │
   │                                │  bounded retry if needed     │
   │                                │                              │
   │                                │  filter pending === false    │
   │                                │  normalize (sign flip)       │
   │                                │  group by checking account   │
   │                                │  discard access_token        │
   │◀─{ accounts: [...] }───────────│                              │
   │                                │                              │
   │  if 1 account: auto-select     │                              │
   │  if >1: show inline selector   │                              │
   │  runBacktest() client-side     │                              │
```

### 9.2 API Route: POST /api/plaid/link-token

**Location:** `src/app/api/plaid/link-token/route.ts`  
**Request body:** None  
**Response (success):** `{ linkToken: string }`  
**Response (error):** `{ error: string; code: 'connection_failed' | 'unexpected' }`

**Server-side behavior:**
```
1. Read PLAID_CLIENT_ID and PLAID_SECRET from process.env (server-only).
2. Read sessionId from request body: { sessionId: string }.
   Validate: non-empty string, maximum 64 characters, no structural PII.
   The client generates and owns this identifier (see client behavior below).
3. Construct Plaid client for SANDBOX environment.
4. Call linkTokenCreate:
   {
     user: { client_user_id: validatedSessionId },
     client_name: "Affordly",
     products: ["transactions"],
     country_codes: ["US"],
     language: "en",
     transactions: { days_requested: 210 }
   }
   days_requested: 210 provides ~7 months of history, covering M-1 through M-6 plus the
   current partial month with buffer for the boundary-exclusion rule. The 730-day maximum
   is not requested because Affordly does not need more than ~7 months.
5. Return { linkToken: response.link_token }.
```

**Client-side session identity (in `PlaidConnector.tsx` or `AffordlyApp.tsx`):**
```
1. On Plaid connection initiation, check sessionStorage.getItem('affordly-session-id').
2. If not present: generate sessionId = crypto.randomUUID() (Web Crypto API).
   Store: sessionStorage.setItem('affordly-session-id', sessionId).
3. Reuse the same sessionId for all subsequent Plaid Link attempts during this browser session.
4. Send { sessionId } to POST /api/plaid/link-token.
```

This is an MVP Sandbox identity strategy. `sessionId` is ephemeral (cleared when the browser
tab closes), contains no PII, and is not persisted to any database. A production system would
use its authenticated internal user identifier instead of a browser-generated UUID.

### 9.3 API Route: POST /api/plaid/connect

**Location:** `src/app/api/plaid/connect/route.ts`  
**Request body:** `{ publicToken: string }`  
**Response (success):** `{ accounts: PlaidConnectResponse['accounts'] }`  
**Response (error):** `ApiErrorResponse` with appropriate HTTP status

**Transaction readiness strategy:**

Plaid's `transactionsSync` response includes a `transactions_update_status` field indicating
how much historical data has been indexed for the item:
- `'HISTORICAL_UPDATE_COMPLETE'` — full requested history is available.
- `'INITIAL_UPDATE_COMPLETE'` — recent transactions are available; full history pending.
- Other / missing — data is still being prepared.

For the MVP, the goal is to retrieve the most complete snapshot available within a bounded
time budget:

```
// Provisional constants — validate against actual Plaid Sandbox behavior during implementation.
// The user-facing behavior (bounded wait, never indefinite, clear error + Demo Mode fallback)
// is the requirement. These specific values may be adjusted without a design change.
SYNC_MAX_RETRIES = 3         // provisional starting point
SYNC_RETRY_DELAY_MS = 1500   // provisional starting point

async fetchTransactionsForSession(accessToken):
  // Transaction reconciliation map: keyed by transaction_id
  // Represents the current authoritative state of all transactions
  transactionMap = new Map<string, PlaidSyncTransaction>()
  cursor = undefined
  updateStatus = undefined
  attempts = 0

  // Paginate, applying all update types to the map
  function runSync():
    transactionMap.clear()
    cursor = undefined
    do:
      response = await plaid.transactionsSync({
        access_token: accessToken,
        cursor: cursor,   // undefined on first call (initial history fetch)
        count: 500        // Plaid's supported page size for sync
      })

      // Apply added: insert or update
      for each t in response.added:
        transactionMap.set(t.transaction_id, t)

      // Apply modified: replace existing entry
      for each t in response.modified:
        transactionMap.set(t.transaction_id, t)

      // Apply removed: delete from map
      for each r in response.removed:
        transactionMap.delete(r.removed_transaction_id)

      cursor = response.next_cursor
      updateStatus = response.transactions_update_status
    while response.has_more
    // After this loop: transactionMap holds the current authoritative snapshot

  runSync()

  // Bounded retry if historical data is not yet complete
  while updateStatus !== 'HISTORICAL_UPDATE_COMPLETE' && attempts < SYNC_MAX_RETRIES:
    await sleep(SYNC_RETRY_DELAY_MS)
    runSync()   // restart from no cursor — rebuilds map from fresh state
    attempts++

  // Proceed if we have sufficient history, even without HISTORICAL_UPDATE_COMPLETE
  if updateStatus !== 'HISTORICAL_UPDATE_COMPLETE':
    reconciledTransactions = Array.from(transactionMap.values())
    if hasAtLeast3CompleteMonths(reconciledTransactions):
      // Proceed with available data; limitation documented
      pass
    else:
      return { error: "Sandbox history is still being prepared.", code: "history_preparing" }

  return Array.from(transactionMap.values())
```

**Why added/modified/removed all matter:**

- `added`: New transactions (includes pending→posted transitions when they appear as new).
- `modified`: Changes to existing transactions (e.g., amount corrections, pending→posted
  status change, merchant name update).
- `removed`: Transactions removed from the item's history (e.g., declined authorizations that
  initially appeared as pending).

Processing only `added` would miss modifications and leave removed/declined items in the
analysis. The reconciliation map ensures the snapshot matches Plaid's current state.

**Intentional MVP tradeoff:** This bounded retry strategy works for Sandbox because Plaid
Sandbox processes transaction history quickly. In a production integration, webhooks
(`HISTORICAL_UPDATE_COMPLETE`) would replace polling. Webhooks are explicitly out of MVP
scope. This limitation is documented in the product README.

**Full server-side behavior:**
```
1. Exchange publicToken → accessToken via itemPublicTokenExchange.
2. Fetch accounts via accountsGet.
3. Filter checking accounts: type='depository' AND subtype='checking'.
4. If 0 checking accounts: return 422 + { error: "...", code: "no_checking_account" }.
5. Execute transactionsSync with reconciliation map (see above).
   Follow has_more until complete — no silent truncation.
6. Handle update_status with bounded retry.
7. If history_preparing after retries: return 503 + { error: "...", code: "history_preparing" }.
8. reconciledTransactions = Array.from(transactionMap.values())
9. For each checking account: normalizePlaidTransactions(reconciledTransactions, accountId)
   (adapter filters pending === false and flips sign).
10. Return { accounts: [{ id, name, mask, transactions }...] }.
    access_token is not stored; it goes out of scope when the handler returns.
```

### 9.4 Checking account identification

Plaid account type filter: `account.type === 'depository' && account.subtype === 'checking'`

Other depository subtypes (savings, money market, cd, etc.) are excluded because Affordly
analyzes primary checking account cash flow, not savings vehicles.

### 9.5 Account selection flow (client-side)

After the server returns `accounts[]`:
- **1 account:** Automatically used as the primary checking account. No UI shown.
- **Multiple accounts:** Inline account selection shown within the main flow (see §12.3).
- **0 accounts:** Error state with Demo Mode fallback (handled server-side).

---

## 10. Application File Structure

```
src/
├── app/
│   ├── api/
│   │   └── plaid/
│   │       ├── link-token/
│   │       │   └── route.ts       # POST: Plaid link token + days_requested
│   │       └── connect/
│   │           └── route.ts       # POST: token exchange + sync pagination
│   ├── layout.tsx                  # Server component: metadata + ThemeProviderWrapper
│   ├── page.tsx                    # Server component: renders AffordlyApp
│   └── globals.css                 # @theme provisional tokens; FIAT import point
│
├── components/
│   ├── AffordlyApp.tsx             # Root "use client" component; owns all state
│   ├── ThemeProviderWrapper.tsx    # "use client" pass-through → ClientThemeProvider later
│   ├── DataModeBar.tsx             # Mode indicator + Plaid connect/switch control
│   ├── InputPanel.tsx              # Payment + cushion inputs (debounced)
│   ├── BacktestSummary.tsx         # Summary statement
│   ├── MonthCardList.tsx           # Date range label + month card list
│   ├── MonthCard.tsx               # Month card + expandable detail
│   ├── AccountSelector.tsx         # Inline multi-account selection
│   ├── PlaidConnector.tsx          # react-plaid-link wrapper
│   ├── Disclosure.tsx              # Retrospective disclosure (Req 12.1)
│   └── ui/                         # Presentation primitives (FIAT-swap layer)
│       ├── Button.tsx              # → FIAT Button
│       ├── Badge.tsx               # → FIAT Badge
│       ├── StatusBadge.tsx         # Status-specific Badge wrapper
│       ├── CurrencyInput.tsx       # Validated currency field
│       ├── Card.tsx                # Surface/card container
│       ├── Spinner.tsx             # Loading indicator
│       └── Disclosure.tsx          # Informational banner
│
├── lib/
│   ├── analysis/
│   │   ├── types.ts               # Domain types (no external deps)
│   │   ├── months.ts              # Complete month selection (contiguous window)
│   │   ├── aggregation.ts         # Monthly cash flow aggregation
│   │   ├── simulation.ts          # Payment simulation + classification
│   │   └── index.ts               # runBacktest() public API
│   ├── adapters/
│   │   ├── demo.ts                # Demo dataset → FinancialHistory
│   │   └── plaid.ts               # Plaid sync response → FinancialHistory
│   ├── demo/
│   │   └── dataset.ts             # Deterministic sample data + defaults
│   └── utils/
│       ├── currency.ts            # formatCurrency(), parseCurrencyInput()
│       └── date.ts                # monthKeyToLabel(), monthKeyAt()
│
└── __tests__/
    ├── analysis/
    │   ├── months.test.ts
    │   ├── aggregation.test.ts
    │   ├── simulation.test.ts
    │   └── backtest.test.ts
    ├── adapters/
    │   └── plaid.test.ts
    └── components/
        └── AffordlyApp.test.tsx
```

---

## 11. UI Component Responsibilities

### AffordlyApp.tsx (`"use client"`)

Root client component. Owns all application state. Does not contain inline markup for
individual UI elements — delegates to specialized components.

**State:**
```typescript
dataMode: 'demo' | 'plaid'
plaidStatus: 'idle' | 'linking' | 'loading' | 'selecting-account' | 'ready' | 'error'
plaidError: string | null
accountOptions: CheckingAccountOption[] | null
financialHistory: FinancialHistory   // initialized to getDemoHistory()
proposedPayment: number | null       // null while input is empty or invalid
cushionTarget: number | null         // null while input is empty or invalid
expandedMonthKey: string | null
```

**Derived (not stored):**
```typescript
const backtestResult = useMemo(
  () =>
    proposedPayment !== null && cushionTarget !== null
      ? runBacktest(financialHistory, proposedPayment, cushionTarget)
      : null,
  [financialHistory, proposedPayment, cushionTarget]
);
```

Any change to `financialHistory`, `proposedPayment`, or `cushionTarget` automatically
triggers recalculation. No manual "recalculate" event needed.

### InputPanel.tsx

Manages raw string state for both inputs. Applies debounced validation before committing
to `AffordlyApp`. Does not contain analysis logic.

### AccountSelector.tsx

Inline selector (not a modal or overlay). Shown only when Plaid returns > 1 checking account.
Large touch targets. Shows account name + masked number. Includes "Use Demo Data" option.
See §12.3 for layout.

### MonthCard.tsx

Controlled expand/collapse state. Expanding a card calls `setExpandedMonthKey(monthKey)`;
expanding a different card collapses the previous one (only one expanded at a time).

The detail panel shows only factual information: cash-in total, cash-out total, original/
simulated cash flow, and up to 3 transactions with description and amount. No annotations,
no inferences, no AI-generated commentary.

---

## 12. UX and Visual Design

### 12.1 Mobile-first layout (≥ 375px, base styles)

Single-column stack. All Tailwind classes are mobile-first with `md:` prefixes for
enhancement. Content lives within a padded container (e.g., `px-4 max-w-2xl mx-auto`).

```
┌────────────────────────────────┐
│ HEADER                         │
│ Affordly            [Demo ●]   │ ← product name + data mode indicator
├────────────────────────────────┤
│ INPUTS                         │
│ Monthly Payment                │
│ [$475.00──────────────────]    │ ← full-width; "Example starting point"
│                                │
│ Monthly Cushion Target         │
│ [$300.00──────────────────]    │
├────────────────────────────────┤
│ DISCLOSURE                     │
│ ℹ This analysis is based on   │
│   historical data. It does not │
│   predict future performance.  │
├────────────────────────────────┤
│ SUMMARY                        │
│ With a $475/mo payment, 2 of   │
│ your last 6 months would have  │
│ fallen below your $300 cushion.│
│ 1 month would have been        │
│ negative.                      │
├────────────────────────────────┤
│ Analyzed: Apr – Sep 2026       │
│                                │
│ ┌──────────────────────────┐   │
│ │ September 2026           │   │
│ │ [Below Cushion  ▽]       │   │ ← badge + expand toggle
│ │ Before: +$620            │   │
│ │ After:  +$145            │   │
│ └──────────────────────────┘   │
│ ┌──────────────────────────┐   │
│ │ August 2026              │   │
│ │ [Above Cushion  ▽]       │   │
│ │ Before: +$980            │   │
│ │ After:  +$505            │   │
│ └──────────────────────────┘   │
│ ...4 more months               │
├────────────────────────────────┤
│ PLAID SECTION                  │
│ [Connect Plaid Sandbox]        │
│ Test the Plaid API integration │
└────────────────────────────────┘
```

### 12.2 Desktop adaptation (≥ 768px)

Same single-column sequential structure. No dashboard grid for the month cards — the
chronological narrative is part of the product story and must remain readable top-to-bottom.

Desktop enhancements:
- Max-width container centered (`max-w-2xl mx-auto`)
- More generous vertical spacing between sections
- Payment and cushion inputs flow side-by-side (`md:flex md:gap-4`)
- Month cards use full width with more internal padding

The month list stays vertical. The experience is the same product, more spacious.

### 12.3 Inline account selection

When Plaid returns multiple checking accounts, the account selector appears inline between
the summary and the month cards — replacing the month card area until a selection is made.

```
┌──────────────────────────────────────────┐
│ Multiple checking accounts found         │
│ Choose one to analyze:                   │
│                                          │
│  ○  Alex Checking  ····4231             │ ← large touch target (min 48px height)
│  ○  Joint Checking  ····8822            │
│  ○  Business Check  ····1197            │
│                                          │
│ [Use Demo Data instead]                  │
└──────────────────────────────────────────┘
```

This is a radio list within the page flow. No modal, no dialog, no overlay. The user can
scroll to and from this section naturally. The exact component pattern should be chosen from
FIAT once access is available.

### 12.4 Expanded month detail

```
┌────────────────────────────────────────────┐
│ September 2026          [Below Cushion △]  │
│ [▲ Hide details]                           │
├────────────────────────────────────────────┤
│ Cash in:              +$4,200.00           │
│ Cash out:             -$3,580.00           │
│                                            │
│ Without this payment: +$620.00            │
│ With $475/mo payment: +$145.00            │
│                                            │
│ 3 largest transactions this month:        │
│ • Payroll Deposit         +$4,200.00      │
│ • Annual Car Insurance    -$1,680.00      │
│ • Rent Payment            -$1,400.00      │
└────────────────────────────────────────────┘
```

All information is factual. Transaction descriptions come from Plaid `merchant_name ?? name`
or the demo dataset's `description` field. No annotations or inferred explanations are added.
The user can identify that the annual car insurance payment explains the tight month without
the application making that inference for them.

### 12.5 Status visual language — non-judgmental

The three statuses are descriptive simulation states. The visual treatment must communicate
distinction without implying a verdict.

**Label:** The primary differentiator. Always visible as text. Required by Req 14.3.
- "Negative"
- "Below Cushion"
- "Above Cushion"

**Icon:** Provides a secondary, accessible signal. Must not imply pass/fail. Acceptable
options include neutral directional indicators (↑ ↓), neutral geometric shapes, or numeric
indicators. Avoid ✓ (pass), ✕ (fail), ⚠ (danger), or similar evaluative symbols.

**Color:** Provides tertiary distinction. Must not be the only differentiator (Req 14.3).
Color semantics and exact values are deferred to FIAT inspection. Do not treat
"Above Cushion" as "success green" or "Negative" as "error/destructive red" in the codebase —
these framings create semantic values that may conflict with FIAT's actual approach.

**Provisional implementation policy:** Use neutral descriptive language in CSS variable names
(`--color-status-negative`, not `--color-error` or `--color-destructive`). Use accessible
contrast ratios. Replace with FIAT badge semantics when available.

### 12.6 Debounced input behavior

The input-update strategy balances responsiveness with clarity:

1. **Typing:** Raw string state updates immediately. `proposedPayment` / `cushionTarget`
   remain at previous valid value. Results continue showing the last valid analysis.

2. **Debounce (200ms):** A `useRef`-backed `setTimeout` fires after 200ms of typing pause.
   The pending value is validated:
   - If valid: commit to `proposedPayment` / `cushionTarget`. Analysis recalculates.
   - If invalid: clear `proposedPayment` / `cushionTarget` to `null`. Results hidden.

3. **Blur:** Currency formatting is applied to the display value. Any pending debounce fires
   immediately (clear the timeout, commit or reject right away).

No third-party debounce library is introduced. A simple `useRef<ReturnType<typeof setTimeout>>`
pattern is sufficient.

This prevents result flickering during mid-type edits while maintaining the responsive feel
of the product. Invalid or incomplete inputs never produce partial results (Req 11.5).

---

## 13. State Design

All state in `AffordlyApp.tsx`. React `useState` + `useMemo`. No external library.

```typescript
// Data mode
const [dataMode, setDataMode] = useState<'demo' | 'plaid'>('demo');

// Plaid flow
type PlaidStatus = 'idle' | 'linking' | 'loading' | 'selecting-account' | 'ready' | 'error';
const [plaidStatus, setPlaidStatus] = useState<PlaidStatus>('idle');
const [plaidError, setPlaidError] = useState<string | null>(null);
const [accountOptions, setAccountOptions] = useState<CheckingAccountOption[] | null>(null);

// Financial history (starts as Demo; replaced on Plaid connect)
const [financialHistory, setFinancialHistory] = useState<FinancialHistory>(getDemoHistory);

// User inputs (null = invalid or empty — no partial results)
const [proposedPayment, setProposedPayment] = useState<number | null>(DEMO_DEFAULT_PAYMENT);
const [cushionTarget, setCushionTarget] = useState<number | null>(DEMO_DEFAULT_CUSHION);

// UI
const [expandedMonthKey, setExpandedMonthKey] = useState<string | null>(null);

// Derived
const backtestResult = useMemo(() => {
  if (proposedPayment === null || cushionTarget === null) return null;
  const result = runBacktest(financialHistory, proposedPayment, cushionTarget);
  return 'ineligible' in result ? null : result;
}, [financialHistory, proposedPayment, cushionTarget]);
```

**Switching back to Demo Mode** (from any state): `setFinancialHistory(getDemoHistory())` +
`setDataMode('demo')` + `setPlaidStatus('idle')` + `setPlaidError(null)`. This satisfies
Reqs 9.7 and 11.2.

---

## 14. Server / API Boundaries

### What lives server-side

Only operations requiring `PLAID_CLIENT_ID` and `PLAID_SECRET`:
- Creating Plaid Link tokens
- Exchanging public tokens for access tokens
- Fetching Plaid accounts and transactions

### What lives client-side

- Demo data (bundled)
- All analysis computation (pure TypeScript, instant)
- React state and UI rendering

### Token security clarification

- **`public_token`**: Issued by Plaid to the browser after Plaid Link completes. This is
  expected and by design — the browser sends it to the server for exchange. It is temporary
  (30-minute TTL) and can only be used once to create an access token.
- **`access_token`**: Created server-side. Used server-side to fetch data. Never returned to
  the client. Discarded after the handler completes (no persistence).

### Environment variables

```
PLAID_CLIENT_ID=   # Server-side only; no NEXT_PUBLIC_ prefix
PLAID_SECRET=      # Server-side only; NEVER client-accessible
PLAID_ENV=sandbox  # Must be "sandbox" for MVP
```

Next.js enforces the server/client boundary: variables without `NEXT_PUBLIC_` cannot be
accessed in `"use client"` components or their imports.

### Error response contract (unified)

All API routes return one consistent error shape:

```typescript
// HTTP 4xx/5xx
{ error: string; code: AffordlyErrorCode }

// HTTP 200
{ linkToken: string }          // from /api/plaid/link-token
{ accounts: [...] }            // from /api/plaid/connect
```

`error` is a non-technical, user-displayable message.  
`code` is an Affordly classification (not a raw Plaid code) used by the client to route
to the correct error state and user message. Raw Plaid error details are logged server-side.

---

## 15. Error Handling

### Error surface map

| Failure | HTTP | code | User message | UI state |
|---|---|---|---|---|
| Link token creation fails | 500 | `connection_failed` | "Unable to start the Plaid connection." | plaidStatus: 'error' |
| User cancels Plaid Link | — | — | None | plaidStatus: 'idle' (Req 11.2) |
| Public token exchange fails | 502 | `connection_failed` | "Connection failed. Please try again." | plaidStatus: 'error' |
| Transaction sync fails | 502 | `connection_failed` | "Unable to retrieve account data." | plaidStatus: 'error' |
| No checking account | 422 | `no_checking_account` | "No checking account found in this connection." | plaidStatus: 'error' |
| History not ready after retries | 503 | `history_preparing` | "Sandbox history is still being prepared. Try again in a moment." | plaidStatus: 'error' |
| Server error (catch-all) | 500 | `unexpected` | "Something went wrong. Please try again." | plaidStatus: 'error' |
| Multiple checking accounts | — | — | Account selection UI | plaidStatus: 'selecting-account' |
| Insufficient history (< 3 months) | — | — | "This account needs at least 3 complete months..." | client-side state from runBacktest |
| Empty payment input | — | — | "Enter a payment amount greater than $0." | inline validation |
| Zero or negative payment | — | — | "Payment amount must be greater than $0." | inline validation |
| Empty cushion input | — | — | "Enter a monthly cushion target." | inline validation |
| Negative cushion | — | — | "Cushion must be $0 or greater." | inline validation |

### Recovery path

All Plaid error states expose a "Use Demo Data" action that resets to Demo Mode (Req 1.5).
Demo Mode content is visible behind the error state, not replaced by it.

---

## 16. Security and Privacy

### MVP safeguards

- **`PLAID_SECRET` server-side only.** Next.js module boundary enforces this. No
  `NEXT_PUBLIC_PLAID_SECRET` variable ever exists.
- **Access token not returned to client.** The `POST /api/plaid/connect` route discards the
  access token when the handler returns. There is no persistence.
- **`public_token` is not an access token.** The `public_token` the browser sends to the
  server is a temporary Plaid-issued credential, valid for 30 minutes and single-use. This
  is the documented and intended Plaid Link flow.
- **`.env.local` is gitignored.** The existing `.gitignore` pattern `.env*` (with `!.env.example`
  exception) covers this.
- **No database.** Financial data lives only in React component state for the browser session.
- **No bank credentials handled.** Affordly never processes bank login credentials. Plaid Link
  manages the institution handshake.
- **Technical errors not exposed.** Raw Plaid errors are logged server-side; only `AffordlyErrorCode`
  classifications reach the client.

### Required before production (out of MVP scope)

- Secure server-side session for access token (instead of immediate discard)
- HTTPS enforcement, HSTS, and security headers
- Rate limiting on API routes
- CSRF protection
- Plaid webhook handling for item status and transaction readiness
- Switch from `PLAID_ENV=sandbox` to `PLAID_ENV=production`
- Privacy policy and data-handling disclosure
- Production-grade logging

---

## 17. Testing Strategy

### Priority 1: Financial analysis unit tests (pure functions, no mocking)

**`months.test.ts`**
- Current month is excluded; M-1 through M-6 are the candidate set
- Contiguous window: a zero-transaction month within the supported window is included, not skipped
- Conservative boundary: earliest transaction in M-3 makes M-3 the boundary; firstSupportedMonth
  is M-2; months M-2 through M-1 are available (2 months → ineligible); not the 4 months
  M-3 through M-1 that a non-conservative rule would produce
- Normal case: earliest transaction before M-6 → all six candidates are within the window
- Exactly 3 and exactly 5 available months produce correct partial windows
- Returns ineligible when the conservative window produces < 3 supported months

**`aggregation.test.ts`**
- Standard aggregation (cashFlow = cashIn - cashOut)
- Zero inflow month: cashFlow = -(cashOut)
- Zero outflow month: cashFlow = cashIn
- Zero-transaction month (within window): cashIn = 0, cashOut = 0, cashFlow = 0
- Top-3 by absolute value: large inflow and large outflow compete for same slots
- Month with 2 transactions: returns 2 (no padding or failure)
- Month with 0 transactions: topTransactions = []

**`simulation.test.ts`**
- Standard simulation: simulatedCashFlow = cashFlow - proposedPayment
- Status: `< 0` → negative
- Status: `= 0`, cushion = 0 → above-cushion
- Status: `= 0`, cushion > 0 → below-cushion
- Status: `= cushion` (positive) → above-cushion
- Status: just above cushion → above-cushion
- Status: just below cushion → below-cushion
- Zero-cushion: only negative and above-cushion can occur

**`backtest.test.ts`**
- End-to-end with demo dataset → expected status distribution
- Count aggregation (negative / below / above)
- Period label reflects the actual analyzed months
- Returns ineligible for insufficient history

### Priority 2: Adapter tests

**`plaid.test.ts`**
- Pending transactions (`pending: true`) are excluded from normalized output
- Posted transactions (`pending: false`) are included
- Sign convention: Plaid `amount: 75.50` → normalized `-75.50` (outflow)
- Sign convention: Plaid `amount: -3000` → normalized `+3000` (inflow)
- Correct account ID filter (only transactions for the selected account)
- Description preference: `merchant_name` when present; `name` as fallback

**Reconciliation tests (in `plaid.test.ts` or a dedicated `sync-reconcile.test.ts`):**
- `modified` transaction replaces its prior representation: a transaction appearing in
  `added` and then in `modified` (second sync page) results in only the modified version
  in the final snapshot, not both
- `removed` transaction disappears: a transaction in `added` that also appears in `removed`
  is absent from the final snapshot
- Pending→posted transition does not duplicate cash movement: a transaction that first
  appears with `pending: true` in an `added` update, then appears with `pending: false`
  in a `modified` update, results in exactly one normalized transaction (the posted version)
  in the final output
- Cursor pagination aggregation: transactions from page 1 and page 2 of `added` combined
  into the same reconciliation map produce the correct unified snapshot
- History-not-ready: when `transactions_update_status !== 'HISTORICAL_UPDATE_COMPLETE'`
  after bounded retries and insufficient months, the `history_preparing` code is returned
  (testable by mocking the Plaid client)

### Priority 3: Component interaction tests (React Testing Library)

**`AffordlyApp.test.tsx`**
- Renders Demo Mode analysis immediately on mount (Req 1.1)
- Typing a valid payment amount and pausing → results update with new payment
- Typing an invalid payment (zero, negative, non-numeric) → validation message shown;
  prior results not overwritten by invalid state
- Clearing payment input → results hidden, prompt shown (Req 2.4)
- Changing cushion → statuses recalculate (Req 3.5)
- Expanding a month card → detail content visible (Req 8.1)
- Collapsing a month card → detail content hidden (Req 8.7)
- Simulated Plaid error → error message + "Use Demo Data" option visible (Req 1.5)
- Plaid cancel → no error message; Demo Mode active (Req 11.2)

### Test configuration

```json
// package.json additions
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

Vitest is configured with `jsdom` for component tests and `node` environment for pure
analysis library tests (faster, no jsdom overhead).

---

## 18. Requirements Traceability

| Requirement area | Design section |
|---|---|
| Req 1: Demo Mode | §8, §11 (AffordlyApp state) |
| Req 2–3: Input validation and debounce | §11 (InputPanel), §12.6, §13 |
| Req 4: Monthly calculation | §6.2 (aggregation.ts) |
| Req 5: Status classification | §6.3 (simulation.ts), §12.5 (status visual) |
| Req 6: Month cards | §11 (MonthCard), §12.1–12.2 |
| Req 7: Summary statement | §11 (BacktestSummary) |
| Req 8: Month detail | §11 (MonthCard expanded), §12.4 |
| Req 9: Plaid integration + posted filter | §9, §7.2 (plaid adapter) |
| Req 10: Account selection + eligibility | §9.4–9.5, §11 (AccountSelector), §6.1 |
| Req 11: Loading + error states | §12.5 (empty states), §15 |
| Req 12: Retrospective language | §11 (Disclosure), §12.4 (detail copy) |
| Req 13: Data mode consistency | §7 (adapters), §6.4 (runBacktest) |
| Req 14: Visual design + mobile | §2 (FIAT/Joy), §12 (UX design), §2.4 (interim policy) |

---

## 19. Design Tradeoffs and Rejected Alternatives

### transactions/sync over transactions/get

The design uses `/transactions/sync` rather than `/transactions/get`. Plaid recommends
`/transactions/sync` for all new integrations. The primary differences for this MVP:
- `sync` requires cursor pagination (handled transparently by the server route)
- `sync` does not accept a date range parameter — history length is controlled at
  link-token creation via `days_requested: 210`
- `sync` explicitly surfaces `transactions_update_status`, making the readiness state
  observable and allowing the bounded retry strategy

The `transactions/get` endpoint is not deprecated in the Sandbox but would require
separate deprecation migration work before production.

### Client-side analysis over server-side

Analysis runs in the browser for instant feedback. Server involvement is limited to Plaid
operations. See §4 for the reasoning. The session-only MVP has no reason for server-side
computation of financial results.

### Bounded retry over webhooks

Webhooks (the production-correct approach for transaction readiness) are explicitly out of
scope per the approved requirements. The bounded retry is an intentional Sandbox-MVP tradeoff,
documented in product limitations.

### Inline account selection over modal/dialog

An inline selector within the main flow is simpler, more accessible, and does not require
overlay/focus management complexity. The approved MVP is a focused single-page experience
where navigation-based context switching is natural.

### Debounced commit over on-blur-only

On-blur-only updates feel slow — a user tabbing between fields would not see results until
they leave the input, even if they paused in the field. Debouncing at 200ms provides
responsiveness while preventing flickering on every keystroke.

### pnpm over npm

pnpm is a hard prerequisite of the FIAT installation documentation. Migrating before adding
feature dependencies ensures a single clean lockfile and avoids future package-manager
conflicts. The migration is non-disruptive (all existing `npm run` scripts work unchanged with
`pnpm run`).

### Single-column month layout over grid

A 2–3 column card grid on desktop would be more "dashboard-like" but would break the
chronological reading narrative. The user is mentally asking "what happened month by month?"
— a linear sequence answers this better than a grid. Confirmed per the approved revision.

---

## 20. Open Items for Human Review

1. **`transactions/sync` behavior in Sandbox:** The bounded retry strategy assumes Sandbox
   processes history within ~5 seconds (3 retries × 1.5s). If Sandbox is slower for some
   test accounts, the `history_preparing` state will surface more frequently than expected.
   Confirm the retry budget is acceptable or adjust retry count/delay.

2. **Account selector component from FIAT:** The inline radio list is the interim pattern.
   Once FIAT documentation is available, confirm whether `Badge`, `Dialog`, or another
   component is the preferred pattern for account selection — this affects `AccountSelector.tsx`.

3. **FIAT status badge semantics:** The `StatusBadge` component uses provisional semantic
   CSS variables. Once FIAT badge documentation is accessible, confirm which badge variant
   maps to each status and whether any variant carries implied pass/fail semantics that should
   be avoided.

4. **pnpm migration timing:** The migration from npm to pnpm should happen as its own
   isolated commit before any feature dependencies are installed. Confirm this is acceptable
   as the first task in the implementation phase.

5. **`transactionsSync` pending filter:** Plaid's `pending` field on sync transactions
   should be `false` for posted items. Verify against actual Plaid Node SDK type definitions
   during implementation — the field name may differ from `pending` in some SDK versions.
