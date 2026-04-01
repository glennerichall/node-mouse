import {createLogger} from '../../log/logger.js';
import {NOTIFIER_LEVEL_INFO} from '../../notifier/notifier-composite.js';
import {createSocketTimestampGuardMiddleware} from './socket.timestamp-middleware.js';

const log = createLogger('socket');

export function buildSocketApi({
                                           io,
                                           socketActionRegistrars = [],
                                           notifier,
                                           maxEventAgeMs = 1200,
                                           prepareSocketAuth,
                                           authorizeSocket,
                                       }) {
    if (typeof prepareSocketAuth === 'function') {
        prepareSocketAuth(io);
    }

    io.use(authorizeSocket);

    io.on('connection', (socket) => {
        socket.use(createSocketTimestampGuardMiddleware({
            maxEventAgeMs,
            socketId: socket.id,
        }));

        log.info({ socketId: socket.id }, 'Client connecté');
        
        notifier.target().notify({
            level: NOTIFIER_LEVEL_INFO,
            title: 'Client connecte',
            message: `Client ${socket.id.slice(0, 8)} connecte.`,
        });

        for (const registerAction of socketActionRegistrars) {
            if (typeof registerAction === 'function') {
                registerAction(socket);
            }
        }

       ;
    });
}
