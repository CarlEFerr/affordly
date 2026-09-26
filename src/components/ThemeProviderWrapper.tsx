'use client';

/**
 * Theme provider boundary — currently a transparent pass-through.
 *
 * PROVISIONAL: When @nymbus/fiat access is granted, replace the body of this
 * component with ClientThemeProvider from @nymbus/fiat:
 *
 *   import { ClientThemeProvider } from '@nymbus/fiat';
 *   export default function ThemeProviderWrapper({ children }) {
 *     return <ClientThemeProvider>{children}</ClientThemeProvider>;
 *   }
 *
 * No other components need to change when this swap happens.
 */
export default function ThemeProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
