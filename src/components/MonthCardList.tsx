/**
 * Ordered list of month cards with analyzed period label (Reqs 6.4, 6.5, 10.7).
 * Most recent month (M-1) is at the top.
 */
import MonthCard from '@/components/MonthCard';
import type { BacktestResult } from '@/lib/analysis/types';

interface MonthCardListProps {
  result: BacktestResult;
  expandedMonthKey: string | null;
  onToggleMonth: (monthKey: string) => void;
}

export default function MonthCardList({
  result,
  expandedMonthKey,
  onToggleMonth,
}: MonthCardListProps) {
  return (
    <section aria-label="Historical months">
      <p className="text-xs text-(--color-text-tertiary) mb-3">
        Analyzed period: <span className="font-medium">{result.periodLabel}</span>
        {result.totalMonths < 6 && (
          <span className="ml-1">
            ({result.totalMonths} months available)
          </span>
        )}
      </p>

      <ul className="flex flex-col gap-3" role="list">
        {result.months.map(month => (
          <li key={month.monthKey}>
            <MonthCard
              month={month}
              isExpanded={expandedMonthKey === month.monthKey}
              onToggle={() => onToggleMonth(month.monthKey)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
