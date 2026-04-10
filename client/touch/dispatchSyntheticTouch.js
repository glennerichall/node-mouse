import {createTouchList} from "./createTouchList.js";

export function dispatchSyntheticTouch(touchpad, type, sourceTouch) {
    if (!touchpad || typeof Touch !== 'function' || typeof TouchEvent !== 'function') {
        return;
    }

    const touches = type === 'touchend' || type === 'touchcancel'
        ? []
        : createTouchList(touchpad, sourceTouch);
    const changedTouches = createTouchList(touchpad, sourceTouch);

    touchpad.dispatchEvent(new TouchEvent(type, {
        bubbles: true,
        cancelable: true,
        touches,
        targetTouches: touches,
        changedTouches,
    }));
}