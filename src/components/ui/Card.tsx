/**
 * Affordly Card primitive — FIAT-ready surface container.
 * Replace with FIAT surface/card component when available.
 */

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Additional padding override */
  padding?: 'none' | 'sm' | 'md';
}

export default function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddings = { none: '', sm: 'p-3', md: 'p-4 sm:p-5' };
  return (
    <div
      className={
        `bg-(--color-surface) rounded-xl border border-(--color-border) ` +
        `${paddings[padding]} ${className}`
      }
    >
      {children}
    </div>
  );
}
