import {defineConfig, devices} from '@playwright/test';
import path from 'node:path';
import {tmpdir} from 'node:os';

const port = Number(process.env.PLAYWRIGHT_PORT || 3210);
const baseURL = `http://127.0.0.1:${port}`;
const databasePath = path.join(tmpdir(), 'remote-mouse-playwright', 'remote-mouse.sqlite');

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', {open: 'never'}]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'node index.js',
    url: `${baseURL}/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    env: {
      ...process.env,
      PORT: String(port),
      SERVER_HOST: '127.0.0.1',
      PERSISTENCE_DB_PATH: databasePath,
      LOG_LEVEL: 'fatal',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']},
    },
    {
      name: 'mobile-chrome',
      use: {...devices['Pixel 5']},
    },
  ],
});
