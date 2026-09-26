/**
 * Data mode indicator.
 *
 * Shows whether the analysis uses Demo data or Plaid Sandbox data.
 * Demo is a first-class experience, not a fallback (Req 1.6).
 * Plaid Sandbox integration is wired in Task 7.
 */
import Badge from '@/components/ui/Badge';

interface DataModeBarProps {
  mode: 'demo' | 'plaid';
  accountName: string;
}

export default function DataModeBar({ mode, accountName }: DataModeBarProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {mode === 'demo' ? (
          <Badge variant="info">Demo data</Badge>
        ) : (
          <Badge variant="info">Plaid Sandbox</Badge>
        )}
        <span className="text-sm text-(--color-text-secondary) truncate">
          {accountName}
        </span>
      </div>

      {/* Plaid connect is implemented in Task 7 */}
      {mode === 'demo' && (
        <span className="text-xs text-(--color-text-tertiary) hidden sm:inline">
          Plaid Sandbox integration coming in full demo
        </span>
      )}
    </div>
  );
}
