# Affordly

A retrospective financial backtest tool that answers a specific question: **how would a proposed monthly payment have fit into the months you just lived through?**

> **Live demo:** https://affordly-six.vercel.app

---

## The Problem

When a consumer evaluates a new recurring payment — most commonly vehicle financing — existing tools answer the lender's question: *is this person creditworthy?* They do not answer the consumer's question: *how would this payment actually fit the months I just lived through?*

Debt-to-income ratios and monthly averages conceal variance. They do not reveal that two specific months in the past six would have been uncomfortably tight. There is no simple, focused tool that replays a proposed obligation against a consumer's own recent cash flow.

Affordly fills that gap.

---

## Who It's For

A consumer who has a concrete proposed monthly payment amount and wants to understand how it would have affected their real financial behavior over the last six months. Their defining characteristic is that their month-to-month breathing room is not perfectly predictable — some months are materially tighter than others — and they know it.

**Primary scenario:** a vehicle financing offer with a specific monthly payment. The consumer enters the proposed amount, sets a minimum monthly cushion they want to preserve, and sees — month by month — whether each recent month would have stayed above their cushion, fallen below it, or gone cash-flow negative.

---

## How the Backtest Works

Affordly performs a simple, transparent simulation:

1. **Retrieve history.** The app uses posted checking-account transactions for the last six complete calendar months (minimum three required for Plaid data; Demo Mode always provides six). The current calendar month is never included — it hasn't finished yet.

2. **Compute monthly cash flow.** For each month: total posted cash in minus total posted cash out, measured through the primary checking account. All account activity is included — there are no exclusions for transfers.

3. **Simulate the payment.** Subtract the proposed payment from each month's actual cash flow to produce a simulated cash flow.

4. **Classify each month** into one of three descriptive states based on the simulated result and the user's cushion target:

   | Condition | Status |
   |---|---|
   | Simulated cash flow < $0 | **Negative** |
   | Simulated cash flow ≥ $0 and < cushion target | **Below Cushion** |
   | Simulated cash flow ≥ cushion target | **Above Cushion** |

   These are descriptive simulation states. Affordly never claims the user can or cannot afford the payment.

5. **Display.** Six month cards render with the original and simulated cash flow for each month. A summary statement shows how many months fell into each category. Any month can be expanded to see cash-in total, cash-out total, and the three largest individual transactions by absolute value.

---

## Demo Mode

Affordly opens in Demo Mode — no account connection required. A pre-authored six-month dataset for a fictional persona (Alex Chen) loads immediately with realistic cash-flow variance: one month goes negative (annual insurance bill), two months fall below cushion, three months stay above cushion. Default values of **$475/month payment** and **$300 cushion** are pre-filled so analysis is visible the moment the page loads.

You can change the payment or cushion and watch all six month cards update in real time. Expanding any card shows the cash-in/out totals and the largest transactions for that month.

Demo Mode is the intended first experience and is fully representative of what Plaid data produces.

---

## Plaid Sandbox Integration

Affordly integrates with the **Plaid Sandbox** — Plaid's test environment with scripted test users and synthetic transaction data. This is not a live bank connection; no real financial data is accessed.

### What Plaid integration demonstrates

- The full Plaid Link OAuth flow (link token → Link modal → public token → server-side exchange)
- Server-side `transactionsSync` pagination with reconciliation (added/modified/removed transactions)
- Sign normalization from Plaid's convention (positive = debit) to Affordly's convention (positive = inflow)
- Pending transaction exclusion
- Conservative boundary month exclusion (the month containing the earliest transaction is excluded from analysis to avoid partial-month distortion)
- Multi-account selection when a Plaid connection returns more than one checking account

### How to connect in Sandbox

1. Ensure Plaid credentials are configured (see **Environment Variables** below).
2. On the main page, click **Connect Plaid Sandbox**.
3. In the Plaid Link modal, use a **Sandbox test user** — for example:
   - Username: `user_good`, Password: `pass_good` (standard Plaid Sandbox user)
   - Or a custom user configured with `days_requested: 210` for broader history
4. After Link completes, Affordly exchanges the public token server-side and runs the same backtest engine used by Demo Mode.

The `access_token` never reaches the browser and is discarded at the end of the API request — Affordly has no database and no session persistence.

---

## Product Limitations

These limitations apply to all modes and are stated in the in-app disclosure:

1. **Monthly granularity only.** Cash flow is analyzed at the monthly level. Timing within a month — when income arrives, when bills are due — is not modeled.

2. **Primary checking account only.** Credit card charges are not individually counted; what appears in the analysis is the lump-sum payment from checking. This avoids double-counting but itemized card spending is not visible.

3. **All cash movement through the checking account is measured.** Transfers between your own accounts (e.g., a transfer to savings) appear as cash outflows or inflows, because they represent real movement through the primary account. Large inter-account transfers can materially affect a month's apparent cash flow. The month-detail view helps identify when this occurred.

4. **One-time inflows can inflate individual months.** Tax refunds, bonuses, and large one-time transfers will make that month appear healthier than typical. Expand the month card to identify these.

5. **Six months may not represent the future.** Seasonal patterns, income changes, and life events after the analysis window are not captured.

6. **Spending behavior is modeled as fixed.** The analysis does not account for how a user's spending would adapt if the payment were added.

7. **This is a consumer exploration tool.** It is not a lending decision, financial advice, or guarantee of any outcome.

---

## Local Development Setup

### Prerequisites

- **Node.js** v18 or later (developed and tested on v26)
- **pnpm** v8 or later (project uses pnpm@12.6.0; install with `npm install -g pnpm`)
- **Plaid developer account** (free Sandbox tier) — only required for the Plaid path; Demo Mode works without it

### Install dependencies

```bash
pnpm install
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in your Plaid Sandbox credentials:

```bash
cp .env.example .env.local
```

```
PLAID_CLIENT_ID=   # from https://dashboard.plaid.com — "Keys" section
PLAID_SECRET=      # Sandbox secret from the same location
PLAID_ENV=sandbox
```

`.env.local` is gitignored and must never be committed.

---

## Running the App

| Command | What it does |
|---|---|
| `pnpm dev` | Start the development server at `http://localhost:3000` |
| `pnpm build` | Produce a production build |
| `pnpm start` | Serve the production build locally |
| `pnpm test` | Run the full test suite (154 tests) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | Run TypeScript compiler check (`tsc --noEmit`) |

Demo Mode works immediately on `pnpm dev` — no Plaid credentials needed to see the full analysis experience.

---

## Key Product Decisions

### Retrospective framing, not affordability scoring

Affordly does not produce an affordability verdict. It never says "you can afford this" or "you can't afford this." The output is a factual simulation of what each historical month would have looked like with the payment subtracted. Status labels (Negative, Below Cushion, Above Cushion) are descriptive — not judgmental.

This framing is deliberate: the product helps consumers ask their own question, not answer it for them.

### Mobile-primary design

The layout is designed first for a 375px viewport (modern mobile phone). All interactive elements meet 44px minimum touch target heights. The payment and cushion inputs flow side by side on wider screens but stack vertically on mobile. Month cards remain in a single column on all screen sizes to preserve the sequential narrative of the six-month history.

### Client-side analysis engine

The backtest runs entirely in the browser — no server-side computation beyond the Plaid token exchange. This means:
- Analysis updates instantly as the user changes the payment or cushion (no round-trips)
- No financial data is stored, logged, or transmitted to any server
- The same engine runs identically for Demo Mode and Plaid Mode — no separate code paths

The analysis module (`src/lib/analysis/`) has zero imports from React, Next.js, or Plaid and is independently testable as pure TypeScript.

---

## Key Technical Decisions

### pnpm

The project uses pnpm as its package manager to meet the Nymbus FIAT prerequisite. The `packageManager` field in `package.json` pins the exact version used. No `package-lock.json` is present.

### `transactionsSync` over `transactionsGet`

The integration uses Plaid's `transactionsSync` endpoint (current Plaid recommendation) rather than the deprecated `transactionsGet`. This supports proper reconciliation of added, modified, and removed transactions across paginated responses and handles the `TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION` restart case.

### Conservative boundary month

The month containing the earliest retrieved transaction is excluded from analysis. This prevents partial-month distortion where only a few days of transactions would be treated as a full month's cash flow. The first *complete* month after that boundary is the earliest month included in the backtest.

### `firstSupportedMonth` as explicit metadata

The demo adapter and Plaid adapter both set `firstSupportedMonth` explicitly on the `FinancialHistory` object. The analysis engine reads this field and never infers coverage from transaction presence. This makes the boundary logic explicit, independently testable, and correct for zero-transaction months within the analysis window.

### Bounded retry over webhooks

Plaid Transactions data is processed asynchronously after the access token is issued. Rather than implementing webhooks (which require a persistent server and session storage), Affordly uses a bounded retry loop (3 attempts × 1,500 ms) to wait for `HISTORICAL_UPDATE_COMPLETE`. If the history isn't ready within the retry window, the user sees a clear "not ready yet" message with an invitation to retry manually.

---

## Nymbus FIAT Status

Affordly uses `@nymbus/fiat@1.8.1` and `@nymbus/fiat-tokens@1.7.1` from Nymbus's private Nexus registry, integrated as Task 11 after Checkpoint E deployment.

**Integration summary:**
- `ClientThemeProvider` from `@nymbus/fiat` wraps the application root via `ThemeProviderWrapper`
- `@nymbus/fiat-tokens/tokens.css` + `theme.css` provide the complete Nymbus token set
- `Button`, `Badge`, `Spinner`, `Card` are now FIAT components
- `globals.css` contains a bridge `@theme` block that maps Affordly's internal `--color-*` variable names to verified FIAT semantic tokens — all component class names are unchanged, only the values behind them now come from the design system
- `StatusBadge` retains a local wrapper: FIAT `Badge` type values (`"success"`, `"danger"`) would imply a pass/fail affordability verdict, violating Req 5.2. The wrapper uses FIAT color tokens through the bridge without carrying their semantic labels
- `CurrencyInput` retains its current implementation: FIAT's `Field`/`InputGroup` pattern could replace the presentational shell in a future dedicated pass without changing the validation logic

**Installation note:** pnpm 12's HTTP client (undici) has a TLS compatibility issue with the Nymbus development CA certificate. Packages are installed via local tarballs in `vendor/` with `pnpm-workspace.yaml` overrides. To set up locally, download the tarballs from Nexus after connecting to the Nymbus VPN and place them in `vendor/` before running `pnpm install`.

---

## What Would Be Done With More Time

- **CurrencyInput FIAT shell.** The `CurrencyInput` component retains its custom implementation. FIAT's `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, and `InputGroup` components could replace the presentational shell while keeping the validation/debounce logic unchanged.

- **Production Plaid environment.** The current integration targets Plaid Sandbox only. Moving to production requires a separate Plaid `PLAID_SECRET` for the production environment, updated environment variables in the deployment platform, and removal of Sandbox-specific test users from documentation.

- **Session persistence.** Affordly currently has no database and no authentication. The Plaid access token is discarded after each request. Adding optional session persistence (encrypted token storage, user accounts) would allow reconnection without re-running Plaid Link.

- **Webhook-based readiness.** The bounded retry is a pragmatic MVP choice. A production implementation would use Plaid webhooks (`TRANSACTIONS_INITIAL_UPDATE`, `TRANSACTIONS_HISTORICAL_UPDATE`) for reliable readiness signaling without polling.

- **Deeper analysis window.** The engine supports up to 6 months. With more history available, a 12-month window would reveal stronger seasonal patterns. The analysis pipeline would need a configurable window length and updated summary language.

- **Anomaly surfacing.** The month-detail view currently shows the three largest transactions factually. A follow-on feature would surface notable anomalies (unusually large months, one-time inflows) with plain-language explanations to help users interpret the results — without crossing into financial advice territory.

- **More test coverage.** Component render tests for AccountSelector, DataModeBar, and the Plaid error states (history_preparing vs. connection_failed) would increase confidence in the UI layer. Integration tests for the full Plaid API round-trip (using MSW or a Plaid mock) would reduce dependence on manual Sandbox testing.

---

## Project Structure

```
affordly/
├── src/
│   ├── app/                    # Next.js App Router (layout, page, API routes)
│   │   ├── api/plaid/          # Server-side: link-token and connect endpoints
│   │   ├── globals.css         # Provisional design tokens (@theme block)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/             # React UI components
│   │   ├── ui/                 # Provisional primitives (Button, Badge, etc.)
│   │   ├── AffordlyApp.tsx     # Root client component; owns all state
│   │   ├── InputPanel.tsx      # Payment + cushion inputs with 200ms debounce
│   │   ├── BacktestSummary.tsx # Aggregate summary statement
│   │   ├── MonthCard.tsx       # Expandable per-month card
│   │   ├── MonthCardList.tsx   # Ordered list of month cards
│   │   ├── AccountSelector.tsx # Inline account picker (multiple Plaid accounts)
│   │   ├── DataModeBar.tsx     # Mode indicator + Plaid connect button
│   │   ├── PlaidConnector.tsx  # react-plaid-link integration
│   │   └── Disclosure.tsx      # Retrospective disclaimer
│   ├── lib/
│   │   ├── analysis/           # Pure financial engine (no React/Plaid imports)
│   │   ├── adapters/           # demo.ts + plaid.ts → FinancialHistory
│   │   ├── demo/               # Deterministic demo dataset
│   │   ├── plaid/              # Plaid client + transactionsSync
│   │   ├── api/                # API boundary types
│   │   └── utils/              # currency.ts, date.ts
│   └── __tests__/              # Vitest test suite (154 tests)
├── docs/
│   ├── product/                # Product Direction Brief
│   └── ai-collaboration/       # Kiro prompt capture log
├── .kiro/
│   └── specs/affordly-financial-backtest/  # requirements.md, design.md, tasks.md
├── .env.example                # Env variable template (safe to commit)
└── pnpm-lock.yaml
```

---

## Built With Kiro

This project was built using [Kiro](https://kiro.dev) — an AI-powered development environment. The development followed Kiro's spec-driven workflow:

1. **Phase 1:** Product discovery and problem framing
2. **Phase 2:** Requirements specification (94 requirements across 14 sections)
3. **Phase 3:** Technical design (normalized domain model, analysis pipeline, Plaid integration architecture)
4. **Phase 4:** Implementation task breakdown (10 required tasks + 1 conditional FIAT task across 5 checkpoints)
5. **Phases 5–9:** Implementation, checkpoint review, and polish

The full collaboration log — every prompt and agent response across all phases — is documented in `docs/ai-collaboration/prompts.md`.
