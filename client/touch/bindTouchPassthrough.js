import {dispatchSyntheticTouch} from "./dispatchSyntheticTouch.js";

const MOVE_THRESHOLD_PX = 10;

function distanceFrom(startTouch, nextTouch) {
    const dx = nextTouch.clientX - startTouch.clientX;
    const dy = nextTouch.clientY - startTouch.clientY;
    return Math.hypot(dx, dy);
}

export function bindTouchPassthrough(buttons, touchpad) {
    if (!touchpad) {
        return;
    }

    for (const button of buttons || []) {
        if (!button) {
            continue;
        }

        let activeTouchId = null;
        let startTouch = null;
        let isPassthrough = false;
        let suppressNextClick = false;
        let suppressNextClickTimer = null;

        const resetState = () => {
            activeTouchId = null;
            startTouch = null;
            isPassthrough = false;
        };

        const getTrackedTouch = (touchList) => Array.from(touchList || []).find((touch) => touch.identifier === activeTouchId);

        const onTouchMove = (event) => {
            const trackedTouch = getTrackedTouch(event.changedTouches) || getTrackedTouch(event.touches);
            if (!trackedTouch || !startTouch) {
                return;
            }

            const distance = distanceFrom(startTouch, trackedTouch);
            if (!isPassthrough && distance < MOVE_THRESHOLD_PX) {
                return;
            }

            if (!isPassthrough) {
                isPassthrough = true;
                suppressNextClick = true;
                dispatchSyntheticTouch(touchpad, 'touchstart', startTouch);
            }

            event.preventDefault();
            event.stopImmediatePropagation();
            dispatchSyntheticTouch(touchpad, 'touchmove', trackedTouch);
        };

        const onTouchEnd = (event) => {
            const wasPassthrough = isPassthrough;
            const trackedTouch = getTrackedTouch(event.changedTouches) || getTrackedTouch(event.touches) || startTouch;
            if (isPassthrough && trackedTouch) {
                event.preventDefault();
                event.stopImmediatePropagation();
                dispatchSyntheticTouch(touchpad, event.type === 'touchcancel' ? 'touchcancel' : 'touchend', trackedTouch);
            }

            resetState();
            if (wasPassthrough) {
                clearTimeout(suppressNextClickTimer);
                suppressNextClickTimer = setTimeout(() => {
                    suppressNextClick = false;
                    suppressNextClickTimer = null;
                }, 500);
            }
        };

        const onTouchStart = (event) => {
            if (activeTouchId !== null || event.changedTouches.length !== 1) {
                return;
            }

            const touch = event.changedTouches[0];
            clearTimeout(suppressNextClickTimer);
            suppressNextClickTimer = null;
            suppressNextClick = false;
            activeTouchId = touch.identifier;
            startTouch = touch;
            isPassthrough = false;
        };

        const onClickCapture = (event) => {
            if (!suppressNextClick) {
                return;
            }

            suppressNextClick = false;
            clearTimeout(suppressNextClickTimer);
            suppressNextClickTimer = null;
            event.preventDefault();
            event.stopImmediatePropagation();
        };

        button.addEventListener('touchstart', onTouchStart, {passive: true});
        button.addEventListener('click', onClickCapture, true);
        document.addEventListener('touchmove', onTouchMove, {passive: false});
        document.addEventListener('touchend', onTouchEnd, {passive: false});
        document.addEventListener('touchcancel', onTouchEnd, {passive: false});
    }
}
