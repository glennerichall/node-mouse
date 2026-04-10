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

    const resetState = () => {
      console.debug('[touch-passthrough] reset', {
        buttonId: button.id || '(unknown)',
        activeTouchId,
        isPassthrough,
      });
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
        console.debug('[touch-passthrough] start passthrough', {
          buttonId: button.id || '(unknown)',
          activeTouchId,
          distance,
        });
        dispatchSyntheticTouch(touchpad, 'touchstart', startTouch);
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      console.debug('[touch-passthrough] move passthrough', {
        buttonId: button.id || '(unknown)',
        activeTouchId,
        x: trackedTouch.clientX,
        y: trackedTouch.clientY,
      });
      dispatchSyntheticTouch(touchpad, 'touchmove', trackedTouch);
    };

    const onTouchEnd = (event) => {
      const trackedTouch = getTrackedTouch(event.changedTouches) || getTrackedTouch(event.touches) || startTouch;
      if (isPassthrough && trackedTouch) {
        event.preventDefault();
        event.stopImmediatePropagation();
        console.debug('[touch-passthrough] end passthrough', {
          buttonId: button.id || '(unknown)',
          activeTouchId,
          type: event.type,
        });
        dispatchSyntheticTouch(touchpad, event.type === 'touchcancel' ? 'touchcancel' : 'touchend', trackedTouch);
      }

      resetState();
    };

    const onTouchStart = (event) => {
      if (activeTouchId !== null || event.changedTouches.length !== 1) {
        return;
      }

      const touch = event.changedTouches[0];
      activeTouchId = touch.identifier;
      startTouch = touch;
      isPassthrough = false;
      console.debug('[touch-passthrough] touchstart', {
        buttonId: button.id || '(unknown)',
        activeTouchId,
        x: touch.clientX,
        y: touch.clientY,
      });
    };

    const onClickCapture = (event) => {
      if (!suppressNextClick) {
        console.debug('[touch-passthrough] allow click', {
          buttonId: button.id || '(unknown)',
        });
        return;
      }

      suppressNextClick = false;
      console.debug('[touch-passthrough] suppress click', {
        buttonId: button.id || '(unknown)',
      });
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    button.addEventListener('touchstart', onTouchStart, { passive: true });
    button.addEventListener('click', onClickCapture, true);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: false });
    document.addEventListener('touchcancel', onTouchEnd, { passive: false });
  }
}
