import {createWaylandDesktopController} from './createWaylandDesktopController.js';
import {createWaylandHelperClient} from '../../../os/linux/wayland/createWaylandHelperClient.js';
import {loadXWaylandPointerPosition} from '../../../os/linux/wayland/loadXWaylandPointerPosition.js';

export async function loadWaylandPortal({
                                            helperFactory = createWaylandHelperClient,
                                            interactive = Boolean(process.stdin.isTTY),
                                            pointerPositionLoader = loadXWaylandPointerPosition,
                                        } = {}) {
    const helper = helperFactory();
    if (interactive) {
        helper.start();
    }
    return createWaylandDesktopController(helper, {
        adapter: 'wayland-portal',
        getPointerPosition: pointerPositionLoader(),
    });
}
