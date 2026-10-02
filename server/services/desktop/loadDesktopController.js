import {createRobotJSDesktopController} from './createRobotJSDesktopController.js';
import {loadRobotJS} from './loadRobotJS.js';

export async function loadDesktopController({robotJSLoader = loadRobotJS} = {}) {
    const robotJS = await robotJSLoader();
    return createRobotJSDesktopController(robotJS);
}
