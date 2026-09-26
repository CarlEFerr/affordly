'use client';

/**
 * Individual month card with expandable factual detail (Req §6, §8).
 *
 * Shows: month name, original cash flow, simulated cash flow, status.
 * Detail: cash in/out totals, pre/post payment cash flows, top-3 transactions.
 * Detail is factual only — no interpretations or explanations (Req 8.6).
 */
import StatusBadge from '@/components/ui/StatusBadge';
import { formatCurrency } from '@/lib/utils/currency';
import type { SimulatedMonth } from '@/lib/analysis/types';

interface MonthCardProps {
  month: SimulatedMonth;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function MonthCard({ month, isExpanded, onToggle }: MonthCardProps) {
  const {
    label, cashFlow, simulatedCashFlow, status,
    cashIn, cashOut, topTransactions,
  } = month;

  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) overflow-hidden">
      {/* Card header — always visible, tap target for expand/collapse */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`detail-${month.monthKey}`}
        className={
          'flex w-full items-start justify-between gap-3 px-4 py-4 text-left ' +
          'hover:bg-(--color-surface-subtle) transition-colors ' +
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset ' +
          'focus-visible:ring-(--color-focus-ring) min-h-[56px]'
        }
      >
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-(--color-text-primary)">{label}</span>
            <StatusBadge status={status} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-(--color-text-secondary)">
            <span>
              Before:{' '}
              <span className="font-medium text-(--color-text-primary)">
                {formatCurrency(cashFlow)}
              </span>
            </span>
            <span>
              With payment:{' '}
              <span
                className={
                  'font-medium ' +
                  (simulatedCashFlow < 0
                    ? 'text-(--color-status-negative-text)'
                    : 'text-(--color-text-primary)')
                }
              >
                {formatCurrency(simulatedCashFlow)}
              </span>
            </span>
          </div>
        </div>

        {/* Chevron */}
        <span
          className={
            'mt-0.5 shrink-0 text-(--color-text-tertiary) transition-transform duration-150 ' +
            (isExpanded ? 'rotate-180' : '')
          }
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {/* Expandable detail */}
      {isExpanded && (
        <div
          id={`detail-${month.monthKey}`}
          className="border-t border-(--color-border) px-4 py-4 space-y-3"
        >
          {/* Cash-flow totals */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            <div>
              <dt className="text-(--color-text-secondary)">Cash in</dt>
              <dd className="font-medium text-(--color-text-primary)">{formatCurrency(cashIn)}</dd>
            </div>
            <div>
              <dt className="text-(--color-text-secondary)">Cash out</dt>
              <dd className="font-medium text-(--color-text-primary)">
                {formatCurrency(-cashOut)}
              </dd>
            </div>
            <div>
              <dt className="text-(--color-text-secondary)">Without this payment</dt>
              <dd className="font-medium text-(--color-text-primary)">{formatCurrency(cashFlow)}</dd>
            </div>
            <div>
              <dt className="text-(--color-text-secondary)">With this payment</dt>
              <dd
                className={
                  'font-medium ' +
                  (simulatedCashFlow < 0
                    ? 'text-(--color-status-negative-text)'
                    : 'text-(--color-text-primary)')
                }
              >
                {formatCurrency(simulatedCashFlow)}
              </dd>
            </div>
          </dl>

          {/* Top transactions */}
          {topTransactions.length > 0 && (
            <div>
              <p className="text-xs text-(--color-text-tertiary) mb-2">
                {topTransactions.length} largest transaction
                {topTransactions.length !== 1 ? 's' : ''} this month
              </p>
              <ul className="space-y-1.5" aria-label="Largest transactions this month">
                {topTransactions.map(t => (
                  <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-(--color-text-secondary) truncate min-w-0">
                      {t.description}
                    </span>
                    <span
                      className={
                        'shrink-0 font-medium tabular-nums ' +
                        (t.amount < 0
                          ? 'text-(--color-status-negative-text)'
                          : 'text-(--color-text-primary)')
                      }
                    >
                      {formatCurrency(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
