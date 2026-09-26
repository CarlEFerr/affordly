/**
 * Hypothetical payment simulation and month-status classification.
 * Pure functions — no side effects, no external state.
 */

import type { MonthlyAggregation, MonthStatus, SimulatedMonth } from './types';

/**
 * Canonical month-status classification (Req 5.1).
 *
 * Status rules:
 *   simulatedCashFlow < 0                           → 'negative'
 *   simulatedCashFlow >= 0 AND < cushionTarget      → 'below-cushion'
 *   simulatedCashFlow >= cushionTarget              → 'above-cushion'
 *
 * Key boundary behaviours (Reqs 4.6, 4.7, 3.7):
 *   sim=0, cushion=0  → 'above-cushion'  (0 >= 0)
 *   sim=0, cushion>0  → 'below-cushion'  (0 < cushion)
 *   sim=cushion>0     → 'above-cushion'  (sim >= cushion, boundary is inclusive)
 *   cushion=0         → 'below-cushion' is impossible
 *
 * This function is the single authoritative implementation of the classification rules.
 * Reqs 4.6 and 4.7 in requirements.md derive from and must stay consistent with it.
 */
export function classifyMonth(
  simulatedCashFlow: number,
  cushionTarget: number
): MonthStatus {
  if (simulatedCashFlow < 0) return 'negative';
  if (simulatedCashFlow < cushionTarget) return 'below-cushion';
  return 'above-cushion';
}

/**
 * Applies the hypothetical monthly payment to an aggregation and classifies the result.
 *
 * @param aggregation   - monthly cash-flow data for one complete month
 * @param proposedPayment - the user's hypothetical recurring payment (> 0)
 * @param cushionTarget - the user's minimum desired remaining cash flow (>= 0)
 */
export function simulateMonth(
  aggregation: MonthlyAggregation,
  proposedPayment: number,
  cushionTarget: number
): SimulatedMonth {
  const simulatedCashFlow = aggregation.cashFlow - proposedPayment;
  const status = classifyMonth(simulatedCashFlow, cushionTarget);
  return { ...aggregation, simulatedCashFlow, status };
}
