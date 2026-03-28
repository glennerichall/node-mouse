export function createAdminEventGuardMiddleware({
  isAdminActionsEnabled,
  client,
  log,
  respondAdminAction,
}) {
  return function adminEventGuard(packet, next) {
    const eventName = String(packet?.[0] || '');
    if (!eventName.startsWith('admin:')) {
      next();
      return;
    }

    if (isAdminActionsEnabled) {
      next();
      return;
    }

    const action = eventName.replace('admin:', '');
    log.warn({ client, action }, 'Action admin refusée: ADMIN_ACTIONS_ENABLED=false');
    respondAdminAction(action, {
      ok: false,
      message: 'Actions admin desactivees.',
    });
    next(new Error('admin_actions_disabled'));
  };
}
