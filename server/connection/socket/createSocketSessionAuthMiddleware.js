import {isLocalAddress, resolveClientAddress} from '../../utils/clientAddress.js';

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
        const systemConfig = services.getSystemConfig();
        const remoteAddress = resolveClientAddress(socket.request, systemConfig.trustProxy);
        if (isLocalAddress(remoteAddress)) {
            next();
            return;
        }

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
