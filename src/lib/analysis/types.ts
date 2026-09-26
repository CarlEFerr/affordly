/**
 * Source-independent financial domain types for the Affordly analysis engine.
 *
 * This module must remain free of React, Next.js, Plaid, and FIAT imports.
 * API boundary types (AffordlyErrorCode, ApiErrorResponse, PlaidConnectResponse,
 * CheckingAccountOption) are NOT here — they belong in the API layer (Task 6).
 */

/** Month key in "YYYY-MM" format, e.g. "2026-03" */
export type MonthKey = string;

/**
 * A single normalized checking-account transaction.
 *
 * Sign convention (source-agnostic):
 *   positive amount = cash INTO the checking account (inflow / credit)
 *   negative amount = cash OUT of the checking account (outflow / debit)
 *
 * Plaid adapter is responsible for flipping the sign from Plaid's convention
 * (where positive = debit) to this convention before producing a FinancialHistory.
 */
export interface NormalizedTransaction {
  id: string;
  date: string;        // ISO date: "YYYY-MM-DD"
  amount: number;      // positive = cash in; negative = cash out
  description: string;
}

/**
 * The source-independent normalized financial history consumed by the analysis engine.
 *
 * firstSupportedMonth carries explicit coverage metadata established by the adapter.
 * The engine must read this field to determine the supported analysis window.
 * The engine must NOT infer coverage from transaction presence.
 *
 * Adapter contracts:
 *   Demo adapter   → sets firstSupportedMonth = M−6 (all six months guaranteed)
 *   Plaid adapter  → sets firstSupportedMonth = the calendar month AFTER the
 *                    boundary month (the month containing the earliest retrieved
 *                    posted transaction), or null when coverage cannot be established
 */
export interface FinancialHistory {
  source: 'demo' | 'plaid';
  accountName: string;
  transactions: NormalizedTransaction[];
  /**
   * Earliest complete calendar month that may safely participate in the backtest.
   * null = adapter could not establish coverage → engine returns ineligible.
   */
  firstSupportedMonth: MonthKey | null;
}

/** Aggregated cash-flow data for one complete calendar month */
export interface MonthlyAggregation {
  monthKey: MonthKey;
  label: string;              // e.g. "March 2026"
  cashIn: number;             // sum of positive transaction amounts
  cashOut: number;            // absolute sum of negative transaction amounts
  cashFlow: number;           // cashIn − cashOut
  topTransactions: NormalizedTransaction[]; // up to 3, sorted by |amount| descending
}

/**
 * Descriptive simulation status — reflects historical behaviour only.
 * Must never imply an affordability verdict (Req 5.2).
 */
export type MonthStatus = 'negative' | 'below-cushion' | 'above-cushion';

/** A simulated month: the aggregation extended with the hypothetical-payment result */
export interface SimulatedMonth extends MonthlyAggregation {
  simulatedCashFlow: number;  // cashFlow − proposedPayment
  status: MonthStatus;
}

/** The complete backtest result when sufficient history is available */
export interface BacktestResult {
  months: SimulatedMonth[];   // most-recent first: index 0 = M−1, last index = oldest
  proposedPayment: number;
  cushionTarget: number;
  countNegative: number;
  countBelowCushion: number;
  countAboveCushion: number;
  totalMonths: number;        // 3, 4, 5, or 6
  periodLabel: string;        // e.g. "April 2026 – September 2026"
}

/**
 * Typed ineligibility result.
 * Returned instead of throwing when the history does not support ≥ 3 complete months.
 */
export interface IneligibleHistory {
  ineligible: true;
  reason: 'insufficient-history';
}

/** Union output type from runBacktest */
export type BacktestOutput = BacktestResult | IneligibleHistory;

/** Type guard: narrows a BacktestOutput to IneligibleHistory */
export function isIneligible(output: BacktestOutput): output is IneligibleHistory {
  return 'ineligible' in output && (output as IneligibleHistory).ineligible === true;
}
