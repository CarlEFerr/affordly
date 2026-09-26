/**
 * Affordly Button primitive — FIAT-ready thin wrapper.
 * Replace with Button from @nymbus/fiat when access is available.
 */
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
}

export default function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium ' +
    'transition-colors focus-visible:outline-none focus-visible:ring-2 ' +
    'focus-visible:ring-(--color-focus-ring) focus-visible:ring-offset-1 ' +
    'disabled:pointer-events-none disabled:opacity-50';

  const variants = {
    primary:
      'bg-(--color-btn-primary-bg) text-(--color-btn-primary-text) ' +
      'hover:opacity-90 active:opacity-80',
    ghost:
      'bg-transparent text-(--color-text-secondary) underline-offset-4 ' +
      'hover:text-(--color-text-primary) hover:underline',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
