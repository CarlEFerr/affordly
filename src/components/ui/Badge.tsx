/**
 * Affordly Badge primitive — FIAT-ready thin wrapper.
 * Replace with Badge from @nymbus/fiat when access is available.
 * Verify FIAT badge semantics before substituting (ensure no implied pass/fail).
 */

interface BadgeProps {
  children: React.ReactNode;
  /** Visual variant — provisional until FIAT color semantics are verified */
  variant?: 'default' | 'info' | 'muted';
  className?: string;
}

export default function Badge({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) {
  const base =
    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium';

  const variants = {
    default: 'bg-(--color-surface-subtle) text-(--color-text-secondary) border border-(--color-border)',
    info:    'bg-(--color-info-surface) text-(--color-info-text) border border-(--color-info-border)',
    muted:   'bg-(--color-surface-subtle) text-(--color-text-tertiary)',
  };

  return (
    <span className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
