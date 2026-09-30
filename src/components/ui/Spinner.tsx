'use client';

/**
 * Affordly Spinner — uses @nymbus/fiat Spinner SVG (Task 11.7).
 *
 * FIAT's Spinner is a bare SVG element (React.ComponentProps<'svg'>).
 * This wrapper adds the accessibility structure FIAT's component omits:
 *   - role="status" container for screen-reader announcement
 *   - visible label text (aria-hidden on the SVG itself)
 *   - size variants for different use sites
 *
 * When FIAT ships a more complete loading component, replace this wrapper.
 */
import { Spinner as FiatSpinner } from '@nymbus/fiat';

interface SpinnerProps {
  label?: string;
  size?: 'sm' | 'md';
}

export default function Spinner({ label = 'Loading…', size = 'md' }: SpinnerProps) {
  const sizes: Record<string, string> = { sm: 'h-4 w-4', md: 'h-6 w-6' };
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <FiatSpinner
        className={`animate-spin ${sizes[size]} text-(--color-text-secondary)`}
        aria-hidden="true"
      />
      <span className="text-sm text-(--color-text-secondary)">{label}</span>
    </span>
  );
}
