import {createKeyboardController} from "./keyboard-controller.js";
import {getConfig} from "../../init/config/index.js";
import {createMouseController} from "./mouse-controller.js";

export function createController(robot) {
    const config = getConfig();
    
    const mouse = createMouseController(robot, {
        mouseSpeed: config.input.mouseSpeed,
        scrollSpeed: config.input.scrollSpeed,
    });

    const keyboard = createKeyboardController(robot);
    
    return {
        robot,
        mouse,
        keyboard,
    };
}
