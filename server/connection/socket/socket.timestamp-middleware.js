import {createLogger} from '../../application/logger.js';

let log;
function getModuleLog() {
  log ??= createLogger('socket:timestamp');
  return log;
}

export function socketTimestampGuardMiddleware({
  maxEventAgeMs = 1200,
  maxClockSkewMs = 5 * 60 * 1000,
  socketId,
} = {}) {
  const log = getModuleLog();
  let observedClockOffsetMs = null;

  return function enforceSocketEventTimestamp(packet, next) {
    const [, payload] = packet;
    const ts = payload && typeof payload === 'object'
      ? Number(payload.ts)
      : NaN;

    if (!Number.isFinite(ts)) {
      log.warn({ socketId, event: packet[0] }, 'Socket message has no timestamp');
      next(new Error('missing_timestamp'));
      return;
    }

    const rawDeltaMs = Date.now() - ts;
    if (observedClockOffsetMs == null && Math.abs(rawDeltaMs) <= maxClockSkewMs) {
      observedClockOffsetMs = rawDeltaMs;
      log.info({ socketId, event: packet[0], observedClockOffsetMs }, 'Socket clock calibrated');
    }

    const ageMs = rawDeltaMs - (observedClockOffsetMs || 0);
    if (ageMs > maxEventAgeMs) {
      log.warn({
        socketId,
        event: packet[0],
        ageMs,
        rawDeltaMs,
        observedClockOffsetMs,
        maxEventAgeMs,
      }, 'Socket message expired');
      next(new Error('stale_event'));
      return;
    }

    next();
  };
}
