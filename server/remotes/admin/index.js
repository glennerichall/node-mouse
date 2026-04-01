import { createForceUpdateCheckAction } from './force-update-check.js';
import { createInstallUpdateAction } from './install-update.js';
import { createRestartServiceAction } from './restart-service.js';
import { createOpenQrBrowserAction } from './open-qr-browser.js';
import { createOpenServerInfoBrowserAction } from './open-server-info-browser.js';
import { createRotateEntryTokenAction } from './rotate-entry-token.js';
import { createToggleQrOverlayAction } from './toggle-qr-overlay.js';
import { notifyIfRestarted } from './restart-marker.js';

export { notifyIfRestarted };

import {NOTIFIER_TARGET_CLIENT, NOTIFIER_TARGET_SERVER} from '../../notifier/notifier-composite.js';

export function createAdminActions({ notifier, updateChecker, browser, tokenManager, qrOverlay }) {
  return {
    forceUpdateCheck: createForceUpdateCheckAction({ notifier, updateChecker }),
    installUpdate: createInstallUpdateAction({ notifier, updateChecker }),
    restartService: createRestartServiceAction({ notifier }),
    openQrBrowserServer: createOpenQrBrowserAction({ notifier, browser, target: NOTIFIER_TARGET_SERVER }),
    openQrBrowserClient: createOpenQrBrowserAction({ notifier, browser, target: NOTIFIER_TARGET_CLIENT }),
    openServerInfoBrowserServer: createOpenServerInfoBrowserAction({ notifier, browser, target: NOTIFIER_TARGET_SERVER }),
    openServerInfoBrowserClient: createOpenServerInfoBrowserAction({ notifier, browser, target: NOTIFIER_TARGET_CLIENT }),
    rotateEntryToken: createRotateEntryTokenAction({ notifier, tokenManager }),
    toggleQrOverlay: createToggleQrOverlayAction({ notifier, qrOverlay }),
  };
}
