import {createLogger} from '../application/logger.js';
import {
    broadcast,
    createActionHandlers,
    createGuards,
    createNotificationHandler,
} from './socketBootstrapComponents.js';

export function bootstrapSocket(services) {
    const {getServer} = services;
    const log = createLogger('socket:bootstrap');

    const {io, cookieParser} = getServer();
    log.debug('Initializing Socket.IO');

    io.engine.use((...args) => cookieParser(...args));

    createGuards(services).forEach(guard => {io.use(guard)});

    log.trace('Socket.IO middlewares registered');

    io.on('connection', broadcast(
        createNotificationHandler(services),
        createActionHandlers(services)
    ));
    log.debug('Socket.IO handlers registered');
}
