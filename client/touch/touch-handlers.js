import { getScrollZoneLayout } from './gesture-zone.js';
import {
  applyNonLinearAcceleration,
  distance2D,
  scaleSigned,
} from '../../utils/shared/math.js';

const SCROLL_GAIN = 1.1;
const REMOTE_HIDE_MOVEMENT_THRESHOLD_PX = 10;

function getDragHoldMs(handler) {
  const value = Number(handler.getInputConfig?.().touchDragHoldMs);
  return Number.isFinite(value) && value > 0 ? value : 420;
}

function getDragStillDistancePx(handler) {
  const value = Number(handler.getInputConfig?.().touchDragStillDistancePx);
  return Number.isFinite(value) && value > 0 ? value : 8;
}

function startDrag(state, handler) {
  if (state.dragActive) {
    return;
  }

  state.dragActive = true;
  handler.buttonState('left', 'down');
}

function stopDrag(state, handler) {
  if (!state.dragActive) {
    return;
  }

  state.dragActive = false;
  handler.buttonState('left', 'up');
}

function notifyMovementStartIfNeeded(state, handler, distancePx, kind = 'move') {
  if (state.movementStarted) {
    return;
  }

  if (!Number.isFinite(distancePx) || distancePx < REMOTE_HIDE_MOVEMENT_THRESHOLD_PX) {
    return;
  }

  state.movementStarted = true;
  handler.interactionStart?.(kind);
}

export function handleTouchStart(event, { touchpad, state, handler }) {
  event.preventDefault();
  const touches = event.touches;

  if (!state.interactionActive && touches.length > 0) {
    state.interactionActive = true;
  }

  if (touches.length === 1) {
    const t = touches[0];
    const rect = touchpad.getBoundingClientRect();
    const layout = getScrollZoneLayout(rect.width, rect.height, handler.getHandedness?.());
    const localX = t.clientX - rect.left;
    const localY = t.clientY - rect.top;
    const inRightZone =
      localX >= layout.x
      && localX <= layout.x + layout.width
      && localY >= layout.y
      && localY <= layout.y + layout.height;
    state.oneFinger = { x: t.clientX, y: t.clientY };
    state.oneFingerStart = { x: t.clientX, y: t.clientY };
    state.oneFingerMode = inRightZone ? 'scroll' : 'move';
    state.twoFinger = null;
    state.movementStarted = false;
    state.moved = false;
    state.dragEligible = !inRightZone;
    state.touchStartedAt = Date.now();
    state.lastMoveAt = state.touchStartedAt;
  }

  if (touches.length === 2) {
    stopDrag(state, handler);
    const t1 = touches[0];
    const t2 = touches[1];
    state.twoFinger = {
      p1: { x: t1.clientX, y: t1.clientY },
      p2: { x: t2.clientX, y: t2.clientY },
    };
    state.movementStarted = false;
    state.oneFinger = null;
    state.oneFingerStart = null;
    state.touchStartedAt = Date.now();
    state.moved = false;
    state.dragEligible = false;
    state.lastMoveAt = state.touchStartedAt;
  }
}

export function handleTouchMove(event, { state, handler }) {
  event.preventDefault();
  const touches = event.touches;

  if (touches.length === 1 && state.oneFinger) {
    const t = touches[0];
    const dx = t.clientX - state.oneFinger.x;
    const dy = t.clientY - state.oneFinger.y;
    const now = Date.now();
    const elapsed = now - state.lastMoveAt;
    const holdDuration = now - state.touchStartedAt;
    const travelFromStart = state.oneFingerStart
      ? distance2D(state.oneFingerStart, { x: t.clientX, y: t.clientY })
      : 0;

    if (!state.dragActive && travelFromStart > getDragStillDistancePx(handler)) {
      state.dragEligible = false;
    }

    notifyMovementStartIfNeeded(state, handler, travelFromStart, state.oneFingerMode === 'scroll' ? 'scroll' : 'move');

    if (state.oneFingerMode === 'scroll') {
      if (Math.abs(dy) > 0.12) {
        state.moved = true;
        handler.scroll(scaleSigned(dy, SCROLL_GAIN));
      }
    } else if (state.dragActive || (state.dragEligible && holdDuration >= getDragHoldMs(handler))) {
      startDrag(state, handler);
      if (Math.abs(dx) + Math.abs(dy) > 0.5) {
        state.moved = true;
        const adjusted = applyNonLinearAcceleration(dx, dy, elapsed);
        handler.move(adjusted.dx, adjusted.dy);
      }
    } else if (Math.abs(dx) + Math.abs(dy) > 0.5) {
      state.moved = true;
      const adjusted = applyNonLinearAcceleration(dx, dy, elapsed);
      handler.move(adjusted.dx, adjusted.dy);
    }

    state.oneFinger = { x: t.clientX, y: t.clientY };
    state.lastMoveAt = now;
  }

  if (touches.length === 2 && state.twoFinger) {
    const t1 = { x: touches[0].clientX, y: touches[0].clientY };
    const t2 = { x: touches[1].clientX, y: touches[1].clientY };
    const travelP1 = distance2D(state.twoFinger.p1, t1);
    const travelP2 = distance2D(state.twoFinger.p2, t2);
    const prevMidY = (state.twoFinger.p1.y + state.twoFinger.p2.y) / 2;
    const nextMidY = (t1.y + t2.y) / 2;
    const deltaY = nextMidY - prevMidY;

    notifyMovementStartIfNeeded(state, handler, Math.max(travelP1, travelP2), 'scroll');

    if (Math.abs(deltaY) > 0.12) {
      state.moved = true;
      handler.scroll(scaleSigned(deltaY, SCROLL_GAIN));
    }

    state.twoFinger = { p1: t1, p2: t2 };
  }
}

export function handleTouchEnd(event, { state, handler }) {
  event.preventDefault();
  const duration = Date.now() - state.touchStartedAt;

  if (event.touches.length === 0) {
    if (state.dragActive) {
      stopDrag(state, handler);
    } else if (!state.moved && duration < 220 && state.oneFingerMode !== 'scroll') {
      if (state.twoFinger) {
        const space = distance2D(state.twoFinger.p1, state.twoFinger.p2);
        if (space > 20) {
          handler.click('right');
        }
      } else {
        handler.click('left');
      }
    }

    state.oneFinger = null;
    state.oneFingerStart = null;
    state.oneFingerMode = 'move';
    state.twoFinger = null;
    state.movementStarted = false;
    state.moved = false;
    state.dragActive = false;
    state.dragEligible = false;
    state.interactionActive = false;
    handler.flush();
    handler.interactionEnd?.();
  }
}
