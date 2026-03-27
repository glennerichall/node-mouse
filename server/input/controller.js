import {createKeyboardController} from "./keyboard-controller.js";
import {
    MOUSE_SPEED,
    SCROLL_SPEED
} from "../init/config.js";
import {createMouseController} from "./mouse-controller.js";
import {loadRobot} from "../../utils/server/robot.js";

export function createController(robot) {
    
    const mouse = createMouseController(robot, {
        mouseSpeed: MOUSE_SPEED,
        scrollSpeed: SCROLL_SPEED,
    });

    const keyboard = createKeyboardController(robot);
    
    return {
        robot,
        mouse,
        keyboard,
    };
}
