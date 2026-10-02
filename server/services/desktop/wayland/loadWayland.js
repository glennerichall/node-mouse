import {createWaylandDesktopController} from './createWaylandDesktopController.js';
import {createWaylandHelperClient} from './createWaylandHelperClient.js';

export async function loadWayland({
                                      helperFactory = createWaylandHelperClient,
                                      interactive = Boolean(process.stdin.isTTY),
                                  } = {}) {
    const helper = helperFactory();
    if (interactive) {
        helper.start();
    }
    return createWaylandDesktopController(helper);
}
