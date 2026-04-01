import {createKeyboardController} from './keyboard-controller.js';
import {createMouseController} from './mouse-controller.js';

export function createController(robot, {config}) {
    const mouse = createMouseController(robot, {
        mouseSpeed: config.input.mouseSpeed,
        scrollSpeed: config.input.scrollSpeed,
    });

    const keyboard = createKeyboardController(robot);
    
    return {
        robot,
        mouse,
        keyboard,
        updateConfig(nextConfig) {
            mouse.updateSpeeds({
                mouseSpeed: nextConfig.input?.mouseSpeed,
                scrollSpeed: nextConfig.input?.scrollSpeed,
            });
        }
    };
}
