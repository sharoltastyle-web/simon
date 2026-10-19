import { defineConfig, devices } from '@playwright/test';
import { BASE_URL, LIVE } from './e2e/baseUrl.ts';

const CI = Boolean(process.env.CI);

// Browser tests run against the real production build, served under the project sub-path.
// In CI the build already exists (it is the one that gets deployed), so it is only served, not rebuilt.
// With E2E_BASE_URL set, the tests run against that address (the live site) and no local server starts.
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: CI ? 1 : 0,
  reporter: CI ? [['list'], ['github']] : 'list',
  use: {
    ...devices['Pixel 7'],
    baseURL: BASE_URL,
  },
  projects: [{ name: 'chromium-mobile', use: { browserName: 'chromium' } }],
  webServer: LIVE
    ? undefined
    : {
        command: CI
          ? 'npx vite preview --port 4173 --strictPort'
          : 'npx vite build && npx vite preview --port 4173 --strictPort',
        url: 'http://localhost:4173/simon/',
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
