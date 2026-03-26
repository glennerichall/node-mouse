export function createAccumulatedThrottle(emitFn, intervalMs) {
  let pendingDx = 0;
  let pendingDy = 0;
  let timer = null;
  let lastFlushAt = 0;

  function flush() {
    timer = null;
    if (pendingDx === 0 && pendingDy === 0) {
      return;
    }

    const payload = { dx: pendingDx, dy: pendingDy };
    pendingDx = 0;
    pendingDy = 0;
    lastFlushAt = Date.now();
    emitFn(payload);
  }

  function schedule() {
    if (timer) {
      return;
    }

    const elapsed = Date.now() - lastFlushAt;
    const delay = Math.max(0, intervalMs - elapsed);
    timer = setTimeout(flush, delay);
  }

  function addDelta(dx, dy) {
    pendingDx += dx;
    pendingDy += dy;
    schedule();
  }

  function flushNow() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    flush();
  }

  return { addDelta, flushNow };
}

