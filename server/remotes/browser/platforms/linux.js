import { commandExists, execFileAsync, spawnDetached } from '../../../utils/process.js';
import { BROWSER_CATALOG, getBrowserCatalogEntry } from '../browserCatalog.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isBrowserRunningLinux(browser) {
  const processNames = browser.linuxProcessNames ?? browser.linuxCommands ?? [];
  const checks = [];

  for (const processName of processNames) {
    checks.push(await execFileAsync('pgrep', ['-x', processName]));
    checks.push(await execFileAsync('pgrep', ['-f', processName]));
  }

  return checks.some((result) => result.ok);
}

function parseWmctrlWindowIds(output, browser) {
  const patterns = [
    ...(browser.linuxWindowClasses ?? []),
    ...(browser.linuxWindowNames ?? []),
  ].map((value) => String(value).toLowerCase());

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => patterns.some((pattern) => line.toLowerCase().includes(pattern)))
    .map((line) => line.split(/\s+/)[0])
    .filter((id) => /^0x[0-9a-f]+$/i.test(id));
}

async function focusBrowserWithWmctrl(browser) {
  if (!(await commandExists('wmctrl'))) {
    return false;
  }

  const list = await execFileAsync('wmctrl', ['-lx']);
  if (!list.ok) {
    return false;
  }

  const windowIds = parseWmctrlWindowIds(list.stdout, browser);
  if (windowIds.length === 0) {
    return false;
  }

  const target = windowIds[0];
  const activate = await execFileAsync('wmctrl', ['-ia', target]);
  if (!activate.ok) {
    return false;
  }

  await execFileAsync('wmctrl', ['-ir', target, '-b', 'add,maximized_vert,maximized_horz']);
  return true;
}

async function focusBrowserWithXdotool(browser) {
  if (!(await commandExists('xdotool'))) {
    return false;
  }

  const matches = [];
  const classPatterns = browser.linuxWindowClasses ?? [];
  const namePatterns = browser.linuxWindowNames ?? [];

  for (const classPattern of classPatterns) {
    const searchClassVisible = await execFileAsync('xdotool', ['search', '--onlyvisible', '--class', classPattern]);
    const searchClassAny = await execFileAsync('xdotool', ['search', '--class', classPattern]);
    matches.push(searchClassVisible.stdout, searchClassAny.stdout);
  }

  for (const namePattern of namePatterns) {
    const searchNameVisible = await execFileAsync('xdotool', ['search', '--onlyvisible', '--name', namePattern]);
    const searchNameAny = await execFileAsync('xdotool', ['search', '--name', namePattern]);
    matches.push(searchNameVisible.stdout, searchNameAny.stdout);
  }

  const idsRaw = matches.join('\n');
  const ids = idsRaw
    .split('\n')
    .map((value) => value.trim())
    .filter((value) => /^\d+$/.test(value));

  if (ids.length === 0) {
    return false;
  }

  const target = ids[0];
  const activated = await execFileAsync('xdotool', ['windowactivate', '--sync', target]);
  if (!activated.ok) {
    return false;
  }

  await execFileAsync('xdotool', ['windowraise', target]);
  if (await commandExists('wmctrl')) {
    await execFileAsync('wmctrl', ['-ir', target, '-b', 'add,maximized_vert,maximized_horz']);
  }

  return true;
}

async function focusOrMaximizeBrowserLinux(browser) {
  if (await focusBrowserWithWmctrl(browser)) {
    return true;
  }
  if (await focusBrowserWithXdotool(browser)) {
    return true;
  }
  return false;
}

async function ensureFocusedAndMaximizedAfterLaunch(browser) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const done = await focusOrMaximizeBrowserLinux(browser);
    if (done) {
      return true;
    }
    await sleep(350);
  }
  return false;
}

async function resolveLinuxBrowser(browserId) {
  const browser = getBrowserCatalogEntry(browserId);
  if (!browser) {
    return null;
  }

  for (const command of browser.linuxCommands ?? []) {
    if (await commandExists(command)) {
      return {
        ...browser,
        launchCommand: command,
        launchArgs: [],
      };
    }
  }

  if (browser.linuxFlatpakAppId && await commandExists('flatpak')) {
    return {
      ...browser,
      launchCommand: 'flatpak',
      launchArgs: ['run', browser.linuxFlatpakAppId],
    };
  }

  return null;
}

async function tryLaunchBrowser(browser) {
  const launchers = [
    [browser.launchCommand, browser.launchArgs ?? []],
  ];

  for (const [command, args] of launchers) {
    const launched = await spawnDetached(command, args);
    if (launched) {
      return true;
    }
  }

  return false;
}

export async function listBrowsersLinux() {
  const browsers = [];

  for (const browser of BROWSER_CATALOG) {
    const resolved = await resolveLinuxBrowser(browser.id);
    if (!resolved) {
      continue;
    }

    browsers.push({
      id: browser.id,
      name: browser.name,
      shortLabel: browser.shortLabel,
      command: resolved.launchCommand,
    });
  }

  return browsers;
}

export async function focusOrLaunchBrowserLinux(browserId) {
  const browser = await resolveLinuxBrowser(browserId);
  if (!browser) {
    return false;
  }

  const running = await isBrowserRunningLinux(browser);
  if (running) {
    return focusOrMaximizeBrowserLinux(browser);
  }

  const launched = await tryLaunchBrowser(browser);
  if (launched) {
    await sleep(400);
    await ensureFocusedAndMaximizedAfterLaunch(browser);
    return true;
  }

  return false;
}
