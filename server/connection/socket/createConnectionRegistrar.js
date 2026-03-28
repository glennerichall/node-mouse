import {createLogger} from "../../log/logger.js";

const log = createLogger('socket');

export function createConnectionRegistrar({notifier}) {
    return (socket) => {
        socket.on('disconnect', () => {
            log.info({socketId: socket.id}, 'Client déconnecté');
            notifier.notify({
                level: 'info',
                title: 'Client deconnecte',
                message: `Client ${socket.id.slice(0, 8)} deconnecte.`,
            });
        })
    }
}