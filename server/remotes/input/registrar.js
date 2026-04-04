import {
  REMOTE_EVENT_KEYBOARD_KEY,
  REMOTE_EVENT_KEYBOARD_TEXT,
  REMOTE_EVENT_MOUSE_BUTTON,
  REMOTE_EVENT_MOUSE_CLICK,
  REMOTE_EVENT_MOUSE_MOVE,
  REMOTE_EVENT_MOUSE_SCROLL,
} from '../../../utils/shared/remoteCommands.js';

export function createControlEventRegistrar({ mouse, keyboard }) {
  return function registerControlEvents(socket) {
    socket.on(REMOTE_EVENT_MOUSE_MOVE, (payload = {}) => {
      const dx = Number(payload.dx) || 0;
      const dy = Number(payload.dy) || 0;
      mouse.move(dx, dy);
    });

    socket.on(REMOTE_EVENT_MOUSE_CLICK, (payload = {}) => {
      mouse.click(payload.button);
    });

    socket.on(REMOTE_EVENT_MOUSE_BUTTON, (payload = {}) => {
      mouse.setButtonState(payload.button, payload.state);
    });

    socket.on(REMOTE_EVENT_MOUSE_SCROLL, (payload = {}) => {
      const dy = Number(payload.dy) || 0;
      mouse.scroll(dy);
    });

    socket.on(REMOTE_EVENT_KEYBOARD_TEXT, (payload = {}) => {
      keyboard.typeText(payload.text);
    });

    socket.on(REMOTE_EVENT_KEYBOARD_KEY, (payload = {}) => {
      keyboard.pressSpecialKey(payload.key, payload.modifiers);
    });
  };
}
