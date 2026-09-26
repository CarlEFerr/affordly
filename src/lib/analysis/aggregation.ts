/**
 * Monthly cash-flow aggregation.
 * Pure function — no side effects, no external state.
 */

import type { MonthKey, NormalizedTransaction, MonthlyAggregation } from './types';
import { monthKeyToLabel } from '../utils/date';

/**
 * Aggregates all transactions for a given calendar month into cash-flow totals.
 *
 * A month with zero transactions returns:
 *   cashIn = 0, cashOut = 0, cashFlow = 0, topTransactions = []
 *
 * Top transactions: up to 3 entries ordered by |amount| descending.
 * Inflows and outflows compete for the same three slots (bidirectional) —
 * a large inflow (e.g. tax refund, bonus) will surface if it is among the
 * largest movements.
 *
 * @param transactions - all normalized transactions for the history source
 * @param monthKey     - "YYYY-MM" key identifying the month to aggregate
 */
export function aggregateMonth(
  transactions: NormalizedTransaction[],
  monthKey: MonthKey
): MonthlyAggregation {
  const monthTransactions = transactions.filter(
    t => t.date.slice(0, 7) === monthKey
  );

  let cashIn = 0;
  let cashOut = 0;

  for (const t of monthTransactions) {
    if (t.amount > 0) {
      cashIn += t.amount;
    } else {
      cashOut += Math.abs(t.amount);
    }
  }

  // Top 3 by |amount|, descending — bidirectional (Req 8.3)
  const topTransactions = [...monthTransactions]
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 3);

  return {
    monthKey,
    label: monthKeyToLabel(monthKey),
    cashIn,
    cashOut,
    cashFlow: cashIn - cashOut,
    topTransactions,
  };
}
