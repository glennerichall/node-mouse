import {createSocketSessionAuthMiddleware} from '../connection/socket/createSocketSessionAuthMiddleware.js';
import {createEventSubscriptions} from './createEventSubscriptions.js';
import {socketTimestampGuardMiddleware} from "../connection/socket/socket.timestamp-middleware.js";
import {hasRecentRestart} from '../remotes/admin/notifyIfRestarted.js';
import {
  PUBSUB_EVENT_SOCKET_CLIENT_CONNECTED,
  PUBSUB_SERVICE_SOCKET,
} from "../services/pubsub/serviceEventConstants.js";
import {REMOTE_EVENT_SYSTEM_RELOAD} from '../../utils/remoteCommands.js';
import {createLogger} from '../application/logger.js';
import {createSocketInputGuard, createSocketOriginGuard} from '../connection/socket/socket-input-guard.middleware.js';
import {createAdminEventGuardMiddleware} from '../remotes/admin/createAdminEventGuardMiddleware.js';
import {createSocketActionResponder} from '../connection/socket/socket-action-responder.js';

export function broadcast(...functions) {
  return (...args) => functions.flatMap(f => f).map(f => f(...args));
}

export function createNotificationHandler(services) {
  const events = services.getEvents();
  const log = createLogger('socket:timestamp');

  return socket => {
    log.info({socketId: socket.id}, 'Client connected');
    events.publishEvent(PUBSUB_SERVICE_SOCKET, PUBSUB_EVENT_SOCKET_CLIENT_CONNECTED, {
      clientId: socket.id,
    });
    if (hasRecentRestart()) {
      socket.emit(REMOTE_EVENT_SYSTEM_RELOAD, {
        reason: 'service-restarted',
      });
    }
  };
}

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

export function createActionHandlers(services) {
  const subscriptions = createEventSubscriptions(services);
  return channel => {
    for (const subscribe of Object.values(subscriptions)) {
      subscribe(channel);
    }
  };
}

export function createGuards(services) {
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
