import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    // jsdom for component tests. Pure analysis tests annotate with @vitest-environment node.
    environment: 'jsdom',
    // globals: true exposes describe/it/expect/vi globally so jest-dom v7 can extend expect.
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
