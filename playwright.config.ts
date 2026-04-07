import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:8082',
    headless: true,
    screenshot: 'on',
    video: 'on',
  },
  workers: 1,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Start Expo web server before tests
  webServer: {
    command: 'npx expo start --web --port 8082',
    url: 'http://localhost:8082',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
