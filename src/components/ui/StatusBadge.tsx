/**
 * StatusBadge — wraps Badge with Affordly's three descriptive simulation statuses.
 *
 * IMPORTANT: These statuses are DESCRIPTIVE, not judgmental (Req 5.2).
 *   - Labels are the primary identifier (color is secondary support).
 *   - No pass/fail, good/bad, safe/unsafe semantics.
 *   - Colors are PROVISIONAL; replace with FIAT badge variants when available.
 */
import type { MonthStatus } from '@/lib/analysis/types';

const STATUS_STYLES: Record<
  MonthStatus,
  { surface: string; text: string; border: string; label: string }
> = {
  'negative': {
    surface: 'bg-(--color-status-negative-surface)',
    text:    'text-(--color-status-negative-text)',
    border:  'border-(--color-status-negative-border)',
    label:   'Negative',
  },
  'below-cushion': {
    surface: 'bg-(--color-status-below-cushion-surface)',
    text:    'text-(--color-status-below-cushion-text)',
    border:  'border-(--color-status-below-cushion-border)',
    label:   'Below Cushion',
  },
  'above-cushion': {
    surface: 'bg-(--color-status-above-cushion-surface)',
    text:    'text-(--color-status-above-cushion-text)',
    border:  'border-(--color-status-above-cushion-border)',
    label:   'Above Cushion',
  },
};

interface StatusBadgeProps {
  status: MonthStatus;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={
        `inline-flex items-center rounded-full border px-2.5 py-0.5 ` +
        `text-xs font-semibold ${s.surface} ${s.text} ${s.border} ${className}`
      }
    >
      {s.label}
    </span>
  );
}
