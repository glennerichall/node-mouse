import {registerConnection} from "../../connection/actions/connection.subscriber.js";
import {registerPreviewConnection} from "../../connection/actions/preview.router.js";
import {socketRouter} from "../routers/socket.router.js";
import {createLogger} from "../../application/logger.js";

/** Normalize the Socket.IO route packet to the request shape expected by router. */
export function eventRequest(socket, payload) {
    payload = payload && typeof payload === 'object' ? payload : {};
    const path = typeof payload.path === 'string' ? `/${payload.path.replace(/^\/+/, '')}` : '/';
    return {
        method: typeof payload.method === 'string' ? payload.method : 'POST',
        url: path,
        originalUrl: path,
        body: payload.body ?? {},
        socket,
    };
}

export function createSocketRouteHandler({services, router}) {
    const log = createLogger('socket:handler');
    const finalhandler = (request, _response, error) => {
        if (error) log.warn({url: request.url, error}, 'Socket route failed');
    };

    return (socket, payload, response) => {
        const request = eventRequest(socket, payload);
        request.services = services;
        request.securityContext = socket.securityContext;
        router(request, {response}, finalhandler);
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