import {
    REMOTE_EVENT_KEYBOARD_KEY,
    REMOTE_EVENT_KEYBOARD_TEXT,
    REMOTE_EVENT_MOUSE_BUTTON,
    REMOTE_EVENT_MOUSE_CLICK,
    REMOTE_EVENT_MOUSE_MOVE,
    REMOTE_EVENT_MOUSE_SCROLL,
} from '../../../utils/remoteCommands.js';
import {createMouseMoveDispatcher} from '../../services/input/createMouseMoveDispatcher.js';

export function createControlEventSubscriber({mouse, keyboard}) {
    return function subscribeInput(channel) {
        channel
            .on(REMOTE_EVENT_MOUSE_MOVE, createMouseMoveDispatcher(mouse))

            .on(REMOTE_EVENT_MOUSE_CLICK, (payload) => {
                mouse.click(payload.button);
            })

            .on(REMOTE_EVENT_MOUSE_BUTTON, (payload) => {
                mouse.setButtonState(payload.button, payload.state);
            })

            .on(REMOTE_EVENT_MOUSE_SCROLL, (payload) => {
                const dy = Number(payload.dy) || 0;
                mouse.scroll(dy);
            })

            .on(REMOTE_EVENT_KEYBOARD_TEXT, (payload) => {
                keyboard.typeText(payload.text);
            })

            .on(REMOTE_EVENT_KEYBOARD_KEY, (payload) => {
                keyboard.pressSpecialKey(payload.key, payload.modifiers);
            })
    };
}
