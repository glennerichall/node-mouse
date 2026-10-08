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
    .post(`/start`, (request, response) => {
        const socket = request.socket;
        const preview = request.services.getRemotes().preview;
        const getConfig = request.services.getConfig;
        if (getConfig()?.preview?.enabled !== false && preview?.isAvailable?.() !== false && !sessions.has(socket)) {
            sessions.set(socket, preview.startForSocket(socket));
        }
        response.send({ok: true});
    })
    .post(`/stop`, (request, response) => {
        stop(request.socket);
        response.send({ok: true});
    });

export function registerPreviewConnection(socket) {
    socket.on('disconnect', () => stop(socket));
}
