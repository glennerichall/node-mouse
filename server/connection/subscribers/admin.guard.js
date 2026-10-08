export function createAdminEventGuard({
  isAdminActionsEnabled,
  isAdmin,
  client,
  log,
}) {
  return function adminEventGuard(_payload, response, next) {
    if (!isAdmin) {
      log.warn({client}, 'Admin action rejected: insufficient role');
      response({
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
    response({
      ok: false,
      message: 'Admin actions disabled.',
    });
    next(new Error('admin_actions_disabled'));
  };
}
