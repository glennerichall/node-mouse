import { REMOTE_EVENT_ADMIN_PREFIX } from '../../../utils/remoteCommands.js';

export function createAdminEventGuardMiddleware({
  isAdminActionsEnabled,
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

    if (isAdminActionsEnabled) {
      next();
      return;
    }

    const action = eventName.replace(REMOTE_EVENT_ADMIN_PREFIX, '');
    log.warn({ client, action }, 'Action admin refusée: ADMIN_ACTIONS_ENABLED=false');
    respondAdminAction(action, {
      ok: false,
      message: 'Actions admin desactivees.',
    });
    next(new Error('admin_actions_disabled'));
  };
}
