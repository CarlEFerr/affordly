/**
 * Plaid source adapter.
 *
 * Converts a reconciled Plaid transaction snapshot into a FinancialHistory
 * for the shared analysis engine.
 *
 * Sign convention:
 *   Plaid: positive = debit (money leaves account), negative = credit (money enters)
 *   Affordly: positive = inflow, negative = outflow
 *   Transform: normalizedAmount = -plaidAmount
 *
 * firstSupportedMonth is derived conservatively:
 *   - Find the earliest posted transaction date → its month is the boundary month
 *     (possibly incomplete — we can't confirm coverage before the first retrieved tx)
 *   - firstSupportedMonth = the calendar month AFTER the boundary month
 *   - null when no posted transactions exist (cannot establish coverage)
 */

import type { Transaction } from 'plaid';
import type { FinancialHistory, NormalizedTransaction, MonthKey } from '@/lib/analysis/types';
import { nextMonthKey } from '@/lib/utils/date';

/**
 * Normalizes a single Plaid transaction into Affordly's source-agnostic format.
 * Does NOT filter by account or pending status — those filters belong in the caller.
 */
export function normalizePlaidTransaction(t: Transaction): NormalizedTransaction {
  return {
    id: t.transaction_id,
    date: t.date,              // already "YYYY-MM-DD"
    amount: -(t.amount),      // sign flip: Plaid debit(+) → Affordly outflow(-)
    description: t.merchant_name ?? t.name,
  };
}

/**
 * Filters and normalizes a reconciled Plaid transaction snapshot for one account.
 * - Filters to the specified accountId
 * - Excludes pending transactions (posted only — Req 9.3)
 * - Applies sign convention flip
 */
export function normalizePlaidTransactions(
  reconciledTransactions: Transaction[],
  accountId: string
): NormalizedTransaction[] {
  return reconciledTransactions
    .filter(t => t.account_id === accountId)
    .filter(t => !t.pending)     // posted only: pending === false
    .map(normalizePlaidTransaction);
}

/**
 * Derives the conservative firstSupportedMonth from a set of normalized posted transactions.
 *
 * - Finds the earliest posted transaction's month → this is the boundary/possibly-partial month
 * - Returns the month AFTER that boundary (first month guaranteed to be complete)
 * - Returns null if no posted transactions exist
 *
 * This conservatism means we may undercount available months, but we never falsely claim
 * a partial month has full coverage. The days_requested: 210 in the link token is sized
 * to push this boundary before the target 6-month analysis window in typical cases.
 */
export function derivePlaidFirstSupportedMonth(
  postedTransactions: NormalizedTransaction[]
): MonthKey | null {
  if (postedTransactions.length === 0) return null;

  const boundaryMonth = postedTransactions
    .map(t => t.date.slice(0, 7)) // "YYYY-MM"
    .sort()[0];                    // lexicographic sort = chronological for "YYYY-MM"

  return nextMonthKey(boundaryMonth);
}

/**
 * Builds a complete FinancialHistory for one Plaid checking account.
 * Used by /api/plaid/connect after reconciliation is complete.
 */
export function buildPlaidHistory(
  reconciledTransactions: Transaction[],
  accountId: string,
  accountName: string
): FinancialHistory {
  const postedNormalized = normalizePlaidTransactions(reconciledTransactions, accountId);

  return {
    source: 'plaid',
    accountName,
    transactions: postedNormalized,
    firstSupportedMonth: derivePlaidFirstSupportedMonth(postedNormalized),
  };
}
