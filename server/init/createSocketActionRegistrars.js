import {createController} from "../input/controller.js";
import {createBrowserReceiver} from "../remotes/browser/index.js";
import {createPreviewStreamer} from "../preview/preview.js";
import {getConfig} from "./config/index.js";
import {startUpdateChecker} from "../update-check/index.js";
import {createAdminActions} from "../remotes/admin/index.js";
import {createControlEventRegistrar} from "../connection/events/input.js";
import {createCommandEventRegistrar} from "../connection/events/commands.js";
import {createAdminEventRegistrar} from "../connection/events/admin.js";
import {createPreviewEventRegistrar} from "../connection/events/preview.js";
import {createConnectionRegistrar} from "../connection/socket/createConnectionRegistrar.js";
import {createSamsungRemote} from '../remotes/samsung/index.js';

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
        createCommandEventRegistrar({browser, samsung}),
        createAdminEventRegistrar({adminActions}),
        createPreviewEventRegistrar({preview}),
        createConnectionRegistrar({notifier})
    ];

}
