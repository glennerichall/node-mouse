export function createSocketSessionAuthMiddleware({
                                        tokenManager,
                                        cookies
                                    },
                                                  {
                                        cookieName
                                    }) {
    function createUnauthorizedError() {
        const error = new Error('unauthorized');
        error.data = {
            code: 'ENTRY_TOKEN_INVALID',
            message: 'Rescannez le code QR du serveur.',
        };
        return error;
    }

    function isLocalAddress(value) {
        const address = String(value || '').toLowerCase();
        return (
            address === '127.0.0.1'
            || address === '::1'
            || address === '::ffff:127.0.0.1'
        );
    }

    function authorizeSocket(socket, next) {
        const remoteAddress = socket.request?.socket?.remoteAddress;
        if (isLocalAddress(remoteAddress)) {
            next();
            return;
        }

        const token = socket.request?.signedCookies?.[cookieName];
        if (!tokenManager.isValid(token)) {
            next(createUnauthorizedError());
            return;
        }

        socket.sessionToken = token;
        next();
    }

    function prepareSocketAuth(io) {
        io.engine.use((req, res, next) => {
            cookies(req, res, next);
        });
    }

    return {
        prepareSocketAuth,
        authorizeSocket,
    };
}
