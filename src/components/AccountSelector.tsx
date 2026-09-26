'use client';

/**
 * Inline checking-account selector — shown when Plaid returns multiple
 * eligible checking accounts (Req 10.5).
 *
 * Not a modal or bottom sheet — renders inline within the main flow.
 * Large touch targets for mobile usability.
 */
import Button from '@/components/ui/Button';
import type { PlaidAccountData } from '@/lib/api/types';

interface AccountSelectorProps {
  accounts: PlaidAccountData[];
  onSelect: (account: PlaidAccountData) => void;
  onUseDemo: () => void;
}

export default function AccountSelector({ accounts, onSelect, onUseDemo }: AccountSelectorProps) {
  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 sm:p-5">
      <p className="text-sm font-semibold text-(--color-text-primary) mb-1">
        Multiple checking accounts found
      </p>
      <p className="text-sm text-(--color-text-secondary) mb-4">
        Choose one to analyze:
      </p>

      <ul className="flex flex-col gap-2" role="list" aria-label="Available checking accounts">
        {accounts.map(account => (
          <li key={account.id}>
            <button
              type="button"
              onClick={() => onSelect(account)}
              className={
                'w-full flex items-center justify-between gap-4 rounded-lg border ' +
                'border-(--color-border) bg-(--color-surface) px-4 py-3 text-left ' +
                'hover:bg-(--color-surface-subtle) transition-colors ' +
                'focus-visible:outline-none focus-visible:ring-2 ' +
                'focus-visible:ring-(--color-focus-ring) min-h-[48px]'
              }
            >
              <span className="text-sm font-medium text-(--color-text-primary)">
                {account.name}
              </span>
              <span className="text-sm text-(--color-text-secondary) font-mono shrink-0">
                ····{account.mask}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 pt-4 border-t border-(--color-border)">
        <Button variant="ghost" onClick={onUseDemo} className="text-sm">
          Use Demo Data instead
        </Button>
      </div>
    </div>
  );
}
