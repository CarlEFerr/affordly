'use client';

/**
 * CurrencyInput — accessible currency text field.
 *
 * Uses type="text" + inputMode="decimal" for correct mobile keyboard.
 * type="number" is avoided because browser spinner arrows and step validation
 * create poor UX for currency entry on mobile.
 *
 * Validation logic and business rules (payment > 0, cushion >= 0) live in the
 * parent component. This primitive handles display, accessibility, and error presentation.
 */

interface CurrencyInputProps {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (raw: string) => void;
  onBlur?: () => void;
  error?: string | null;
  placeholder?: string;
}

export default function CurrencyInput({
  id,
  label,
  hint,
  value,
  onChange,
  onBlur,
  error,
  placeholder = '0.00',
}: CurrencyInputProps) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId  = hint  ? `${id}-hint`  : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-(--color-text-primary)">
        {label}
      </label>

      {hint && (
        <p id={hintId} className="text-xs text-(--color-text-secondary)">
          {hint}
        </p>
      )}

      <div className="relative">
        <span
          className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-(--color-text-tertiary)"
          aria-hidden="true"
        >
          $
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          aria-describedby={describedBy}
          aria-invalid={!!error}
          className={
            'w-full rounded-lg border pl-7 pr-3 py-2.5 text-sm ' +
            'bg-(--color-surface) text-(--color-text-primary) ' +
            'placeholder:text-(--color-text-tertiary) ' +
            'focus-visible:outline-none focus-visible:ring-2 ' +
            'focus-visible:ring-(--color-focus-ring) focus-visible:ring-offset-0 ' +
            'min-h-[44px] ' + // accessible touch target
            (error
              ? 'border-(--color-status-negative-border) '
              : 'border-(--color-border) hover:border-(--color-text-tertiary) ')
          }
        />
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-xs text-(--color-status-negative-text)">
          {error}
        </p>
      )}
    </div>
  );
}
