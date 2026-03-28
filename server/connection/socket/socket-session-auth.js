export function createSocketSessionAuthMiddleware({
                                        tokenManager,
                                        cookies
                                    },
                                                  {
                                        cookieName
                                    }) {
    function authorizeSocket(socket, next) {
        const token = socket.request?.signedCookies?.[cookieName];
        if (!tokenManager.isValid(token)) {
            next(new Error('unauthorized'));
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
