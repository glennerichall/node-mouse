import { createForceUpdateCheckAction } from './force-update-check.js';
import { createInstallUpdateAction } from './install-update.js';
import { createRestartServiceAction } from './restart-service.js';
import { createOpenQrBrowserAction } from './open-qr-browser.js';
import { createOpenServerInfoBrowserAction } from './open-server-info-browser.js';
import { createRotateEntryTokenAction } from './rotate-entry-token.js';
import { notifyIfRestarted } from './restart-marker.js';

export { notifyIfRestarted };

export function createAdminActions({ notifier, updateChecker, browser, tokenManager }) {
  return {
    forceUpdateCheck: createForceUpdateCheckAction({ notifier, updateChecker }),
    installUpdate: createInstallUpdateAction({ notifier, updateChecker }),
    restartService: createRestartServiceAction({ notifier }),
    openQrBrowser: createOpenQrBrowserAction({ notifier, browser }),
    openServerInfoBrowser: createOpenServerInfoBrowserAction({ notifier, browser }),
    rotateEntryToken: createRotateEntryTokenAction({ notifier, tokenManager }),
  };
}
