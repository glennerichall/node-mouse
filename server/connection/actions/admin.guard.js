/** Express-style admin authorization middleware for socket routes. */
export function adminGuard(request, response, next) {
    const client = String(request.socket?.id ?? 'unknown').slice(0, 8);

    const authorization = request.services.getAuthorization()
        .authorize(request.socket?.securityContext, 'admin:manage');

    if (!authorization.allowed) {
        request.log.warn({client}, 'Admin action rejected: insufficient role');
        response.status(403).send({
            ok: false,
            message: 'Permission administrateur requise.' +
                ''
        });
        return;
    }

    if (request.services.getSystemConfig().adminActionsEnabled) {
        return next();
    }

    request.log.warn({client}, 'Admin action rejected: ADMIN_ACTIONS_ENABLED=false');
    response.status(403).send({
        ok: false,
        message: 'Admin actions disabled.'
    });
    return;
}
