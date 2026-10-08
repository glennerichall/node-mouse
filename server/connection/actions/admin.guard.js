import {createLogger} from '../../application/logger.js';

export function createAdminEventGuard({
  getSystemConfig = () => ({adminActionsEnabled: true}),
  getAuthorization = () => ({authorize: () => ({allowed: true})}),
  isAdminActionsEnabled: configuredEnabled,
  isAdmin: configuredAdmin,
  client: configuredClient = 'unknown',
  log = createLogger('events:admin'),
}) {
  return function adminEventGuard(request, response, next) {
    request ??= {};
    const client = request.socket ? String(request.socket.id ?? 'unknown').slice(0, 8) : configuredClient;
    const authorization = request.socket
      ? getAuthorization(request).authorize(request.socket.securityContext, 'admin:manage')
      : {allowed: configuredAdmin};
    const isAdminActionsEnabled = configuredEnabled ?? getSystemConfig(request).adminActionsEnabled;
    const isAdmin = configuredAdmin ?? authorization.allowed;
    const reply = typeof response === 'function' ? response : response.response;
    if (!isAdmin) {
      log.warn({client}, 'Admin action rejected: insufficient role');
      reply?.({
        ok: false,
        message: 'Permission administrateur requise.',
      });
      next(new Error('admin_forbidden'));
      return;
    }

    if (isAdminActionsEnabled) {
      next();
      return;
    }

    log.warn({client}, 'Admin action rejected: ADMIN_ACTIONS_ENABLED=false');
    reply?.({
      ok: false,
      message: 'Admin actions disabled.',
    });
    next(new Error('admin_actions_disabled'));
  };
}
