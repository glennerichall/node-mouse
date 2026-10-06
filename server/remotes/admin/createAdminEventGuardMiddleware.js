import { REMOTE_EVENT_ADMIN_PREFIX } from '../../../utils/remoteCommands.js';

export function createAdminEventGuardMiddleware({
  isAdminActionsEnabled,
  isAdmin,
  client,
  log,
  respondAdminAction,
}) {
  return function adminEventGuard(packet, next) {
    const eventName = String(packet?.[0] || '');
    if (!eventName.startsWith(REMOTE_EVENT_ADMIN_PREFIX)) {
      next();
      return;
    }

    if (!isAdmin) {
      const action = eventName.replace(REMOTE_EVENT_ADMIN_PREFIX, '');
      log.warn({client, action}, 'Admin action rejected: insufficient role');
      respondAdminAction(action, {
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

    const action = eventName.replace(REMOTE_EVENT_ADMIN_PREFIX, '');
      log.warn({ client, action }, 'Admin action rejected: ADMIN_ACTIONS_ENABLED=false');
    respondAdminAction(action, {
      ok: false,
      message: 'Admin actions disabled.',
    });
    next(new Error('admin_actions_disabled'));
  };
}
