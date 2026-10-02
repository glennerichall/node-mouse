import {createWaylandDesktopController} from './createWaylandDesktopController.js';
import {createUInputHelperClient} from '../../../os/linux/wayland/createUInputHelperClient.js';

export async function loadUInput({helperFactory = createUInputHelperClient} = {}) {
    const helper = helperFactory();
    helper.start();
    return createWaylandDesktopController(helper, {adapter: 'wayland-uinput'});
}
