import {createForceUpdateCheckAction} from './force-update-check.js';
import {createInstallUpdateAction} from './install-update.js';
import {createRestartServiceAction} from './restart-service.js';
import {createOpenQrBrowserAction} from './open-qr-browser.js';
import {createOpenServerInfoBrowserAction} from './open-server-info-browser.js';
import {createRotateEntryTokenAction} from './rotate-entry-token.js';
import {createToggleQrOverlayAction} from './toggle-qr-overlay.js';
import {notifyIfRestarted} from './restart-marker.js';

export {notifyIfRestarted};

import {
    NOTIFIER_TARGET_CLIENT,
    NOTIFIER_TARGET_SERVER
} from '../../services/notifier/createNotifierComposite.js';
import {createBrowser} from '../browser/index.js';

export function createAdminActions(services) {
    const browser = createBrowser();

    return {
        forceUpdateCheck: createForceUpdateCheckAction(services),
        installUpdate: createInstallUpdateAction(services),
        restartService: createRestartServiceAction(services),
        openQrBrowserServer: createOpenQrBrowserAction(services, {browser, target: NOTIFIER_TARGET_SERVER}),
        openQrBrowserClient: createOpenQrBrowserAction(services, {browser, target: NOTIFIER_TARGET_CLIENT}),
        openServerInfoBrowserServer: createOpenServerInfoBrowserAction(services, {browser, target: NOTIFIER_TARGET_SERVER}),
        openServerInfoBrowserClient: createOpenServerInfoBrowserAction(services, {browser, target: NOTIFIER_TARGET_CLIENT}),
        rotateEntryToken: createRotateEntryTokenAction(services),
        toggleQrOverlay: createToggleQrOverlayAction(services),
    };
}
