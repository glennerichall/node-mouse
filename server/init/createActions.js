import {createController} from "../input/controller.js";
import {createBrowserReceiver} from "../browser/index.js";
import {createPreviewStreamer} from "../preview/preview.js";
import {
    PREVIEW_FPS,
    PREVIEW_HEIGHT,
    PREVIEW_WIDTH
} from "./config.js";
import {startUpdateChecker} from "../update-check/index.js";
import {createAdminActions} from "../admin/index.js";
import {createControlEventRegister} from "../connection/events/input.js";
import {createCommandEventRegister} from "../connection/events/commands.js";
import {createAdminEventRegister} from "../connection/events/admin.js";
import {createPreviewEventRegister} from "../connection/events/preview.js";

export async function createActions({notifier, robot}) {
    const {
        mouse,
        keyboard
    } = createController(robot);

    const browser = createBrowserReceiver();

    const preview = createPreviewStreamer(robot, {
        width: PREVIEW_WIDTH,
        height: PREVIEW_HEIGHT,
        fps: PREVIEW_FPS,
    });

    const updateChecker = await startUpdateChecker(notifier);

    const adminActions = createAdminActions({notifier, updateChecker});

    const registerControlEvents = createControlEventRegister({mouse, keyboard});
    const registerCommandEvents = createCommandEventRegister({browser});
    const registerAdminEvents = createAdminEventRegister({adminActions});
    const registerPreviewEvents = createPreviewEventRegister({preview});

    return [
        registerControlEvents,
        registerCommandEvents,
        registerAdminEvents,
        registerPreviewEvents,
    ];

}