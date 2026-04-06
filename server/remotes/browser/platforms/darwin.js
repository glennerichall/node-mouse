import fs from 'node:fs';
import { execFileAsync } from '../../../utils/process.js';
import { BROWSER_CATALOG, getBrowserCatalogEntry } from '../browserCatalog.js';

function appExists(appName) {
  const locations = [
    `/Applications/${appName}.app`,
    `/System/Applications/${appName}.app`,
  ];

  return locations.some((path) => fs.existsSync(path));
}

export async function listBrowsersDarwin() {
  return BROWSER_CATALOG
    .map((browser) => {
      const appName = (browser.darwinApps ?? []).find((candidate) => appExists(candidate));
      if (!appName) {
        return null;
      }

      return {
        id: browser.id,
        name: browser.name,
        shortLabel: browser.shortLabel,
        app: appName,
      };
    })
    .filter(Boolean);
}

export async function focusOrLaunchBrowserDarwin(browserId) {
  const browser = getBrowserCatalogEntry(browserId);
  if (!browser) {
    return false;
  }

  const appName = (browser.darwinApps ?? []).find((candidate) => appExists(candidate));
  if (!appName) {
    return false;
  }

  const result = await execFileAsync('open', ['-a', appName]);
  return result.ok;
}
