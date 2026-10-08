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
    .post(`/sessions`, (request, response) => {
        const socket = request.socket;
        const preview = request.services.getRemotes().preview;
        const getConfig = request.services.getConfig;
        let created = false;
        if (getConfig()?.preview?.enabled !== false && preview?.isAvailable?.() !== false && !sessions.has(socket)) {
            sessions.set(socket, preview.startForSocket(socket));
            created = true;
        }
        if (created) response.status(201).send({ok: true});
        else response.status(204).end();
    })
    .delete(`/sessions`, (request, response) => {
        stop(request.socket);
        response.status(204).end();
    });

export function registerPreviewConnection(socket) {
    socket.on('disconnect', () => stop(socket));
}
