import {createSocketSessionAuthMiddleware} from './createSocketSessionAuthMiddleware.js';
import {socketTimestampGuardMiddleware} from './socket.timestamp-middleware.js';
import {createSocketInputGuard, createSocketOriginGuard} from './socket-input-guard.middleware.js';
import {createAdminEventGuardMiddleware} from '../../remotes/admin/createAdminEventGuardMiddleware.js';
import {createSocketActionResponder} from './socket-action-responder.js';
import {createLogger} from '../../application/logger.js';

export function createSocketGuardMiddleware(services) {
  const {getSystemConfig} = services;
  const maxEventAgeMs = getSystemConfig().session.socketEventMaxAgeMs;

  return (socket, next) => {
    socket.use(socketTimestampGuardMiddleware({
      maxEventAgeMs,
      socketId: socket.id,
    }));

    const authorization = services.getAuthorization().authorize(
      socket.securityContext,
      'admin:manage',
    );
    socket.use(createAdminEventGuardMiddleware({
      isAdminActionsEnabled: getSystemConfig().adminActionsEnabled,
      isAdmin: authorization.allowed,
      client: socket.id.slice(0, 8),
      log: createLogger('events:admin-guard'),
      respondAdminAction: createSocketActionResponder({socket}),
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
