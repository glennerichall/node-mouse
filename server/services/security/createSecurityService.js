import {randomUUID} from 'node:crypto';
import {
    isLocalAddress,
    resolveClientAddress,
} from '../../utils/clientAddress.js';

export const SECURITY_REASON_LOCAL_CLIENT = 'local-client';
export const SECURITY_REASON_VALID_SESSION = 'valid-session';
export const SECURITY_REASON_INVALID_SESSION = 'invalid-session';

export function createSecurityService(services) {
    function createClientContext({transport, request}) {
        const config = services.getSystemConfig();
        const clientAddress = resolveClientAddress(request, config.trustProxy);

        return {
            correlationId: randomUUID(),
            transport,
            clientAddress,
            local: isLocalAddress(clientAddress),
            authenticated: false,
            authenticationMethod: null,
        };
    }

    function authenticate({transport, request}) {
        const context = createClientContext({transport, request});
        if (context.local) {
            return {
                allowed: true,
                reason: SECURITY_REASON_LOCAL_CLIENT,
                context: {
                    ...context,
                    authenticated: true,
                    authenticationMethod: 'local',
                },
            };
        }

        const config = services.getSystemConfig();
        const cookieName = config.session.cookieName;
        const token = request?.signedCookies?.[cookieName];
        const valid = services.getTokenManager().isValid(token);

        return {
            allowed: valid,
            reason: valid ? SECURITY_REASON_VALID_SESSION : SECURITY_REASON_INVALID_SESSION,
            context: {
                ...context,
                authenticated: valid,
                authenticationMethod: valid ? 'session' : null,
            },
        };
    }

    return {
        createClientContext,
        authenticateHttp: (request) => authenticate({transport: 'http', request}),
        authenticateSocket: (socket) => authenticate({transport: 'socket.io', request: socket?.request}),
    };
}
