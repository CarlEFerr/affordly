# Affordly — Product Direction Brief

**Phase:** 2 — Product Discovery and Problem Framing  
**Status:** Approved  
**Established:** 2026-09-26

This document is the approved product foundation for the Affordly requirements workflow.
It reflects the final product direction reached through the Phase 2 discovery process documented in
`docs/ai-collaboration/prompts.md`.

---

## 1. Problem Statement

When a consumer is evaluating a new recurring payment — most commonly vehicle financing — existing
tools answer the lender's question ("is this person creditworthy?") but not the consumer's question
("how would this payment actually fit the months I just lived through?"). Debt-to-income ratios and
monthly averages conceal variance: they do not reveal that two specific months in the past six would
have been uncomfortably tight. There is no simple, focused tool that replays a proposed obligation
against a consumer's own recent cash flow.

---

## 2. Primary User

A consumer who has a concrete proposed monthly payment amount and wants to understand how it would
have fit their real financial behavior over the last six months. Their defining characteristic is
that their month-to-month financial breathing room is not perfectly predictable — some months are
materially tighter than others — and they are aware of it. They do not require formal lender approval
to have occurred; they simply need a specific dollar amount to evaluate.

The primary MVP scenario is vehicle financing because it is a single, fixed, material, multi-year
commitment made at one decision point.

---

## 3. Primary Job-to-be-Done

Understand how a specific new monthly payment would have affected each of the last six complete
months, using the user's own primary checking account history rather than averages or ratios.

---

## 4. Primary MVP Scenario

A consumer considering a vehicle financing offer at a specific monthly payment uses Affordly to
replay that obligation against their six most recent complete months. They enter the proposed
payment, set the minimum monthly cushion they want to preserve, and see — month by month — whether
each month would have remained above their cushion, fallen below it, or gone cash-flow negative.
They can adjust the payment amount and watch the six-month view update in real time. They can expand
any month to understand what drove its cash flow.

---

## 5. Product Thesis

Lenders evaluate whether they are comfortable extending credit. Affordly helps consumers evaluate
whether they are personally comfortable accepting it — using their own recent financial history as
the evidence base rather than statistical averages.

---

## 6. What Affordly Does

- Accepts a proposed monthly payment amount from the user
- Accepts a monthly cushion target from the user
- Analyzes the six most recent complete calendar months of primary checking account activity
  (minimum three months required for Plaid; Demo Mode always provides six)
- Computes monthly net cash flow per historical month: total posted cash in minus total posted cash
  out through the primary checking account (all account transfers included)
- Applies the proposed payment as an additional monthly outflow to each historical month
- Displays six month cards: original monthly cushion, simulated monthly cushion, and month status
- Summarizes how many months fall into each status category
- Allows the user to adjust the proposed payment and see all six months update without a page reload
- Allows the user to expand an individual month to see: total cash in, total cash out, original
  monthly cash flow, simulated monthly cash flow, and the three largest individual cash movements
  (by absolute value, including both inflows and outflows)
- Supports two data modes: deterministic Demo Mode and live Plaid Sandbox, normalized to the same
  internal model before the analysis engine runs

---

## 7. What Affordly Explicitly Does Not Claim

- Whether the user can or cannot afford the payment
- Any prediction of future financial conditions
- Any recommendation to accept or decline a financing offer
- That historical performance will repeat
- Accuracy about intra-month liquidity, payment timing, or daily balance reconstruction
- Any form of financial advice, lending guidance, or creditworthiness assessment

---

## 8. Core Interaction

1. User arrives in Demo Mode (analysis visible immediately) or initiates Plaid Sandbox connection
2. User sees proposed payment input and monthly cushion input — both pre-filled with visible
   demo/default values
3. Six month cards render showing status, original cushion, and simulated cushion per month
4. A summary statement shows counts across the three status categories
5. User changes the proposed payment amount — all cards and the summary update without a page reload
6. User changes the cushion target — same update
7. User expands a month card to see cash-in total, cash-out total, simulated cushion, and the three
   largest cash movements for that month
8. User can switch between Demo Mode and Plaid Sandbox if not already connected

---

## 9. Definitions

### Monthly cash flow
Total cash in minus total cash out for a given complete calendar month, as measured through all
posted transactions to the primary checking account. All cash movement through the account is
included — there are no exclusions for account transfers.

### Monthly cushion
The amount of monthly cash flow the user personally wants to remain after all normal outflows. It is
user-defined, adjustable at any time, and not an Affordly recommendation or universal threshold. For
Demo Mode, a visible default value is pre-filled. For Plaid Mode, the input starts with a suggested
default (labeled as such) so the analysis renders immediately.

### Complete month
A calendar month that has fully elapsed. The current calendar month, regardless of how many days
have passed, is not a complete month and is not included in the analysis.

### Posted transaction
A transaction that has fully settled and is reflected in the account's transaction history. Pending
transactions are not posted and do not participate in the analysis.

---

## 10. Month Status Rules

Each historical month receives one of three statuses derived from simulated monthly cash flow and
the user's cushion target:

| Condition | Status |
|---|---|
| Simulated monthly cash flow < $0 | **Negative** |
| Simulated monthly cash flow ≥ $0 and < cushion target | **Below cushion** |
| Simulated monthly cash flow ≥ cushion target | **Above cushion** |

These are descriptive retrospective simulation states. They must not be labeled or styled as
good/bad, safe/unsafe, affordable/unaffordable, or recommended/not recommended.

Summary language example:
> "With a $475 monthly payment, 2 of your last 6 months would have fallen below your $300 cushion.
> 1 of those months would have been negative."

---

## 11. Plaid History Rules

| Available complete months | Behavior |
|---|---|
| 6 | Full analysis; standard display |
| 3–5 | Analysis runs; actual date range displayed; no pretense that 6 months were analyzed |
| Fewer than 3 | Analysis does not run; user sees explanation that at least 3 complete months are required |

Demo Mode always provides exactly 6 complete months of deterministic data.

---

## 12. Success Criteria for the MVP

- The deterministic demo produces a correct, readable, meaningful backtest result that a reviewer
  can experience without connecting any external account
- The Plaid Sandbox path retrieves test data through a live Plaid Sandbox API integration and
  produces the same quality of analysis through the same UI
- A first-time user can identify what question the product answers within 30 seconds without
  documentation
- No output language implies the product knows whether the user can or should afford the payment
- The analyzed date range is visible in the UI
- Changing the proposed payment or cushion target updates all six month cards without a full page
  reload
- The product functions without authentication, a database, or a production Plaid environment
- The implementation follows Kiro's spec-driven workflow: requirements, then design, then tasks,
  then code

---

## 13. Explicit MVP Non-Goals

- Authentication, user accounts, or session persistence
- Database storage of any financial data
- Production Plaid environment (Sandbox only)
- Continuous transaction synchronization or webhooks
- Multiple scenario comparison
- Future cash flow projection
- Spending categorization or budget features
- Credit card transaction aggregation or itemization
- Savings rate analysis
- Payment timing or intra-month liquidity modeling
- Anomaly detection or AI-generated explanations
- Ability to exclude months from the analysis
- Multi-account aggregation across checking, savings, and credit accounts

---

## 14. Key Assumptions and Limitations

These must appear in the product README and at minimum one in-app disclosure:

1. **Monthly granularity only.** Cash flow is analyzed at the monthly level. Timing within a month —
   when income arrives, when bills are due — is not modeled.

2. **Primary checking account only.** Credit card charges are not individually counted; what appears
   in the analysis is the lump-sum payment from checking. This avoids double-counting but also means
   itemized card spending is not visible.

3. **All cash movement through the primary checking account is measured.** Transfers between the
   user's own accounts — for example, a transfer to savings or a savings draw — appear as cash
   outflows or cash inflows respectively, because they represent real movement through the primary
   checking account. Large inter-account transfers can materially affect a month's apparent cash
   flow. The month-detail view helps users identify when this occurred.

4. **One-time inflows can inflate individual months.** Tax refunds, bonuses, and large one-time
   transfers will make that month appear healthier than typical. The month-detail view allows users
   to identify these.

5. **Six months may not represent the future.** Seasonal patterns, income changes, and life events
   after the analysis window are not captured.

6. **Spending behavior is modeled as fixed.** The analysis does not account for how a user's
   spending would adapt if the payment were added.

7. **This is a consumer exploration tool.** It is not a lending decision, financial advice, or
   guarantee of any outcome.
