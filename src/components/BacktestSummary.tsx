/**
 * Aggregate retrospective summary statement (Req §7).
 *
 * Language rules:
 *   - Conditional-past tense throughout (Req 12.2)
 *   - No affordability verdict (Reqs 12.3–12.5)
 *   - "below cushion" aggregate = countBelowCushion + countNegative
 *     (months where simulated < cushion in any sense)
 *   - The three formal status counts remain mutually exclusive in the data model
 */
import { formatCurrency } from '@/lib/utils/currency';
import type { BacktestResult } from '@/lib/analysis/types';

interface BacktestSummaryProps {
  result: BacktestResult;
}

function buildSummaryText(result: BacktestResult): string {
  const { proposedPayment, cushionTarget, totalMonths, countNegative, countBelowCushion } = result;
  const payment = formatCurrency(proposedPayment);
  const cushion = formatCurrency(cushionTarget);

  // "not meeting cushion" = below-cushion + negative (both are < cushion)
  const notMeetingCushion = countBelowCushion + countNegative;

  if (notMeetingCushion === 0) {
    return (
      `With a ${payment} monthly payment, all ${totalMonths} analyzed months would have ` +
      `stayed at or above your ${cushion} cushion.`
    );
  }

  let summary =
    `With a ${payment} monthly payment, ${notMeetingCushion} of the last ${totalMonths} analyzed months ` +
    `would have fallen below your ${cushion} cushion`;

  if (countNegative > 0) {
    summary += `, including ${countNegative} that would have gone negative`;
  }

  return summary + '.';
}

export default function BacktestSummary({ result }: BacktestSummaryProps) {
  const text = buildSummaryText(result);

  return (
    <div className="rounded-lg bg-(--color-surface-subtle) border border-(--color-border) px-4 py-3">
      <p className="text-sm leading-relaxed text-(--color-text-primary)">
        {text}
      </p>
    </div>
  );
}
