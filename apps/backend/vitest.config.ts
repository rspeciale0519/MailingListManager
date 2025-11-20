import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    env: {
      JWT_ACCESS_SECRET: 'test-access-secret-key-min-32-chars-long-value',
      JWT_REFRESH_SECRET: 'test-refresh-secret-key-min-32-chars-long-value',
      JWT_VERIFICATION_SECRET: 'test-verification-secret-key-min-32-chars',
      JWT_ACCESS_EXPIRY: '900',
      JWT_REFRESH_EXPIRY: '2592000',
      VERIFICATION_TOKEN_EXPIRY: '86400',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key-min-32-chars-long-key',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.test.ts', '**/index.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
