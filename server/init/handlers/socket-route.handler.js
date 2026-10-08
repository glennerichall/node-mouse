import {registerConnection} from "../../connection/actions/connection.subscriber.js";
import {registerPreviewConnection} from "../../connection/actions/preview.router.js";
import {socketRouter} from "../routers/socket.router.js";
import {createLogger} from "../../application/logger.js";
import {createSocketResponse} from '../../connection/socket/socket-response.adapter.js';

const SOCKET_ROUTE_DOMAINS = new Set([
    'admin', 'browser', 'keyboard', 'mouse', 'preview', 'qr', 'samsung', 'vlc', 'window',
]);

/** Normalize the Socket.IO route packet to the request shape expected by router. */
export function eventRequest(socket, payload) {
    payload = payload && typeof payload === 'object' ? payload : {};
    const path = typeof payload.path === 'string' ? `/${payload.path.replace(/^\/+/, '')}` : '/';
    return {
        method: typeof payload.method === 'string' ? payload.method.toUpperCase() : 'POST',
        url: path,
        originalUrl: path,
        body: payload.body ?? {},
        socket,
    };
}

function getRouteDomain(url) {
    return url.split('/').filter(Boolean)[0] ?? '';
}

export function createSocketRouteHandler({services, router}) {
    const log = createLogger('socket:handler');

    return (socket, payload, response) => {
        const request = eventRequest(socket, payload);
        request.services = services;
        request.securityContext = socket.securityContext;
        request.log = services.getLogger?.() ?? createLogger('socket:request').child({socketId: socket.id});

        const domain = getRouteDomain(request.url);
        const acknowledge = createSocketResponse(response);
        if (!domain || !SOCKET_ROUTE_DOMAINS.has(domain)) {
            acknowledge.status(404).send({ok: false, message: 'Unknown route domain.'});
            return;
        }

        if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method.toUpperCase())) {
            acknowledge.status(400).send({ok: false, message: 'Unsupported route method.'});
            return;
        }

        router(request, acknowledge, error => {
            if (error) log.warn({url: request.url, error}, 'Socket route failed');
            if (!acknowledge.ended) {
                acknowledge.status(error?.statusCode ?? 404).send({
                    ok: false,
                    message: error?.message ?? 'Route not found.',
                });
            }
        });
    };
}

export function registerSocketConnection(services, socket) {
    registerConnection(socket, services.getEvents());
    registerPreviewConnection(socket);
}

export function createOnSocketConnect(services) {
    const handleRouteRequest = createSocketRouteHandler({services, router: socketRouter});

    return socket => {
        registerSocketConnection(services, socket);
        socket.on('route:request', (payload, response) => handleRouteRequest(socket, payload, response));
    }

}
