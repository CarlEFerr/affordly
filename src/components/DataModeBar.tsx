'use client';

/**
 * Data mode indicator and Plaid connection control.
 *
 * Shows the current data source and provides the Plaid connect button
 * (wired in Task 7). Plaid Sandbox is clearly labeled as test data,
 * not live bank data (Req 9.6, design §9.6).
 */
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import PlaidConnector from '@/components/PlaidConnector';
import type { ApiErrorResponse, PlaidConnectResponse } from '@/lib/api/types';

interface DataModeBarProps {
  mode: 'demo' | 'plaid';
  accountName: string;
  onPlaidData: (data: PlaidConnectResponse) => void;
  onPlaidError: (error: Omit<ApiErrorResponse, 'error'> & { error: string }) => void;
  onPlaidCancel: () => void;
  onUseDemo: () => void;
}

export default function DataModeBar({
  mode,
  accountName,
  onPlaidData,
  onPlaidError,
  onPlaidCancel,
  onUseDemo,
}: DataModeBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {mode === 'demo' ? (
          <Badge variant="info">Demo data</Badge>
        ) : (
          <Badge variant="info">Plaid Sandbox</Badge>
        )}
        <span className="text-sm text-(--color-text-secondary) truncate">
          {mode === 'plaid'
            ? `${accountName} · test data`  // clearly labeled as Sandbox/test
            : accountName}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {mode === 'demo' ? (
          <PlaidConnector
            onData={onPlaidData}
            onError={onPlaidError}
            onCancel={onPlaidCancel}
          />
        ) : (
          <Button variant="ghost" onClick={onUseDemo} className="text-sm">
            Use Demo Data
          </Button>
        )}
      </div>
    </div>
  );
}
