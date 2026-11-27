import { defineConfig } from 'vitest/config';

// Database tests need a real Postgres (see README, "Tests").
export default defineConfig({
  test: {
    include: ['tests/db/**/*.test.ts'],
    environment: 'node',
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
