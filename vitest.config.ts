import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [angular()],
  resolve: {
    alias: {
      '@testing': fileURLToPath(new URL('./src/app/testing', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    pool: 'forks',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    reporters: ['default', 'junit'],
    outputFile: {
      junit: './test-results/junit.xml',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/app/**/*.ts'],
      exclude: [
        'src/app/**/*.spec.ts',
        'src/app/**/*.routes.ts',
        'src/app/**/index.ts',
        'src/test-setup.ts',
        'src/app/testing/**',
        'src/main.ts',
        'src/environments/**',
      ],
      // NOTE: coverage % thresholds are intentionally not enforced yet — the refactor is only
      // at Phase 1 (tooling). Thresholds (80% statements/branches/functions/lines) are added in
      // Phase 5 once every feature has specs, so this gate doesn't fail mid-refactor.
    },
  },
});
