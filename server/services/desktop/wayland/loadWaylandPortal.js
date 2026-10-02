import {createWaylandDesktopController} from './createWaylandDesktopController.js';
import {createWaylandHelperClient} from '../../../os/linux/wayland/createWaylandHelperClient.js';

export async function loadWaylandPortal({
                                            helperFactory = createWaylandHelperClient,
                                            interactive = Boolean(process.stdin.isTTY),
                                        } = {}) {
    const helper = helperFactory();
    if (interactive) {
        helper.start();
    }
    return createWaylandDesktopController(helper, {adapter: 'wayland-portal'});
}
