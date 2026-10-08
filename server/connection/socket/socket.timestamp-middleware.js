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
    const [packetEvent, payload] = packet;
    const route = packetEvent === 'route:request' ? payload : undefined;
    const body = route?.body ?? payload;
    const event = route?.path ?? packetEvent;
    const ts = body && typeof body === 'object'
      ? Number(body.ts)
      : NaN;

    if (!Number.isFinite(ts)) {
      log.warn({ socketId, event }, 'Socket message has no timestamp');
      next(new Error('missing_timestamp'));
      return;
    }

    const rawDeltaMs = Date.now() - ts;
    if (rawDeltaMs < -maxClockSkewMs) {
      log.warn({socketId, event, rawDeltaMs, maxClockSkewMs}, 'Socket message clock is ahead');
      next(new Error('clock_skew'));
      return;
    }

    if (observedClockOffsetMs == null && Math.abs(rawDeltaMs) <= maxClockSkewMs) {
      observedClockOffsetMs = rawDeltaMs;
      log.info({ socketId, event, observedClockOffsetMs }, 'Socket clock calibrated');
    }

    const ageMs = rawDeltaMs - (observedClockOffsetMs || 0);
    if (ageMs > maxEventAgeMs) {
      log.warn({
        socketId,
        event,
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
