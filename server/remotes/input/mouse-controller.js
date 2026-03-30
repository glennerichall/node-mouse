import { clamp } from '../../../utils/shared/math.js';

export function createMouseController(robot, { mouseSpeed, scrollSpeed }) {
  let scrollRemainder = 0;

  function move(dx, dy) {
    const screen = robot.getScreenSize();
    const current = robot.getMousePos();
    const nextX = clamp(Math.round(current.x + dx * mouseSpeed), 0, screen.width - 1);
    const nextY = clamp(Math.round(current.y + dy * mouseSpeed), 0, screen.height - 1);
    robot.moveMouse(nextX, nextY);
  }

  function scroll(deltaY) {
    const total = -deltaY * scrollSpeed + scrollRemainder;
    const amount = total > 0 ? Math.floor(total) : Math.ceil(total);
    scrollRemainder = total - amount;
    if (amount !== 0) {
      robot.scrollMouse(0, amount);
    }
  }

  function click(button) {
    const mouseButton = button === 'right' ? 'right' : 'left';
    robot.mouseClick(mouseButton);
  }

  return { move, scroll, click };
}
