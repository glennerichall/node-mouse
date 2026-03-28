import {createController} from "../input/controller.js";
import {createBrowserReceiver} from "../browser/index.js";
import {createPreviewStreamer} from "../preview/preview.js";
import {getStartupConfigSnapshot} from "./config.js";
import {startUpdateChecker} from "../update-check/index.js";
import {createAdminActions} from "../admin/index.js";
import {createControlEventRegistrar} from "../connection/events/input.js";
import {createCommandEventRegistrar} from "../connection/events/commands.js";
import {createAdminEventRegistrar} from "../connection/events/admin.js";
import {createPreviewEventRegistrar} from "../connection/events/preview.js";
import {createConnectionRegistrar} from "../connection/socket/createConnectionRegistrar.js";

const config = getStartupConfigSnapshot();

export async function createSocketActionRegistrars(instances) {
    const {notifier, robot} = instances;

    const {
        mouse,
        keyboard
    } = createController(robot);

    const browser = createBrowserReceiver();

    const preview = createPreviewStreamer(robot, {
        width: config.preview.width,
        height: config.preview.height,
        fps: config.preview.fps,
    });

    const updateChecker = await startUpdateChecker(notifier);

    const adminActions = createAdminActions({notifier, updateChecker});

    return [
        createControlEventRegistrar({mouse, keyboard}),
        createCommandEventRegistrar({browser}),
        createAdminEventRegistrar({adminActions}),
        createPreviewEventRegistrar({preview}),
        createConnectionRegistrar({notifier})
    ];

}
