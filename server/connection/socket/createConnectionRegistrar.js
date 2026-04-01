import {createLogger} from "../../log/logger.js";
import {NOTIFIER_LEVEL_INFO} from '../../notifier/notifier-composite.js';

const log = createLogger('socket');

export function createConnectionRegistrar({notifier}) {
    return (socket) => {
        socket.on('disconnect', () => {
            log.info({socketId: socket.id}, 'Client déconnecté');
            notifier.target().notify({
                level: NOTIFIER_LEVEL_INFO,
                title: 'Client deconnecte',
                message: `Client ${socket.id.slice(0, 8)} deconnecte.`,
            });
        })
    }
}
