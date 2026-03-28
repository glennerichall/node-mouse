import {createKeyboardController} from "./keyboard-controller.js";
import {getStartupConfigSnapshot} from "../init/config.js";
import {createMouseController} from "./mouse-controller.js";
import {loadRobot} from "../../utils/server/robot.js";

const config = getStartupConfigSnapshot();

export function createController(robot) {
    
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
