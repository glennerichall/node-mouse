#!/usr/bin/env node

import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium, devices} from '@playwright/test';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const outputDir = path.resolve(projectRoot, '.artifacts', 'screenshots');
const port = Number(process.env.MOBILE_SCREENSHOT_PORT || process.env.PORT || 3211);
const baseUrl = String(process.env.MOBILE_SCREENSHOT_BASE_URL || `http://127.0.0.1:${port}`).replace(/\/$/, '');
const locale = String(process.env.MOBILE_SCREENSHOT_LOCALE || 'en');
const device = devices['iPhone 14 Pro'];
const stableScreenshotCss = [
  '*,*::before,*::after{',
  'animation-duration:0s!important;',
  'animation-delay:0s!important;',
  'transition-duration:0s!important;',
  'scroll-behavior:auto!important;',
  '}',
].join('');

const screenshots = [
  {
    path: '/',
    readySelector: '#touchpad',
    fileName: 'remote-mobile-home.png',
  },
  {
    path: '/',
    readySelector: '#vlc-controls',
    fileName: 'remote-mobile-vlc.png',
    beforeCapture: async (page) => {
      await page.evaluate(() => {
        const remoteStack = document.querySelector('#remote-stack');
        const vlcPanel = document.querySelector('#vlc-controls');
        const vlcToggle = vlcPanel?.querySelector('.remote-panel-toggle');
        vlcPanel.hidden = false;
        vlcToggle?.click();

        if (remoteStack && vlcPanel) {
          remoteStack.prepend(vlcPanel);
        }

        document.querySelector('#vlc-controls')?.scrollIntoView({
          block: 'start',
          inline: 'nearest',
        });
      });
    },
  },
  {
    path: '/ui/admin/preferences',
    readySelector: '[data-theme-switcher]',
    fileName: 'remote-mobile-preferences.png',
  },
  {
    path: '/ui/admin/config',
    readySelector: '#config-form',
    fileName: 'remote-mobile-config.png',
  },
  {
    path: '/ui/admin/server-info',
    readySelector: '#capabilities',
    fileName: 'remote-mobile-server-info.png',
  },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isServerHealthy() {
  try {
    const response = await fetch(`${baseUrl}/health`, {signal: AbortSignal.timeout(1000)});
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer(serverProcess) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 30_000) {
    if (await isServerHealthy()) {
      return;
    }
    if (serverProcess.exitCode !== null) {
      const details = serverProcess.stderrOutput ? `\n${serverProcess.stderrOutput.trim()}` : '';
      throw new Error(`Server exited before becoming healthy with code ${serverProcess.exitCode}.${details}`);
    }
    await sleep(250);
  }
  const details = serverProcess.stderrOutput ? `\n${serverProcess.stderrOutput.trim()}` : '';
  throw new Error(`Timed out waiting for ${baseUrl}/health.${details}`);
}

function startServer() {
  const databasePath = path.join(os.tmpdir(), `remote-mouse-screenshots-${process.pid}.sqlite`);
  const serverProcess = spawn(process.execPath, ['index.js'], {
    cwd: projectRoot,
    env: {
      ...process.env,
      PORT: String(port),
      SERVER_HOST: '127.0.0.1',
      PERSISTENCE_DB_PATH: databasePath,
      LOG_LEVEL: process.env.LOG_LEVEL || 'fatal',
    },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  serverProcess.stderrOutput = '';
  serverProcess.stderr.on('data', (chunk) => {
    serverProcess.stderrOutput = `${serverProcess.stderrOutput}${chunk}`.slice(-4000);
  });
  return serverProcess;
}

async function stopServer(serverProcess) {
  if (!serverProcess || serverProcess.exitCode !== null) {
    return;
  }

  serverProcess.kill('SIGINT');
  const stopped = await Promise.race([
    new Promise((resolve) => serverProcess.once('exit', () => resolve(true))),
    sleep(5000).then(() => false),
  ]);

  if (!stopped && serverProcess.exitCode === null) {
    serverProcess.kill('SIGTERM');
  }
}

async function captureScreenshots() {
  await fs.mkdir(outputDir, {recursive: true});

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      ...device,
      locale: locale === 'en' ? 'en-US' : locale,
    });

    await context.addInitScript(({selectedLocale, css}) => {
      window.localStorage.setItem('remote-mouse.locale', selectedLocale);
      window.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
      });
    }, {
      selectedLocale: locale,
      css: stableScreenshotCss,
    });

    const page = await context.newPage();
    page.setDefaultTimeout(15_000);
    await page.route('**/api/admin/configs', async (route) => {
      const response = await route.fetch();
      const payload = await response.json();
      const configs = Array.isArray(payload.configs) ? payload.configs.map((entry) => (
        entry?.path === 'vlc.enabled' || entry?.id === 'vlc.enabled'
          ? {...entry, value: true}
          : entry
      )) : payload.configs;

      await route.fulfill({
        response,
        json: {
          ...payload,
          configs,
          config: {
            ...payload.config,
            vlc: {
              ...payload.config?.vlc,
              enabled: true,
            },
          },
        },
      });
    });
    await page.route('**/api/admin/remotes', async (route) => {
      const response = await route.fetch();
      const payload = await response.json();
      const remotes = Array.isArray(payload.remotes) ? [...payload.remotes] : [];
      if (!remotes.some((remote) => remote?.id === 'vlc')) {
        const insertAt = Math.max(0, remotes.findIndex((remote) => remote?.id === 'preview'));
        remotes.splice(insertAt, 0, {
          id: 'vlc',
          labelKey: 'preferences.remote.vlc',
          enabled: true,
        });
      }

      await route.fulfill({
        response,
        json: {
          ...payload,
          remotes: remotes.map((remote) => (
            remote?.id === 'vlc' ? {...remote, enabled: true} : remote
          )),
        },
      });
    });

    for (const screenshot of screenshots) {
      await page.goto(`${baseUrl}${screenshot.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15_000,
      });
      await page.waitForSelector(screenshot.readySelector, {state: 'visible'});
      await page.waitForFunction((expectedLocale) => (
        document.documentElement.lang === expectedLocale
      ), locale).catch(() => {});
      await page.waitForTimeout(700);
      if (screenshot.beforeCapture) {
        await screenshot.beforeCapture(page);
        await page.waitForTimeout(100);
      }

      const outputPath = path.join(outputDir, screenshot.fileName);
      await page.screenshot({path: outputPath, fullPage: false});
      console.log(`Generated ${path.relative(projectRoot, outputPath)}`);
    }
  } finally {
    await browser.close();
  }
}

let serverProcess = null;

try {
  if (!(await isServerHealthy())) {
    serverProcess = startServer();
    await waitForServer(serverProcess);
  }

  await captureScreenshots();
} finally {
  await stopServer(serverProcess);
}
