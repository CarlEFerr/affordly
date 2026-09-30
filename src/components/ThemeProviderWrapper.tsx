'use client';

/**
 * Theme provider boundary — wraps the application with the Nymbus FIAT
 * ClientThemeProvider, which injects CSS custom property overrides for the
 * active Nymbus theme.
 *
 * themeBasePath is omitted so ClientThemeProvider uses its default ('/themes/'),
 * which is correct for a standard Next.js public directory deployment.
 *
 * Previously a pass-through; activated when @nymbus/fiat access was granted
 * (Task 11.4). No other components changed as a result of this swap.
 */
import { ClientThemeProvider } from '@nymbus/fiat';

export default function ThemeProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientThemeProvider>{children}</ClientThemeProvider>;
}
