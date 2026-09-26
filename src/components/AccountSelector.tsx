'use client';

/**
 * Inline checking-account selector — shown when Plaid returns multiple
 * eligible checking accounts (Req 10.5).
 *
 * Not a modal or bottom sheet — renders inline within the main flow.
 * Uses radio input semantics: Tab to reach the group, arrow keys to navigate,
 * Enter/Space to select. Each label is the full-width touch target (≥48px).
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
      <fieldset className="border-0 m-0 p-0">
        <legend className="mb-1">
          <span className="text-sm font-semibold text-(--color-text-primary)">
            Multiple checking accounts found
          </span>
        </legend>
        <p className="text-sm text-(--color-text-secondary) mb-4">
          Choose one account to analyze:
        </p>

        <div className="flex flex-col gap-2">
          {accounts.map(account => (
            <label
              key={account.id}
              className={
                'flex items-center justify-between gap-4 rounded-lg border ' +
                'border-(--color-border) bg-(--color-surface) px-4 py-3 cursor-pointer ' +
                'hover:bg-(--color-surface-subtle) transition-colors ' +
                'focus-within:ring-2 focus-within:ring-(--color-focus-ring) ' +
                'min-h-[48px]'
              }
            >
              {/* Visually hidden radio — label is the full click/tap target */}
              <input
                type="radio"
                name="plaid-account-selection"
                value={account.id}
                onChange={() => onSelect(account)}
                className="sr-only"
              />
              <span className="text-sm font-medium text-(--color-text-primary)">
                {account.name}
              </span>
              <span className="text-sm text-(--color-text-secondary) font-mono shrink-0">
                ····{account.mask}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 pt-4 border-t border-(--color-border)">
        <Button variant="ghost" onClick={onUseDemo} className="text-sm">
          Use Demo Data instead
        </Button>
      </div>
    </div>
  );
}
