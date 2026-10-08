import {createSocketSessionAuthMiddleware} from './createSocketSessionAuthMiddleware.js';
import {socketTimestampGuardMiddleware} from './socket.timestamp-middleware.js';
import {createSocketInputGuard, createSocketOriginGuard} from './socket-input-guard.middleware.js';

export function createSocketGuardMiddleware(services) {
  const {getSystemConfig} = services;
  const maxEventAgeMs = getSystemConfig().session.socketEventMaxAgeMs;

  return (socket, next) => {
    socket.use(socketTimestampGuardMiddleware({
      maxEventAgeMs,
      socketId: socket.id,
    }));

    next();
  };
}

export function createSocketGuards(services) {
  const systemConfig = services.getSystemConfig();
  return [
    createSocketOriginGuard({
      protocol: systemConfig.protocol,
      getAllowedOrigins: () => systemConfig.allowedOrigins,
    }),
    createSocketSessionAuthMiddleware(services),
    createSocketInputGuard(),
    createSocketGuardMiddleware(services),
  ];
}
