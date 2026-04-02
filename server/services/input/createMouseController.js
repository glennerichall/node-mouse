import {clamp} from '../../../utils/shared/math.js';
import {DEFAULT_PERSISTED_CONFIG} from '../config/defaultConfig.js';

export function createMouseController(services) {
    const {
        getConfig
    } = services;

    let scrollRemainder = 0;

    function getInputConfig() {
        return getConfig().input || DEFAULT_PERSISTED_CONFIG.input;
    }

    function move(dx, dy) {
        const robot = services.getRobot();
        const inputConfig = getInputConfig();
        const mouseSpeed = Number(inputConfig.mouseSpeed) || DEFAULT_PERSISTED_CONFIG.input.mouseSpeed;
        const screen = robot.getScreenSize();
        const current = robot.getMousePos();
        const nextX = clamp(Math.round(current.x + dx * mouseSpeed), 0, screen.width - 1);
        const nextY = clamp(Math.round(current.y + dy * mouseSpeed), 0, screen.height - 1);
        robot.moveMouse(nextX, nextY);
    }

    function scroll(deltaY) {
        const robot = services.getRobot();
        const inputConfig = getInputConfig();
        const scrollSpeed = Number(inputConfig.scrollSpeed) || DEFAULT_PERSISTED_CONFIG.input.scrollSpeed;
        const total = -deltaY * scrollSpeed + scrollRemainder;
        const amount = total > 0 ? Math.floor(total) : Math.ceil(total);
        scrollRemainder = total - amount;
        if (amount !== 0) {
            robot.scrollMouse(0, amount);
        }
    }

    function click(button) {
        const robot = services.getRobot();
        const mouseButton = button === 'right' ? 'right' : 'left';
        robot.mouseClick(mouseButton);
    }

    return {
        move,
        scroll,
        click,
        updateConfig() {
            return getInputConfig();
        }
    };
}
