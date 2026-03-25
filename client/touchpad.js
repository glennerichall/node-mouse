import { createAccumulatedThrottle } from './throttle.js';
import { getRightScrollZoneWidth } from './gesture-zone.js';

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function applyNonLinearAcceleration(dx, dy, elapsedMs) {
  const dt = Math.max(elapsedMs, 1);
  const dist = Math.hypot(dx, dy);
  const speed = dist / dt; // px/ms

  // Courbe non lineaire: fine precision a basse vitesse, acceleration plus forte quand ca bouge vite.
  const normalized = clamp(speed / 0.9, 0, 4);
  const gain = clamp(0.55 + normalized ** 1.5, 0.55, 4);

  return {
    dx: dx * gain,
    dy: dy * gain,
  };
}

function applyScrollSensitivity(deltaY) {
  const direction = Math.sign(deltaY);
  const magnitude = Math.abs(deltaY);
  const boosted = magnitude * 1.45;
  return direction * boosted;
}

export function bindTouchpad(socket, touchpad) {
  const moveEmitter = createAccumulatedThrottle(
    (payload) => socket.emit('mouse:move', payload),
    16,
  );
  const scrollEmitter = createAccumulatedThrottle(
    (payload) => socket.emit('mouse:scroll', { dy: payload.dy }),
    12,
  );

  const state = {
    oneFinger: null,
    oneFingerMode: 'move',
    twoFinger: null,
    moved: false,
    touchStartedAt: 0,
    lastMoveAt: 0,
  };

  function onTouchStart(event) {
    event.preventDefault();
    const touches = event.touches;

    if (touches.length === 1) {
      const t = touches[0];
      const rect = touchpad.getBoundingClientRect();
      const zoneWidth = getRightScrollZoneWidth(rect.width);
      const inRightZone = t.clientX >= rect.right - zoneWidth;
      state.oneFinger = { x: t.clientX, y: t.clientY };
      state.oneFingerMode = inRightZone ? 'scroll' : 'move';
      state.twoFinger = null;
      state.moved = false;
      state.touchStartedAt = Date.now();
      state.lastMoveAt = state.touchStartedAt;
    }

    if (touches.length === 2) {
      const t1 = touches[0];
      const t2 = touches[1];
      state.twoFinger = {
        p1: { x: t1.clientX, y: t1.clientY },
        p2: { x: t2.clientX, y: t2.clientY },
      };
      state.oneFinger = null;
      state.touchStartedAt = Date.now();
      state.moved = false;
      state.lastMoveAt = state.touchStartedAt;
    }
  }

  function onTouchMove(event) {
    event.preventDefault();
    const touches = event.touches;
    if (touches.length === 1 && state.oneFinger) {
      const t = touches[0];
      const dx = t.clientX - state.oneFinger.x;
      const dy = t.clientY - state.oneFinger.y;
      const now = Date.now();
      const elapsed = now - state.lastMoveAt;

      if (state.oneFingerMode === 'scroll') {
        if (Math.abs(dy) > 0.12) {
          state.moved = true;
          scrollEmitter.addDelta(0, applyScrollSensitivity(dy));
        }
      } else if (Math.abs(dx) + Math.abs(dy) > 0.5) {
        state.moved = true;
        const adjusted = applyNonLinearAcceleration(dx, dy, elapsed);
        moveEmitter.addDelta(adjusted.dx, adjusted.dy);
      }

      state.oneFinger = { x: t.clientX, y: t.clientY };
      state.lastMoveAt = now;
    }

    if (touches.length === 2 && state.twoFinger) {
      const t1 = { x: touches[0].clientX, y: touches[0].clientY };
      const t2 = { x: touches[1].clientX, y: touches[1].clientY };
      const prevMidY = (state.twoFinger.p1.y + state.twoFinger.p2.y) / 2;
      const nextMidY = (t1.y + t2.y) / 2;
      const deltaY = nextMidY - prevMidY;

      if (Math.abs(deltaY) > 0.12) {
        state.moved = true;
        scrollEmitter.addDelta(0, applyScrollSensitivity(deltaY));
      }

      state.twoFinger = { p1: t1, p2: t2 };
    }
  }

  function onTouchEnd(event) {
    event.preventDefault();
    const duration = Date.now() - state.touchStartedAt;

    if (event.touches.length === 0) {
      if (!state.moved && duration < 220 && state.oneFingerMode !== 'scroll') {
        if (state.twoFinger) {
          const space = distance(state.twoFinger.p1, state.twoFinger.p2);
          if (space > 20) {
            socket.emit('mouse:click', { button: 'right' });
          }
        } else {
          socket.emit('mouse:click', { button: 'left' });
        }
      }

      state.oneFinger = null;
      state.oneFingerMode = 'move';
      state.twoFinger = null;
      state.moved = false;
      moveEmitter.flushNow();
      scrollEmitter.flushNow();
    }
  }

  touchpad.addEventListener('touchstart', onTouchStart, { passive: false });
  touchpad.addEventListener('touchmove', onTouchMove, { passive: false });
  touchpad.addEventListener('touchend', onTouchEnd, { passive: false });
  touchpad.addEventListener('touchcancel', onTouchEnd, { passive: false });
}
