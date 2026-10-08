import Router from 'router';

const sessions = new WeakMap();
const stop = (socket) => {
    const session = sessions.get(socket);
    if (session) {
        session.stop();
        sessions.delete(socket);
    }
};
export const previewRouter = Router()
    .post(`/start`, (request, _response, next) => {
        const socket = request.socket;
        const preview = request.services.getRemotes().preview;
        const getConfig = request.services.getConfig;
        if (getConfig()?.preview?.enabled !== false && preview?.isAvailable?.() !== false && !sessions.has(socket)) {
            sessions.set(socket, preview.startForSocket(socket));
        }
        next();
    })
    .post(`/stop`, (request, _response, next) => {
        stop(request.socket);
        next();
    });

export function registerPreviewConnection(socket) {
    socket.on('disconnect', () => stop(socket));
}
