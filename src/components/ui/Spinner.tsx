/**
 * Affordly Spinner — loading indicator.
 * Replace with FIAT loading pattern when available.
 */

interface SpinnerProps {
  label?: string;
  size?: 'sm' | 'md';
}

export default function Spinner({ label = 'Loading…', size = 'md' }: SpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6' };
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <svg
        className={`animate-spin ${sizes[size]} text-(--color-text-secondary)`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12" cy="12" r="10"
          stroke="currentColor" strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span className="text-sm text-(--color-text-secondary)">{label}</span>
    </span>
  );
}
