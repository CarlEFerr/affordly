import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    // jsdom provides the DOM environment for component tests.
    // Pure TypeScript analysis/adapter/utility tests will use
    // // @vitest-environment node annotations to opt out of jsdom overhead.
    environment: 'jsdom',
    globals: false,
    // Do NOT set passWithNoTests: true here.
    // The normal `pnpm test` command must fail when no tests exist.
    // For Checkpoint A foundation verification only, use:
    //   pnpm exec vitest run --passWithNoTests
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
