import {createKeyboardController} from "./keyboard-controller.js";
import {
    MOUSE_SPEED,
    SCROLL_SPEED
} from "../config.js";
import {createMouseController} from "./mouse-controller.js";
import {loadRobot} from "../../utils/robot.js";

export async function createController() {

    let robot;
    try {
        robot = await loadRobot();
    } catch (error) {
        console.error('RobotJS n\'est pas disponible. Installez les dépendances natives puis relancez.');
        console.error(error.message);
        throw error;
    }

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