import {createLogger} from '../../services/log/logger.js';

const getLogger = () => createLogger('socket:timestamp');

export function socketTimestampGuardMiddleware({
  maxEventAgeMs = 1200,
  maxClockSkewMs = 5 * 60 * 1000,
  socketId,
} = {}) {
  let observedClockOffsetMs = null;

  return function enforceSocketEventTimestamp(packet, next) {
    const [, payload] = packet;
    const ts = payload && typeof payload === 'object'
      ? Number(payload.ts)
      : NaN;

    if (!Number.isFinite(ts)) {
      getLogger().warn({ socketId, event: packet[0] }, 'Message socket sans timestamp');
      next(new Error('missing_timestamp'));
      return;
    }

    const rawDeltaMs = Date.now() - ts;
    if (observedClockOffsetMs == null && Math.abs(rawDeltaMs) <= maxClockSkewMs) {
      observedClockOffsetMs = rawDeltaMs;
      getLogger().info({ socketId, event: packet[0], observedClockOffsetMs }, 'Calibration horloge socket');
    }

    const ageMs = rawDeltaMs - (observedClockOffsetMs || 0);
    if (ageMs > maxEventAgeMs) {
      getLogger().warn({
        socketId,
        event: packet[0],
        ageMs,
        rawDeltaMs,
        observedClockOffsetMs,
        maxEventAgeMs,
      }, 'Message socket expiré');
      next(new Error('stale_event'));
      return;
    }

    next();
  };
}
