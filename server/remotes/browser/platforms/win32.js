import { execFileAsync } from '../../../utils/process.js';
import { BROWSER_CATALOG, getBrowserCatalogEntry } from '../browserCatalog.js';

async function commandExistsWin32(command) {
  const result = await execFileAsync('powershell', [
    '-NoProfile',
    '-Command',
    `if (Get-Command "${command}" -ErrorAction SilentlyContinue) { "true" }`,
  ]);

  return result.ok && result.stdout.trim() === 'true';
}

export async function listBrowsersWin32() {
  const browsers = [];

  for (const browser of BROWSER_CATALOG) {
    const commands = browser.winCommands ?? [];
    let availableCommand = null;

    for (const command of commands) {
      if (await commandExistsWin32(command)) {
        availableCommand = command;
        break;
      }
    }

    if (!availableCommand) {
      continue;
    }

    browsers.push({
      id: browser.id,
      name: browser.name,
      shortLabel: browser.shortLabel,
      command: availableCommand,
    });
  }

  return browsers;
}

export async function focusOrLaunchBrowserWin32(browserId) {
  const browser = getBrowserCatalogEntry(browserId);
  if (!browser) {
    return false;
  }

  for (const command of browser.winCommands ?? []) {
    if (await commandExistsWin32(command)) {
      const result = await execFileAsync('powershell', ['-NoProfile', '-Command', `Start-Process ${command}`]);
      return result.ok;
    }
  }

  return false;
}
