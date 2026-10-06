import {
  REMOTE_EVENT_KEYBOARD_KEY,
  REMOTE_EVENT_KEYBOARD_TEXT,
  REMOTE_EVENT_MOUSE_BUTTON,
  REMOTE_EVENT_MOUSE_CLICK,
  REMOTE_EVENT_MOUSE_MOVE,
  REMOTE_EVENT_MOUSE_SCROLL,
} from '../../../utils/remoteCommands.js';
import {createMouseMoveDispatcher} from '../../services/input/createMouseMoveDispatcher.js';

export function createControlEventRegistrar({ mouse, keyboard }) {
    return function subscribeInput(channel) {
    channel.on(REMOTE_EVENT_MOUSE_MOVE, createMouseMoveDispatcher(mouse));

    channel.on(REMOTE_EVENT_MOUSE_CLICK, (payload = {}) => {
      mouse.click(payload.button);
    });

    channel.on(REMOTE_EVENT_MOUSE_BUTTON, (payload = {}) => {
      mouse.setButtonState(payload.button, payload.state);
    });

    channel.on(REMOTE_EVENT_MOUSE_SCROLL, (payload = {}) => {
      const dy = Number(payload.dy) || 0;
      mouse.scroll(dy);
    });

    channel.on(REMOTE_EVENT_KEYBOARD_TEXT, (payload = {}) => {
      keyboard.typeText(payload.text);
    });

    channel.on(REMOTE_EVENT_KEYBOARD_KEY, (payload = {}) => {
      keyboard.pressSpecialKey(payload.key, payload.modifiers);
    });
  };
}
