import {createLogger} from '../../log/logger.js';

const log = createLogger('socket:timestamp');

export function createSocketTimestampGuardMiddleware({ maxEventAgeMs = 1200, socketId } = {}) {
  return function enforceSocketEventTimestamp(packet, next) {
    const [, payload] = packet;
    const ts = payload && typeof payload === 'object'
      ? Number(payload.ts)
      : NaN;

    if (!Number.isFinite(ts)) {
      log.warn({ socketId, event: packet[0] }, 'Message socket sans timestamp');
      next(new Error('missing_timestamp'));
      return;
    }

    const ageMs = Date.now() - ts;
    if (ageMs > maxEventAgeMs) {
      log.warn({ socketId, event: packet[0], ageMs, maxEventAgeMs }, 'Message socket expiré');
      next(new Error('stale_event'));
      return;
    }

    next();
  };
}
