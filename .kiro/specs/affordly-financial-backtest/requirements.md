# Affordly Financial Backtest — Requirements

**Spec:** affordly-financial-backtest  
**Phase:** 3 — Formal Requirements Specification  
**Status:** Approved — Phase 3  
**Authoritative product context:** `docs/product/product-direction.md`

---

## Introduction

Affordly helps a consumer evaluate a proposed recurring monthly financial commitment by
retrospectively applying that payment to their own recent monthly cash-flow history.

The product answers one question:

> **How would this monthly payment have fit into the financial months I just lived through?**

It does not answer "Can I afford this?" and must never imply that it does.

The MVP supports two data modes that share a single analysis engine:

- **Demo Mode** — deterministic sample data; always available; makes the product immediately
  understandable without external setup.
- **Plaid Sandbox** — transaction data retrieved through the Plaid API using a Sandbox environment.
  This demonstrates the external financial-data integration; it is not a live connection to the
  user's real bank account.

All requirements derive from the approved Product Direction Brief. Any scope not present in that
brief is excluded.

---

## Definitions

These definitions apply throughout this document and must be consistently applied in implementation.

| Term | Definition |
|---|---|
| **Monthly cash flow** | Total cash in minus total cash out for a given complete calendar month, as measured through the primary checking account. All posted transactions are included; no account transfers are excluded. |
| **Cash in** | Sum of all posted credits and deposits to the primary checking account for a month, including transfers received from other accounts. |
| **Cash out** | Sum of all posted debits and withdrawals from the primary checking account for a month, including transfers made to other accounts. |
| **Simulated monthly cash flow** | Monthly cash flow minus the proposed monthly payment. |
| **Monthly cushion** | The user-defined minimum amount of monthly cash flow the user wants to remain after all outflows and the proposed payment. Not an Affordly recommendation. |
| **Complete month** | A calendar month that has fully elapsed before the current calendar month. The current partial month is never included. |
| **Posted transaction** | A transaction that has fully settled and is reflected in the account's transaction history. Pending transactions are not posted and must not participate in analysis. |
| **Proposed payment** | The positive monthly dollar amount the user is evaluating as a hypothetical new recurring obligation. |
| **Primary checking account** | The single checking account used as the data source for Plaid Mode analysis. When exactly one checking account is available from a Plaid Sandbox connection, it is used automatically. When multiple checking accounts are available, it is the account the user explicitly selects before the backtest runs. |

---

## Requirements

---

### 1. Demo Mode

**User story:** As a user, I want to see a complete financial backtest immediately upon opening
Affordly using built-in sample data, so that I can understand the product without connecting a bank
account or completing any setup.

#### 1.1
The application MUST present a fully functional backtest in Demo Mode on initial page load, without
requiring any action from the user before results are visible.

#### 1.2
Demo Mode MUST use a deterministic, intentionally authored sample financial dataset containing
exactly six complete calendar months.

#### 1.3
The Demo Mode dataset MUST include at least one month that would be classified as **Negative**, at
least one as **Below Cushion**, and at least one as **Above Cushion** using the pre-filled sample
payment and cushion values — so that all three status states are visible in the default experience.

#### 1.4
Both the proposed payment input and the monthly cushion input MUST be pre-filled with clearly
labeled example values in Demo Mode. These values MUST be visibly identified as examples and MUST
NOT be presented as Affordly recommendations.

#### 1.5
Demo Mode MUST remain accessible at all times: before a Plaid connection attempt, after a
user-cancelled Plaid attempt, and after a failed Plaid connection. It MUST be available as a
fallback path in all Plaid error states.

#### 1.6
Demo Mode is a first-class product experience and MUST be treated as equivalent to Plaid Mode in
the UI — not labeled as a fallback, test mode, or error state when presented initially.

#### 1.7
The Demo Mode dataset MUST contain only finalized, posted-equivalent transaction records. No
pending or incomplete transactions should be present in the sample data.

---

### 2. Proposed Monthly Payment Input

**User story:** As a user, I want to enter a proposed recurring monthly payment amount so that
Affordly can apply it to my historical months and show me how each one would have been affected.

#### 2.1
The application MUST provide a clearly labeled input for the proposed monthly payment amount.

#### 2.2
The payment input MUST accept positive U.S. dollar amounts. Values with more than two decimal
places (sub-cent precision) MUST either be rejected with a clear message or rounded to the nearest
cent before calculation. The input MUST NOT silently accept values that cannot be cleanly
represented as a U.S. dollar amount.

#### 2.3
WHEN the user changes the payment amount to a valid value, the backtest results MUST update without
a full page reload.

#### 2.4
WHEN the payment input is empty, the application MUST NOT display simulated results and MUST
indicate that a payment amount is required to run the backtest.

#### 2.5
WHEN the user enters zero (`$0`) as the payment amount, the application MUST reject the input and
indicate that a payment amount greater than zero is required. A zero payment is not a valid backtest
scenario.

#### 2.6
WHEN the user enters a negative value, the application MUST reject the input and indicate that the
payment amount must be greater than zero.

#### 2.7
WHEN the user enters a non-numeric value or a non-finite numeric value (such as Infinity or NaN),
the application MUST reject the input and not update the backtest.

#### 2.8
The application MUST accept realistic positive currency values and MUST handle large valid payment
amounts without calculation errors or broken visual presentation. The application MUST NOT impose an
arbitrary product-defined maximum payment value.

#### 2.9
All monetary values displayed in results — cash flow amounts, cushion values, transaction amounts —
MUST be formatted as U.S. dollar amounts with a dollar sign and appropriate decimal formatting.

---

### 3. Monthly Cushion Input

**User story:** As a user, I want to define my own monthly cushion target — the minimum amount I
personally want remaining each month after all outflows and the proposed payment — so that
Affordly's status classifications reflect my financial comfort, not a system-defined threshold.

#### 3.1
The application MUST provide a clearly labeled input for the monthly cushion target.

#### 3.2
The cushion input MUST accept U.S. dollar amounts of zero or greater, with or without cents.

#### 3.3
The cushion input MUST be labeled in a way that communicates it is user-defined and not an Affordly
recommendation or universal affordability rule. Labels and supporting copy MUST NOT suggest that any
specific cushion value is "correct," "safe," or "recommended."

#### 3.4
Both Demo Mode and Plaid Mode MUST pre-fill the cushion input with a default starting value clearly
labeled as a suggested starting point — so that the analysis renders immediately without requiring
the user to set a value first.

#### 3.5
WHEN the user changes the cushion value to a valid value, the backtest results MUST update without
a full page reload.

#### 3.6
WHEN the cushion input is empty, the application MUST NOT display status-based month classifications
and MUST indicate that a cushion value is required.

#### 3.7
WHEN the user enters a cushion of zero (`$0`), the application MUST treat it as a valid input.
With a zero cushion: a month is **Above Cushion** if simulated cash flow ≥ $0, and **Negative** if
simulated cash flow < $0. The **Below Cushion** status cannot occur with a zero cushion.

#### 3.8
WHEN the user enters a negative cushion value, the application MUST reject the input and indicate
that the cushion must be zero or a positive number.

---

### 4. Historical Monthly Cash-Flow Calculation

**User story:** As the system, I need to accurately calculate net monthly cash flow for each
analyzed complete calendar month so that the backtest applies the proposed payment to a correct
and consistent financial baseline.

#### 4.1
For each analyzed complete calendar month, the system MUST calculate:

```
monthly cash flow = total cash in − total cash out
```

Cash in and cash out are measured from all posted transactions to the primary checking account for
that month. Transfers between the user's own accounts (e.g., to or from savings) are included
because they represent actual cash movement through the primary checking account.

#### 4.2
For each analyzed complete calendar month, the system MUST calculate:

```
simulated monthly cash flow = monthly cash flow − proposed monthly payment
```

#### 4.3
The analysis MUST target the six most recent complete calendar months. The current partial calendar
month MUST NOT be included. If today is in month M, the most recent complete month is M−1 and the
oldest analyzed month is M−6, for a total of six months.

#### 4.4
WHEN a historical month has zero cash inflow (no posted credits or deposits), the system MUST
compute monthly cash flow as the negative of total cash outflows for that month, or zero if
outflows are also zero. The simulated deduction MUST still be applied.

#### 4.5
WHEN a historical month has zero cash outflow (no posted debits or withdrawals), the system MUST
compute monthly cash flow as equal to total cash inflow. The simulated deduction MUST still be
applied.

#### 4.6
WHEN simulated monthly cash flow is exactly zero ($0), the month status MUST be determined by
applying the classification rules in Requirement 5.1:
- if cushion target is $0: classified as **Above Cushion** (simulated 0 ≥ cushion 0)
- if cushion target is > $0: classified as **Below Cushion** (simulated 0 < cushion)

#### 4.7
WHEN simulated monthly cash flow is exactly equal to the user's cushion target (and both are
positive), the month MUST be classified as **Above Cushion**, per the classification rules in
Requirement 5.1 (simulated cash flow ≥ cushion target → Above Cushion).

#### 4.8
The calculation logic MUST be identical for Demo Mode and Plaid Mode data after normalization.

---

### 5. Month Status Classification

**User story:** As a user, I want each analyzed month to display a descriptive simulation status so
that I can immediately see how the proposed payment would have affected each month relative to my
cushion target.

#### 5.1
Each analyzed month MUST be assigned exactly one of the following statuses, determined solely by
simulated monthly cash flow and the user's cushion target. These rules are canonical — Reqs 4.6 and
4.7 derive from and must remain consistent with this table:

| Condition | Status |
|---|---|
| Simulated monthly cash flow `< $0` | **Negative** |
| Simulated monthly cash flow `≥ $0` AND `< cushion target` | **Below Cushion** |
| Simulated monthly cash flow `≥ cushion target` | **Above Cushion** |

#### 5.2
Month statuses MUST be presented as descriptive retrospective simulation states. The following
terms MUST NOT be used as status labels or directly associated status copy: *affordable*,
*unaffordable*, *safe*, *unsafe*, *good*, *bad*, *pass*, *fail*, *recommended*,
*not recommended*, *can afford*, *cannot afford*.

#### 5.3
WHEN the proposed payment changes, all month statuses MUST be recalculated and updated without a
full page reload.

#### 5.4
WHEN the cushion target changes, all month statuses MUST be recalculated and updated without a
full page reload.

---

### 6. Month Card Display

**User story:** As a user, I want to see each analyzed historical month displayed individually with
its original and simulated financial position, so that I can identify which months would have been
most affected by the proposed payment.

#### 6.1
Each analyzed complete calendar month MUST be displayed as a distinct, individually identifiable
card or section within the main analysis view.

#### 6.2
Each month card MUST display all of the following:
- the month name and year (e.g., "March 2026"),
- the original monthly cash flow (before the proposed payment),
- the simulated monthly cash flow (after the proposed payment),
- the month's status classification (Negative / Below Cushion / Above Cushion).

#### 6.3
The three status states (Negative, Below Cushion, Above Cushion) MUST be visually distinguishable
from each other on the month cards without relying solely on color — at minimum through distinct
visible labels.

#### 6.4
Month cards MUST be displayed in chronological order, with the most recently analyzed month shown
first (M−1) and the oldest shown last (M−6).

#### 6.5
The analyzed historical date range — the earliest and latest complete months included in the
analysis — MUST be visible in the analysis view so the user understands the period being examined.

#### 6.6
WHEN the proposed payment or cushion target changes, all month card values and statuses MUST update
without a full page reload.

#### 6.7
All monetary values displayed on month cards MUST be formatted as U.S. dollar amounts.

---

### 7. Summary Statement

**User story:** As a user, I want a concise summary of how the proposed payment affected the
analyzed months in aggregate, so that I can quickly understand the overall pattern without reading
each month card individually.

#### 7.1
The application MUST display a summary statement reporting how many analyzed months fall into each
relevant status category.

#### 7.2
The summary MUST reference the current proposed payment amount and the current cushion target by
their actual values.

#### 7.3
The summary MUST use explicitly retrospective language — past or conditional-past tense — to
communicate that the analysis describes history, not a prediction. For example: *"would have fallen
below"* rather than *"will fall below"* or *"you cannot afford."*

#### 7.4
WHEN the proposed payment or cushion target changes, the summary MUST update without a full page
reload.

#### 7.5
WHEN all analyzed months are Above Cushion, the summary MUST accurately reflect that zero months
fell below the cushion and zero months were negative.

---

### 8. Month Detail

**User story:** As a user, I want to expand an individual month to see the composition of its cash
flow, so that I can understand why a particular month was financially tighter or healthier than
others — including whether a large transfer materially affected it.

#### 8.1
The user MUST be able to expand or select any individual month card to reveal a detail view for
that month.

#### 8.2
The month detail view MUST display all of the following:
- total cash in for the month,
- total cash out for the month,
- original monthly cash flow (cash in − cash out, before the proposed payment),
- simulated monthly cash flow (original cash flow − proposed payment),
- up to three individual transactions for that month, ordered by absolute value (largest first),
  each showing the transaction description/label and dollar amount.

#### 8.3
The three transactions MUST be selected by absolute dollar value regardless of direction — large
inflows and large outflows compete for the same three slots. This ensures a large one-time inflow
(e.g., a bonus, tax refund, or savings draw) is surfaced when it is among the largest movements in
that month.

#### 8.4
The month detail MUST indicate how many transactions are being shown and that the list is not a
complete transaction history (e.g., "3 largest transactions this month").

#### 8.5
WHEN a month has fewer than three posted transactions, the detail MUST show all available
transactions rather than failing or displaying empty placeholders.

#### 8.6
The month detail MUST NOT include: transaction categorization UI, transaction search, inline charts
within the detail, editable transactions, anomaly detection, or AI-generated explanations.

#### 8.7
The month detail MUST be dismissible — the user can collapse it and return to the primary month
card view.

---

### 9. Plaid Sandbox Integration

**User story:** As a user evaluating this prototype, I want to connect via Plaid Sandbox so that
Affordly can retrieve and analyze transaction data through a real Plaid API integration, demonstrating
that the same backtest analysis can operate on externally sourced financial data.

#### 9.1
The application MUST provide a clearly labeled mechanism for the user to initiate a Plaid Sandbox
connection.

#### 9.2
The Plaid integration MUST use the Plaid Sandbox environment only. Connection to the Plaid
Production environment is outside the MVP scope and MUST NOT be enabled.

#### 9.3
WHEN retrieving Plaid transaction data, the system MUST include only transactions with a posted
status. Pending transactions MUST NOT contribute to cash in, cash out, month detail, the top-three
cash movements, or month-status calculations.

#### 9.4
WHEN the Plaid connection is successfully established and transaction data is retrieved, the
application MUST normalize the Plaid transaction data into the same internal financial-history model
used by Demo Mode before running the analysis engine.

#### 9.5
The analysis engine — monthly cash-flow calculation, simulated deduction, and month-status
classification — MUST operate identically on Demo Mode and Plaid Mode data after normalization.
See Section 13 for the general data-mode consistency requirements.

#### 9.6
WHEN operating in Plaid Mode, the application MUST clearly indicate that the analysis is using Plaid
Sandbox data, not Demo Mode sample data and not live production bank data.

#### 9.7
The user MUST be able to return to Demo Mode from Plaid Mode — either by an explicit user action
or by the application falling back to Demo Mode after a Plaid error or cancellation.

#### 9.8
No authentication, persistent user accounts, or server-side storage of financial data is required
or permitted for this MVP. The application MUST NOT store transaction data beyond the current
session.

---

### 10. Plaid History, Account Selection, and Eligibility

**User story:** As the system, I need to handle varying amounts of Plaid transaction history and
multiple possible account configurations appropriately, so that the analysis is accurate, the
displayed date range reflects what was actually analyzed, and users receive clear explanations when
requirements are not met.

#### 10.1
WHEN the connected Plaid Sandbox account contains six or more complete calendar months of posted
transaction history, the system MUST analyze the six most recent complete calendar months.

#### 10.2
WHEN the connected Plaid Sandbox account contains three to five complete calendar months of posted
transaction history, the system MUST:
- run the analysis on the available complete months,
- display the actual number of months and date range being analyzed,
- NOT present or imply that a full six-month analysis was performed.

#### 10.3
WHEN the connected Plaid Sandbox account contains fewer than three complete calendar months of
posted transaction history, the system MUST NOT run the backtest. The application MUST display a
clear, non-technical explanation that at least three complete months are required, and MUST offer
the user the option to use Demo Mode.

#### 10.4
WHEN exactly one checking account is identifiable among the connected Plaid Sandbox accounts, the
system MUST use that account automatically as the primary checking account for analysis. No account
selection step is required.

#### 10.5
WHEN multiple checking accounts are identifiable among the connected Plaid Sandbox accounts, the
application MUST present the user with a selection of the available checking accounts and MUST NOT
proceed to the backtest until the user has explicitly selected one. The application MUST display the
account identifiers (e.g., account name or masked number) clearly enough for the user to distinguish
between them.

#### 10.6
WHEN no checking account is identifiable among the connected Plaid Sandbox accounts, the system
MUST NOT run the backtest and MUST display a clear explanation, offering the user the option to use
Demo Mode.

#### 10.7
The displayed analysis date range MUST always reflect the actual months analyzed — whether 3, 4, 5,
or 6 — and MUST NOT be hardcoded to "last 6 months" when fewer months were available.

---

### 11. Loading and Error States

**User story:** As a user, I want clear, accurate feedback during Plaid connection attempts and
analysis processing so that I always know the application's current state and what I can do next.

#### 11.1
WHEN a Plaid connection or transaction retrieval is in progress, the application MUST display a
loading indicator and MUST NOT render stale or partially calculated results during the operation.

#### 11.2
WHEN the user cancels a Plaid connection flow, the application MUST return to Demo Mode. A
user-initiated cancellation MUST NOT display an error message.

#### 11.3
WHEN a Plaid API error occurs during connection or transaction retrieval, the application MUST
display a clear, non-technical user-facing message, not expose raw API error codes, and offer the
option to retry or use Demo Mode.

#### 11.4
WHEN Plaid retrieval succeeds but produces fewer than three complete months, the application MUST
display the insufficiency message defined in Requirement 10.3 — not a generic error.

#### 11.5
Displayed results MUST accurately reflect the most recently applied complete, valid input values.
The application MUST NOT display backtest results that are inconsistent with the currently displayed
input values.

#### 11.6
Demo Mode MUST NOT require a user-visible loading state unless sample data requires asynchronous
retrieval. If a loading state is necessary, it MUST indicate the application is loading, not that
an error occurred.

---

### 12. Retrospective Language and Product Disclosure

**User story:** As a user, I want at least one clear, visible statement in the application
confirming that the analysis is retrospective and does not predict my future financial situation,
so that I do not misinterpret historical results as a guarantee or recommendation.

#### 12.1
The application MUST include at least one clearly visible, in-product disclosure stating that the
analysis is based on historical data and does not predict future financial performance. This
disclosure MUST be visible in the main analysis view without requiring navigation to a separate page
or opening a modal.

#### 12.2
All result language — month card values, month statuses, summary statement, and month detail —
MUST use past or conditional-past tense. Examples of required tense: *"would have been," "fell
below," "was negative," "would have left."*

#### 12.3
The application MUST NOT contain any language stating or implying that the user can afford the
proposed payment.

#### 12.4
The application MUST NOT contain any language stating or implying that the user cannot afford the
proposed payment.

#### 12.5
The application MUST NOT contain any language recommending that the user accept or decline a
financing offer.

#### 12.6
The in-product disclosure MUST NOT be styled as a warning or error state. It is an informational
product boundary statement.

---

### 13. Data Mode Consistency

**User story:** As a user, I want the same analysis logic to apply regardless of whether I use Demo
Mode or Plaid Mode, so that both experiences are trustworthy and produce comparable results.

#### 13.1
The application MUST use a single normalized internal financial-history model as the input to the
analysis engine, regardless of whether data originates from Demo Mode or Plaid.

#### 13.2
Demo Mode data and Plaid Mode data MUST both be converted into the normalized model before the
analysis engine runs. The analysis engine MUST NOT contain logic that branches based on data source.

#### 13.3
The month-status classification rules (Requirement 5) MUST produce identical results for identical
financial data regardless of its source mode.

#### 13.4
The month-detail display (Requirement 8) MUST function identically for Demo Mode and Plaid Mode
data.

---

### 14. Visual Design, Responsiveness, and Accessibility

**User story:** As a user, I want the application to look intentional and polished, be accessible,
and work fully on both mobile and desktop, so that I can understand and use it regardless of the
device or context in which I encounter it.

#### 14.1
The application visual and interaction design MUST use the Nymbus Joy Design System as its primary
design reference where applicable. Specific implementation choices — color tokens, typography scale,
spacing values, component patterns — belong to the technical design phase after the Nymbus Joy
documentation has been inspected.

#### 14.2
The application MUST have clear visual hierarchy that makes the primary inputs (payment amount and
cushion), the month cards, and the summary statement visually distinguishable from each other and
from supporting UI.

#### 14.3
The three month statuses (Negative, Below Cushion, Above Cushion) MUST be visually distinguishable
without relying solely on color — at minimum through distinct visible text labels.

#### 14.4
All interactive controls — inputs, buttons, expandable month cards — MUST use appropriate semantic
HTML elements so that assistive technologies can identify and operate them.

#### 14.5
All interactive elements MUST have accessible labels or programmatically associated label elements.
Placeholder text alone MUST NOT serve as the accessible label for an input.

#### 14.6
Interactive elements MUST have visible focus indicators to support keyboard navigation.

#### 14.7
The core Affordly workflow MUST be fully functional and visually intentional starting at
approximately 375px viewport width. Mobile is the primary UX consideration for this product.

#### 14.8
At mobile viewport widths (approximately 375px and above), all of the following MUST remain fully
available and operable without horizontal scrolling: payment and cushion inputs, summary statement,
all analyzed month cards, month detail expansion, Plaid connection initiation, account selection
(when multiple checking accounts are present), and all disclosures and validation messages.

#### 14.9
At tablet and desktop viewport widths, 100% of the same functionality MUST be available. Layouts
MAY adapt to make better use of available space. No functionality may be exclusive to mobile or
exclusive to desktop. The experience MUST remain polished and appropriate for browser-based review
at any common screen width.

#### 14.10
Empty, loading, error, and success states MUST be visually distinct so that users can identify the
application's current state without relying solely on the presence or absence of content.

---

## Edge Case Summary

The following input and data edge cases MUST be handled correctly. All are covered by individual
requirements above and listed here for traceability:

| Edge case | Requirement(s) |
|---|---|
| Payment amount = $0 (invalid) | 2.5 |
| Payment amount is negative | 2.6 |
| Payment amount is empty | 2.4 |
| Payment amount is non-numeric or non-finite | 2.7 |
| Payment amount has more than 2 decimal places | 2.2 |
| Payment amount is very large but valid | 2.8 |
| Cushion = $0 (valid) | 3.7, 5.1 |
| Cushion is negative | 3.8 |
| Cushion is empty | 3.6 |
| Simulated cash flow = $0 exactly | 4.6, 5.1 |
| Simulated cash flow = cushion exactly (positive) | 4.7, 5.1 |
| Month has zero cash inflow | 4.4 |
| Month has zero cash outflow | 4.5 |
| Plaid account has 0–2 complete months | 10.3 |
| Plaid account has 3–5 complete months | 10.2 |
| Plaid account has exactly one checking account | 10.4 |
| Plaid account has multiple checking accounts | 10.5 |
| No primary checking account identifiable | 10.6 |
| Pending transactions present in Plaid data | 9.3 |
| Month detail has fewer than 3 transactions | 8.5 |
| All months are Above Cushion | 7.5 |
| Plaid connection cancelled by user | 11.2 |
| Plaid API error | 11.3 |

---

## Assumptions and Limitations (Requirements-Level)

The following product-boundary statements derive from the approved Product Direction Brief. They
must appear in the README and at least one in-product location:

1. Analysis is at monthly granularity. Timing within a month — when income arrives or bills are
   due — is not modeled.
2. Analysis covers the primary checking account only. Credit card charges appear as the lump-sum
   payment from checking; individual purchases are not itemized.
3. All cash movement through the primary checking account is measured, including account transfers.
   A transfer to savings appears as cash outflow; a savings draw appears as cash inflow. Large
   inter-account transfers can materially affect a month's apparent cash flow. The month-detail view
   helps users identify this.
4. One-time inflows (tax refunds, bonuses, transfers from savings) can make individual months appear
   healthier than typical. The month-detail view helps users identify these.
5. Six months may not represent the future. Seasonal patterns, income changes, and life events are
   not captured.
6. Spending behavior is modeled as fixed. The analysis does not account for how spending would
   adapt if the payment were added.
7. This is a consumer exploration tool. It is not financial advice, a lending decision, or a
   guarantee of any outcome.

---

## Non-Goals (Requirements Boundary)

The following are explicitly outside scope and MUST NOT appear as requirements or be introduced
during implementation:

- Authentication, user accounts, or session persistence
- Database storage of financial data
- Production Plaid environment
- Plaid webhooks or continuous synchronization
- Multiple scenario comparison
- Future cash-flow projection
- Spending categorization or budget features
- Credit card transaction aggregation
- Savings analysis or recommendations
- Payment timing or intra-month modeling
- Sophisticated inter-account transfer matching or exclusion
- Anomaly detection or AI explanations
- Ability to exclude individual months from the analysis
- Financial advice, lending guidance, or credit assessment
- DTI calculation or credit score display
- Native mobile applications, App Store or Google Play distribution
