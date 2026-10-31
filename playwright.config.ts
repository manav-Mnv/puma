import { defineConfig, devices } from '@playwright/test';

// Golden-path E2E (T19). Runs against the static web export served on :8090 and a
// local Supabase stack (`supabase start`). See .github/workflows/ci.yml → e2e.
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8090',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    timezoneId: 'Asia/Kolkata',
  },
  projects: [{ name: 'chromium', use: { ...devices['Pixel 7'] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npx --yes serve@14.2.4 -s dist -l 8090',
        port: 8090,
        reuseExistingServer: true,
      },
});
