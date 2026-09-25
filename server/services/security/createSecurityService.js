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
            correlationId: request?.requestId || randomUUID(),
            transport,
            clientAddress,
            local: isLocalAddress(clientAddress),
            authenticated: false,
            authenticationMethod: null,
        };
    }

    function authenticate({transport, request, context = createClientContext({transport, request})}) {
        if (context.local) {
            return {
                allowed: true,
                reason: SECURITY_REASON_LOCAL_CLIENT,
                context: {
                    ...context,
                    authenticated: true,
                    authenticationMethod: 'local',
                    role: 'admin',
                },
            };
        }

        const config = services.getSystemConfig();
        const cookieName = config.session.cookieName;
        const token = request?.signedCookies?.[cookieName];
        const deviceSession = services.getDeviceSessionService().authenticate(token);
        const valid = Boolean(deviceSession);

        return {
            allowed: valid,
            reason: valid ? SECURITY_REASON_VALID_SESSION : SECURITY_REASON_INVALID_SESSION,
            context: {
                ...context,
                authenticated: valid,
                authenticationMethod: deviceSession ? 'session' : null,
                deviceSessionId: deviceSession?.id || null,
                role: deviceSession ? 'controller' : null,
            },
        };
    }

    function createRequestSecurity(transport, request) {
        let context;
        const getContext = () => {
            if (!context) {
                context = createClientContext({transport, request});
            }
            return context;
        };

        return {
            createClientContext: getContext,
            authenticate: () => authenticate({
                transport,
                request,
                context: getContext(),
            }),
        };
    }

    return {
        createClientContext,
        authenticateHttp: (request) => authenticate({transport: 'http', request}),
        authenticateSocket: (socket) => authenticate({transport: 'socket.io', request: socket?.request}),
        forHttpRequest: (request) => createRequestSecurity('http', request),
    };
}
