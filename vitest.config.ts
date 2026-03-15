import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**', '**/dist-electron/**', 'server/**'],
    setupFiles: ['./src/renderer/test-setup.ts'],
  },
});
