export function createSocketSessionAuthMiddleware(services) {
    function createUnauthorizedError(decision) {
        const error = new Error('unauthorized');
        error.data = {
            code: 'ENTRY_TOKEN_INVALID',
            message: 'Rescannez le code QR du serveur.',
            reason: decision.reason,
            correlationId: decision.context.correlationId,
        };
        return error;
    }

    function authorizeSocket(socket, next) {
        const decision = services.getSecurity().authenticateSocket(socket);
        socket.securityContext = decision.context;
        if (!decision.allowed) {
            next(createUnauthorizedError(decision));
            return;
        }
        next();
    }


    return authorizeSocket;
}
