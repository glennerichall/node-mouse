function isLocalAddress(value) {
    const address = String(value || '').toLowerCase();
    return (
        address === '127.0.0.1'
        || address === '::1'
        || address === '::ffff:127.0.0.1'
    );
}

function getForwardedFor(request) {
    const raw = String(request?.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
    return raw || null;
}

export function createSocketSessionAuthMiddleware(services) {
    function createUnauthorizedError() {
        const error = new Error('unauthorized');
        error.data = {
            code: 'ENTRY_TOKEN_INVALID',
            message: 'Rescannez le code QR du serveur.',
        };
        return error;
    }

    function authorizeSocket(socket, next) {
        const forwarded = getForwardedFor(socket.request);
        const remoteAddress = forwarded || socket.request?.socket?.remoteAddress;
        if (isLocalAddress(remoteAddress)) {
            next();
            return;
        }

        const systemConfig = services.getSystemConfig();
        const tokenManager = services.getTokenManager();
        const cookieName = systemConfig.session.cookieName;

        const token = socket.request?.signedCookies?.[cookieName];
        if (!tokenManager?.isValid?.(token)) {
            next(createUnauthorizedError());
            return;
        }

        socket.sessionToken = token;
        next();
    }


    return authorizeSocket;
}
