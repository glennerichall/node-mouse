import {clamp} from "../../utils/math.js";

export function captureAroundCursor(robot, width, height) {
    const screen = robot.getScreenSize();
    const cursor = robot.getMousePos();

    const x = clamp(Math.round(cursor.x - width / 2), 0, Math.max(0, screen.width - width));
    const y = clamp(Math.round(cursor.y - height / 2), 0, Math.max(0, screen.height - height));

    const capture = robot.screen.capture(x, y, width, height);
    return {capture, x, y};
}