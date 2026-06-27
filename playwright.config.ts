import { defineConfig, devices } from '@playwright/test';

/** Dedicated E2E ports — avoids conflict with dev (3001 / 5173). */
const frontendPort = 5174;
const backendPort = 3002;
const backendUrl = `http://localhost:${backendPort}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${frontendPort}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npx pnpm --filter @shield/backend exec tsx src/index.ts',
      url: `${backendUrl}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        PORT: String(backendPort),
        DATABASE_URL: 'file::memory:',
        PRIVACY_MODE: 'true',
        CORS_ORIGIN: `http://localhost:${frontendPort}`,
      },
    },
    {
      command: `npx pnpm --filter @shield/frontend exec vite preview --port ${frontendPort} --strictPort`,
      url: `http://localhost:${frontendPort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        VITE_API_TARGET: backendUrl,
      },
    },
  ],
});
