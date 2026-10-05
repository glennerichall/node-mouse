import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './test/integration/vm/browser',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.REMOTE_MOUSE_VM_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{name: 'mobile-chrome', use: {...devices['Pixel 5']}}],
});
