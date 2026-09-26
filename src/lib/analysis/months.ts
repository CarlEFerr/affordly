/**
 * Coverage-aware complete month selection.
 *
 * Uses history.firstSupportedMonth to determine the supported analysis window.
 * Does NOT infer coverage from transaction presence — that would break Demo Mode,
 * which guarantees six complete months but whose firstSupportedMonth is M−6.
 */

import type { MonthKey, FinancialHistory, IneligibleHistory } from './types';
import { monthKeyAt } from '../utils/date';

const ANALYSIS_WINDOW = 6;  // maximum months to analyze
const MINIMUM_MONTHS = 3;   // minimum required for eligibility

/**
 * Returns the supported complete months for the backtest in most-recent-first order
 * (index 0 = M−1, last index = oldest supported month).
 *
 * Rules:
 *   1. Current month M is always excluded.
 *   2. Candidates are M−1 through M−6.
 *   3. Only months on or after history.firstSupportedMonth are included.
 *   4. A supported month is included even with zero transactions (cashFlow = $0).
 *   5. The result is always a contiguous sequence — never sparse.
 *   6. If firstSupportedMonth is null → ineligible.
 *   7. If < MINIMUM_MONTHS supported → ineligible.
 *
 * @param history - normalized financial history; engine reads firstSupportedMonth only
 * @param today   - injectable for deterministic tests (default: new Date())
 */
export function selectCompleteMonths(
  history: FinancialHistory,
  today: Date = new Date()
): MonthKey[] | IneligibleHistory {
  const { firstSupportedMonth } = history;

  if (!firstSupportedMonth) {
    return { ineligible: true, reason: 'insufficient-history' };
  }

  // Build candidates M−1 through M−6, most-recent first
  const candidates: MonthKey[] = [];
  for (let i = 1; i <= ANALYSIS_WINDOW; i++) {
    candidates.push(monthKeyAt(today, i));
  }

  // Keep the contiguous set of candidates that are >= firstSupportedMonth.
  // "YYYY-MM" lexicographic order == chronological order, so this is safe.
  // Because candidates are ordered most-recent → oldest, filtering by
  // >= firstSupportedMonth produces a contiguous prefix (no gaps).
  const supported = candidates.filter(m => m >= firstSupportedMonth);

  if (supported.length < MINIMUM_MONTHS) {
    return { ineligible: true, reason: 'insufficient-history' };
  }

  return supported;
}
