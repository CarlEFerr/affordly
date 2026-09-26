/**
 * Public API for the Affordly financial analysis engine.
 *
 * The entire pipeline:
 *   FinancialHistory (with firstSupportedMonth)
 *   → selectCompleteMonths
 *   → aggregateMonth  (per month)
 *   → simulateMonth   (per month)
 *   → BacktestResult
 *
 * Source-independence guarantee:
 *   The engine does NOT inspect history.source.
 *   Adapters (Demo / Plaid) are responsible for producing a correctly formed
 *   FinancialHistory. The engine consumes it identically regardless of origin.
 */

import type {
  FinancialHistory,
  BacktestResult,
  BacktestOutput,
  SimulatedMonth,
  MonthKey,
} from './types';
import { selectCompleteMonths } from './months';
import { aggregateMonth } from './aggregation';
import { simulateMonth } from './simulation';
import { monthKeyToLabel } from '../utils/date';

function buildPeriodLabel(months: MonthKey[]): string {
  if (months.length === 0) return '';
  // months[0] = most recent (M−1); months[last] = oldest
  const oldest = months[months.length - 1];
  const newest = months[0];
  return `${monthKeyToLabel(oldest)} – ${monthKeyToLabel(newest)}`;
}

/**
 * Runs the complete financial backtest for a proposed monthly payment.
 *
 * @param history         - normalized financial history from Demo or Plaid adapter
 * @param proposedPayment - user-entered monthly payment (must be > 0 per Req 2.5)
 * @param cushionTarget   - user-entered monthly cushion target (>= 0 per Req 3.7)
 * @param today           - injectable for deterministic tests (default: new Date())
 *
 * @returns BacktestResult when sufficient history exists; IneligibleHistory otherwise.
 *          Never throws for expected product states.
 */
export function runBacktest(
  history: FinancialHistory,
  proposedPayment: number,
  cushionTarget: number,
  today: Date = new Date()
): BacktestOutput {
  const monthsResult = selectCompleteMonths(history, today);

  if ('ineligible' in monthsResult) {
    return { ineligible: true, reason: 'insufficient-history' };
  }

  const monthKeys = monthsResult;

  const simulatedMonths: SimulatedMonth[] = monthKeys.map(monthKey => {
    const aggregation = aggregateMonth(history.transactions, monthKey);
    return simulateMonth(aggregation, proposedPayment, cushionTarget);
  });

  const countNegative = simulatedMonths.filter(m => m.status === 'negative').length;
  const countBelowCushion = simulatedMonths.filter(m => m.status === 'below-cushion').length;
  const countAboveCushion = simulatedMonths.filter(m => m.status === 'above-cushion').length;

  const result: BacktestResult = {
    months: simulatedMonths,
    proposedPayment,
    cushionTarget,
    countNegative,
    countBelowCushion,
    countAboveCushion,
    totalMonths: simulatedMonths.length,
    periodLabel: buildPeriodLabel(monthKeys),
  };

  return result;
}

// Re-export the full public surface of the engine
export { selectCompleteMonths } from './months';
export { aggregateMonth } from './aggregation';
export { classifyMonth, simulateMonth } from './simulation';
export { isIneligible } from './types';
export type {
  MonthKey,
  NormalizedTransaction,
  FinancialHistory,
  MonthlyAggregation,
  MonthStatus,
  SimulatedMonth,
  BacktestResult,
  IneligibleHistory,
  BacktestOutput,
} from './types';
