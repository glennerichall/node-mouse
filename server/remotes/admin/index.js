import {createForceUpdateCheckAction} from './createForceUpdateCheckAction.js';
import {createInstallUpdateAction} from './createInstallUpdateAction.js';
import {createRestartServiceAction} from './createRestartServiceAction.js';
import {createOpenServerInfoBrowserAction} from './createOpenServerInfoBrowserAction.js';
import {notifyIfRestarted} from './notifyIfRestarted.js';

export {notifyIfRestarted};

import {
    NOTIFIER_TARGET_CLIENT,
    NOTIFIER_TARGET_SERVER
} from '../../services/notifier/createNotifierComposite.js';
import {createBrowser} from '../browser/index.js';

export function createAdminActions(services) {
    const browser = createBrowser(services.getOs());

    return {
        forceUpdateCheck: createForceUpdateCheckAction(services),
        installUpdate: createInstallUpdateAction(services),
        restartService: createRestartServiceAction(services),
        openServerInfoBrowserServer: createOpenServerInfoBrowserAction(services, {browser, target: NOTIFIER_TARGET_SERVER}),
        openServerInfoBrowserClient: createOpenServerInfoBrowserAction(services, {browser, target: NOTIFIER_TARGET_CLIENT}),
    };
}
