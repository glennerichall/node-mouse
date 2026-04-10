import { BROWSER_CATALOG } from './browserCatalog.js';
import { createBrowserAppSpec } from './spec.js';

export async function listBrowsersOnHost(osService) {
  const browsers = [];

  for (const browser of BROWSER_CATALOG) {
    const resolved = await osService.app.resolve(createBrowserAppSpec(browser));
    if (!resolved) {
      continue;
    }

    browsers.push({
      id: browser.id,
      name: browser.name,
      shortLabel: browser.shortLabel,
      command: resolved.launchCommand || resolved.command || '',
      app: resolved.appName || '',
    });
  }

  return browsers;
}
