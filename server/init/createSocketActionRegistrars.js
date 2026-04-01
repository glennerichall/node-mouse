import {createController} from '../remotes/input/controller.js';
import {createBrowser} from '../remotes/browser/index.js';
import {createPreviewStreamer} from '../remotes/preview/createPreviewStreamer.js';
import {startUpdateChecker} from '../update-check/index.js';
import {createAdminActions} from '../remotes/admin/index.js';
import {createControlEventRegistrar} from '../remotes/input/registrar.js';
import {createAdminEventRegistrar} from '../remotes/admin/registrar.js';
import {createPreviewEventRegistrar} from '../remotes/preview/registrar.js';
import {createConnectionRegistrar} from '../connection/socket/createConnectionRegistrar.js';
import {createSamsungRemote} from '../remotes/samsung/index.js';
import {createBrowserRegistrar} from '../remotes/browser/registrar.js';
import {createSamsungRegistrar} from '../remotes/samsung/registrar.js';

export async function createSocketActionRegistrars(instances) {
    const {notifier, robot, tokenManager, qrOverlay, configService} = instances;
    const config = configService.get();

    const {
        mouse,
        keyboard,
        updateConfig: updateInputConfig
    } = createController(robot, {config});

    const browser = createBrowser();
    const samsung = createSamsungRemote();

    const preview = createPreviewStreamer(robot, {
        width: config.preview.width,
        height: config.preview.height,
        fps: config.preview.fps,
    });

    const updateChecker = await startUpdateChecker(notifier);

    const adminActions = createAdminActions({notifier, updateChecker, browser, tokenManager, qrOverlay});

    if (configService?.onChange) {
        configService.onChange((next) => {
            updateInputConfig(next);
        });
    }

    return [
        createControlEventRegistrar({mouse, keyboard}),
        createBrowserRegistrar({browser}),
        createAdminEventRegistrar({adminActions}),
        createPreviewEventRegistrar({preview}),
        createSamsungRegistrar({samsung}),
        createConnectionRegistrar({notifier})
    ];

}
