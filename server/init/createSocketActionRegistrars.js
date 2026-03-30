import {createController} from "../remotes/input/controller.js";
import {createBrowserReceiver} from "../remotes/browser/index.js";
import {createPreviewStreamer} from "../remotes/preview/createPreviewStreamer.js";
import {getConfig} from "./config/index.js";
import {startUpdateChecker} from "../update-check/index.js";
import {createAdminActions} from "../remotes/admin/index.js";
import {createControlEventRegistrar} from "../remotes/input/registrar.js";
import {createAdminEventRegistrar} from "../remotes/admin/registrar.js";
import {createPreviewEventRegistrar} from "../remotes/preview/registrar.js";
import {createConnectionRegistrar} from "../connection/socket/createConnectionRegistrar.js";
import {createSamsungRemote} from '../remotes/samsung/index.js';
import {createBrowserRegistrar} from "../remotes/browser/registrar.js";
import {createSamsungRegistrar} from "../remotes/samsung/registrar.js";

export async function createSocketActionRegistrars(instances) {
    const config = getConfig();
    const {notifier, robot, tokenManager, qrOverlay} = instances;

    const {
        mouse,
        keyboard
    } = createController(robot);

    const browser = createBrowserReceiver();
    const samsung = createSamsungRemote();

    const preview = createPreviewStreamer(robot, {
        width: config.preview.width,
        height: config.preview.height,
        fps: config.preview.fps,
    });

    const updateChecker = await startUpdateChecker(notifier);

    const adminActions = createAdminActions({notifier, updateChecker, browser, tokenManager, qrOverlay});

    return [
        createControlEventRegistrar({mouse, keyboard}),
        createBrowserRegistrar({browser}),
        createAdminEventRegistrar({adminActions}),
        createPreviewEventRegistrar({preview}),
        createSamsungRegistrar({samsung}),
        createConnectionRegistrar({notifier})
    ];

}
