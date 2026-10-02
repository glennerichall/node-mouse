import {createRobotJSDesktopController} from './createRobotJSDesktopController.js';
import {loadRobotJS} from './loadRobotJS.js';
import {loadWayland} from './wayland/loadWayland.js';

export async function loadDesktopController({
                                                platform = process.platform,
                                                env = process.env,
                                                robotJSLoader = loadRobotJS,
                                                waylandLoader = loadWayland,
                                            } = {}) {
    if (platform === 'linux' && String(env.XDG_SESSION_TYPE).toLowerCase() === 'wayland') {
        return waylandLoader();
    }
    const robotJS = await robotJSLoader();
    return createRobotJSDesktopController(robotJS);
}
