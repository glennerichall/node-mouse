import {Buffer} from 'node:buffer';
import {isOriginAllowed} from '../security/origin.js';
import {createRateLimiter} from '../security/createRateLimiter.js';
import {REMOTE_EVENT_ADMIN_PREFIX} from '../../../utils/remoteCommands.js';

export function createSocketOriginGuard({protocol = 'http', getAllowedOrigins = () => []} = {}) {
  return function socketOriginGuard(socket, next) {
    const origin = socket.handshake?.headers?.origin;
    if (!origin) {
      next();
      return;
    }

    const host = socket.handshake?.headers?.host || socket.request?.headers?.host;
    const expectedOrigin = host ? `${protocol}://${host}` : '';
    if (!isOriginAllowed(origin, expectedOrigin, getAllowedOrigins())) {
      const error = new Error('origin_not_allowed');
      error.data = {code: 'ORIGIN_NOT_ALLOWED'};
      next(error);
      return;
    }
    next();
  };
}

export function createSocketInputGuard({
  maxPayloadBytes = 16 * 1024,
  adminEventLimit = 15,
  windowMs = 60_000,
} = {}) {
  const limiter = createRateLimiter({limit: adminEventLimit, windowMs});

  return function socketInputGuard(socket, next) {
    socket.use((packet, continuePacket) => {
      const eventName = String(packet?.[0] || '');
      let serialized;
      try {
        serialized = JSON.stringify(packet);
      } catch (_error) {
        continuePacket(new Error('invalid_payload'));
        return;
      }

      if (Buffer.byteLength(serialized || '', 'utf8') > maxPayloadBytes) {
        continuePacket(new Error('payload_too_large'));
        return;
      }

      if (eventName.startsWith(REMOTE_EVENT_ADMIN_PREFIX)) {
        const context = socket.securityContext || {};
        const key = context.deviceSessionId || context.clientAddress || socket.id;
        if (!limiter.consume(key).allowed) {
          continuePacket(new Error('rate_limited'));
          return;
        }
      }

      continuePacket();
    });
    next();
  };
}
