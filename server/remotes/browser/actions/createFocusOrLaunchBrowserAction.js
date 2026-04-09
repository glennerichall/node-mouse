import { getBrowserCatalogEntry } from '../browserCatalog.js';
import { createBrowserAppSpec } from '../createBrowserAppSpec.js';

export function createFocusOrLaunchBrowserAction(state, osService) {
  return async function focusOrLaunchBrowser(browserId) {
    if (state.inFlight) {
      return false;
    }
    state.inFlight = true;

    try {
      const browser = getBrowserCatalogEntry(browserId);
      if (!browser) {
        return false;
      }

      return osService.app.openOrFocus(createBrowserAppSpec(browser), { maximize: true });
    } finally {
      state.inFlight = false;
    }
  };
}
