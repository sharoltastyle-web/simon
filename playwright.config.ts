import { defineConfig, devices } from '@playwright/test';

// Browser tests run against the real production build, served under the project sub-path.
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    ...devices['Pixel 7'],
    baseURL: 'http://localhost:4173/simon/',
  },
  projects: [{ name: 'chromium-mobile', use: { browserName: 'chromium' } }],
  webServer: {
    command: 'npx vite build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/simon/',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
