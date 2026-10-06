import {createControlEventRegistrar} from '../remotes/input/registrar.js';
import {createAdminEventRegistrar} from '../remotes/admin/registrar.js';
import {createPreviewEventRegistrar} from '../remotes/preview/registrar.js';
import {createConnectionRegistrar} from '../connection/socket/createConnectionRegistrar.js';
import {createBrowserRegistrar} from '../remotes/browser/registrar.js';
import {createSamsungRegistrar} from '../remotes/samsung/registrar.js';
import {createVlcRegistrar} from '../remotes/vlc/registrar.js';
import {createWindowRegistrar} from '../remotes/window/registrar.js';
import {createQrEventRegistrar} from '../remotes/qr/registrar.js';

/**
 * Construit les souscriptions métier sans imposer un transport particulier.
 * Chaque fonction retournée accepte un ClientChannel (`id`, `on`, `emit`).
 */
export function createEventSubscriptions(services) {
    const {mouse, keyboard, updateConfig} = services.getInputController();
    const {browser, adminActions, qrActions, preview, samsung, vlc, windowActions} = services.getRemotes();
    updateConfig();

    return {
        subscribeInput: createControlEventRegistrar({mouse, keyboard}),
        subscribeBrowser: createBrowserRegistrar({browser, getConfig: services.getConfig}),
        subscribeQr: createQrEventRegistrar({qrActions}),
        subscribeAdmin: createAdminEventRegistrar({adminActions, legacyQrActions: qrActions}),
        subscribePreview: createPreviewEventRegistrar({preview, getConfig: services.getConfig}),
        subscribeSamsung: createSamsungRegistrar({samsung}),
        subscribeVlc: createVlcRegistrar({
            vlc,
            keyboard,
            getConfig: services.getConfig,
        }),
        subscribeWindow: createWindowRegistrar({windowActions}),
        subscribeConnection: createConnectionRegistrar({events: services.getEvents()}),
    };
}
